import { ReactNode } from 'react';

interface StrengthSignalProps {
  title: string;
  description: string;
  impact?: 'high' | 'medium' | 'low';
  icon?: ReactNode;
  className?: string;
}

const impactLabels: Record<string, string> = {
  high: 'High Impact',
  medium: 'Medium Impact',
  low: 'Supporting',
};

export function StrengthSignal({
  title,
  description,
  impact = 'medium',
  icon,
  className = '',
}: StrengthSignalProps) {
  return (
    <div
      className={`
        strength-signal
        rounded-lg p-4
        ${className}
      `}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {icon || (
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-[var(--text-primary)]">{title}</h4>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-success)]/20 text-[var(--color-success)]">
              {impactLabels[impact]}
            </span>
          </div>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{description}</p>
        </div>
      </div>
    </div>
  );
}

interface StrengthListProps {
  strengths: Array<{
    title: string;
    description: string;
    impact?: 'high' | 'medium' | 'low';
  }>;
  title?: string;
  className?: string;
}

export function StrengthList({
  strengths,
  title = 'Key Strengths',
  className = '',
}: StrengthListProps) {
  if (strengths.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <div className="mb-4 flex items-center gap-2">
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
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          {title}
          <span className="ml-2 text-sm font-normal text-[var(--text-muted)]">
            ({strengths.length})
          </span>
        </h2>
      </div>
      <div className="space-y-3">
        {strengths.map((strength, index) => (
          <StrengthSignal
            key={index}
            title={strength.title}
            description={strength.description}
            impact={strength.impact}
          />
        ))}
      </div>
    </div>
  );
}
