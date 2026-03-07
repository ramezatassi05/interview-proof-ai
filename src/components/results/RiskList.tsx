'use client';

import { useState } from 'react';
import type { RiskItem as RiskItemType } from '@/types';
import { RiskItem } from './RiskItem';
import { BlurFade } from '@/components/ui/blur-fade';

interface RiskListProps {
  risks: RiskItemType[];
  showEvidence?: boolean;
  title?: string;
}

type SeverityFilter = 'all' | 'critical' | 'high' | 'medium' | 'low';

const DEFAULT_SHOW_COUNT = 3;

export function RiskList({
  risks,
  showEvidence = false,
  title = 'Recruiter Red Flags',
}: RiskListProps) {
  const [showAll, setShowAll] = useState(false);
  const [filter, setFilter] = useState<SeverityFilter>('all');

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
      <div className="rounded-xl bg-[var(--bg-card)] p-8 text-center">
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

  const filteredRisks = filter === 'all' ? risks : risks.filter((r) => r.severity === filter);
  const displayedRisks = showAll ? filteredRisks : filteredRisks.slice(0, DEFAULT_SHOW_COUNT);
  const hiddenCount = filteredRisks.length - DEFAULT_SHOW_COUNT;

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

        <div className="flex items-center gap-3">
          {/* Severity filter */}
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value as SeverityFilter);
              setShowAll(false);
            }}
            className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical ({severityCounts.critical || 0})</option>
            <option value="high">High ({severityCounts.high || 0})</option>
            <option value="medium">Medium ({severityCounts.medium || 0})</option>
            <option value="low">Low ({severityCounts.low || 0})</option>
          </select>

          {/* Severity breakdown dots */}
          <div className="hidden sm:flex items-center gap-3 text-xs">
            {severityCounts.critical && (
              <span className="flex items-center gap-1 text-[var(--color-danger)]">
                <span className="h-2 w-2 rounded-full bg-[var(--color-danger)]" />
                {severityCounts.critical}
              </span>
            )}
            {severityCounts.high && (
              <span className="flex items-center gap-1 text-[var(--color-danger)]">
                <span className="h-2 w-2 rounded-full bg-[var(--color-danger)]/70" />
                {severityCounts.high}
              </span>
            )}
            {severityCounts.medium && (
              <span className="flex items-center gap-1 text-[var(--color-warning)]">
                <span className="h-2 w-2 rounded-full bg-[var(--color-warning)]" />
                {severityCounts.medium}
              </span>
            )}
            {severityCounts.low && (
              <span className="flex items-center gap-1 text-[var(--color-success)]">
                <span className="h-2 w-2 rounded-full bg-[var(--color-success)]" />
                {severityCounts.low}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {displayedRisks.map((risk, index) => (
          <BlurFade key={risk.id} delay={0.06 * index}>
            <RiskItem risk={risk} index={index} showEvidence={showEvidence} />
          </BlurFade>
        ))}
      </div>

      {/* Show all / collapse toggle */}
      {!showAll && hiddenCount > 0 && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-4 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--border-accent)] hover:text-[var(--text-primary)]"
        >
          Show {hiddenCount} more risk{hiddenCount !== 1 ? 's' : ''}
        </button>
      )}
      {showAll && filteredRisks.length > DEFAULT_SHOW_COUNT && (
        <button
          onClick={() => setShowAll(false)}
          className="mt-4 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--border-accent)] hover:text-[var(--text-primary)]"
        >
          Show fewer
        </button>
      )}
    </div>
  );
}
