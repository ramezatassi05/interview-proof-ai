import type { ReactNode } from 'react';
import type { RiskItem as RiskItemType } from '@/types';
import { Badge, severityToVariant } from '@/components/ui/Badge';

interface RiskItemProps {
  risk: RiskItemType;
  index: number;
  showEvidence?: boolean;
}

const severityIcons: Record<string, ReactNode> = {
  critical: (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
        clipRule="evenodd"
      />
    </svg>
  ),
  high: (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
        clipRule="evenodd"
      />
    </svg>
  ),
  medium: (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
        clipRule="evenodd"
      />
    </svg>
  ),
  low: (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
        clipRule="evenodd"
      />
    </svg>
  ),
};

export function RiskItem({ risk, index, showEvidence = false }: RiskItemProps) {
  const isCriticalOrHigh = risk.severity === 'critical' || risk.severity === 'high';

  return (
    <div
      className={`
        risk-signal
        rounded-lg border border-[var(--border-default)] p-4
        ${isCriticalOrHigh ? 'bg-[var(--color-danger-muted)]' : 'bg-[var(--bg-card)]'}
      `}
    >
      <div className="flex items-start gap-3">
        <div
          className={`
            flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full
            ${isCriticalOrHigh ? 'bg-[var(--color-danger)]/20 text-[var(--color-danger)]' : 'bg-[var(--bg-elevated)] text-[var(--text-muted)]'}
          `}
        >
          {severityIcons[risk.severity] || <span className="text-xs font-medium">{index + 1}</span>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={severityToVariant(risk.severity)}>{risk.severity}</Badge>
            <h3 className="font-semibold text-[var(--text-primary)]">{risk.title}</h3>
          </div>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">{risk.rationale}</p>

          {showEvidence && risk.missingEvidence && (
            <div className="mt-3 rounded-md bg-[var(--bg-elevated)] p-3 border border-[var(--border-subtle)]">
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-danger)]">
                Missing Evidence
              </p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{risk.missingEvidence}</p>
            </div>
          )}

          {showEvidence && risk.jdRefs && risk.jdRefs.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                JD Requirements
              </p>
              <ul className="mt-1 space-y-1">
                {risk.jdRefs.map((ref, i) => (
                  <li
                    key={i}
                    className="text-sm text-[var(--text-secondary)] flex items-start gap-2"
                  >
                    <span className="text-[var(--accent-primary)]">&bull;</span>
                    {ref}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
