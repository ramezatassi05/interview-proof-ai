'use client';

import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ActionCard } from '@/components/agents/artifacts';
import type { AgentAction, AgentActionStatus } from '@/types';

const STATUS_LABELS: Record<AgentActionStatus, string> = {
  drafted: 'Drafted',
  awaiting_approval: 'Awaiting approval',
  approved: 'Approved (sending soon)',
  completed: 'Sent',
  failed: 'Failed',
  rejected: 'Rejected',
};

const STATUS_ORDER: AgentActionStatus[] = [
  'drafted',
  'awaiting_approval',
  'approved',
  'completed',
  'failed',
  'rejected',
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function OutboxPage() {
  const [items, setItems] = useState<AgentAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/outbox');
        if (!res.ok) throw new Error(`Failed (${res.status})`);
        const json = (await res.json()) as { data: AgentAction[] };
        if (!cancelled) setItems(json.data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const grouped = STATUS_ORDER.map((status) => ({
    status,
    rows: items.filter((i) => i.status === status),
  })).filter((g) => g.rows.length > 0);

  return (
    <AppLayout showIntelligencePanel={false}>
      <div className="mb-8">
        <h1 className="heading-modern text-2xl font-bold text-[var(--text-primary)]">Outbox</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Recruiter replies and resume bullet rewrites your agents have drafted. Approve to send
          via your connected Gmail; otherwise copy/paste manually.
        </p>
      </div>

      {loading && <p className="text-sm text-[var(--text-muted)]">Loading…</p>}
      {error && (
        <div className="rounded-lg border border-[var(--color-danger)]/30 bg-[var(--color-danger-muted)] p-4 text-sm text-[var(--color-danger)]">
          {error}
        </div>
      )}
      {!loading && !error && items.length === 0 && (
        <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] p-8 text-center text-sm text-[var(--text-muted)]">
          No drafts yet. Your agents will populate this when they propose recruiter replies or
          resume rewrites.
        </div>
      )}

      <div className="space-y-8">
        {grouped.map(({ status, rows }) => (
          <section key={status}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
              {STATUS_LABELS[status]} · {rows.length}
            </h2>
            <ul className="space-y-3">
              {rows.map((action) => (
                <li
                  key={action.id}
                  className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] p-4"
                >
                  <ActionCard action={action} />
                  <div className="mt-3 flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                    <span>Drafted {formatDate(action.createdAt)}</span>
                    {action.completedAt && <span>Finished {formatDate(action.completedAt)}</span>}
                  </div>
                  {action.status === 'failed' && action.error && (
                    <p className="mt-2 rounded-md border border-[var(--color-danger)]/30 bg-[var(--color-danger-muted)] px-3 py-2 text-xs text-[var(--color-danger)]">
                      {action.error}
                    </p>
                  )}
                  {action.status === 'completed' &&
                    typeof (action.resultJson as Record<string, unknown> | null)?.delivery ===
                      'string' && (
                      <p className="mt-2 text-[11px] text-[var(--text-muted)]">
                        Delivery:{' '}
                        {String((action.resultJson as Record<string, unknown>).delivery)}
                      </p>
                    )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </AppLayout>
  );
}
