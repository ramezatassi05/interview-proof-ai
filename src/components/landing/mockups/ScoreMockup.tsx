'use client';

import { BrowserFrame } from './BrowserFrame';

const DIMENSIONS = [
  { label: 'Technical Match', value: 82, color: 'var(--color-success)' },
  { label: 'Evidence Depth', value: 65, color: 'var(--color-warning)' },
  { label: 'Round Readiness', value: 71, color: 'var(--color-warning)' },
  { label: 'Clarity', value: 88, color: 'var(--color-success)' },
];

export function ScoreMockup() {
  return (
    <BrowserFrame url="interviewproof.ai/report">
      <div className="space-y-4">
        {/* Score ring */}
        <div className="flex items-center justify-center">
          <div className="relative h-24 w-24">
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="var(--track-bg)" strokeWidth="8" />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="var(--color-warning)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray="264"
                style={{
                  '--score-circumference': '264',
                  '--score-offset': '71',
                  animation: 'mockup-score-fill 1.5s ease-out forwards',
                } as React.CSSProperties}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-[var(--text-primary)]">73</span>
              <span className="text-[10px] text-[var(--text-muted)]">/ 100</span>
            </div>
          </div>
        </div>

        <div className="text-center">
          <span className="rounded-full bg-[var(--color-warning)]/10 px-2.5 py-0.5 text-xs font-semibold text-[var(--color-warning)]">
            Medium Risk
          </span>
        </div>

        {/* Score bars */}
        <div className="space-y-2.5">
          {DIMENSIONS.map((dim, i) => (
            <div key={dim.label}>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-[var(--text-secondary)]">{dim.label}</span>
                <span className="font-semibold text-[var(--text-primary)]">{dim.value}</span>
              </div>
              <div className="h-1.5 rounded-full bg-[var(--track-bg)] overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: dim.color,
                    '--bar-width': `${dim.value}%`,
                    animation: `mockup-bar-grow 0.8s ease-out ${0.3 + i * 0.15}s both`,
                  } as React.CSSProperties}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </BrowserFrame>
  );
}
