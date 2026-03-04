'use client';

import { BrowserFrame } from './BrowserFrame';

const STEPS = [
  { label: 'Extracting resume data', done: true },
  { label: 'Parsing job requirements', done: true },
  { label: 'Cross-referencing rubrics', done: true },
  { label: 'Computing readiness score', done: false },
];

export function AnalysisMockup() {
  return (
    <BrowserFrame url="interviewproof.ai/analyzing">
      <div className="space-y-4">
        <div className="text-center">
          <p className="text-sm font-semibold text-[var(--text-primary)]">Analyzing Your Profile</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">This takes about 60 seconds</p>
        </div>

        {/* Progress bar */}
        <div className="h-2 rounded-full bg-[var(--track-bg)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--accent-primary)]"
            style={{
              '--progress-width': '72%',
              animation: 'mockup-progress 2.5s ease-out forwards',
            } as React.CSSProperties}
          />
        </div>

        {/* Steps */}
        <div className="space-y-2.5">
          {STEPS.map((step, i) => (
            <div
              key={step.label}
              className="flex items-center gap-3"
              style={{
                animation: `mockup-fade-in 0.4s ease-out ${i * 0.5}s both`,
              }}
            >
              {step.done ? (
                <svg className="h-4 w-4 text-[var(--color-success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-[var(--accent-primary)] border-t-transparent animate-spin" />
              )}
              <span className={`text-xs ${step.done ? 'text-[var(--text-secondary)]' : 'text-[var(--text-primary)] font-medium'}`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </BrowserFrame>
  );
}
