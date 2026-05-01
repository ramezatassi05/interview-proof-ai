'use client';

import type { Opportunity } from '@/types';
import { StageBadge } from './StageBadge';

interface OpportunityCardProps {
  opportunity: Opportunity;
  onClick: () => void;
}

function formatInterviewDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function OpportunityCard({ opportunity, onClick }: OpportunityCardProps) {
  const interviewLabel = formatInterviewDate(opportunity.interviewDate);
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] p-3 text-left transition-colors hover:border-[var(--border-accent)]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
            {opportunity.companyName}
          </p>
          <p className="mt-0.5 truncate text-xs text-[var(--text-secondary)]">
            {opportunity.roleTitle}
          </p>
        </div>
        <StageBadge stage={opportunity.stage} />
      </div>
      {interviewLabel && (
        <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
          <svg
            className="h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          {interviewLabel}
        </p>
      )}
    </button>
  );
}
