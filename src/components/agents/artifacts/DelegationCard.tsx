import type { AgentAction } from '@/types';

const TARGET_LABELS: Record<string, string> = {
  readiness_coach: 'Readiness Coach',
  mock_interview: 'Mock Interview',
  prep_plan: 'Prep Plan',
  resume_evidence: 'Resume Evidence',
  company_research: 'Company Research',
  recruiter_comm: 'Recruiter Communication',
  opportunity_tracker: 'Opportunity Tracker',
  application_materials: 'Application Materials',
  post_interview_debrief: 'Post-Interview Debrief',
};

function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

export function DelegationCard({ action }: { action: AgentAction }) {
  const target = asString(action.payloadJson.targetAgentKind);
  const brief = asString(action.payloadJson.brief);
  const label = TARGET_LABELS[target] ?? target;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="rounded-md border border-[var(--border-default)] bg-[var(--bg-card)] px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
          delegate
        </span>
        <span className="text-xs text-[var(--text-secondary)]">→ {label}</span>
      </div>
      {brief && (
        <p className="line-clamp-3 text-sm text-[var(--text-primary)]">{brief}</p>
      )}
    </div>
  );
}
