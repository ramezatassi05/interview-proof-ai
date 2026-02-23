'use client';

import type { ReactNode } from 'react';
import type {
  RecruiterSimulation,
  FirstImpression,
  RecruiterInternalNotes,
  RecruiterDebriefSummary,
  CandidatePositioning,
} from '@/types';

interface RecruiterViewProps {
  simulation: RecruiterSimulation;
  companyName?: string;
}

function getImpressionConfig(impression: FirstImpression): {
  label: string;
  color: string;
  bg: string;
  border: string;
  icon: ReactNode;
} {
  switch (impression) {
    case 'proceed':
      return {
        label: 'Likely to Proceed',
        color: 'text-[var(--color-success)]',
        bg: 'bg-[var(--color-success-muted)]',
        border: 'border-[var(--color-success)]/30',
        icon: (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ),
      };
    case 'maybe':
      return {
        label: 'On the Fence',
        color: 'text-[var(--color-warning)]',
        bg: 'bg-[var(--color-warning-muted)]',
        border: 'border-[var(--color-warning)]/30',
        icon: (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ),
      };
    case 'reject':
      return {
        label: 'Risk of Rejection',
        color: 'text-[var(--color-danger)]',
        bg: 'bg-[var(--color-danger-muted)]',
        border: 'border-[var(--color-danger)]/30',
        icon: (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ),
      };
  }
}

function formatScreenTime(seconds: number): string {
  if (seconds < 60) return `${seconds} seconds`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds === 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  return `${minutes}m ${remainingSeconds}s`;
}

function getScreenTimeLabel(seconds: number): { label: string; color: string } {
  if (seconds < 30) return { label: 'Very Quick Scan', color: 'text-[var(--color-danger)]' };
  if (seconds < 45) return { label: 'Standard Review', color: 'text-[var(--color-warning)]' };
  if (seconds < 90) return { label: 'Engaged Review', color: 'text-[var(--color-success)]' };
  return { label: 'Deep Review', color: 'text-[var(--color-info)]' };
}

