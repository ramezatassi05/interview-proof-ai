import { Badge, severityToVariant } from '@/components/ui/Badge';
import type { CompanyActionPriority, CompanyActionStatus } from '@/server/agents/company/types';

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
      {children}
    </p>
  );
}

// Friendlier, sentence-case label for places where SectionLabel's ALL CAPS feels too corporate.
export function SoftLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-medium text-[var(--text-secondary)]">
      {children}
    </p>
  );
}

export function HeroMetric({
  label,
  value,
  caption,
  gradient = false,
}: {
  label: string;
  value: string;
  caption?: string;
  gradient?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <p
        className={`text-4xl font-semibold leading-none tracking-tight tabular-nums sm:text-[44px] ${
          gradient
            ? 'bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] bg-clip-text text-transparent'
            : 'text-[var(--text-primary)]'
        }`}
      >
        {value}
      </p>
      <p className="text-sm font-medium text-[var(--text-secondary)]">{label}</p>
      {caption && (
        <p className="text-[11px] tabular-nums text-[var(--text-muted)]">{caption}</p>
      )}
    </div>
  );
}

export function MetaStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <span className="inline-flex items-baseline gap-1 text-[12px] text-[var(--text-muted)]">
      <span className="font-medium tabular-nums text-[var(--text-secondary)]">{value}</span>
      <span>{label}</span>
    </span>
  );
}

export function MetricTile({
  label,
  value,
  caption,
  emphasis = false,
}: {
  label: string;
  value: string;
  caption?: string;
  emphasis?: boolean;
}) {
  const valueColor = emphasis ? 'text-[var(--color-warning)]' : 'text-[var(--text-primary)]';
  const labelColor = emphasis ? 'text-[var(--color-warning)]' : 'text-[var(--text-muted)]';
  return (
    <div className="min-w-[140px] flex-1 border border-[var(--border-default)] bg-[var(--bg-card)] px-4 py-3">
      <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${labelColor}`}>
        {label}
      </p>
      <p className={`mt-1.5 text-2xl font-semibold tabular-nums ${valueColor}`}>{value}</p>
      {caption && (
        <p className="mt-0.5 text-[10px] text-[var(--text-muted)] tabular-nums">{caption}</p>
      )}
    </div>
  );
}

export function PriorityBadge({ priority }: { priority: CompanyActionPriority }) {
  return <Badge variant={severityToVariant(priority)}>{priority}</Badge>;
}

const STATUS_FRIENDLY: Record<CompanyActionStatus, string> = {
  drafted: 'draft',
  awaiting_approval: 'waiting on you',
  approved: 'approved',
  rejected: 'passed on',
  completed: 'done',
  failed: 'hit a snag',
};

export function StatusBadge({ status }: { status: CompanyActionStatus }) {
  const isAwaiting = status === 'awaiting_approval';
  return <Badge variant={isAwaiting ? 'accent' : 'default'}>{STATUS_FRIENDLY[status]}</Badge>;
}

export function humanizeKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
