'use client';

import type { PrepPlan } from '@/types';

interface ActivePrepPlanPanelProps {
  prepPlan: PrepPlan | null;
}

export function ActivePrepPlanPanel({ prepPlan }: ActivePrepPlanPanelProps) {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl overflow-hidden">
      <div className="px-6 pt-4 pb-2 border-b border-[var(--border-default)]">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Active Prep Plan</h3>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          A day-by-day roadmap your coach maintains for you.
        </p>
      </div>
      <div className="p-6">
        {prepPlan ? (
          <div className="text-sm text-[var(--text-secondary)]">
            <p className="text-[var(--text-primary)] font-medium">
              Plan {prepPlan.id.slice(0, 8)} — {prepPlan.status}
            </p>
            <p className="mt-2">
              Plan rendering will arrive with the Prep Plan Agent. For now you can see that a plan
              is attached.
            </p>
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-[var(--border-default)] bg-[var(--bg-elevated)] px-4 py-6 text-center">
      <svg
        className="mx-auto h-6 w-6 text-[var(--text-muted)]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.75}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
      <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">No prep plan yet</p>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        Your coach will draft a personalized day-by-day plan once the Prep Plan agent ships.
      </p>
    </div>
  );
}
