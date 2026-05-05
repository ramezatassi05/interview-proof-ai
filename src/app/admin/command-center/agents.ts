import type { CompanyAgentKind } from '@/server/agents/company/types';

export interface AgentOption {
  value: CompanyAgentKind;
  label: string;
  discipline: string;
  placeholder: string;
}

export const AGENT_OPTIONS: AgentOption[] = [
  {
    value: 'ceo_orchestrator',
    label: 'CEO Orchestrator',
    discipline: 'Strategy · prioritization · cross-functional',
    placeholder: 'What should I focus on this week given current metrics?',
  },
  {
    value: 'executive_assistant',
    label: 'Executive Assistant',
    discipline: 'Calendar · inbox · meeting prep · follow-ups',
    placeholder: 'Draft an agenda for the next leadership sync.',
  },
  {
    value: 'director_marketing',
    label: 'Director of Marketing',
    discipline: 'Positioning · growth · content · launches',
    placeholder: 'Propose a 7-day content plan to lift unlock rate.',
  },
  {
    value: 'director_finance',
    label: 'Director of Finance',
    discipline: 'Revenue · pricing · runway · unit economics',
    placeholder: 'Review last week’s revenue and flag anomalies.',
  },
  {
    value: 'director_engineering',
    label: 'Director of Engineering',
    discipline: 'Roadmap · specs · reliability · velocity',
    placeholder: 'Turn the next roadmap item into a GitHub-ready spec.',
  },
];

export function agentMeta(kind: CompanyAgentKind): AgentOption {
  return AGENT_OPTIONS.find((a) => a.value === kind) ?? AGENT_OPTIONS[0];
}
