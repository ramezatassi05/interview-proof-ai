import type { AgentAction } from '@/types';

const ACTION_TYPE_LABELS: Record<string, string> = {
  recommend_drill: 'Recommended drill',
  start_mock_interview: 'Mock interview',
  score_answer: 'Score answer',
  draft_recruiter_reply: 'Draft recruiter reply',
  rewrite_resume_bullet: 'Rewrite resume bullet',
  create_company_brief: 'Company brief',
  update_prep_plan: 'Prep plan update',
  propose_opportunity_update: 'Opportunity update',
  summarize_progress: 'Progress summary',
};

export function GenericActionCard({ action }: { action: AgentAction }) {
  const label = ACTION_TYPE_LABELS[action.actionType] ?? action.actionType;
  const previewKeys = Object.keys(action.payloadJson ?? {}).slice(0, 3);
  const preview =
    previewKeys.length > 0
      ? previewKeys
          .map((k) => `${k}: ${truncate(stringify(action.payloadJson[k]), 60)}`)
          .join(' · ')
      : null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="rounded-md border border-[var(--border-default)] bg-[var(--bg-card)] px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
          {label}
        </span>
      </div>
      {preview && <p className="line-clamp-2 text-xs text-[var(--text-muted)]">{preview}</p>}
    </div>
  );
}

function stringify(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return JSON.stringify(v);
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}
