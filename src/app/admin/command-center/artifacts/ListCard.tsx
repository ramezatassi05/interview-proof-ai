'use client';

interface ListCardProps {
  data: Record<string, unknown>;
}

const KNOWN_LIST_KEYS = ['items', 'incidents', 'deploys', 'threads', 'rows', 'results'];

function pickArray(data: Record<string, unknown>): { key: string; rows: Record<string, unknown>[] } | null {
  for (const key of KNOWN_LIST_KEYS) {
    const value = data[key];
    if (Array.isArray(value)) {
      return { key, rows: value as Record<string, unknown>[] };
    }
  }
  // Fall back: pick the first array-valued key.
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      return { key, rows: value as Record<string, unknown>[] };
    }
  }
  return null;
}

function pickTitle(row: Record<string, unknown>): string {
  for (const key of ['title', 'name', 'label', 'subject', 'summary', 'message']) {
    const value = row[key];
    if (typeof value === 'string' && value.trim().length > 0) return value;
  }
  return JSON.stringify(row).slice(0, 80);
}

function pickSubtitle(row: Record<string, unknown>): string | null {
  for (const key of ['status', 'state', 'severity', 'environment', 'category']) {
    const value = row[key];
    if (typeof value === 'string' && value.trim().length > 0) return value;
  }
  return null;
}

function pickTimestamp(row: Record<string, unknown>): string | null {
  for (const key of ['at', 'createdAt', 'created_at', 'occurredAt', 'occurred_at', 'capturedAt', 'updatedAt']) {
    const value = row[key];
    if (typeof value === 'string') {
      const date = new Date(value);
      if (!Number.isNaN(date.getTime())) {
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      }
    }
  }
  return null;
}

export function ListCard({ data }: ListCardProps) {
  const picked = pickArray(data);
  const note = typeof data.note === 'string' ? data.note : null;

  if (!picked || picked.rows.length === 0) {
    return (
      <div className="border border-[var(--border-default)] bg-[var(--bg-card)] p-3 text-[11px] text-[var(--text-muted)]">
        {note ?? 'Nothing to show.'}
      </div>
    );
  }

  return (
    <div className="border border-[var(--border-default)] bg-[var(--bg-card)]">
      <div className="flex items-center justify-between gap-2 border-b border-[var(--border-default)] px-3 py-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
          {picked.key}
        </span>
        <span className="text-[10px] tabular-nums text-[var(--text-muted)]">
          {picked.rows.length}
        </span>
      </div>
      <ul className="max-h-[280px] divide-y divide-[var(--border-default)] overflow-y-auto">
        {picked.rows.map((row, idx) => {
          const title = pickTitle(row);
          const subtitle = pickSubtitle(row);
          const ts = pickTimestamp(row);
          return (
            <li key={idx} className="flex items-baseline gap-2 px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs text-[var(--text-primary)]" title={title}>
                  {title}
                </p>
                {subtitle && (
                  <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                    {subtitle}
                  </p>
                )}
              </div>
              {ts && (
                <span className="text-[10px] tabular-nums text-[var(--text-muted)]">{ts}</span>
              )}
            </li>
          );
        })}
      </ul>
      {note && (
        <p className="border-t border-[var(--border-default)] px-3 py-2 text-[10px] italic text-[var(--text-muted)]">
          {note}
        </p>
      )}
    </div>
  );
}
