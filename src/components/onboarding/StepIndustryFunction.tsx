'use client';

import { BlurFade } from '@/components/ui/blur-fade';
import { INDUSTRY_OPTIONS, FUNCTION_OPTIONS } from '@/lib/profile';
import type { ProfileIndustry, ProfileFunction } from '@/types';

interface StepIndustryFunctionProps {
  industries: ProfileIndustry[];
  functions: ProfileFunction[];
  onIndustriesChange: (industries: ProfileIndustry[]) => void;
  onFunctionsChange: (functions: ProfileFunction[]) => void;
}

function TagButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
        selected
          ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)] text-white'
          : 'border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]/50 hover:text-[var(--text-primary)]'
      }`}
    >
      {label}
    </button>
  );
}

export function StepIndustryFunction({
  industries,
  functions,
  onIndustriesChange,
  onFunctionsChange,
}: StepIndustryFunctionProps) {
  const toggleIndustry = (val: ProfileIndustry) => {
    if (industries.includes(val)) {
      onIndustriesChange(industries.filter((i) => i !== val));
    } else {
      onIndustriesChange([...industries, val]);
    }
  };

  const toggleFunction = (val: ProfileFunction) => {
    if (functions.includes(val)) {
      onFunctionsChange(functions.filter((f) => f !== val));
    } else {
      onFunctionsChange([...functions, val]);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <BlurFade delay={0}>
        <h1 className="mb-2 text-center font-serif text-3xl font-bold text-[var(--text-primary)]">
          Industry & Function
        </h1>
      </BlurFade>

      <BlurFade delay={0.1}>
        <p className="mb-8 text-center text-[var(--text-secondary)]">
          Select all that apply to your career.
        </p>
      </BlurFade>

      <BlurFade delay={0.2}>
        <div className="w-full max-w-lg">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Industry
          </p>
          <div className="mb-8 flex flex-wrap gap-2">
            {INDUSTRY_OPTIONS.map((opt) => (
              <TagButton
                key={opt.value}
                label={opt.label}
                selected={industries.includes(opt.value)}
                onClick={() => toggleIndustry(opt.value)}
              />
            ))}
          </div>

          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Function
          </p>
          <div className="flex flex-wrap gap-2">
            {FUNCTION_OPTIONS.map((opt) => (
              <TagButton
                key={opt.value}
                label={opt.label}
                selected={functions.includes(opt.value)}
                onClick={() => toggleFunction(opt.value)}
              />
            ))}
          </div>
        </div>
      </BlurFade>
    </div>
  );
}
