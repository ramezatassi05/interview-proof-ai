'use client';

import type { PriorityAction } from '@/types';

interface PriorityActionsProps {
  actions: PriorityAction[];
  companyName?: string;
}

function renderResource(resource: string) {
  const urlRegex = /(https?:\/\/[^\s)]+)/g;
  const parts = resource.split(urlRegex);

  return parts.map((part, i) =>
    urlRegex.test(part) ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80">
        {part}
      </a>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export function PriorityActions({ actions, companyName }: PriorityActionsProps) {
  if (!actions || actions.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border-2 border-[var(--color-success)]/30 bg-[var(--color-success-muted)] p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-success)]/20">
          <svg
            className="h-5 w-5 text-[var(--color-success)]"
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
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            {companyName ? `${companyName} -- Start Here` : 'Start Here'}
          </h3>
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
            className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)] p-4"
          >
            {/* Priority number and action */}
            <div className="flex items-start gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-success)]/20 text-xs font-bold text-[var(--color-success)]">
                {index + 1}
              </span>
              <div className="flex-1">
                <p className="font-medium text-[var(--text-primary)]">{action.action}</p>

                {/* Rationale */}
                <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">
                  <span className="font-medium text-[var(--text-muted)]">Why: </span>
                  {action.rationale}
                </p>

                {/* Resources (if provided) */}
                {action.resources && action.resources.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {action.resources.map((res, ri) => (
                      <div key={ri} className="flex items-start gap-2 rounded-md bg-[var(--color-info-muted)] px-3 py-2">
                        <svg
                          className="h-4 w-4 text-[var(--color-info)] mt-0.5 flex-shrink-0"
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
                        <span className="text-sm text-[var(--color-info)]">
                          <span className="font-medium">Resource: </span>
                          {renderResource(res)}
                        </span>
                      </div>
                    ))}
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
