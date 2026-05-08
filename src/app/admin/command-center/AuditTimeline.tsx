'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { relativeTime } from '@/lib/relative-time';
import { COMPANY_AGENT_KINDS, type CompanyAgentKind } from '@/server/agents/company/types';
import { agentMeta } from './agents';
import { SoftLabel } from './_primitives';
import { friendlyActionType } from './_action-copy';

type AuditEventKind =
  | 'action_drafted'
  | 'action_approved'
  | 'action_rejected'
  | 'action_completed'
  | 'action_failed'
  | 'decision_recorded'
  | 'task_created';

interface AuditEvent {
  id: string;
  occurredAt: string;
  agentKind: CompanyAgentKind | null;
  kind: AuditEventKind;
  title: string;
  summary: string | null;
  refType: 'action' | 'decision' | 'task';
  refId: string;
  meta: Record<string, unknown>;
}

const KIND_OPTIONS: Array<{ value: AuditEventKind | 'all'; label: string }> = [
  { value: 'all', label: 'All events' },
  { value: 'action_drafted', label: 'Drafted' },
  { value: 'action_approved', label: 'Approved' },
  { value: 'action_rejected', label: 'Rejected' },
  { value: 'action_completed', label: 'Completed' },
  { value: 'action_failed', label: 'Failed' },
  { value: 'decision_recorded', label: 'Decisions' },
  { value: 'task_created', label: 'Tasks' },
];

const RANGE_OPTIONS = [
  { value: '7d', label: 'Last 7 days', days: 7 },
  { value: '30d', label: 'Last 30 days', days: 30 },
  { value: 'all', label: 'All time', days: null as number | null },
] as const;
type RangeValue = (typeof RANGE_OPTIONS)[number]['value'];

const KIND_LABEL: Record<AuditEventKind, string> = {
  action_drafted: 'Drafted',
  action_approved: 'Approved',
  action_rejected: 'Rejected',
  action_completed: 'Completed',
  action_failed: 'Failed',
  decision_recorded: 'Decision',
  task_created: 'Task',
};

const KIND_TONE: Record<AuditEventKind, string> = {
  action_drafted: 'text-[var(--text-secondary)]',
  action_approved: 'text-[var(--color-success)]',
  action_rejected: 'text-[var(--text-muted)]',
  action_completed: 'text-[var(--color-success)]',
  action_failed: 'text-[var(--color-danger)]',
  decision_recorded: 'text-[var(--accent-primary)]',
  task_created: 'text-[var(--text-secondary)]',
};

interface FetchResult {
  data: AuditEvent[];
  nextCursor: string | null;
}

async function fetchPage(params: {
  agent: CompanyAgentKind | null;
  kind: AuditEventKind | null;
  fromIso: string | null;
  cursor: string | null;
}): Promise<FetchResult> {
  const search = new URLSearchParams();
  if (params.agent) search.set('agentKind', params.agent);
  if (params.kind) search.set('kind', params.kind);
  if (params.fromIso) search.set('from', params.fromIso);
  if (params.cursor) search.set('cursor', params.cursor);
  const res = await fetch(`/api/admin/company-agent/audit-timeline?${search.toString()}`);
  if (!res.ok) throw new Error(`audit-timeline ${res.status}`);
  return (await res.json()) as FetchResult;
}

