import type { AgentAction } from '@/types';

function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

export function OpportunityCreateCard({ action }: { action: AgentAction }) {
  const company = asString(action.payloadJson.companyName);
  const role = asString(action.payloadJson.roleTitle);
  const stage = asString(action.payloadJson.stage, 'applied');
  const sourceUrl = asString(action.payloadJson.sourceUrl);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="rounded-md border border-[var(--border-default)] bg-[var(--bg-card)] px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
          new opportunity
        </span>
        <span className="font-mono text-[11px] text-[var(--text-muted)]">{stage}</span>
      </div>
      <p className="text-sm font-medium text-[var(--text-primary)]">
        {company || 'Unknown company'} — {role || 'Unknown role'}
      </p>
      {sourceUrl && (
        <p className="truncate font-mono text-[11px] text-[var(--text-muted)]">{sourceUrl}</p>
      )}
    </div>
  );
}
