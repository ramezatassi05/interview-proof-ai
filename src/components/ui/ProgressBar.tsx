'use client';

interface ProgressBarProps {
  value: number;
  max?: number;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'auto' | 'success' | 'warning' | 'danger' | 'accent';
  animated?: boolean;
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  showValue = true,
  size = 'md',
  variant = 'auto',
  animated = true,
  className = '',
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  // Determine color based on value if variant is 'auto'
  const getColor = () => {
    if (variant !== 'auto') return variant;
    if (value >= 70) return 'success';
    if (value >= 40) return 'warning';
    return 'danger';
  };

  const color = getColor();

  const colorClasses = {
    success: 'bg-[var(--color-success)]',
    warning: 'bg-[var(--color-warning)]',
    danger: 'bg-[var(--color-danger)]',
    accent: 'bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)]',
  };

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className={`flex-1 overflow-hidden rounded-full bg-[var(--track-bg)] ${sizeClasses[size]}`}
      >
        <div
          className={`h-full rounded-full ${colorClasses[color]} ${animated ? 'transition-all duration-700 ease-out' : ''}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showValue && (
        <span
          className={`font-semibold tabular-nums text-[var(--text-primary)] ${textSizeClasses[size]} min-w-[3.5rem] text-right`}
        >
          {Math.round(value)}/{max}
        </span>
      )}
    </div>
  );
}
