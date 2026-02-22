import type { RiskItem as RiskItemType } from '@/types';
import { RiskItem } from './RiskItem';

interface RiskListProps {
  risks: RiskItemType[];
  showEvidence?: boolean;
  title?: string;
}

export function RiskList({
  risks,
  showEvidence = false,
  title = 'Recruiter Red Flags',
}: RiskListProps) {
  // Count by severity
  const severityCounts = risks.reduce(
    (acc, risk) => {
      acc[risk.severity] = (acc[risk.severity] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  if (risks.length === 0) {
    return (
      <div className="rounded-[20px] bg-[var(--bg-card)] p-8 text-center shadow-warm">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-success-muted)]">
          <svg
            className="h-6 w-6 text-[var(--color-success)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-[var(--text-secondary)]">No risks identified.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg
            className="h-5 w-5 text-[var(--color-danger)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            {title}
            <span className="ml-2 text-sm font-normal text-[var(--text-muted)]">
              ({risks.length})
            </span>
          </h2>
        </div>

        {/* Severity breakdown */}
        <div className="flex items-center gap-3 text-xs">
          {severityCounts.critical && (
            <span className="flex items-center gap-1 text-[var(--color-danger)]">
              <span className="h-2 w-2 rounded-full bg-[var(--color-danger)]" />
              {severityCounts.critical} critical
            </span>
          )}
          {severityCounts.high && (
            <span className="flex items-center gap-1 text-[var(--color-danger)]">
              <span className="h-2 w-2 rounded-full bg-[var(--color-danger)]/70" />
              {severityCounts.high} high
            </span>
          )}
          {severityCounts.medium && (
            <span className="flex items-center gap-1 text-[var(--color-warning)]">
              <span className="h-2 w-2 rounded-full bg-[var(--color-warning)]" />
              {severityCounts.medium} medium
            </span>
          )}
          {severityCounts.low && (
            <span className="flex items-center gap-1 text-[var(--color-success)]">
              <span className="h-2 w-2 rounded-full bg-[var(--color-success)]" />
              {severityCounts.low} low
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {risks.map((risk, index) => (
          <RiskItem key={risk.id} risk={risk} index={index} showEvidence={showEvidence} />
        ))}
      </div>
    </div>
  );
}
