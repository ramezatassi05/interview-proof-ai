'use client';

import { Input } from '@/components/ui/Input';
import { BlurFade } from '@/components/ui/blur-fade';

interface StepCurrentSituationProps {
  currentRole: string;
  currentCompany: string;
  autoFilled: boolean;
  onChange: (field: 'currentRole' | 'currentCompany', value: string) => void;
}

export function StepCurrentSituation({
  currentRole,
  currentCompany,
  autoFilled,
  onChange,
}: StepCurrentSituationProps) {
  return (
    <div className="flex flex-col items-center">
      <BlurFade delay={0}>
        <h1 className="mb-2 text-center font-serif text-3xl font-bold text-[var(--text-primary)]">
          Current Situation
        </h1>
      </BlurFade>

      <BlurFade delay={0.1}>
        <p className="mb-10 text-center text-[var(--text-secondary)]">
          Where are you working now? Or your most recent role.
        </p>
      </BlurFade>

      <BlurFade delay={0.2}>
        <div className="flex w-full max-w-sm flex-col gap-5">
          {autoFilled && (
            <div className="flex items-center gap-2 rounded-lg bg-[var(--accent-primary)]/5 px-3 py-2">
              <svg className="h-4 w-4 text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-xs text-[var(--accent-primary)]">Auto-filled from your resume</span>
            </div>
          )}
          <Input
            label="Current Role"
            placeholder="e.g. Software Engineer"
            value={currentRole}
            onChange={(e) => onChange('currentRole', e.target.value)}
          />
          <Input
            label="Company"
            placeholder="e.g. Google"
            value={currentCompany}
            onChange={(e) => onChange('currentCompany', e.target.value)}
            hint="Optional"
          />
        </div>
      </BlurFade>
    </div>
  );
}
