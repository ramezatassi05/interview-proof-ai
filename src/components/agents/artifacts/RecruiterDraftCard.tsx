import type { AgentAction } from '@/types';

function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

export function RecruiterDraftCard({ action }: { action: AgentAction }) {
  const subject = asString(action.payloadJson.subject);
  const body = asString(action.payloadJson.body);
  const recipient = asString(action.payloadJson.recipientHint);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="rounded-md border border-[var(--border-default)] bg-[var(--bg-card)] px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
          recruiter draft
        </span>
        {recipient && (
          <span className="font-mono text-[11px] text-[var(--text-muted)]">→ {recipient}</span>
        )}
      </div>
      {subject && (
        <p className="line-clamp-1 text-sm font-medium text-[var(--text-primary)]">{subject}</p>
      )}
      {body && (
        <p className="line-clamp-3 whitespace-pre-wrap text-sm text-[var(--text-secondary)]">
          {body}
        </p>
      )}
    </div>
  );
}
