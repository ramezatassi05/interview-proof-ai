'use client';

import { TOTAL_ONBOARDING_STEPS } from '@/lib/profile';

interface OnboardingProgressProps {
  currentStep: number;
}

export function OnboardingProgress({ currentStep }: OnboardingProgressProps) {
  const percentage = (currentStep / TOTAL_ONBOARDING_STEPS) * 100;

  return (
    <>
      {/* Top progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-[var(--track-bg)]">
        <div
          className="h-full rounded-r-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Step counter */}
      <div className="fixed top-4 right-6 z-50 flex items-center gap-3">
        <span className="font-mono text-xs font-medium tracking-wider text-[var(--text-muted)]">
          STEP {currentStep} OF {TOTAL_ONBOARDING_STEPS}
        </span>
      </div>
    </>
  );
}