export function AuditTimeline() {
  const [agent, setAgent] = useState<CompanyAgentKind | 'all'>('all');
  const [kind, setKind] = useState<AuditEventKind | 'all'>('all');
  const [range, setRange] = useState<RangeValue>('30d');
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fromIso = useMemo(() => {
    const opt = RANGE_OPTIONS.find((r) => r.value === range);
    if (!opt || opt.days == null) return null;
    return new Date(Date.now() - opt.days * 24 * 60 * 60 * 1000).toISOString();
  }, [range]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchPage({
        agent: agent === 'all' ? null : agent,
        kind: kind === 'all' ? null : kind,
        fromIso,
        cursor: null,
      });
      setEvents(res.data);
      setCursor(res.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }, [agent, kind, fromIso]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const loadMore = async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetchPage({
        agent: agent === 'all' ? null : agent,
        kind: kind === 'all' ? null : kind,
        fromIso,
        cursor,
      });
      setEvents((prev) => [...prev, ...res.data]);
      setCursor(res.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoadingMore(false);
    }
  };

  const grouped = useMemo(() => groupByDay(events), [events]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-2">
        <SoftLabel>Filters</SoftLabel>
        <select
          value={agent}
          onChange={(e) => setAgent(e.target.value as CompanyAgentKind | 'all')}
          className="rounded border border-[var(--border-default)] bg-[var(--bg-elevated)] px-2 py-1 text-[12px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-accent)]"
          aria-label="Filter by agent"
        >
          <option value="all">All agents</option>
          {COMPANY_AGENT_KINDS.map((k) => (
            <option key={k} value={k}>
              {agentMeta(k).label}
            </option>
          ))}
        </select>
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as AuditEventKind | 'all')}
          className="rounded border border-[var(--border-default)] bg-[var(--bg-elevated)] px-2 py-1 text-[12px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-accent)]"
          aria-label="Filter by event kind"
        >
          {KIND_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="flex rounded border border-[var(--border-default)] bg-[var(--bg-elevated)] p-0.5">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setRange(opt.value)}
              className={`rounded px-2 py-0.5 text-[12px] ${
                range === opt.value
                  ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <span className="ml-auto text-[11px] tabular-nums text-[var(--text-muted)]">
          {events.length} events
        </span>
      </div>

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
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="h-12 animate-pulse border border-[var(--border-default)] bg-[var(--bg-card)]"
            />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 border border-dashed border-[var(--border-default)] bg-[var(--bg-card)] px-6 py-16 text-center">
          <span className="text-3xl text-[var(--text-muted)]" aria-hidden>
            —
          </span>
          <p className="text-sm text-[var(--text-secondary)]">
            Nothing to show here yet.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {grouped.map(([day, items]) => (
            <DayGroup key={day} day={day} events={items} />
          ))}
        </div>
      )}

      {cursor && !loading && (
        <div className="flex justify-center">
          <Button variant="secondary" size="sm" loading={loadingMore} onClick={loadMore}>
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}

function DayGroup({ day, events }: { day: string; events: AuditEvent[] }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="sticky top-0 z-10 -mx-1 px-1 py-0.5 backdrop-blur-sm">
        <SoftLabel>{day}</SoftLabel>
      </div>
      <ol className="flex flex-col gap-1.5">
        {events.map((event) => (
          <EventRow key={event.id} event={event} />
        ))}
      </ol>
    </div>
  );
}

function EventRow({ event }: { event: AuditEvent }) {
  const meta = event.agentKind ? agentMeta(event.agentKind) : null;
  const actionType =
    typeof event.meta.actionType === 'string'
      ? friendlyActionType(event.meta.actionType)
      : null;

  return (
    <li className="border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-2 transition-colors hover:bg-[var(--bg-elevated)]">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className={`text-[11px] font-semibold ${KIND_TONE[event.kind]}`}>
          {KIND_LABEL[event.kind]}
        </span>
        {meta && (
          <span className="text-[11px] text-[var(--accent-primary)]">{meta.label}</span>
        )}
        {actionType && (
          <span className="text-[11px] text-[var(--text-muted)]">· {actionType}</span>
        )}
        <span className="ml-auto text-[10px] tabular-nums text-[var(--text-muted)]">
          {relativeTime(event.occurredAt)}
        </span>
      </div>
      <p
        className="mt-1 truncate text-sm text-[var(--text-primary)]"
        title={event.title}
      >
        {event.title}
      </p>
      {event.summary && (
        <p className="mt-0.5 line-clamp-2 text-xs text-[var(--text-secondary)]">
          {event.summary}
        </p>
      )}
    </li>
  );
}

function groupByDay(events: AuditEvent[]): Array<[string, AuditEvent[]]> {
  const buckets = new Map<string, AuditEvent[]>();
  for (const event of events) {
    const day = formatDay(event.occurredAt);
    const list = buckets.get(day);
    if (list) list.push(event);
    else buckets.set(day, [event]);
  }
  return Array.from(buckets.entries());
}

function formatDay(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (isSameDay(date, today)) return 'Today';
  if (isSameDay(date, yesterday)) return 'Yesterday';
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}
