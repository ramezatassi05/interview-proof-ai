'use client';

import { useState } from 'react';
import type { InterviewRoundForecasts, RoundForecastItem } from '@/types';

interface RoundForecastProps {
  forecasts: InterviewRoundForecasts;
  userRoundType?: string;
  companyName?: string;
}

// Round type display names and colors
const ROUND_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  technical: {
    label: 'Technical',
    color: 'bg-[var(--color-info)]',
    bgColor: 'bg-[var(--color-info-muted)]',
  },
  behavioral: {
    label: 'Behavioral',
    color: 'bg-[var(--color-tier-1)]',
    bgColor: 'bg-[var(--color-tier-1-muted)]',
  },
  case: {
    label: 'Case Study',
    color: 'bg-[var(--color-warning)]',
    bgColor: 'bg-[var(--color-warning-muted)]',
  },
};

// Educational context for each round type
const ROUND_EXPLANATIONS: Record<
  string,
  { measures: string; typicalQuestions: string; evaluatedBy: string }
> = {
  technical: {
    measures: 'Coding ability, system design, and technical problem-solving',
    typicalQuestions: 'Algorithm problems, code review, architecture discussions',
    evaluatedBy: 'Your skills match to JD requirements + evidence of hands-on work',
  },
  behavioral: {
    measures: 'Communication, teamwork, leadership, and cultural fit',
    typicalQuestions: 'Tell me about a time..., How do you handle conflict...',
    evaluatedBy: 'Your clarity of expression + demonstrated impact in past roles',
  },
  case: {
    measures: 'Structured thinking, problem decomposition, business judgment',
    typicalQuestions: 'How would you approach..., Estimate the market size...',
    evaluatedBy: 'Your analytical clarity + ability to structure ambiguous problems',
  },
};

// Probability interpretation helper
function getProbabilityMeaning(probability: number): string {
  if (probability >= 0.75) return 'Strong position — focus on polish and confidence';
  if (probability >= 0.55) return 'Competitive but has gaps — targeted prep recommended';
  if (probability >= 0.35) return 'Significant preparation needed — prioritize this area';
  return 'Major gaps identified — consider timeline adjustment';
}

function getProbabilityLabel(probability: number): { label: string; color: string } {
  if (probability >= 0.7) return { label: 'Strong', color: 'text-[var(--color-success)]' };
  if (probability >= 0.5) return { label: 'Moderate', color: 'text-[var(--color-warning)]' };
  if (probability >= 0.3) return { label: 'At Risk', color: 'text-[var(--accent-primary)]' };
  return { label: 'Critical', color: 'text-[var(--color-danger)]' };
}

interface ForecastBarProps {
  forecast: RoundForecastItem;
  isUserRound?: boolean;
}

function ForecastBar({ forecast, isUserRound }: ForecastBarProps) {
  const [expanded, setExpanded] = useState(false);
  const config = ROUND_CONFIG[forecast.roundType];
  const explanation = ROUND_EXPLANATIONS[forecast.roundType];
  const percentage = Math.round(forecast.passProbability * 100);
  const probabilityInfo = getProbabilityLabel(forecast.passProbability);
  const probabilityMeaning = getProbabilityMeaning(forecast.passProbability);

  return (
    <div
      className={`bg-[var(--bg-elevated)] rounded-[16px] p-4 card-warm-hover ${
        isUserRound
          ? 'border border-[var(--color-accent)] ring-1 ring-[var(--color-accent)]/30'
          : 'border border-[var(--border-default)]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isUserRound && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--color-accent)]/20 text-[var(--color-accent)]">
              Your Focus
            </span>
          )}
          <span className="font-medium text-[var(--text-primary)]">{config.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${probabilityInfo.color}`}>
            {probabilityInfo.label}
          </span>
          <span className="text-lg font-bold text-[var(--text-primary)]">{percentage}%</span>
        </div>
      </div>

      {/* Probability interpretation */}
      <p className="text-xs text-[var(--text-muted)] mb-3">{probabilityMeaning}</p>

      {/* Progress bar */}
      <div className={`h-3 w-full rounded-full ${config.bgColor}`}>
        <div
          className={`h-full rounded-full bg-[var(--accent-primary)] transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Strength and risk */}
      <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-[var(--text-muted)]">Strength: </span>
          <span className="text-[var(--color-success)]">{forecast.primaryStrength}</span>
        </div>
        <div>
          <span className="text-[var(--text-muted)]">Risk: </span>
          <span className="text-[var(--color-danger)]">{forecast.primaryRisk}</span>
        </div>
      </div>

      {/* Expandable "What this measures" section */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-3 flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
      >
        <svg
          className={`h-4 w-4 transition-transform ${expanded ? 'rotate-90' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        What this measures
      </button>

      {expanded && explanation && (
        <div className="mt-3 pl-5 space-y-2 text-sm border-l-2 border-[var(--border-default)]">
          <div>
            <span className="text-[var(--text-muted)]">Evaluates: </span>
            <span className="text-[var(--text-secondary)]">{explanation.measures}</span>
          </div>
          <div>
            <span className="text-[var(--text-muted)]">Typical Questions: </span>
            <span className="text-[var(--text-secondary)]">{explanation.typicalQuestions}</span>
          </div>
          <div>
            <span className="text-[var(--text-muted)]">Based On: </span>
            <span className="text-[var(--text-secondary)]">{explanation.evaluatedBy}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function RoundForecast({ forecasts, userRoundType, companyName }: RoundForecastProps) {
  // Sort forecasts: user's round first, then by probability (lowest first)
  const sortedForecasts = [...forecasts.forecasts].sort((a, b) => {
    // User's selected round always first
    if (a.roundType === userRoundType) return -1;
    if (b.roundType === userRoundType) return 1;
    // Then sort by probability (lowest first to highlight areas needing work)
    return a.passProbability - b.passProbability;
  });

  return (
    <div className="card-warm shadow-warm rounded-[20px] overflow-hidden">
      {/* Warm gradient header */}
      <div className="bg-gradient-to-r from-[var(--accent-primary)]/5 to-[var(--accent-secondary)]/5 px-6 pt-4 pb-2">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] section-header-warm">
          {companyName ? `${companyName} Interview Round Forecast` : 'Interview Round Forecast'}
        </h3>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          How prepared you are for each interview stage based on your resume signals
        </p>
      </div>

      <div className="p-6">

      {/* Forecast bars */}
      <div className="space-y-4">
        {sortedForecasts.map((forecast) => (
          <ForecastBar
            key={forecast.roundType}
            forecast={forecast}
            isUserRound={forecast.roundType === userRoundType}
          />
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
    </div>
  );
}
