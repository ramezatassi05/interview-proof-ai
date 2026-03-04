'use client';

import { BrowserFrame } from './BrowserFrame';

export function UploadMockup() {
  return (
    <BrowserFrame url="interviewproof.ai/new">
      <div className="space-y-4">
        {/* Resume textarea */}
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">
            Resume
          </label>
          <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] p-3 text-xs text-[var(--text-secondary)] leading-relaxed">
            <div className="overflow-hidden whitespace-nowrap" style={{ animation: 'mockup-typing 3s steps(40) infinite' }}>
              Senior Software Engineer with 6+ years of experience in distributed systems, React, and TypeScript...
            </div>
          </div>
        </div>

        {/* JD textarea */}
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">
            Job Description
          </label>
          <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] p-3 text-xs text-[var(--text-muted)] leading-relaxed">
            <div className="overflow-hidden whitespace-nowrap" style={{ animation: 'mockup-typing 3s steps(40) 1s infinite' }}>
              We are looking for a Staff Engineer to lead our platform team...
            </div>
          </div>
        </div>

        {/* Round selector */}
        <div className="flex gap-2">
          <span className="rounded-full bg-[var(--accent-primary)]/10 px-3 py-1 text-[11px] font-medium text-[var(--accent-primary)]">Technical</span>
          <span className="rounded-full bg-[var(--bg-elevated)] px-3 py-1 text-[11px] text-[var(--text-muted)]">Behavioral</span>
          <span className="rounded-full bg-[var(--bg-elevated)] px-3 py-1 text-[11px] text-[var(--text-muted)]">Case</span>
        </div>

        {/* CTA button */}
        <div className="h-9 rounded-lg bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 flex items-center justify-center text-xs font-semibold text-white shadow-lg shadow-pink-500/20">
          Analyze My Fit
        </div>
      </div>
    </BrowserFrame>
  );
}
