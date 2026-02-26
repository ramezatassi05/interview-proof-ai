'use client';

import { useState } from 'react';
import type {
  ArchetypeProfile,
  InterviewRoundForecasts,
  TrajectoryProjection,
  EvidenceContext,
  PersonalizedCoaching,
  CompanyDifficultyContext,
  CompanyTier,
} from '@/types';
import { RoundCoachingPanel } from './RoundCoachingPanel';

interface CoachingHubProps {
  archetypeProfile: ArchetypeProfile;
  roundForecasts?: InterviewRoundForecasts;
  trajectoryProjection?: TrajectoryProjection;
  evidenceContext?: EvidenceContext;
  personalizedCoaching?: PersonalizedCoaching;
  companyDifficulty?: CompanyDifficultyContext;
  userRoundType?: string;
  companyName?: string;
}

// -- Section 1: Candidate Profile --

function CandidateProfile({
  profile,
  companyName,
}: {
  profile: ArchetypeProfile;
  companyName?: string;
}) {
  const confidencePct = Math.round(profile.confidence * 100);

  return (
    <div className="rounded-xl border border-[var(--border-accent)] bg-[var(--accent-primary)]/5 p-6 card-warm-hover">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-[var(--accent-primary)] uppercase tracking-wide mb-1">
            Your Candidate Profile
          </p>
          <h3 className="text-xl font-bold text-[var(--text-primary)]">{profile.label}</h3>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
            {profile.description}
          </p>

          {/* Confidence bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-[var(--text-muted)]">Classification confidence</span>
              <span className="text-xs font-medium text-[var(--accent-primary)]">{confidencePct}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-[var(--accent-primary)]/10">
              <div
                className="h-full rounded-full bg-[var(--accent-primary)] transition-all duration-500"
                style={{ width: `${confidencePct}%` }}
              />
            </div>
          </div>

          {companyName && (
            <p className="mt-3 text-xs text-[var(--text-muted)]">
              Classified based on your {companyName} interview analysis
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// -- Section 3: Improvement Trajectory --

function ImprovementTrajectory({ trajectory }: { trajectory: TrajectoryProjection }) {
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const m1 = trajectory.milestone1Day ?? 3;
  const m2 = trajectory.milestone2Day ?? 7;
  const m3 = trajectory.milestone3Day ?? 14;

  const milestones = [
    {
      key: 'day3',
      label: `Day ${m1}`,
      ...trajectory.day3Projection,
    },
    {
      key: 'day7',
      label: `Day ${m2}`,
      ...trajectory.day7Projection,
    },
    {
      key: 'day14',
      label: `Day ${m3}`,
      ...trajectory.day14Projection,
    },
  ];

  const totalImprovement = trajectory.day14Projection.score - trajectory.currentScore;

  const potentialColors: Record<string, { text: string; bg: string }> = {
    high: { text: 'text-[var(--color-success)]', bg: 'bg-[var(--color-success-muted)]' },
    medium: { text: 'text-[var(--color-warning)]', bg: 'bg-[var(--color-warning-muted)]' },
    low: { text: 'text-[var(--text-muted)]', bg: 'bg-[var(--bg-elevated)]' },
  };

  const potentialStyle = potentialColors[trajectory.improvementPotential] ?? potentialColors.medium;

  return (
    <div className="rounded-xl bg-[var(--bg-card)] p-6 card-warm-hover">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Improvement Trajectory</h3>
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded ${potentialStyle.bg} ${potentialStyle.text}`}
        >
          {{ high: 'High Growth', medium: 'Steady Growth', low: 'Polish & Perfect' }[trajectory.improvementPotential]}
        </span>
      </div>
      <p className="text-sm text-[var(--text-muted)] mb-6">
        Projected score growth with consistent preparation
      </p>

      {/* Current score anchor */}
      <div className="flex items-center gap-3 mb-5">
        <span className="text-sm text-[var(--text-muted)]">Current</span>
        <div className="flex-1 h-px bg-[var(--border-default)]" />
        <span className="text-2xl font-bold text-[var(--text-primary)]">
          {trajectory.currentScore}
        </span>
      </div>

      {/* Timeline milestones */}
      <div className="grid grid-cols-3 gap-3">
        {milestones.map((m) => {
          const delta = m.score - trajectory.currentScore;
          const isExpanded = expandedDay === m.key;

          return (
            <button
              key={m.key}
              onClick={() => setExpandedDay(isExpanded ? null : m.key)}
              className="rounded-xl bg-[var(--bg-elevated)] p-4 text-left hover:border-[var(--color-success)]/40 transition-colors border border-transparent card-warm-hover"
            >
              <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
                {m.label}
              </span>
              <p className="mt-1 text-xl font-bold text-[var(--text-primary)]">{m.score}</p>
              {delta > 0 && (
                <span className="text-sm font-medium text-[var(--color-success)]">+{delta} pts</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Expanded assumptions */}
      {expandedDay && (
        <div className="mt-3 rounded-xl bg-[var(--bg-elevated)] p-4">
          <p className="text-xs font-medium text-[var(--text-muted)] mb-2">
            {milestones.find((m) => m.key === expandedDay)?.label} assumptions
          </p>
          <ul className="space-y-1.5">
            {milestones
              .find((m) => m.key === expandedDay)
              ?.assumptions.map((a, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                  <span className="text-[var(--text-muted)] mt-0.5">-</span>
                  {a}
                </li>
              ))}
          </ul>
        </div>
      )}

      {/* Summary */}
      {totalImprovement > 0 && (
        <div className="mt-5 rounded-lg bg-[var(--color-success-muted)] border border-[var(--color-success)]/20 p-4 text-center">
          <span className="text-sm text-[var(--text-secondary)]">
            <span className="font-semibold text-[var(--color-success)]">+{totalImprovement} points</span>{' '}
            projected improvement over {m3} days
          </span>
        </div>
      )}
    </div>
  );
}

// -- Section 4: Personalized Action Plan --

function ActionPlan({ coachingTips, roundFocus }: { coachingTips: string[]; roundFocus?: string }) {
  const [showAll, setShowAll] = useState(false);

  const visibleTips = showAll ? coachingTips : coachingTips.slice(0, 2);

  return (
    <div className="rounded-xl bg-[var(--bg-card)] p-6 card-warm-hover">
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
        Personalized Action Plan
      </h3>
      <p className="text-sm text-[var(--text-muted)] mb-5 mt-3">
        Targeted actions based on your candidate archetype
      </p>

      <div className="space-y-3">
        {visibleTips.map((tip, index) => (
          <div
            key={index}
            className="rounded-xl bg-[var(--bg-elevated)] p-4 border-l-3 border-l-[var(--accent-primary)]"
            style={{ borderLeft: '3px solid var(--accent-primary)' }}
          >
            <div className="flex items-start gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent-primary)]/15 text-xs font-semibold text-[var(--accent-primary)]">
                {index + 1}
              </span>
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{tip}</p>
            </div>
          </div>
        ))}
      </div>

      {coachingTips.length > 2 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-3 flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <svg
            className={`h-4 w-4 transition-transform ${showAll ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          {showAll ? 'Show less' : `Show ${coachingTips.length - 2} more`}
        </button>
      )}

      {roundFocus && (
        <div className="mt-5 rounded-lg border border-[var(--color-warning)]/30 bg-[var(--color-warning-muted)] p-4">
          <div className="flex items-start gap-3">
            <svg
              className="h-5 w-5 text-[var(--color-warning)] mt-0.5 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <div>
              <span className="text-sm font-medium text-[var(--color-warning)]">Round-Specific Focus</span>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{roundFocus}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -- Section 5: Evidence Snapshot --

function EvidenceSnapshot({ evidence }: { evidence: EvidenceContext }) {
  return (
    <div className="rounded-xl bg-[var(--bg-card)] p-6 card-warm-hover">
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
        Your Evidence Snapshot
      </h3>
      <p className="text-sm text-[var(--text-muted)] mb-5 mt-3">
        What your resume already proves to recruiters
      </p>

      {/* Two-column: met vs unmet requirements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Requirements met */}
        {evidence.matchedMustHaves.length > 0 && (
          <div className="rounded-lg border border-[var(--color-success)]/20 bg-[var(--color-success-muted)] p-4">
            <p className="text-xs font-medium text-[var(--color-success)] uppercase tracking-wide mb-3">
              Requirements You Meet
            </p>
            <ul className="space-y-2">
              {evidence.matchedMustHaves.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                  <svg
                    className="h-4 w-4 text-[var(--color-success)] mt-0.5 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Requirements to address */}
        {evidence.unmatchedMustHaves.length > 0 && (
          <div className="rounded-lg border border-[var(--color-warning)]/20 bg-[var(--color-warning-muted)] p-4">
            <p className="text-xs font-medium text-[var(--color-warning)] uppercase tracking-wide mb-3">
              Requirements to Address
            </p>
            <ul className="space-y-2">
              {evidence.unmatchedMustHaves.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                  <svg
                    className="h-4 w-4 text-[var(--color-warning)] mt-0.5 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01"
                    />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Bonus qualifications */}
      {evidence.matchedNiceToHaves.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-[var(--text-muted)] mb-2">Bonus Qualifications</p>
          <div className="flex flex-wrap gap-2">
            {evidence.matchedNiceToHaves.map((item, i) => (
              <span
                key={i}
                className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-[var(--color-info-muted)] text-[var(--color-info)] border border-[var(--color-info)]/20"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Strongest metrics */}
      {evidence.strongestMetrics.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-medium text-[var(--text-muted)] mb-3">
            Your Strongest Evidence
          </p>
          <div className="space-y-2">
            {evidence.strongestMetrics.map((metric, i) => (
              <div
                key={i}
                className="border-l-2 border-[var(--color-success)]/50 pl-3 py-1 text-sm text-[var(--text-secondary)]"
              >
                {metric}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// -- Section 6: Ways to Stand Out --

const TIER_BADGE_COLORS: Record<CompanyTier, { bg: string; text: string; border: string }> = {
  FAANG_PLUS: { bg: 'bg-[var(--color-tier-1-muted)]', text: 'text-[var(--color-tier-1)]', border: 'border-[var(--color-tier-1)]/30' },
  BIG_TECH: { bg: 'bg-[var(--color-info-muted)]', text: 'text-[var(--color-info)]', border: 'border-[var(--color-info)]/30' },
  TOP_FINANCE: {
    bg: 'bg-[var(--color-success-muted)]',
    text: 'text-[var(--color-success)]',
    border: 'border-[var(--color-success)]/30',
  },
  UNICORN: { bg: 'bg-[var(--accent-primary)]/10', text: 'text-[var(--accent-primary)]', border: 'border-[var(--accent-primary)]/30' },
  GROWTH: { bg: 'bg-[var(--color-success-muted)]', text: 'text-[var(--color-success)]', border: 'border-[var(--color-success)]/30' },
  STANDARD: { bg: 'bg-[var(--bg-elevated)]', text: 'text-[var(--text-muted)]', border: 'border-[var(--border-default)]' },
};

const TIER_LABELS: Record<CompanyTier, string> = {
  FAANG_PLUS: 'FAANG+',
  BIG_TECH: 'Big Tech',
  TOP_FINANCE: 'Top Finance',
  UNICORN: 'Unicorn',
  GROWTH: 'Growth',
  STANDARD: 'Standard',
};

const COMPETITION_LABELS: Record<string, { label: string; color: string }> = {
  extreme: { label: 'Extreme', color: 'text-[var(--color-danger)]' },
  very_high: { label: 'Very High', color: 'text-[var(--accent-primary)]' },
  high: { label: 'High', color: 'text-[var(--color-warning)]' },
  moderate: { label: 'Moderate', color: 'text-[var(--color-success)]' },
};

function WaysToStandOut({ difficulty }: { difficulty: CompanyDifficultyContext }) {
  const [showAll, setShowAll] = useState(false);
  const badgeColor = TIER_BADGE_COLORS[difficulty.tier];
  const competitionMeta =
    COMPETITION_LABELS[difficulty.competitionLevel] ?? COMPETITION_LABELS.moderate;

  const visibleStrategies = showAll
    ? difficulty.differentiationStrategies
    : difficulty.differentiationStrategies.slice(0, 3);

  return (
    <div className={`rounded-xl border ${badgeColor.border} bg-[var(--bg-card)] p-6 card-warm-hover`}>
      {/* Header with tier badge */}
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Ways to Stand Out</h3>
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded ${badgeColor.bg} ${badgeColor.text}`}
        >
          {TIER_LABELS[difficulty.tier]}
        </span>
      </div>
      <p className="text-sm text-[var(--text-muted)] mb-5 mt-3">
        How to differentiate yourself for {difficulty.companyName}
      </p>

      {/* Competition context panel */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="rounded-lg bg-[var(--bg-elevated)] p-3 text-center">
          <p className="text-xs text-[var(--text-muted)] mb-1">Competition</p>
          <p className={`text-sm font-semibold ${competitionMeta.color}`}>
            {competitionMeta.label}
          </p>
        </div>
        <div className="rounded-lg bg-[var(--bg-elevated)] p-3 text-center">
          <p className="text-xs text-[var(--text-muted)] mb-1">Accept Rate</p>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {difficulty.acceptanceRateEstimate}
          </p>
        </div>
        <div className="rounded-lg bg-[var(--bg-elevated)] p-3 text-center">
          <p className="text-xs text-[var(--text-muted)] mb-1">Difficulty</p>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {difficulty.difficultyScore}/150
          </p>
        </div>
      </div>

      {/* Interview bar description */}
      <div className="rounded-xl bg-[var(--bg-elevated)] p-4 mb-5">
        <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-2">
          Interview Bar
        </p>
        <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
          {difficulty.interviewBarDescription}
        </p>
      </div>

      {/* Intern warning callout */}
      {difficulty.isIntern && (
        <div className="rounded-lg border border-[var(--color-warning)]/30 bg-[var(--color-warning-muted)] p-4 mb-5">
          <div className="flex items-start gap-3">
            <svg
              className="h-5 w-5 text-[var(--color-warning)] mt-0.5 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <div>
              <span className="text-sm font-medium text-[var(--color-warning)]">Intern Competition Warning</span>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Intern positions at {difficulty.companyName} are extremely competitive with limited
                slots. Focus on demonstrating learning velocity, relevant coursework, and personal
                projects that show initiative beyond classroom requirements.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Differentiation strategies */}
      {difficulty.differentiationStrategies.length > 0 && (
        <>
          <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-3">
            Differentiation Strategies
          </p>
          <div className="space-y-2.5">
            {visibleStrategies.map((strategy, index) => (
              <div
                key={index}
                className="flex items-start gap-3 rounded-xl bg-[var(--bg-elevated)] p-3"
              >
                <span
                  className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ${badgeColor.bg} ${badgeColor.text}`}
                >
                  {index + 1}
                </span>
                <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{strategy}</p>
              </div>
            ))}
          </div>

          {difficulty.differentiationStrategies.length > 3 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="mt-3 flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <svg
                className={`h-4 w-4 transition-transform ${showAll ? 'rotate-90' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
              {showAll
                ? 'Show less'
                : `Show ${difficulty.differentiationStrategies.length - 3} more`}
            </button>
          )}
        </>
      )}
    </div>
  );
}

// -- Main CoachingHub --

export function CoachingHub({
  archetypeProfile,
  roundForecasts,
  trajectoryProjection,
  evidenceContext,
  personalizedCoaching,
  companyDifficulty,
  userRoundType,
  companyName,
}: CoachingHubProps) {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-6 space-y-6">
      {/* Section 1: Candidate Profile */}
      <CandidateProfile profile={archetypeProfile} companyName={companyName} />

      {/* Section 2: Round-Specific Coaching (replaces old forecast bars) */}
      {roundForecasts && (
        <RoundCoachingPanel
          forecasts={roundForecasts}
          userRoundType={userRoundType}
          companyName={companyName}
        />
      )}

      {/* Section 3: Improvement Trajectory */}
      {trajectoryProjection && <ImprovementTrajectory trajectory={trajectoryProjection} />}

      {/* Section 4: Personalized Action Plan */}
      <ActionPlan
        coachingTips={archetypeProfile.coachingTips}
        roundFocus={personalizedCoaching?.roundFocus}
      />

      {/* Section 5: Evidence Snapshot */}
      {evidenceContext && <EvidenceSnapshot evidence={evidenceContext} />}

      {/* Section 6: Ways to Stand Out (only for non-STANDARD companies) */}
      {companyDifficulty && companyDifficulty.tier !== 'STANDARD' && (
        <WaysToStandOut difficulty={companyDifficulty} />
      )}
    </div>
  );
}
