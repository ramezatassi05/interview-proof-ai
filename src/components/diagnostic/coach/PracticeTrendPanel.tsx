'use client';

import type { PracticeProgress } from '@/types';

interface PracticeTrendPanelProps {
  practiceProgress: PracticeProgress;
}

const TREND_META: Record<
  PracticeProgress['scoreTrend'],
  { label: string; tone: 'success' | 'warning' | 'neutral'; icon: string }
> = {
  improving: { label: 'Improving', tone: 'success', icon: '↗' },
  flat: { label: 'Flat', tone: 'neutral', icon: '→' },
  declining: { label: 'Declining', tone: 'warning', icon: '↘' },
};

export function PracticeTrendPanel({ practiceProgress }: PracticeTrendPanelProps) {
  const empty = practiceProgress.answersAttempted === 0;
  const trend = TREND_META[practiceProgress.scoreTrend];
  const trendBg =
    trend.tone === 'success'
      ? 'bg-[var(--color-success-muted)] text-[var(--color-success)] border-[var(--color-success)]/30'
      : trend.tone === 'warning'
        ? 'bg-[var(--color-warning-muted)] text-[var(--color-warning)] border-[var(--color-warning)]/30'
        : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border-default)]';

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl overflow-hidden">
      <div className="px-6 pt-4 pb-2 border-b border-[var(--border-default)]">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Practice Trend</h3>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          How your scored answers are tracking across sessions.
        </p>
      </div>
      <div className="p-6">
        {empty ? (
          <p className="text-sm text-[var(--text-muted)]">
            You haven&apos;t scored any answers yet. Submit one in the Practice tab to start
            building a trend.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <Stat label="Attempts" value={String(practiceProgress.answersAttempted)} />
            <Stat
              label="Avg score"
              value={practiceProgress.avgScore != null ? String(practiceProgress.avgScore) : '—'}
            />
            <div className="flex flex-col">
              <p className="text-xs font-mono uppercase tracking-wide text-[var(--text-muted)]">
                Trend
              </p>
              <span
                className={`mt-1 inline-flex w-fit items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${trendBg}`}
              >
                <span aria-hidden>{trend.icon}</span>
                {trend.label}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <p className="text-xs font-mono uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">{value}</p>
    </div>
  );
}
