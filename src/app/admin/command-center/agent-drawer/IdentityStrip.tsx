'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import type { CompanyAgentKind, GuardrailTier } from '@/server/agents/company/types';
import { getModelLabelForAgent } from '@/server/agents/company/agent-models';
import {
  MEMORY_TOPIC_LABELS,
  MEMORY_TOPIC_ORDER,
  isMemoryTopic,
  type MemoryTopic,
} from '@/server/agents/company/memory-topics';
import { agentMeta } from '../agents';
import { skillsForAgent } from './agent-skill-catalog';
import { tierBadgeVariant } from './GuardrailsCard';

interface IdentityStripProps {
  agentKind: CompanyAgentKind;
  memoryCount: number;
  guardrailTier?: GuardrailTier;
}

const TIER_LABEL: Record<GuardrailTier, string> = {
  manual: 'Won’t act without your OK',
  guarded: 'Guarded autonomy',
  autonomous: 'Autonomous (low-risk)',
};

interface MemoryRow {
  id: string;
  topic: string | null;
  key: string;
  summary: string | null;
  body: string | null;
  value_json: unknown;
  source: string;
  updated_at: string;
}

function previewValue(row: MemoryRow): string {
  if (row.summary && row.summary.trim().length > 0) return row.summary;
  if (typeof row.value_json === 'string') return row.value_json;
  if (row.value_json === null || row.value_json === undefined) return '';
  try {
    return JSON.stringify(row.value_json);
  } catch {
    return String(row.value_json);
  }
}

