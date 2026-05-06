import type { CompanyAgentKind } from './types';

// Reporting structure as data. Drives system prompts, the org chart UI, and
// which directors the CEO can delegate to / consult. To add a node or a
// reporting edge, change this map and everything else follows.
export const REPORTING_STRUCTURE: Record<CompanyAgentKind, { directReports: CompanyAgentKind[] }> = {
  ceo_orchestrator: {
    directReports: [
      'director_marketing',
      'director_finance',
      'director_engineering',
      'executive_assistant',
    ],
  },
  executive_assistant: { directReports: [] },
  director_marketing: { directReports: [] },
  director_finance: { directReports: [] },
  director_engineering: { directReports: [] },
};

export function getDirectReports(kind: CompanyAgentKind): CompanyAgentKind[] {
  return [...REPORTING_STRUCTURE[kind].directReports];
}

export function getManager(kind: CompanyAgentKind): CompanyAgentKind | null {
  for (const [manager, node] of Object.entries(REPORTING_STRUCTURE) as [
    CompanyAgentKind,
    { directReports: CompanyAgentKind[] },
  ][]) {
    if (node.directReports.includes(kind)) return manager;
  }
  return null;
}

export function getPeers(kind: CompanyAgentKind): CompanyAgentKind[] {
  const manager = getManager(kind);
  if (!manager) return [];
  return REPORTING_STRUCTURE[manager].directReports.filter((peer) => peer !== kind);
}

const DOMAIN_BLURB: Record<CompanyAgentKind, string> = {
  ceo_orchestrator: '',
  executive_assistant: 'owns briefings, follow-ups, scheduling.',
  director_marketing: 'owns marketing/growth/positioning.',
  director_finance: 'owns revenue, runway, pricing.',
  director_engineering: 'owns specs, infra, what to build next.',
};

// Display labels live here (rather than in company-agent-prompts.ts) so the
// org module is self-contained — anyone importing org helpers gets labels too,
// without pulling in the whole prompt assembly module.
export const COMPANY_AGENT_DISPLAY: Record<CompanyAgentKind, string> = {
  ceo_orchestrator: 'CEO',
  executive_assistant: 'Executive Assistant',
  director_marketing: 'Director of Marketing',
  director_finance: 'Director of Finance',
  director_engineering: 'Director of Engineering',
};

// Returns the system prompt block describing this agent's place in the org.
// Driven entirely by REPORTING_STRUCTURE — no per-role hardcoding here.
export function formatReportingBlock(kind: CompanyAgentKind): string {
  if (kind === 'ceo_orchestrator') {
    const reports = getDirectReports(kind);
    const lines = reports.map(
      (r) => `- ${COMPANY_AGENT_DISPLAY[r]} — ${DOMAIN_BLURB[r] || 'reports to you.'}`
    );
    return [
      '## REPORTING',
      'You are the CEO. The following directors report to you:',
      ...lines,
      '',
      "You don't execute work yourself. When the operator asks something:",
      '- If you can answer from MEMORY or roadmap context, do it.',
      '- Otherwise, call `consult_director` against the relevant director and incorporate their answer in your reply. You have a budget of 2 consults per turn.',
      '- When the operator wants something done, call `delegate_task` to assign it to the right director with a clear rationale.',
      '- Escalations from directors appear under "What\'s going on right now" — address those first.',
    ].join('\n');
  }

  const manager = getManager(kind);
  const peers = getPeers(kind);
  const managerLabel = manager
    ? COMPANY_AGENT_DISPLAY[manager]
    : 'no one (you operate independently)';
  const peerLabels = peers.map((p) => COMPANY_AGENT_DISPLAY[p]).join(', ');
  const ownership = DOMAIN_BLURB[kind] || 'owns its area.';

  return [
    '## REPORTING',
    `You report to the ${managerLabel}.${peerLabels ? ` Your peers are: ${peerLabels}.` : ''}`,
    '',
    `You ${ownership.replace(/\.$/, '')} end-to-end up to the point of execution (which the CEO approves).`,
    '',
    "If a delegated task is out of scope, blocked on a decision only the CEO can make, or you've stalled — call `escalate_to_ceo` with the taskId and a one-paragraph reason. Don't sit on stuck work.",
  ].join('\n');
}
