'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { skillById } from './agent-skill-catalog';
import type { ToolCallView } from './types';

export function ToolCallCard({ call }: { call: ToolCallView }) {
  const [expanded, setExpanded] = useState(false);
  const meta = skillById(call.skillId);
  const label = meta?.label ?? call.skillId;
  const accent = accentForStatus(call.status);

  return (
    <div className={`my-1.5 border ${accent.border} ${accent.bg}`}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left"
      >
        {call.status === 'running' ? (
          <Spinner />
        ) : (
          <span className={`h-2 w-2 ${accent.dot}`} aria-hidden />
        )}
        <span className="text-[11px] font-medium text-[var(--text-secondary)]">
          {statusLabel(call.status)}
        </span>
        <span className="text-[12px] font-medium text-[var(--text-primary)]">{label}</span>
        {call.linkedActionId ? <Badge variant="accent">Waiting on you</Badge> : null}
        {typeof call.latencyMs === 'number' && call.status !== 'running' && (
          <span className="ml-auto text-[10px] tabular-nums text-[var(--text-muted)]">
            {call.latencyMs}ms
          </span>
        )}
        {call.status !== 'running' && (
          <span className="ml-2 text-[10px] text-[var(--text-muted)]">{expanded ? '−' : '+'}</span>
        )}
      </button>
      {expanded && call.status !== 'running' && (
        <div className="border-t border-[var(--border-default)] px-3 py-2">
          {call.input && Object.keys(call.input).length > 0 && (
            <Section label="Input" data={call.input} />
          )}
          {call.output && <Section label="Output" data={call.output} />}
          {call.error && (
            <p className="mt-1 text-[11px] text-[var(--color-danger)]">{call.error}</p>
          )}
          {call.status === 'awaiting_approval' && (
            <p className="mt-2 text-[11px] text-[var(--accent-primary)]">
              I drafted this. Look it over on the right whenever you&apos;re ready and hit approve.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ label, data }: { label: string; data: Record<string, unknown> }) {
  return (
    <details className="mt-1 group" open>
      <summary className="cursor-pointer text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
        {label}
      </summary>
      <pre className="mt-1 max-h-56 overflow-auto whitespace-pre-wrap break-words border border-[var(--border-default)] bg-[var(--bg-primary)] p-2 text-[11px] leading-snug text-[var(--text-secondary)]">
        {JSON.stringify(data, null, 2)}
      </pre>
    </details>
  );
}

function statusLabel(status: ToolCallView['status']): string {
  switch (status) {
    case 'running':
      return 'Working on';
    case 'succeeded':
      return 'Pulled';
    case 'awaiting_approval':
      return 'Drafted — needs your OK on';
    case 'failed':
      return 'Hit a snag with';
  }
}

function accentForStatus(status: ToolCallView['status']) {
  switch (status) {
    case 'running':
      return {
        border: 'border-[var(--border-accent)]',
        bg: 'bg-[var(--bg-card)]',
        dot: 'bg-[var(--accent-primary)]',
      };
    case 'succeeded':
      return {
        border: 'border-[var(--border-default)]',
        bg: 'bg-[var(--bg-card)]',
        dot: 'bg-[var(--text-muted)]',
      };
    case 'awaiting_approval':
      return {
        border: 'border-[var(--color-warning)]/40',
        bg: 'bg-[var(--bg-card)]',
        dot: 'bg-[var(--color-warning)]',
      };
    case 'failed':
      return {
        border: 'border-[var(--color-danger)]/40',
        bg: 'bg-[var(--color-danger-muted)]',
        dot: 'bg-[var(--color-danger)]',
      };
  }
}

function Spinner() {
  return (
    <span
      className="h-3 w-3 animate-spin border-2 border-[var(--accent-primary)] border-t-transparent"
      aria-hidden
    />
  );
}
