'use client';

import { cn } from '@/lib/utils';
import { AnimatedShinyText } from '@/components/ui/animated-shiny-text';

const BLUR_MAP = {
  light: '3px',
  medium: '6px',
  heavy: '10px',
} as const;

interface LockedSectionProps {
  children: React.ReactNode;
  title: string;
  sectionNumber: string;
  blurIntensity?: 'light' | 'medium' | 'heavy';
  onUnlockClick?: () => void;
  className?: string;
}

export function LockedSection({
  children,
  title,
  sectionNumber,
  blurIntensity = 'medium',
  onUnlockClick,
  className,
}: LockedSectionProps) {
  const blur = BLUR_MAP[blurIntensity];

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Blurred content */}
      <div
        className="max-h-[300px] md:max-h-[400px] overflow-hidden"
        style={{
          filter: `blur(${blur})`,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
        aria-hidden="true"
      >
        {children}
      </div>

      {/* Gradient fade overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(to bottom, transparent 0%, transparent 30%, var(--bg-primary) 95%)',
        }}
      />

      {/* Lock badge overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
        <button
          onClick={onUnlockClick}
          className={cn(
            'flex flex-col items-center gap-2 px-6 py-4 rounded-xl',
            'bg-[var(--bg-card)]/80 backdrop-blur-xl',
            'border border-[var(--border-default)]',
            'shadow-lg cursor-pointer',
            'transition-all duration-200 hover:scale-[1.02] hover:shadow-xl',
            'hover:border-[var(--accent-primary)]/50'
          )}
        >
          {/* Lock icon */}
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-primary)]/15">
            <svg
              className="h-5 w-5 text-[var(--accent-primary)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>

          <div className="text-center">
            <span className="block font-mono text-xs text-[var(--accent-primary)]">
              {sectionNumber}
            </span>
            <AnimatedShinyText className="text-sm font-semibold text-[var(--text-primary)]">
              {title}
            </AnimatedShinyText>
          </div>

          <span className="text-xs font-medium text-[var(--accent-primary)]">
            Unlock to view
          </span>
        </button>
      </div>
    </div>
  );
}
