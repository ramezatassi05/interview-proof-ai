'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { relativeTime } from '@/lib/relative-time';

interface IdeaSummary {
  id: string;
  rawText: string;
  source: 'cli' | 'chat';
  status: 'triaging' | 'routed' | 'completed' | 'failed';
  triageSessionId: string | null;
  spawnedActionCount: number;
  error: string | null;
  createdAt: string;
}

const STATUS_LABEL: Record<IdeaSummary['status'], string> = {
  triaging: 'Triaging',
  routed: 'Routed',
  completed: 'Completed',
  failed: 'Failed',
};

const POLL_MS = 5000;

export function IdeasTab() {
  const [ideas, setIdeas] = useState<IdeaSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      try {
        const res = await fetch('/api/ceo/ideas', { cache: 'no-store' });
        if (cancelled) return;
        if (!res.ok) throw new Error(`Failed to load (${res.status})`);
        const json = (await res.json()) as { ideas: IdeaSummary[] };
        setIdeas(json.ideas);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load ideas');
      } finally {
        if (!cancelled) setLoading(false);
      }

      if (cancelled) return;
      // Keep polling while anything is still triaging — the orchestrator runs
      // server-side and we want the row to flip in front of the user.
      timer = setTimeout(tick, POLL_MS);
    };

    void tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">
          Ideas from Claude Code
        </h2>
        <p className="text-[12px] text-[var(--text-muted)]">
          Every idea you typed via{' '}
          <code className="rounded bg-[var(--bg-elevated)] px-1.5 py-0.5 text-[11px]">/idea</code>{' '}
          in your CLI lands here. The CEO orchestrator triages each one on Opus 4.7 and routes it
          to the right specialist. Autonomous agent flows continue alongside this — these are an
          additional input channel, not a replacement.
        </p>
      </header>

      {error && (
        <div
          role="alert"
          className="border border-[var(--color-danger)]/30 bg-[var(--color-danger-muted)] px-3 py-2 text-xs text-[var(--color-danger)]"
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="h-20 animate-pulse border border-[var(--border-default)] bg-[var(--bg-card)]"
            />
          ))}
        </div>
      ) : ideas.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 border border-dashed border-[var(--border-default)] bg-[var(--bg-card)] px-6 py-16 text-center">
          <span className="text-3xl text-[var(--text-muted)]" aria-hidden>
            💡
          </span>
          <p className="text-sm text-[var(--text-secondary)]">
            No ideas relayed yet. Try{' '}
            <code className="rounded bg-[var(--bg-elevated)] px-1.5 py-0.5 text-[11px]">
              /idea &lt;your thought&gt;
            </code>{' '}
            in your Claude Code session.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {ideas.map((idea) => (
            <li key={idea.id}>
              <Link
                href={`/admin/command-center/ideas/${idea.id}`}
                className="block border border-[var(--border-default)] bg-[var(--bg-card)] px-4 py-3 transition-colors hover:bg-[var(--bg-elevated)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm text-[var(--text-primary)]">
                      {idea.rawText}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-muted)]">
                      <span>{relativeTime(idea.createdAt)}</span>
                      <span aria-hidden>·</span>
                      <span className="uppercase tracking-wide">{idea.source}</span>
                      {idea.spawnedActionCount > 0 && (
                        <>
                          <span aria-hidden>·</span>
                          <span>
                            {idea.spawnedActionCount}{' '}
                            {idea.spawnedActionCount === 1 ? 'action' : 'actions'} drafted
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <StatusPill status={idea.status} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div>
        <Link href="/admin/command-center/ideas">
          <Button variant="ghost" size="sm">
            Open full Ideas page →
          </Button>
        </Link>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: IdeaSummary['status'] }) {
  const tone =
    status === 'failed'
      ? 'border-[var(--color-danger)]/40 bg-[var(--color-danger-muted)] text-[var(--color-danger)]'
      : status === 'triaging'
        ? 'border-[var(--accent-primary)]/40 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
        : 'border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]';
  return (
    <span
      className={`shrink-0 border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${tone}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
