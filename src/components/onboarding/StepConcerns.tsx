'use client';

import { BlurFade } from '@/components/ui/blur-fade';
import { CONCERN_OPTIONS } from '@/lib/profile';
import type { InterviewConcern } from '@/types';

interface StepConcernsProps {
  concerns: InterviewConcern[];
  onChange: (concerns: InterviewConcern[]) => void;
}

export function StepConcerns({ concerns, onChange }: StepConcernsProps) {
  const toggle = (val: InterviewConcern) => {
    if (concerns.includes(val)) {
      onChange(concerns.filter((c) => c !== val));
    } else if (concerns.length < 5) {
      onChange([...concerns, val]);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <BlurFade delay={0}>
        <h1 className="mb-2 text-center font-serif text-3xl font-bold text-[var(--text-primary)]">
          Biggest Interview Concerns
        </h1>
      </BlurFade>

      <BlurFade delay={0.1}>
        <p className="mb-10 text-center text-[var(--text-secondary)]">
          What worries you most? Pick up to 5.
        </p>
      </BlurFade>

      <BlurFade delay={0.2}>
        <div className="w-full max-w-lg">
          <div className="flex flex-wrap justify-center gap-2.5">
            {CONCERN_OPTIONS.map((opt) => {
              const isSelected = concerns.includes(opt.value);
              const isDisabled = !isSelected && concerns.length >= 5;
              return (
                <button
                  key={opt.value}
                  onClick={() => toggle(opt.value)}
                  disabled={isDisabled}
                  className={`rounded-full border px-4 py-2.5 text-sm font-medium transition-all ${
                    isSelected
                      ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)] text-white'
                      : isDisabled
                        ? 'cursor-not-allowed border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-muted)] opacity-50'
                        : 'border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]/50 hover:text-[var(--text-primary)]'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
            {concerns.length}/5 selected
          </p>
        </div>
      </BlurFade>
    </div>
  );
}