/* ─── Percentile Bar ─── */
function PercentileBar({ percentile }: { percentile: number }) {
  const clamped = Math.min(100, Math.max(0, percentile));
  const color =
    clamped >= 70
      ? 'var(--color-success)'
      : clamped >= 40
        ? 'var(--color-warning)'
        : 'var(--color-danger)';

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-[var(--text-muted)]">0</span>
        <span className="text-sm font-semibold" style={{ color }}>
          {clamped}th percentile
        </span>
        <span className="text-xs text-[var(--text-muted)]">100</span>
      </div>
      <div className="relative h-3 rounded-full overflow-hidden bg-[var(--bg-elevated)]">
        {/* Gradient track */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'linear-gradient(to right, var(--color-danger), var(--color-warning), var(--color-success))',
            opacity: 0.25,
          }}
        />
        {/* Filled portion */}
        <div
          className="absolute top-0 left-0 h-full rounded-full transition-all duration-500"
          style={{
            width: `${clamped}%`,
            background: `linear-gradient(to right, var(--color-danger), ${color})`,
          }}
        />
        {/* Marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-md transition-all duration-500"
          style={{
            left: `calc(${clamped}% - 8px)`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}

/* ─── Internal Notes Section ─── */
function InternalNotesSection({ notes }: { notes: RecruiterInternalNotes }) {
  return (
    <div className="mt-8">
      <h4 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide mb-4 flex items-center gap-2">
        <svg className="h-4 w-4 text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Recruiter&apos;s Internal Notes
      </h4>

      {/* First Glance */}
      <div className="rounded-[16px] bg-[var(--bg-elevated)] p-4 mb-4" style={{ borderLeft: '3px solid var(--accent-secondary)' }}>
        <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">First Glance</span>
        <p className="mt-1 text-sm text-[var(--text-secondary)] italic">&ldquo;{notes.firstGlanceReaction}&rdquo;</p>
      </div>

      {/* Starred Item */}
      <div className="rounded-[16px] border border-[var(--color-warning)]/30 bg-[var(--color-warning-muted)] p-4 mb-4 flex items-start gap-3">
        <svg className="h-5 w-5 text-[var(--color-warning)] mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
        <div>
          <span className="text-xs font-medium text-[var(--color-warning)] uppercase tracking-wide">Starred Item</span>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{notes.starredItem}</p>
        </div>
      </div>

      {/* Internal Concerns */}
      <div className="mb-4">
        <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide flex items-center gap-1.5 mb-2">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Internal Concerns
        </span>
        <div className="flex flex-wrap gap-2">
          {notes.internalConcerns.map((concern, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-warning)]/20 bg-[var(--color-warning-muted)] px-3 py-1.5 text-xs text-[var(--text-secondary)]"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-warning)]" />
              {concern}
            </span>
          ))}
        </div>
      </div>

      {/* Phone Screen Questions */}
      <div>
        <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-2 block">Phone Screen Questions</span>
        <div className="space-y-2">
          {notes.phoneScreenQuestions.map((q, i) => (
            <div
              key={i}
              className="rounded-[12px] bg-[var(--bg-elevated)] p-3 text-sm text-[var(--text-secondary)] flex items-start gap-2.5"
            >
              <span className="text-xs font-semibold text-[var(--accent-primary)] mt-0.5 shrink-0">{i + 1}.</span>
              {q}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Debrief Summary Section ─── */
function DebriefSummarySection({ debrief, impression }: { debrief: RecruiterDebriefSummary; impression: FirstImpression }) {
  const verdictColor =
    impression === 'proceed'
      ? 'var(--color-success)'
      : impression === 'maybe'
        ? 'var(--color-warning)'
        : 'var(--color-danger)';

  return (
    <div className="mt-8">
      <h4 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide mb-4 flex items-center gap-2">
        <svg className="h-4 w-4 text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
        </svg>
        Recruiter Debrief
      </h4>

      {/* One-liner Verdict */}
      <div
        className="rounded-[16px] p-4 mb-4 text-center"
        style={{
          borderLeft: `4px solid ${verdictColor}`,
          backgroundColor: `color-mix(in srgb, ${verdictColor} 8%, transparent)`,
        }}
      >
        <p className="text-base font-semibold text-[var(--text-primary)]">&ldquo;{debrief.oneLinerVerdict}&rdquo;</p>
      </div>

      {/* Advocate vs Pushback */}
      <div className="grid gap-4 md:grid-cols-2 mb-4">
        <div>
          <span className="text-xs font-medium text-[var(--color-success)] uppercase tracking-wide mb-2 block">Reasons to Advocate</span>
          <div className="space-y-1.5">
            {debrief.advocateReasons.map((reason, i) => (
              <span
                key={i}
                className="block rounded-full border border-[var(--color-success)]/20 bg-[var(--color-success-muted)] px-3 py-1.5 text-xs text-[var(--text-secondary)]"
              >
                {reason}
              </span>
            ))}
          </div>
        </div>
        <div>
          <span className="text-xs font-medium text-[var(--color-warning)] uppercase tracking-wide mb-2 block">Reasons to Push Back</span>
          <div className="space-y-1.5">
            {debrief.pushbackReasons.map((reason, i) => (
              <span
                key={i}
                className="block rounded-full border border-[var(--color-warning)]/20 bg-[var(--color-warning-muted)] px-3 py-1.5 text-xs text-[var(--text-secondary)]"
              >
                {reason}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendation Paragraph */}
      <div className="rounded-[16px] bg-[var(--bg-elevated)] p-4 mb-4" style={{ borderLeft: '3px solid var(--accent-primary)' }}>
        <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Internal ATS Note</span>
        <blockquote className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">
          {debrief.recommendationParagraph}
        </blockquote>
      </div>

      {/* Comparative Note */}
      <div className="rounded-[16px] bg-[var(--bg-elevated)] p-3 flex items-start gap-3">
        <svg className="h-5 w-5 text-[var(--accent-primary)] mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <div>
          <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Pool Comparison</span>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{debrief.comparativeNote}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Candidate Positioning Section ─── */
function CandidatePositioningSection({ positioning }: { positioning: CandidatePositioning }) {
  return (
    <div className="mt-8">
      <h4 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide mb-4 flex items-center gap-2">
        <svg className="h-4 w-4 text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        Candidate Positioning
      </h4>

      {/* Percentile Bar */}
      <div className="rounded-[16px] bg-[var(--bg-elevated)] p-4 mb-4">
        <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-3 block">Estimated Pool Percentile</span>
        <PercentileBar percentile={positioning.estimatedPoolPercentile} />
      </div>

      {/* Differentiator vs Liability */}
      <div className="grid gap-4 md:grid-cols-2 mb-4">
        <div className="rounded-[16px] border border-[var(--color-success)]/20 bg-[var(--color-success-muted)] p-4">
          <span className="text-xs font-medium text-[var(--color-success)] uppercase tracking-wide">Standout Differentiator</span>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">{positioning.standoutDifferentiator}</p>
        </div>
        <div className="rounded-[16px] border border-[var(--color-warning)]/20 bg-[var(--color-warning-muted)] p-4">
          <span className="text-xs font-medium text-[var(--color-warning)] uppercase tracking-wide">Biggest Liability</span>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">{positioning.biggestLiability}</p>
        </div>
      </div>

      {/* Advance Rationale */}
      <div className="rounded-[16px] bg-[var(--bg-elevated)] p-4" style={{ borderLeft: '3px solid var(--accent-primary)' }}>
        <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Advance Rationale</span>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">{positioning.advanceRationale}</p>
      </div>
    </div>
  );
}

/* ─── Main Component ─── */
export function RecruiterView({ simulation, companyName }: RecruiterViewProps) {
  const impressionConfig = getImpressionConfig(simulation.firstImpression);
  const screenTimeInfo = getScreenTimeLabel(simulation.estimatedScreenTimeSeconds);

  return (
    <div className="card-warm shadow-warm rounded-[20px] overflow-hidden">
      {/* Warm gradient header */}
      <div className="bg-gradient-to-r from-[var(--accent-primary)]/5 to-[var(--accent-secondary)]/5 px-6 pt-4 pb-2">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] section-header-warm">
          {companyName ? `${companyName} Recruiter First Impression` : 'Recruiter First Impression'}
        </h3>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Simulated recruiter perspective on initial resume scan
        </p>
      </div>

      <div className="p-6">

      {/* First Impression Badge */}
      <div
        className={`rounded-lg border ${impressionConfig.border} ${impressionConfig.bg} p-4 mb-6`}
      >
        <div className="flex items-center gap-3">
          <span className={impressionConfig.color}>{impressionConfig.icon}</span>
          <div>
            <span className={`text-lg font-semibold ${impressionConfig.color}`}>
              {impressionConfig.label}
            </span>
            <p className="text-sm text-[var(--text-secondary)] mt-1">{simulation.recruiterNotes}</p>
          </div>
        </div>
      </div>

      {/* Screen Time */}
      <div className="rounded-[16px] bg-[var(--bg-elevated)] p-4 mb-6" style={{ borderLeft: '3px solid var(--accent-primary)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg
              className="h-5 w-5 text-[var(--text-muted)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-[var(--text-secondary)]">Estimated Screen Time</span>
          </div>
          <div className="text-right">
            <span className="text-lg font-semibold text-[var(--accent-primary)]">
              {formatScreenTime(simulation.estimatedScreenTimeSeconds)}
            </span>
            <span className={`block text-xs ${screenTimeInfo.color}`}>{screenTimeInfo.label}</span>
          </div>
        </div>
      </div>

      {/* Two columns: Red Flags and Hidden Strengths */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Red Flags */}
        <div>
          <h4 className="text-sm font-medium text-[var(--color-danger)] uppercase tracking-wide mb-3 flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            Immediate Red Flags
          </h4>
          {simulation.immediateRedFlags.length > 0 ? (
            <ul className="space-y-2">
              {simulation.immediateRedFlags.map((flag, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 rounded-[16px] border border-[var(--color-danger)]/20 bg-[var(--color-danger-muted)] p-3 text-sm card-warm-hover"
                >
                  <span className="text-[var(--color-danger)] mt-0.5">-</span>
                  <span className="text-[var(--text-secondary)]">{flag}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[var(--text-muted)] italic">
              No immediate red flags identified
            </p>
          )}
        </div>

        {/* Hidden Strengths */}
        <div>
          <h4 className="text-sm font-medium text-[var(--color-success)] uppercase tracking-wide mb-3 flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
              />
            </svg>
            Hidden Strengths
          </h4>
          {simulation.hiddenStrengths.length > 0 ? (
            <ul className="space-y-2">
              {simulation.hiddenStrengths.map((strength, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 rounded-[16px] border border-[var(--color-success)]/20 bg-[var(--color-success-muted)] p-3 text-sm card-warm-hover"
                >
                  <span className="text-[var(--color-success)] mt-0.5">+</span>
                  <span className="text-[var(--text-secondary)]">{strength}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[var(--text-muted)] italic">
              No hidden strengths identified
            </p>
          )}
        </div>
      </div>

      {/* ─── New Sections ─── */}
      {simulation.internalNotes && (
        <InternalNotesSection notes={simulation.internalNotes} />
      )}

      {simulation.debriefSummary && (
        <DebriefSummarySection debrief={simulation.debriefSummary} impression={simulation.firstImpression} />
      )}

      {simulation.candidatePositioning && (
        <CandidatePositioningSection positioning={simulation.candidatePositioning} />
      )}

      {/* Version tag */}
      <div className="mt-6 pt-4 border-t border-[var(--border-default)]">
        <span className="text-xs text-[var(--text-muted)]">
          Simulation version {simulation.version}
        </span>
      </div>
      </div>
    </div>
  );
}
