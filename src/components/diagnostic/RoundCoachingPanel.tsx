'use client';

import { useState } from 'react';
import type { InterviewRoundForecasts, RoundCoaching } from '@/types';

interface RoundCoachingPanelProps {
  forecasts: InterviewRoundForecasts;
  userRoundType?: string;
  companyName?: string;
}

// -- Coaching Recommendations --

function CoachingRecommendations({ items }: { items: string[] }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-info-muted)]">
          <svg
            className="h-4 w-4 text-[var(--color-info)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>
        <h4 className="text-sm font-semibold text-[var(--text-primary)]">
          Coaching Recommendations
        </h4>
      </div>
      <div className="space-y-3">
        {items.map((tip, i) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-lg border border-[var(--color-info)]/15 bg-[var(--color-info-muted)] p-4"
          >
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-info)]/20 text-xs font-bold text-[var(--color-info)]">
              {i + 1}
            </span>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{tip}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// -- Ways to Stand Out --

function StandOutStrategies({ items }: { items: string[] }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-success-muted)]">
          <svg
            className="h-4 w-4 text-[var(--color-success)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
        </div>
        <h4 className="text-sm font-semibold text-[var(--text-primary)]">How to Stand Out</h4>
      </div>
      <div className="space-y-2.5">
        {items.map((strategy, i) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-lg border border-[var(--color-success)]/15 bg-[var(--color-success-muted)] p-3.5"
          >
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
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{strategy}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// -- Questions to Ask Interviewer --

function InterviewerQuestions({ items }: { items: { question: string; context: string }[] }) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-tier-1-muted)]">
          <svg
            className="h-4 w-4 text-[var(--color-tier-1)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h4 className="text-sm font-semibold text-[var(--text-primary)]">
          Questions to Ask Your Interviewer
        </h4>
      </div>
      <div className="space-y-2.5">
        {items.map((item, i) => {
          const isExpanded = expandedIndex === i;
          return (
            <button
              key={i}
              onClick={() => setExpandedIndex(isExpanded ? null : i)}
              className="w-full text-left rounded-lg border border-[var(--color-tier-1)]/15 bg-[var(--color-tier-1-muted)] p-4 hover:border-[var(--color-tier-1)]/30 transition-colors"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-tier-1)]/20 text-xs font-bold text-[var(--color-tier-1)] mt-0.5">
                  Q
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] leading-relaxed">
                    &ldquo;{item.question}&rdquo;
                  </p>
                  {isExpanded && (
                    <div className="mt-3 pl-0 border-l-2 border-[var(--color-tier-1)]/30 pl-3">
                      <p className="text-xs font-medium text-[var(--color-tier-1)] mb-1">Why this impresses</p>
                      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                        {item.context}
                      </p>
                    </div>
                  )}
                </div>
                <svg
                  className={`h-4 w-4 text-[var(--color-tier-1)] mt-1 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
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
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// -- Sample Responses --

function SampleResponses({
  items,
}: {
  items: { scenario: string; response: string; whyItWorks: string }[];
}) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-warning-muted)]">
          <svg
            className="h-4 w-4 text-[var(--color-warning)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        </div>
        <h4 className="text-sm font-semibold text-[var(--text-primary)]">
          Answers That Show Passion & Fit
        </h4>
      </div>
      <div className="space-y-3">
        {items.map((item, i) => {
          const isExpanded = expandedIndex === i;
          return (
            <button
              key={i}
              onClick={() => setExpandedIndex(isExpanded ? null : i)}
              className="w-full text-left rounded-lg border border-[var(--color-warning)]/15 bg-[var(--color-warning-muted)] p-4 hover:border-[var(--color-warning)]/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[var(--color-warning)] mb-1.5">Scenario</p>
                  <p className="text-sm font-medium text-[var(--text-primary)] leading-relaxed">
                    {item.scenario}
                  </p>
                </div>
                <svg
                  className={`h-4 w-4 text-[var(--color-warning)] mt-1 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
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
              </div>
              {isExpanded && (
                <div className="mt-4 space-y-3">
                  <div className="rounded-lg bg-[var(--bg-elevated)] p-4 border border-[var(--border-default)]">
                    <p className="text-xs font-medium text-[var(--color-success)] mb-2">Sample Response</p>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
                      {item.response}
                    </p>
                  </div>
                  <div className="border-l-2 border-[var(--color-warning)]/30 pl-3">
                    <p className="text-xs font-medium text-[var(--color-warning)] mb-1">Why This Works</p>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                      {item.whyItWorks}
                    </p>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// -- Passion Signals --

function PassionSignals({ items }: { items: string[] }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-success-muted)]">
          <svg
            className="h-4 w-4 text-[var(--color-success)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </div>
        <h4 className="text-sm font-semibold text-[var(--text-primary)]">
          Ways to Show You&apos;re a Great Fit
        </h4>
      </div>
      <div className="space-y-2.5">
        {items.map((signal, i) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-lg border border-[var(--color-success)]/15 bg-[var(--color-success-muted)] p-3.5"
          >
            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-success)]/20 text-xs font-bold text-[var(--color-success)] mt-0.5">
              {i + 1}
            </span>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{signal}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// -- Fallback for old reports --

function FallbackFocus({ recommendedFocus }: { recommendedFocus: string }) {
  return (
    <div className="rounded-lg border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 p-4">
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
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{recommendedFocus}</p>
        </div>
      </div>
    </div>
  );
}

// -- Main Component --

function CoachingContent({ coaching }: { coaching: RoundCoaching }) {
  const roundLabel =
    coaching.roundType === 'technical'
      ? 'Technical'
      : coaching.roundType === 'behavioral'
        ? 'Behavioral'
        : coaching.roundType === 'case'
          ? 'Case Study'
          : coaching.roundType === 'finance'
            ? 'Finance'
            : coaching.roundType === 'research'
              ? 'Research / ML'
              : coaching.roundType;

  return (
    <div className="space-y-6">
      {/* Round type badge */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[var(--color-accent)]/15 text-[var(--color-accent)]">
          {roundLabel} Round
        </span>
      </div>

      {/* Section 1: Coaching Recommendations */}
      {coaching.coachingRecommendations.length > 0 && (
        <CoachingRecommendations items={coaching.coachingRecommendations} />
      )}

      {/* Section 2: How to Stand Out */}
      {coaching.waysToStandOut.length > 0 && <StandOutStrategies items={coaching.waysToStandOut} />}

      {/* Section 3: Questions to Ask */}
      {coaching.questionsToAskInterviewer.length > 0 && (
        <InterviewerQuestions items={coaching.questionsToAskInterviewer} />
      )}

      {/* Section 4: Sample Responses */}
      {coaching.sampleResponses.length > 0 && <SampleResponses items={coaching.sampleResponses} />}

      {/* Section 5: Passion Signals */}
      {coaching.passionSignals.length > 0 && <PassionSignals items={coaching.passionSignals} />}
    </div>
  );
}

export function RoundCoachingPanel({ forecasts, companyName }: RoundCoachingPanelProps) {
  const coaching = forecasts.roundCoaching;

  return (
    <div className="rounded-[20px] bg-[var(--bg-card)] shadow-warm p-6 card-warm-hover">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] section-header-warm">
          {companyName ? `${companyName} Interview Coaching` : 'Round-Specific Coaching'}
        </h3>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          Recruiter-level tips tailored to your resume, the job, and your interview round
        </p>
      </div>

      {/* Coaching content or fallback */}
      {coaching ? (
        <CoachingContent coaching={coaching} />
      ) : (
        <FallbackFocus recommendedFocus={forecasts.recommendedFocus} />
      )}

      {/* Version tag */}
      <div className="mt-6 pt-4 border-t border-[var(--border-default)]">
        <span className="text-xs text-[var(--text-muted)]">
          Coaching version {forecasts.version}
        </span>
      </div>
    </div>
  );
}
