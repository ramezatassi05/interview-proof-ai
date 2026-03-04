'use client';

import { BrowserFrame } from './BrowserFrame';

const RISKS = [
  {
    title: 'Generic leadership example',
    severity: 'High',
    color: 'var(--color-danger)',
  },
  {
    title: 'No CI/CD pipeline experience',
    severity: 'High',
    color: 'var(--color-danger)',
  },
  {
    title: 'Missing system design depth',
    severity: 'Medium',
    color: 'var(--color-warning)',
  },
];

export function RisksMockup() {
  return (
    <BrowserFrame url="interviewproof.ai/report/risks">
      <div className="space-y-3">
        <p className="text-sm font-semibold text-[var(--text-primary)]">Top Rejection Risks</p>

        {RISKS.map((risk, i) => (
          <div
            key={risk.title}
            className="flex items-start gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-3.5"
            style={{
              animation: `mockup-slide-in 0.5s ease-out ${i * 0.3}s both`,
            }}
          >
            <span
              className="mt-0.5 h-2.5 w-2.5 flex-shrink-0 rounded-full"
              style={{ backgroundColor: risk.color }}
            />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-[var(--text-primary)]">{risk.title}</span>
              <span
                className="ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                style={{
                  backgroundColor: `color-mix(in srgb, ${risk.color} 10%, transparent)`,
                  color: risk.color,
                }}
              >
                {risk.severity}
              </span>
            </div>
          </div>
        ))}

        <div className="text-center pt-1">
          <span className="text-[11px] text-[var(--text-muted)]">
            + 4 more risks in full diagnostic
          </span>
        </div>
      </div>
    </BrowserFrame>
  );
}
