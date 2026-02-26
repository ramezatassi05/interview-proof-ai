import { ReactNode } from 'react';

type MetricVariant = 'default' | 'success' | 'danger' | 'warning' | 'accent';
type TrendDirection = 'up' | 'down' | 'neutral';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: {
    direction: TrendDirection;
    value: string;
  };
  variant?: MetricVariant;
  className?: string;
}

const variantStyles: Record<MetricVariant, { bg: string; border: string; valueColor: string }> = {
  default: {
    bg: 'bg-[var(--bg-card)]',
    border: 'border-l-[var(--accent-primary)]',
    valueColor: 'text-[var(--text-primary)]',
  },
  success: {
    bg: 'bg-[var(--bg-card)]',
    border: 'border-l-[var(--color-success)]',
    valueColor: 'text-[var(--color-success)]',
  },
  danger: {
    bg: 'bg-[var(--bg-card)]',
    border: 'border-l-[var(--color-danger)]',
    valueColor: 'text-[var(--color-danger)]',
  },
  warning: {
    bg: 'bg-[var(--bg-card)]',
    border: 'border-l-[var(--color-warning)]',
    valueColor: 'text-[var(--color-warning)]',
  },
  accent: {
    bg: 'bg-[var(--bg-card)]',
    border: 'border-l-[var(--accent-primary)]',
    valueColor: 'text-[var(--accent-primary)]',
  },
};

const trendIcons: Record<TrendDirection, { icon: ReactNode; color: string }> = {
  up: {
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 10l7-7m0 0l7 7m-7-7v18"
        />
      </svg>
    ),
    color: 'text-[var(--color-success)]',
  },
  down: {
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 14l-7 7m0 0l-7-7m7 7V3"
        />
      </svg>
    ),
    color: 'text-[var(--color-danger)]',
  },
  neutral: {
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
      </svg>
    ),
    color: 'text-[var(--text-muted)]',
  },
};

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = 'default',
  className = '',
}: MetricCardProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={`
        rounded-xl border border-[var(--border-default)] border-l-2 p-4
        ${styles.bg}
        ${styles.border}
        ${className}
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-[var(--text-muted)]">{title}</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className={`font-mono text-2xl font-bold tabular-nums ${styles.valueColor}`}>
              {value}
            </span>
            {trend && (
              <span
                className={`flex items-center gap-0.5 text-sm ${trendIcons[trend.direction].color}`}
              >
                {trendIcons[trend.direction].icon}
                {trend.value}
              </span>
            )}
          </div>
          {subtitle && <p className="mt-1 text-sm text-[var(--text-secondary)]">{subtitle}</p>}
        </div>
        {icon && <div className="flex-shrink-0 text-[var(--text-muted)]">{icon}</div>}
      </div>
    </div>
  );
}
