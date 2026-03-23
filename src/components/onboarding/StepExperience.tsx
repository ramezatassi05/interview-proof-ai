'use client';

import { BlurFade } from '@/components/ui/blur-fade';

interface StepExperienceProps {
  value: number | null;
  onChange: (years: number) => void;
}

const EXPERIENCE_OPTIONS = [
  { value: 0, label: '0' },
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4' },
  { value: 5, label: '5' },
  { value: 7, label: '7' },
  { value: 10, label: '10' },
  { value: 15, label: '15' },
  { value: 21, label: '20+' },
];

export function StepExperience({ value, onChange }: StepExperienceProps) {
  return (
    <div className="flex flex-col items-center">
      <BlurFade delay={0}>
        <h1 className="mb-2 text-center font-serif text-3xl font-bold text-[var(--text-primary)]">
          Years of Experience?
        </h1>
      </BlurFade>

      <BlurFade delay={0.1}>
        <p className="mb-10 text-center text-[var(--text-secondary)]">
          Include internships and freelance work.
        </p>
      </BlurFade>

      <BlurFade delay={0.2}>
        <div className="flex flex-wrap justify-center gap-3">
          {EXPERIENCE_OPTIONS.map((option) => {
            const isSelected = value === option.value;
            return (
              <button
                key={option.value}
                onClick={() => onChange(option.value)}
                className={`flex h-14 w-14 items-center justify-center rounded-xl border text-sm font-semibold transition-all ${
                  isSelected
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)] text-white shadow-lg shadow-[var(--accent-primary)]/25'
                    : 'border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:border-[var(--accent-primary)]/50 hover:bg-[var(--bg-secondary)]'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        {value !== null && (
          <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
            {value === 0
              ? 'No experience yet — everyone starts somewhere!'
              : value === 21
                ? '20+ years — seasoned professional'
                : `${value} year${value === 1 ? '' : 's'} of experience`}
          </p>
        )}
      </BlurFade>
    </div>
  );
}
