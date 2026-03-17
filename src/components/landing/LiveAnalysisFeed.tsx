'use client';

import { Marquee } from '@/components/ui/marquee';
import { NumberTicker } from '@/components/ui/number-ticker';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Container } from '@/components/layout/Container';
import { cn } from '@/lib/utils';
import type { LandingReportData } from '@/types';

const entries = [
  { role: 'SWE', company: 'Google', score: 78, risk: 'Medium' as const },
  { role: 'PM', company: 'Meta', score: 85, risk: 'Low' as const },
  { role: 'Data Eng', company: 'Amazon', score: 62, risk: 'High' as const },
  { role: 'Frontend', company: 'Stripe', score: 91, risk: 'Low' as const },
  { role: 'Backend', company: 'Netflix', score: 71, risk: 'Medium' as const },
  { role: 'ML Eng', company: 'OpenAI', score: 88, risk: 'Low' as const },
  { role: 'DevOps', company: 'Uber', score: 55, risk: 'High' as const },
  { role: 'SWE', company: 'Apple', score: 82, risk: 'Low' as const },
  { role: 'SRE', company: 'Datadog', score: 67, risk: 'Medium' as const },
  { role: 'Full Stack', company: 'Shopify', score: 74, risk: 'Medium' as const },
];

const firstRow = entries.slice(0, 5);
const secondRow = entries.slice(5);

type Risk = 'Low' | 'Medium' | 'High';

const landingRiskStyle: Record<Risk, { color: string; bg: string; border: string }> = {
  High: {
    color: 'rgba(224, 82, 82, 0.55)',
    bg: 'rgba(224, 82, 82, 0.06)',
    border: 'rgba(224, 82, 82, 0.12)',
  },
  Medium: {
    color: 'rgba(217, 119, 6, 0.55)',
    bg: 'rgba(217, 119, 6, 0.05)',
    border: 'rgba(217, 119, 6, 0.10)',
  },
  Low: {
    color: 'rgba(5, 150, 105, 0.55)',
    bg: 'rgba(5, 150, 105, 0.06)',
    border: 'rgba(5, 150, 105, 0.12)',
  },
};

function DiagnosticCard({ role, company, score, risk }: (typeof entries)[number]) {
  return (
    <div
      className={cn(
        'relative w-64 rounded-2xl border border-[var(--border-default)]',
        'bg-[var(--bg-card)] p-4 overflow-hidden card-hover'
      )}
    >
      {/* Subtle neutral shimmer top accent bar */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(150,150,150,0.3), transparent)',
        }}
      />

      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-2xl font-bold text-[var(--text-primary)]">
            {score}
            <span className="text-sm font-normal text-[var(--text-muted)]">/100</span>
          </span>
          <span
            className="inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium tracking-wide border"
            style={{
              color: landingRiskStyle[risk].color,
              backgroundColor: landingRiskStyle[risk].bg,
              borderColor: landingRiskStyle[risk].border,
            }}
          >
            {risk} Risk
          </span>
        </div>
      </div>

      <div className="mt-3 text-sm font-medium text-[var(--text-primary)]">
        {role}
        <span className="mx-1.5 text-[var(--text-muted)]">@</span>
        <span className="text-[var(--text-secondary)]">{company}</span>
      </div>
    </div>
  );
}

interface LiveAnalysisFeedProps {
  lastReport?: LandingReportData | null;
}

const breakdownDimensions = [
  { key: 'hardRequirementMatch' as const, label: 'Hard Match' },
  { key: 'evidenceDepth' as const, label: 'Evidence' },
  { key: 'roundReadiness' as const, label: 'Readiness' },
  { key: 'resumeClarity' as const, label: 'Clarity' },
  { key: 'companyProxy' as const, label: 'Company Fit' },
];

export function LiveAnalysisFeed({ lastReport }: LiveAnalysisFeedProps) {
  // Authenticated view with real score breakdown
  if (lastReport?.scoreBreakdown) {
    const breakdown = lastReport.scoreBreakdown;
    const latestLabel = [lastReport.jobTitle, lastReport.companyName]
      .filter(Boolean)
      .join(' @ ');

    return (
      <section
        id="live-feed"
        className="border-y border-[var(--border-default)] bg-[var(--bg-secondary)] py-6"
      >
        <Container size="2xl">
          {/* Score breakdown tiles */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
            {breakdownDimensions.map(({ key, label }) => {
              const rawScore = breakdown[key];
              const score = Math.round(rawScore * 100);
              return (
                <div
                  key={key}
                  className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] px-4 py-3"
                >
                  <span className="text-xs font-medium text-[var(--text-muted)]">{label}</span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-xl font-bold text-[var(--text-primary)]">
                      <NumberTicker value={score} />
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">/100</span>
                  </div>
                  <div className="mt-2">
                    <ProgressBar value={score} size="sm" variant="auto" showValue={false} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom stats row */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
            {latestLabel && (
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-success)] opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-success)]" />
                </span>
                <span className="font-mono text-xs text-[var(--text-muted)]">
                  Your latest:{' '}
                  <span className="text-[var(--text-secondary)]">{latestLabel}</span>
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[var(--accent-primary)]" />
              <span className="font-mono text-xs text-[var(--text-muted)]">
                <NumberTicker
                  value={lastReport.readinessScore}
                  className="text-[var(--text-secondary)]"
                />{' '}
                readiness
              </span>
            </div>
          </div>
        </Container>
      </section>
    );
  }

  // Default marquee view (unauthenticated or no data)
  return (
    <section
      id="live-feed"
      className="border-y border-[var(--border-default)] bg-[var(--bg-secondary)] py-6"
    >
      <div className="relative flex flex-col gap-4">
        {/* Fade edge overlays */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[var(--bg-secondary)] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[var(--bg-secondary)] to-transparent" />

        <Marquee pauseOnHover className="[--duration:35s]">
          {firstRow.map((entry) => (
            <DiagnosticCard key={`${entry.role}-${entry.company}`} {...entry} />
          ))}
        </Marquee>

        <Marquee reverse pauseOnHover className="[--duration:35s]">
          {secondRow.map((entry) => (
            <DiagnosticCard key={`${entry.role}-${entry.company}`} {...entry} />
          ))}
        </Marquee>
      </div>

      <div className="mt-6 flex items-center justify-center gap-8">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-success)] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-success)]" />
          </span>
          <span className="font-mono text-xs text-[var(--text-muted)]">
            <NumberTicker value={2847} className="text-[var(--text-secondary)]" /> diagnostics run
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[var(--accent-primary)]" />
          <span className="font-mono text-xs text-[var(--text-muted)]">
            +<NumberTicker value={14} className="text-[var(--text-secondary)]" /> avg improvement
          </span>
        </div>
      </div>
    </section>
  );
}
