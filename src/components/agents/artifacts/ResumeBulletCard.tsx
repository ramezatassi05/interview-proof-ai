import type { AgentAction, ResumeBulletAlternative } from '@/types';

function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

interface AlternativesEvidence {
  kind?: string;
  alternatives?: ResumeBulletAlternative[];
}

function alternativesCount(action: AgentAction): number {
  if (!Array.isArray(action.evidenceRefsJson)) return 0;
  for (const ref of action.evidenceRefsJson) {
    if (ref && typeof ref === 'object' && (ref as AlternativesEvidence).kind === 'resume_bullet_alternatives') {
      return (ref as AlternativesEvidence).alternatives?.length ?? 0;
    }
  }
  return 0;
}

export function ResumeBulletCard({ action }: { action: AgentAction }) {
  const original = asString(action.payloadJson.originalBullet);
  const rewritten = asString(action.payloadJson.rewrittenBullet);
  const altCount = alternativesCount(action);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="rounded-md border border-[var(--border-default)] bg-[var(--bg-card)] px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
          resume bullet
        </span>
        {altCount > 0 && (
          <span className="font-mono text-[11px] text-[var(--text-muted)]">
            {altCount} alternative{altCount === 1 ? '' : 's'}
          </span>
        )}
      </div>
      {original && (
        <p className="line-clamp-2 text-xs text-[var(--text-muted)]">
          <span className="font-mono uppercase tracking-wide">from:</span> {original}
        </p>
      )}
      {rewritten && (
        <p className="line-clamp-3 text-sm text-[var(--text-primary)]">
          <span className="font-mono text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
            to:
          </span>{' '}
          {rewritten}
        </p>
      )}
    </div>
  );
}
