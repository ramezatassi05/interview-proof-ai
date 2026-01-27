'use client';

import type { PriorityAction } from '@/types';

interface PriorityActionsProps {
  actions: PriorityAction[];
}

export function PriorityActions({ actions }: PriorityActionsProps) {
  if (!actions || actions.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border-2 border-emerald-500/30 bg-emerald-500/5 p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20">
          <svg
            className="h-5 w-5 text-emerald-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Start Here</h3>
          <p className="text-sm text-[var(--text-muted)]">
            Your top {actions.length} priority actions based on your specific gaps
          </p>
        </div>
      </div>

      {/* Actions List */}
      <div className="space-y-4">
        {actions.map((action, index) => (
          <div
            key={index}
            className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] p-4"
          >
            {/* Priority number and action */}
            <div className="flex items-start gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">
                {index + 1}
              </span>
              <div className="flex-1">
                <p className="font-medium text-[var(--text-primary)]">{action.action}</p>

                {/* Rationale */}
                <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">
                  <span className="font-medium text-[var(--text-muted)]">Why: </span>
                  {action.rationale}
                </p>

                {/* Resource (if provided) */}
                {action.resource && (
                  <div className="mt-3 flex items-start gap-2 rounded-md bg-blue-500/10 px-3 py-2">
                    <svg
                      className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-sm text-blue-300">{action.resource}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