export function IdentityStrip({ agentKind, memoryCount, guardrailTier = 'manual' }: IdentityStripProps) {
  const meta = agentMeta(agentKind);
  const skills = skillsForAgent(agentKind);
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<MemoryRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localCount, setLocalCount] = useState<number | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const displayedCount = localCount ?? memoryCount;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/company-agent/memory?agentKind=${encodeURIComponent(agentKind)}`,
        { method: 'GET' }
      );
      if (!res.ok) {
        let msg = `Couldn't load memory (${res.status})`;
        try {
          const j = (await res.json()) as { error?: string };
          if (j.error) msg = j.error;
        } catch {
          // not JSON
        }
        setError(msg);
        return;
      }
      const json = (await res.json()) as { data?: MemoryRow[] };
      const next = json.data ?? [];
      setRows(next);
      setLocalCount(next.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }, [agentKind]);

  useEffect(() => {
    if (!open) return;
    void load();
  }, [open, load]);

  // Close on outside click / escape.
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Reset cached count if the live counter advances past it (a `remember`
  // landed while popover was closed). Force a refetch next open.
  useEffect(() => {
    if (localCount !== null && memoryCount > localCount) {
      setLocalCount(null);
      setRows(null);
    }
  }, [memoryCount, localCount]);

  const handleDelete = async (key: string) => {
    setRows((prev) => prev?.filter((r) => r.key !== key) ?? prev);
    setLocalCount((prev) => (prev === null ? prev : Math.max(0, prev - 1)));
    try {
      const res = await fetch(
        `/api/admin/company-agent/memory?agentKind=${encodeURIComponent(
          agentKind
        )}&key=${encodeURIComponent(key)}`,
        { method: 'DELETE' }
      );
      if (!res.ok) {
        // Refetch to restore correct state on failure.
        void load();
      }
    } catch {
      void load();
    }
  };

  return (
    <div className="relative flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-[var(--border-default)] bg-[var(--bg-elevated)] px-4 py-2.5">
      <Badge variant="accent">{meta.label}</Badge>
      <span
        className="text-[11px] tabular-nums text-[var(--text-muted)]"
        title="Model running this agent"
      >
        {getModelLabelForAgent(agentKind)}
      </span>
      <span className="text-[11px] text-[var(--text-muted)]" aria-hidden>
        ·
      </span>
      <span className="text-[11px] text-[var(--text-secondary)]">
        Knows how to do <span className="tabular-nums">{skills.length}</span>{' '}
        {skills.length === 1 ? 'thing' : 'things'}
      </span>
      <span className="text-[11px] text-[var(--text-muted)]" aria-hidden>
        ·
      </span>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-[11px] text-[var(--text-secondary)] underline-offset-2 hover:text-[var(--text-primary)] hover:underline"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        Remembers <span className="tabular-nums">{displayedCount}</span>
      </button>
      <button
        type="button"
        onClick={() => {
          const el = document.getElementById(`guardrails-${agentKind}`);
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }}
        className="text-left"
        title="Adjust how much freedom this agent has"
      >
        <Badge variant={tierBadgeVariant(guardrailTier)}>{TIER_LABEL[guardrailTier]}</Badge>
      </button>
      <span className="ml-auto truncate text-[11px] text-[var(--text-muted)]">
        {meta.discipline}
      </span>

      {open && (
        <div
          ref={popoverRef}
          role="dialog"
          aria-label="Agent memory"
          className="absolute left-4 top-full z-50 mt-1 w-[320px] max-w-[calc(100vw-2rem)] border border-[var(--border-default)] bg-[var(--bg-card)] shadow-lg"
        >
          <div className="border-b border-[var(--border-default)] px-3 py-2 text-[11px] font-medium text-[var(--text-secondary)]">
            What I remember
          </div>
          <div className="max-h-[260px] overflow-y-auto">
            {loading && (
              <div className="px-3 py-3 text-[11px] text-[var(--text-muted)]">Loading…</div>
            )}
            {!loading && error && (
              <div className="px-3 py-3 text-[11px] text-[var(--color-danger)]">{error}</div>
            )}
            {!loading && !error && rows && rows.length === 0 && (
              <div className="px-3 py-3 text-[11px] text-[var(--text-muted)]">
                Nothing saved yet.
              </div>
            )}
            {!loading && !error && rows && rows.length > 0 && (
              <MemoryGrouped rows={rows} onDelete={handleDelete} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MemoryGrouped({
  rows,
  onDelete,
}: {
  rows: MemoryRow[];
  onDelete: (key: string) => void;
}) {
  const grouped = useMemo(() => {
    const map = new Map<MemoryTopic, MemoryRow[]>();
    for (const row of rows) {
      const topic: MemoryTopic = isMemoryTopic(row.topic) ? row.topic : 'general';
      const list = map.get(topic);
      if (list) list.push(row);
      else map.set(topic, [row]);
    }
    return MEMORY_TOPIC_ORDER.map((t) => [t, map.get(t) ?? []] as const).filter(
      ([, list]) => list.length > 0
    );
  }, [rows]);

  return (
    <div className="flex flex-col">
      {grouped.map(([topic, list]) => (
        <div key={topic} className="border-b border-[var(--border-default)] last:border-b-0">
          <div className="flex items-center justify-between gap-2 bg-[var(--bg-elevated)] px-3 py-1">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              {MEMORY_TOPIC_LABELS[topic]}
            </span>
            <span className="text-[10px] tabular-nums text-[var(--text-muted)]">{list.length}</span>
          </div>
          {list.map((row) => (
            <MemoryItemRow key={row.id} row={row} onDelete={onDelete} />
          ))}
        </div>
      ))}
    </div>
  );
}

function MemoryItemRow({ row, onDelete }: { row: MemoryRow; onDelete: (key: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const preview = previewValue(row);
  const hasBody = !!(row.body && row.body.trim().length > 0);

  return (
    <div className="flex items-start gap-2 border-t border-[var(--border-default)] px-3 py-2 first:border-t-0">
      <div className="min-w-0 flex-1">
        <div className="truncate text-[11px] font-medium text-[var(--text-primary)]">{row.key}</div>
        {preview && (
          <div className="truncate text-[11px] text-[var(--text-muted)]" title={preview}>
            {preview}
          </div>
        )}
        {hasBody && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-0.5 text-[10px] text-[var(--text-muted)] underline-offset-2 hover:text-[var(--text-primary)] hover:underline"
          >
            {expanded ? 'Hide details' : 'Show details'}
          </button>
        )}
        {hasBody && expanded && (
          <p className="mt-1 whitespace-pre-wrap text-[11px] leading-snug text-[var(--text-secondary)]">
            {row.body}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDelete(row.key)}
        className="shrink-0 text-[14px] leading-none text-[var(--text-muted)] hover:text-[var(--color-danger)]"
        aria-label={`Forget ${row.key}`}
      >
        ×
      </button>
    </div>
  );
}
