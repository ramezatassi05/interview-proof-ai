'use client';

import { BrowserFrame } from './BrowserFrame';

export function PracticeMockup() {
  return (
    <BrowserFrame url="interviewproof.ai/report/practice">
      <div className="space-y-4">
        {/* Question card */}
        <div
          className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-4"
          style={{ animation: 'mockup-fade-in 0.5s ease-out both' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-full bg-[var(--accent-primary)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--accent-primary)]">
              Predicted Question
            </span>
            <span className="text-[10px] text-[var(--text-muted)]">87% likely</span>
          </div>
          <p className="text-xs font-medium text-[var(--text-primary)] leading-relaxed">
            &ldquo;Tell me about a time you had to lead a project with ambiguous requirements. How did you approach it?&rdquo;
          </p>
        </div>

        {/* Answer area */}
        <div
          className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-4"
          style={{ animation: 'mockup-fade-in 0.5s ease-out 0.5s both' }}
        >
          <p className="text-xs text-[var(--text-muted)] mb-2">Your Answer</p>
          <div className="text-xs text-[var(--text-secondary)] leading-relaxed overflow-hidden">
            <span style={{ animation: 'mockup-typing 4s steps(60) 1s both' }} className="inline-block overflow-hidden whitespace-nowrap">
              In my role at Acme Corp, I led the migration of our monolith to microservices...
            </span>
          </div>
        </div>

        {/* AI feedback */}
        <div
          className="rounded-xl border border-[var(--color-success)]/20 bg-[var(--color-success)]/5 p-4"
          style={{ animation: 'mockup-fade-in 0.5s ease-out 2s both' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <svg className="h-4 w-4 text-[var(--color-success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-[11px] font-semibold text-[var(--color-success)]">AI Feedback</span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Strong opening with context. Add specific metrics to strengthen impact.
          </p>
        </div>
      </div>
    </BrowserFrame>
  );
}
