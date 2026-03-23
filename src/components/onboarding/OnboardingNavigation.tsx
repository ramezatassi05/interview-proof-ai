'use client';

import { Button } from '@/components/ui/Button';
import { isStepSkippable } from '@/lib/profile';

interface OnboardingNavigationProps {
  currentStep: number;
  onBack: () => void;
  onContinue: () => void;
  onSkip?: () => void;
  continueDisabled?: boolean;
  continueLoading?: boolean;
  continueLabel?: string;
}

export function OnboardingNavigation({
  currentStep,
  onBack,
  onContinue,
  onSkip,
  continueDisabled = false,
  continueLoading = false,
  continueLabel = 'Continue',
}: OnboardingNavigationProps) {
  const showBack = currentStep > 1;
  const showSkip = isStepSkippable(currentStep);

  return (
    <div className="mt-10 flex items-center justify-between">
      {/* Back button */}
      <div className="w-24">
        {showBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        )}
      </div>

      {/* Center: Continue + Skip */}
      <div className="flex flex-col items-center gap-3">
        <Button
          variant="accent"
          size="lg"
          onClick={onContinue}
          disabled={continueDisabled}
          loading={continueLoading}
          className="min-w-[180px]"
        >
          {continueLabel}
          {!continueLoading && (
            <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </Button>
        {showSkip && onSkip && (
          <button
            onClick={onSkip}
            className="text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
          >
            Skip for now
          </button>
        )}
      </div>

      {/* Spacer for alignment */}
      <div className="w-24" />
    </div>
  );
}
