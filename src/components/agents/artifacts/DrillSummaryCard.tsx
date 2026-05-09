import type { AgentAction } from '@/types';

function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

export function DrillSummaryCard({ action }: { action: AgentAction }) {
  const riskId = asString(action.payloadJson.riskId, 'unknown');
  const reason = asString(action.payloadJson.reason);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="rounded-md border border-[var(--border-default)] bg-[var(--bg-card)] px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
          drill
        </span>
        <span className="font-mono text-xs text-[var(--text-secondary)]">{riskId}</span>
      </div>
      {reason && (
        <p className="line-clamp-3 text-sm text-[var(--text-secondary)]">{reason}</p>
      )}
    </div>
  );
}
