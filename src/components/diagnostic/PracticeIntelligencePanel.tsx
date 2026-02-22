'use client';

import { useState } from 'react';
import { formatHoursMinutes } from '@/lib/format';
import type {
  PracticeIntelligence,
  PracticeSyncIntelligence,
  PressureHandlingIndex,
  ConsistencyMomentumScore,
  PrecisionPracticeRx,
  PracticePrescription,
  PracticeType,
  PressureBand,
  MomentumBand,
} from '@/types';

interface PracticeIntelligencePanelProps {
  data: PracticeIntelligence;
  companyName?: string;
}

// ============================================
// Shared helpers
// ============================================

function getScoreColor(value: number): string {
  if (value >= 0.7) return 'text-emerald-400';
  if (value >= 0.5) return 'text-amber-400';
  return 'text-red-400';
}

function getScoreBarColor(value: number): string {
  if (value >= 0.7) return 'bg-emerald-500';
  if (value >= 0.5) return 'bg-amber-500';
  return 'bg-red-500';
}

function getLevelBadge(level: 'low' | 'moderate' | 'high'): { text: string; className: string } {
  switch (level) {
    case 'high':
      return {
        text: 'High',
        className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      };
    case 'moderate':
      return { text: 'Moderate', className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' };
    case 'low':
      return { text: 'Low', className: 'bg-red-500/15 text-red-400 border-red-500/30' };
  }
}

function ScoreBar({ value, label }: { value: number; label: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-[var(--text-secondary)]">{label}</span>
        <span className={`font-medium ${getScoreColor(value)}`}>{Math.round(value * 100)}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-[var(--bg-elevated)]">
        <div
          className={`h-2 rounded-full transition-all ${getScoreBarColor(value)}`}
          style={{ width: `${Math.round(value * 100)}%` }}
        />
      </div>
    </div>
  );
}

function ExpandableInfo({ title, children }: { title: string; children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="mt-4 border border-[var(--border-default)] rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 text-left text-sm text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] transition-colors"
      >
        <span>{title}</span>
        <svg
          className={`h-4 w-4 transition-transform ${expanded ? 'rotate-90' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
      {expanded && (
        <div className="px-3 pb-3 text-sm text-[var(--text-secondary)] border-t border-[var(--border-default)] bg-[var(--bg-elevated)]">
          <div className="pt-3">{children}</div>
        </div>
      )}
    </div>
  );
}

// ============================================
// 1. Practice Sync Section
// ============================================

function PracticeSyncSection({
  data,
  companyName,
}: {
  data: PracticeSyncIntelligence;
  companyName?: string;
}) {
  const codingBadge = getLevelBadge(data.codingExposure.level);
  const mockBadge = getLevelBadge(data.mockReadiness.level);

  return (
    <div className="rounded-[20px] bg-[var(--bg-card)] shadow-warm p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          {companyName ? `${companyName} Practice Sync` : 'Practice Sync'}
        </h3>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Coding exposure and mock interview readiness assessment
        </p>
      </div>

      {/* Overall readiness score */}
      <div className="flex items-center justify-center mb-6">
        <div className="text-center">
          <div
            className={`text-5xl font-bold ${
              data.overallPracticeReadiness >= 70
                ? 'text-emerald-400'
                : data.overallPracticeReadiness >= 45
                  ? 'text-amber-400'
                  : 'text-red-400'
            }`}
          >
            {data.overallPracticeReadiness}
          </div>
          <div className="text-sm text-[var(--text-muted)] mt-1">Practice Readiness</div>
        </div>
      </div>

      {/* Coding Exposure */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium text-[var(--text-primary)]">Coding Exposure</span>
          <span className={`text-xs px-2 py-0.5 rounded-full border ${codingBadge.className}`}>
            {codingBadge.text}
          </span>
        </div>
        <ScoreBar value={data.codingExposure.score} label="" />
        {data.codingExposure.signals.length > 0 && (
          <ul className="mt-2 space-y-1">
            {data.codingExposure.signals.map((signal, i) => (
              <li key={i} className="text-xs text-[var(--text-muted)] flex items-start gap-1.5">
                <span className="text-[var(--text-muted)] mt-0.5">-</span>
                {signal}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Mock Readiness */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium text-[var(--text-primary)]">Mock Readiness</span>
          <span className={`text-xs px-2 py-0.5 rounded-full border ${mockBadge.className}`}>
            {mockBadge.text}
          </span>
        </div>
        <ScoreBar value={data.mockReadiness.score} label="" />
        {data.mockReadiness.signals.length > 0 && (
          <ul className="mt-2 space-y-1">
            {data.mockReadiness.signals.map((signal, i) => (
              <li key={i} className="text-xs text-[var(--text-muted)] flex items-start gap-1.5">
                <span className="text-[var(--text-muted)] mt-0.5">-</span>
                {signal}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Recommendation */}
      <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
        <p className="text-sm text-[var(--text-secondary)]">{data.recommendation}</p>
      </div>

      <ExpandableInfo title="What this measures">
        <p>
          <strong>Coding Exposure</strong> estimates how well your resume demonstrates hands-on
          coding experience, weighted by technical skills match and evidence depth. Coding-related
          risks reduce this score.
        </p>
        <p className="mt-2">
          <strong>Mock Readiness</strong> gauges how prepared you appear for live interview
          interactions, based on communication clarity, round readiness, and culture fit signals.
        </p>
      </ExpandableInfo>
    </div>
  );
}

// ============================================
// 2. Pressure Index Section
// ============================================

function getPressureBandConfig(band: PressureBand): {
  label: string;
  className: string;
} {
  switch (band) {
    case 'elite':
      return {
        label: 'Elite',
        className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      };
    case 'high':
      return { label: 'High', className: 'bg-blue-500/15 text-blue-400 border-blue-500/30' };
    case 'moderate':
      return { label: 'Moderate', className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' };
    case 'low':
      return { label: 'Low', className: 'bg-red-500/15 text-red-400 border-red-500/30' };
  }
}

const PRESSURE_DIM_LABELS: Record<keyof PressureHandlingIndex['dimensions'], string> = {
  timeConstraintResilience: 'Time Constraint Resilience',
  ambiguityTolerance: 'Ambiguity Tolerance',
  technicalConfidence: 'Technical Confidence',
  communicationUnderStress: 'Communication Under Stress',
};

function PressureIndexSection({
  data,
  companyName,
}: {
  data: PressureHandlingIndex;
  companyName?: string;
}) {
  const bandConfig = getPressureBandConfig(data.band);

  return (
    <div className="rounded-[20px] bg-[var(--bg-card)] shadow-warm p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          {companyName ? `${companyName} Pressure Handling Index` : 'Pressure Handling Index'}
        </h3>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          How well you handle interview pressure across key dimensions
        </p>
      </div>

      {/* Score + band */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <div
          className={`text-5xl font-bold ${
            data.score >= 80
              ? 'text-emerald-400'
              : data.score >= 60
                ? 'text-blue-400'
                : data.score >= 40
                  ? 'text-amber-400'
                  : 'text-red-400'
          }`}
        >
          {data.score}
        </div>
        <span className={`text-sm px-3 py-1 rounded-full border ${bandConfig.className}`}>
          {bandConfig.label}
        </span>
      </div>

      {/* Dimension bars */}
      <div className="space-y-3 mb-6">
        {(Object.entries(data.dimensions) as [keyof typeof data.dimensions, number][]).map(
          ([key, value]) => (
            <ScoreBar key={key} value={value} label={PRESSURE_DIM_LABELS[key]} />
          )
        )}
      </div>

      {/* Weakest / Strongest insights */}
      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
          <span className="text-xs uppercase tracking-wide text-red-400">Weakest</span>
          <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
            {data.weakestDimension}
          </p>
        </div>
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
          <span className="text-xs uppercase tracking-wide text-emerald-400">Strongest</span>
          <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
            {data.strongestDimension}
          </p>
        </div>
      </div>

      {/* Coaching note */}
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
        <div className="flex items-start gap-2">
          <svg
            className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5"
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
          <p className="text-sm text-[var(--text-secondary)]">{data.coachingNote}</p>
        </div>
      </div>

      <ExpandableInfo title="What this measures">
        <p>
          The Pressure Handling Index estimates how well you perform under typical interview
          stressors. It blends your technical readiness, communication ability, and adaptability
          signals into four dimensions.
        </p>
        <p className="mt-2">
          <strong>Time Constraint Resilience</strong> — ability to perform under time limits.
          <br />
          <strong>Ambiguity Tolerance</strong> — comfort with open-ended or unclear problems.
          <br />
          <strong>Technical Confidence</strong> — depth of technical foundation.
          <br />
          <strong>Communication Under Stress</strong> — clarity when pressure is on.
        </p>
      </ExpandableInfo>
    </div>
  );
}

// ============================================
// 3. Consistency & Momentum Section
// ============================================

function getMomentumBandConfig(band: MomentumBand): {
  label: string;
  className: string;
} {
  switch (band) {
    case 'strong_momentum':
      return {
        label: 'Strong Momentum',
        className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      };
    case 'steady':
      return { label: 'Steady', className: 'bg-blue-500/15 text-blue-400 border-blue-500/30' };
    case 'inconsistent':
      return {
        label: 'Inconsistent',
        className: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      };
    case 'stalled':
      return { label: 'Stalled', className: 'bg-red-500/15 text-red-400 border-red-500/30' };
  }
}

const MOMENTUM_SIGNAL_LABELS: Record<keyof ConsistencyMomentumScore['signals'], string> = {
  skillBreadth: 'Skill Breadth',
  evidenceRecency: 'Evidence Recency',
  depthVsBreadth: 'Depth vs Breadth',
  progressionClarity: 'Progression Clarity',
};

function ConsistencyMomentumSection({
  data,
  companyName,
}: {
  data: ConsistencyMomentumScore;
  companyName?: string;
}) {
  const bandConfig = getMomentumBandConfig(data.band);

  return (
    <div className="rounded-[20px] bg-[var(--bg-card)] shadow-warm p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          {companyName ? `${companyName} Consistency & Momentum` : 'Consistency & Momentum'}
        </h3>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Preparation consistency and career progression signals
        </p>
      </div>

      {/* Score + band */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <div
          className={`text-5xl font-bold ${
            data.score >= 75
              ? 'text-emerald-400'
              : data.score >= 55
                ? 'text-blue-400'
                : data.score >= 35
                  ? 'text-amber-400'
                  : 'text-red-400'
          }`}
        >
          {data.score}
        </div>
        <span className={`text-sm px-3 py-1 rounded-full border ${bandConfig.className}`}>
          {bandConfig.label}
        </span>
      </div>

      {/* Signal bars */}
      <div className="space-y-3 mb-6">
        {(Object.entries(data.signals) as [keyof typeof data.signals, number][]).map(
          ([key, value]) => (
            <ScoreBar key={key} value={value} label={MOMENTUM_SIGNAL_LABELS[key]} />
          )
        )}
      </div>

      {/* Insights list */}
      {data.insights.length > 0 && (
        <div className="mb-4 space-y-2">
          {data.insights.map((insight, i) => (
            <div
              key={i}
              className="flex items-start gap-2 rounded-xl bg-[var(--bg-elevated)] shadow-warm p-3 text-sm"
            >
              <svg
                className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5"
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
              <span className="text-[var(--text-secondary)]">{insight}</span>
            </div>
          ))}
        </div>
      )}

      {/* Recommendation */}
      <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
        <p className="text-sm text-[var(--text-secondary)]">{data.recommendation}</p>
      </div>

      <ExpandableInfo title="What this measures">
        <p>
          This score reflects how consistently your resume demonstrates preparation breadth, depth,
          and career momentum. It considers four signals:
        </p>
        <p className="mt-2">
          <strong>Skill Breadth</strong> — range of relevant skills demonstrated.
          <br />
          <strong>Evidence Recency</strong> — how recent and relevant your experience appears.
          <br />
          <strong>Depth vs Breadth</strong> — balance between deep expertise and broad coverage.
          <br />
          <strong>Progression Clarity</strong> — how clearly your career tells a growth story.
        </p>
      </ExpandableInfo>
    </div>
  );
}

// ============================================
// 4. Practice Rx Section
// ============================================

function getPracticeTypeBadge(type: PracticeType): { label: string; className: string } {
  switch (type) {
    case 'coding':
      return {
        label: 'Coding',
        className: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
      };
    case 'mock_interview':
      return {
        label: 'Mock Interview',
        className: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
      };
    case 'review':
      return { label: 'Review', className: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' };
    case 'drill':
      return { label: 'Drill', className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' };
    case 'project':
      return {
        label: 'Design',
        className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      };
  }
}

function getPriorityColor(priority: PracticePrescription['priority']): {
  border: string;
  bg: string;
  text: string;
  dot: string;
} {
  switch (priority) {
    case 'critical':
      return {
        border: 'border-red-500/30',
        bg: 'bg-red-500/5',
        text: 'text-red-400',
        dot: 'bg-red-500',
      };
    case 'high':
      return {
        border: 'border-amber-500/30',
        bg: 'bg-amber-500/5',
        text: 'text-amber-400',
        dot: 'bg-amber-500',
      };
    case 'medium':
      return {
        border: 'border-blue-500/30',
        bg: 'bg-blue-500/5',
        text: 'text-blue-400',
        dot: 'bg-blue-500',
      };
  }
}

function PracticeRxSection({
  data,
  companyName,
}: {
  data: PrecisionPracticeRx;
  companyName?: string;
}) {
  return (
    <div className="rounded-[20px] bg-[var(--bg-card)] shadow-warm p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          {companyName ? `${companyName} Practice Rx` : 'Practice Rx'}
        </h3>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Targeted practice prescriptions based on your identified gaps
        </p>
      </div>

      {/* Total hours header */}
      <div className="flex items-center justify-center mb-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-[var(--text-primary)]">
            ~{formatHoursMinutes(data.totalEstimatedHours)}
          </div>
          <div className="text-sm text-[var(--text-muted)]">Total Estimated Practice</div>
        </div>
      </div>

      {/* Focus summary */}
      <div className="rounded-lg border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/5 p-3 mb-6">
        <p className="text-sm text-[var(--text-secondary)]">{data.focusSummary}</p>
      </div>

      {/* Prescription cards */}
      <div className="space-y-3">
        {data.prescriptions.map((rx, index) => {
          const priorityConfig = getPriorityColor(rx.priority);
          const typeBadge = getPracticeTypeBadge(rx.practiceType);

          return (
            <div
              key={rx.id}
              className={`rounded-lg border ${priorityConfig.border} ${priorityConfig.bg} p-4`}
            >
              <div className="flex items-start gap-3">
                {/* Number */}
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${priorityConfig.dot} flex-shrink-0 mt-0.5`}
                >
                  {index + 1}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Title + badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {rx.title}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border ${typeBadge.className}`}
                    >
                      {typeBadge.label}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border ${priorityConfig.border} ${priorityConfig.text}`}
                    >
                      {rx.priority}
                    </span>
                  </div>

                  {/* Target gap */}
                  <p className="text-xs text-[var(--text-muted)] mb-2">Target: {rx.targetGap}</p>

                  {/* Sessions / time */}
                  <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                    <span>{rx.estimatedSessions} sessions</span>
                    <span>{rx.estimatedMinutesPerSession} min each</span>
                    <span className="capitalize">{rx.difficulty}</span>
                  </div>

                  {/* Rationale */}
                  <p className="mt-2 text-xs text-[var(--text-secondary)]">{rx.rationale}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <ExpandableInfo title="What this measures">
        <p>
          Practice Rx generates targeted prescriptions based on your identified risk gaps. Each
          prescription maps to a specific weakness and recommends a practice type, session count,
          and difficulty level calibrated to the severity of the gap.
        </p>
      </ExpandableInfo>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export function PracticeIntelligencePanel({ data, companyName }: PracticeIntelligencePanelProps) {
  return (
    <div className="space-y-6">
      <PracticeSyncSection data={data.practiceSync} companyName={companyName} />
      <PressureIndexSection data={data.pressureIndex} companyName={companyName} />
      <ConsistencyMomentumSection data={data.consistencyMomentum} companyName={companyName} />
      <PracticeRxSection data={data.practiceRx} companyName={companyName} />

      {/* Version tag */}
      <div className="pt-2">
        <span className="text-xs text-[var(--text-muted)]">
          Practice Intelligence {data.version}
        </span>
      </div>
    </div>
  );
}
