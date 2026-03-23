'use client';

import { BlurFade } from '@/components/ui/blur-fade';
import { TIMELINE_OPTIONS } from '@/lib/profile';
import type { OnboardingInterviewTimeline } from '@/types';

interface StepTimelineProps {
  value: OnboardingInterviewTimeline | null;
  onChange: (timeline: OnboardingInterviewTimeline) => void;
}

const URGENCY_COLORS: Record<OnboardingInterviewTimeline, string> = {
  this_week: 'bg-[var(--color-danger)]',
  two_weeks: 'bg-[var(--color-warning)]',
  one_month: 'bg-[var(--color-success)]',
  one_to_three_months: 'bg-[var(--accent-primary)]',
  exploring: 'bg-[var(--text-muted)]',
};

export function StepTimeline({ value, onChange }: StepTimelineProps) {
  return (
    <div className="flex flex-col items-center">
      <BlurFade delay={0}>
        <h1 className="mb-2 text-center font-serif text-3xl font-bold text-[var(--text-primary)]">
          Interview Timeline
        </h1>
      </BlurFade>

      <BlurFade delay={0.1}>
        <p className="mb-10 text-center text-[var(--text-secondary)]">
          When is your next interview? This helps us prioritize your prep.
        </p>
      </BlurFade>

      <BlurFade delay={0.2}>
        <div className="grid w-full max-w-lg gap-3">
          {TIMELINE_OPTIONS.map((option) => {
            const isSelected = value === option.value;
            return (
              <button
                key={option.value}
                onClick={() => onChange(option.value)}
                className={`flex items-center gap-4 rounded-xl border px-5 py-4 text-left transition-all ${
                  isSelected
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 ring-2 ring-[var(--accent-primary)]/30'
                    : 'border-[var(--border-default)] bg-[var(--bg-card)] hover:border-[var(--accent-primary)]/50 hover:bg-[var(--bg-secondary)]'
                }`}
              >
                <div
                  className={`h-3 w-3 shrink-0 rounded-full ${URGENCY_COLORS[option.value]}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{option.label}</p>
                  <p className="text-xs text-[var(--text-muted)]">{option.description}</p>
                </div>
                {isSelected && (
                  <svg className="h-5 w-5 shrink-0 text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </BlurFade>
    </div>
  );
}
