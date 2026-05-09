'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import type { CompanyTaskOwnerKind } from '@/server/agents/company/types';
import { agentMeta } from '../agents';
import type { CompanyTask } from '../TaskKanban';

interface TicketsCardProps {
  // If supplied, the card renders these tickets directly. Otherwise it fetches.
  data?: { tickets?: CompanyTask[] } & Record<string, unknown>;
}

function shortLabel(kind: CompanyTaskOwnerKind | string | null): string {
  if (!kind) return '—';
  return agentMeta(kind as CompanyTaskOwnerKind).label.replace('Director of ', '');
}

export function TicketsCard({ data }: TicketsCardProps) {
  const seeded = data?.tickets;
  const [tickets, setTickets] = useState<CompanyTask[] | null>(seeded ?? null);
  const [loading, setLoading] = useState(!seeded);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (seeded) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/admin/company-tasks?requester=peer');
        const json = (await res.json()) as { data?: CompanyTask[]; error?: string };
        if (cancelled) return;
        if (!res.ok || !json.data) {
          setError(json.error ?? 'Could not load tickets');
          return;
        }
        setTickets(json.data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Network error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [seeded]);

  const grouped = useMemo(() => {
    if (!tickets) return [];
    const map = new Map<string, CompanyTask[]>();
    for (const t of tickets) {
      const list = map.get(t.ownerKind);
      if (list) list.push(t);
      else map.set(t.ownerKind, [t]);
    }
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [tickets]);

  if (loading) {
    return <p className="text-[11px] text-[var(--text-muted)]">Loading tickets…</p>;
  }

  if (error) {
    return <p className="text-[11px] text-[var(--color-danger)]">{error}</p>;
  }

  if (!tickets || tickets.length === 0) {
    return (
      <p className="text-[11px] text-[var(--text-muted)]/80">
        No peer-filed tickets right now.
      </p>
    );
  }

  return (
    <div className="max-h-[280px] divide-y divide-[var(--border-default)]/50 overflow-y-auto">
      {grouped.map(([owner, list]) => (
        <div key={owner} className="py-2">
          <div className="flex items-center justify-between pb-1.5">
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
              {shortLabel(owner as CompanyTaskOwnerKind)}
            </span>
            <span className="font-serif text-[13px] text-[var(--text-muted)] tabular-nums">
              {list.length}
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            {list.map((t) => (
              <div key={t.id} className="py-1">
                <div className="flex flex-wrap items-baseline gap-1.5">
                  {t.requesterKind && (
                    <Badge variant="default">from {shortLabel(t.requesterKind)}</Badge>
                  )}
                  <span className="text-[10.5px] uppercase tracking-wide text-[var(--text-muted)]">
                    {t.status}
                  </span>
                </div>
                <p
                  className="mt-0.5 truncate text-[13px] text-[var(--text-primary)]"
                  title={t.title}
                >
                  {t.title}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
