'use client';

import type { InterviewRoundForecasts, RoundForecastItem } from '@/types';

interface RoundForecastProps {
  forecasts: InterviewRoundForecasts;
}

// Round type display names and colors
const ROUND_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  technical: {
    label: 'Technical',
    color: 'bg-blue-500',
    bgColor: 'bg-blue-500/20',
  },
  behavioral: {
    label: 'Behavioral',
    color: 'bg-purple-500',
    bgColor: 'bg-purple-500/20',
  },
  case: {
    label: 'Case Study',
    color: 'bg-amber-500',
    bgColor: 'bg-amber-500/20',
  },
};

function getProbabilityLabel(probability: number): { label: string; color: string } {
  if (probability >= 0.7) return { label: 'Strong', color: 'text-emerald-400' };
  if (probability >= 0.5) return { label: 'Moderate', color: 'text-amber-400' };
  if (probability >= 0.3) return { label: 'At Risk', color: 'text-orange-400' };
  return { label: 'Critical', color: 'text-red-400' };
}

function ForecastBar({ forecast }: { forecast: RoundForecastItem }) {
  const config = ROUND_CONFIG[forecast.roundType];
  const percentage = Math.round(forecast.passProbability * 100);
  const probabilityInfo = getProbabilityLabel(forecast.passProbability);

  return (
    <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="font-medium text-[var(--text-primary)]">{config.label}</span>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${probabilityInfo.color}`}>
            {probabilityInfo.label}
          </span>
          <span className="text-lg font-bold text-[var(--text-primary)]">{percentage}%</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className={`h-3 w-full rounded-full ${config.bgColor}`}>
        <div
          className={`h-full rounded-full ${config.color} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Strength and risk */}
      <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-[var(--text-muted)]">Strength: </span>
          <span className="text-emerald-400">{forecast.primaryStrength}</span>
        </div>
        <div>
          <span className="text-[var(--text-muted)]">Risk: </span>
          <span className="text-red-400">{forecast.primaryRisk}</span>
        </div>
      </div>
    </div>
  );
}

export function RoundForecast({ forecasts }: RoundForecastProps) {
  // Sort by probability (lowest first to highlight areas needing work)
  const sortedForecasts = [...forecasts.forecasts].sort(
    (a, b) => a.passProbability - b.passProbability
  );

  return (
    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          Interview Round Forecast
        </h3>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Pass probability by interview stage based on your profile
        </p>
      </div>

      {/* Forecast bars */}
      <div className="space-y-4">
        {sortedForecasts.map((forecast) => (
          <ForecastBar key={forecast.roundType} forecast={forecast} />
        ))}
      </div>

      {/* Recommended focus */}
      <div className="mt-6 rounded-lg border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 p-4">
        <div className="flex items-start gap-3">
          <svg
            className="h-5 w-5 text-[var(--color-accent)] mt-0.5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <span className="font-medium text-[var(--color-accent)]">Recommended Focus</span>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {forecasts.recommendedFocus}
            </p>
          </div>
        </div>
      </div>

      {/* Version tag */}
      <div className="mt-6 pt-4 border-t border-[var(--border-default)]">
        <span className="text-xs text-[var(--text-muted)]">
          Forecast version {forecasts.version}
        </span>
      </div>
    </div>
  );
}
