'use client';

import { BlurFade } from '@/components/ui/blur-fade';
import { COMPENSATION_RANGES } from '@/lib/profile';

interface StepCompensationProps {
  currentRange: string | null;
  targetRange: string | null;
  onChange: (field: 'currentCompensationRange' | 'targetCompensationRange', value: string) => void;
}

function CompensationSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null;
  onChange: (val: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-[var(--text-secondary)]">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        {COMPENSATION_RANGES.map((range) => {
          const isSelected = value === range;
          return (
            <button
              key={range}
              onClick={() => onChange(range)}
              className={`rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                isSelected
                  ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                  : 'border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]/50'
              }`}
            >
              {range}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function StepCompensation({ currentRange, targetRange, onChange }: StepCompensationProps) {
  return (
    <div className="flex flex-col items-center">
      <BlurFade delay={0}>
        <h1 className="mb-2 text-center font-serif text-3xl font-bold text-[var(--text-primary)]">
          Compensation Goals
        </h1>
      </BlurFade>

      <BlurFade delay={0.1}>
        <p className="mb-2 text-center text-[var(--text-secondary)]">
          Help us understand your baseline and goals.
        </p>
        <div className="mb-8 flex items-center justify-center gap-1.5">
          <svg className="h-3.5 w-3.5 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span className="text-xs text-[var(--text-muted)]">Private & Secure — never shared</span>
        </div>
      </BlurFade>

      <BlurFade delay={0.2}>
        <div className="flex w-full max-w-md flex-col gap-6">
          <CompensationSelect
            label="Current Compensation"
            value={currentRange}
            onChange={(val) => onChange('currentCompensationRange', val)}
          />
          <CompensationSelect
            label="Target Compensation"
            value={targetRange}
            onChange={(val) => onChange('targetCompensationRange', val)}
          />
        </div>
      </BlurFade>
    </div>
  );
}
