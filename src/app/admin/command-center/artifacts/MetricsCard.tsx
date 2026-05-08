'use client';

interface MetricsCardProps {
  data: Record<string, unknown>;
}

interface MetricEntry {
  key: string;
  label: string;
  display: string;
}

const SKIP_KEYS = new Set(['note', 'capturedAt']);

function humanizeKey(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/Usd/g, 'USD');
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function formatRate(value: number): string {
  // value may already be 0..1 or 0..100 — assume 0..1 if <= 1
  const pct = Math.abs(value) <= 1 ? value * 100 : value;
  return `${pct.toFixed(1)}%`;
}

function formatNumber(value: number): string {
  if (Math.abs(value) >= 1000) return value.toLocaleString();
  if (!Number.isInteger(value)) return value.toFixed(2);
  return String(value);
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'number') {
    if (key.endsWith('Cents')) return formatCents(value);
    if (key.endsWith('Dollars') || key.endsWith('Usd') || key.endsWith('USD')) {
      return `$${formatNumber(value)}`;
    }
    if (key.endsWith('Rate') || key.endsWith('Pct')) return formatRate(value);
    return formatNumber(value);
  }
  if (typeof value === 'string') {
    if (/At$/.test(key) || key === 'capturedAt') return formatTimestamp(value);
    return value;
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return `${value.length} items`;
  return JSON.stringify(value);
}

function entriesFromData(data: Record<string, unknown>): MetricEntry[] {
  const out: MetricEntry[] = [];
  for (const [key, value] of Object.entries(data)) {
    if (SKIP_KEYS.has(key)) continue;
    if (value === null || value === undefined) continue;
    if (Array.isArray(value)) continue; // arrays go to ListCard, not metrics
    if (typeof value === 'object') continue;
    // Hide *Cents entries when a *Dollars sibling exists (avoid duplication).
    if (key.endsWith('Cents')) {
      const dollarsKey = key.replace(/Cents$/, 'Dollars');
      if (dollarsKey in data && data[dollarsKey] != null) continue;
    }
    out.push({ key, label: humanizeKey(key), display: formatValue(key, value) });
  }
  return out;
}

export function MetricsCard({ data }: MetricsCardProps) {
  const entries = entriesFromData(data);
  const note = typeof data.note === 'string' ? data.note : null;
  const capturedAt = typeof data.capturedAt === 'string' ? data.capturedAt : null;

  if (entries.length === 0) {
    return (
      <div className="border border-[var(--border-default)] bg-[var(--bg-card)] p-3 text-[11px] text-[var(--text-muted)]">
        No metrics returned.
      </div>
    );
  }

  return (
    <div className="border border-[var(--border-default)] bg-[var(--bg-card)] p-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {entries.map((e) => (
          <div key={e.key} className="flex flex-col gap-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
              {e.label}
            </span>
            <span className="text-sm font-semibold tabular-nums text-[var(--text-primary)]">
              {e.display}
            </span>
          </div>
        ))}
      </div>
      {(note || capturedAt) && (
        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2 border-t border-[var(--border-default)] pt-2 text-[10px] text-[var(--text-muted)]">
          {note && <span className="italic">{note}</span>}
          {capturedAt && <span className="tabular-nums">as of {formatTimestamp(capturedAt)}</span>}
        </div>
      )}
    </div>
  );
}
