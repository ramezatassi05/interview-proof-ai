'use client';

import { Input } from '@/components/ui/Input';
import { BlurFade } from '@/components/ui/blur-fade';

interface StepWelcomeNameProps {
  displayName: string;
  onChange: (name: string) => void;
}

export function StepWelcomeName({ displayName, onChange }: StepWelcomeNameProps) {
  return (
    <div className="flex flex-col items-center">
      <BlurFade delay={0}>
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent-primary)]/10">
          <svg className="h-8 w-8 text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        </div>
      </BlurFade>

      <BlurFade delay={0.1}>
        <h1 className="mb-2 text-center font-serif text-3xl font-bold text-[var(--text-primary)]">
          Welcome to InterviewProof
        </h1>
      </BlurFade>

      <BlurFade delay={0.2}>
        <p className="mb-10 text-center text-[var(--text-secondary)]">
          Let&apos;s personalize your interview prep experience.
        </p>
      </BlurFade>

      <BlurFade delay={0.3}>
        <div className="w-full max-w-sm">
          <Input
            label="What should we call you?"
            placeholder="Your name"
            value={displayName}
            onChange={(e) => onChange(e.target.value)}
            autoFocus
          />
        </div>
      </BlurFade>
    </div>
  );
}
