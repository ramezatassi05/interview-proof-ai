import Link from 'next/link';
import type { ReactNode } from 'react';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';
import { SectionBadge } from './SectionBadge';
import { BlurFade } from '@/components/ui/blur-fade';
import { MagicCard } from '@/components/ui/magic-card';
import { BorderBeam } from '@/components/ui/border-beam';
import { RadialScoreIndicator } from '@/components/ui/RadialScoreIndicator';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';

/* ─── Shared PreviewCard ─── */

function PreviewCard({
  title,
  icon,
  accentColor,
  children,
  ctaHref,
  ctaLabel = 'Unlock Full Report',
  hero,
}: {
  title: string;
  icon: ReactNode;
  accentColor: string;
  children: ReactNode;
  ctaHref: string;
  ctaLabel?: string;
  hero?: boolean;
}) {
  return (
    <MagicCard className="group relative h-full rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] overflow-hidden card-hover">
      {/* Accent gradient line */}
      <div
        className="h-0.5"
        style={{ background: `linear-gradient(to right, ${accentColor}, transparent)` }}
      />

      {/* Header */}
      <div className="flex items-center gap-2.5 px-5 pt-4 pb-3">
        <span style={{ color: accentColor }}>{icon}</span>
        <h4 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h4>
      </div>

      {/* Content */}
      <div className="px-5 pb-12">{children}</div>

      {/* Bottom fade gradient */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[var(--bg-card)] via-[var(--bg-card)]/80 to-transparent" />

      {/* Hover lock overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-primary)]/60 backdrop-blur-[3px] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <Link href={ctaHref}>
          <Button variant="accent" size="sm">
            {ctaLabel}
          </Button>
        </Link>
      </div>

      {hero && (
        <BorderBeam
          colorFrom="var(--color-warning)"
          colorTo="var(--color-danger)"
          duration={12}
          size={250}
        />
      )}
    </MagicCard>
  );
}

/* ─── 1. Would You Get Hired? (Hire Zone Gauge) ─── */

function HireZonePreview() {
  const score = 68;
  const hireZoneMin = 72;
  const hireZoneMax = 88;
  const industryAvg = 61;

  const svgWidth = 400;
  const svgHeight = 90;
  const barY = 35;
  const barHeight = 18;
  const barLeft = 20;
  const barRight = 380;
  const barWidth = barRight - barLeft;

  const scaleX = (s: number) => barLeft + (s / 100) * barWidth;

  const zoneMinX = scaleX(hireZoneMin);
  const zoneMaxX = scaleX(hireZoneMax);
  const scoreX = scaleX(score);
  const industryX = scaleX(industryAvg);

  const categoryGaps = [
    { label: 'Technical Depth', current: 62, target: 78 },
    { label: 'Communication', current: 71, target: 75 },
    { label: 'Role Fit', current: 58, target: 72 },
  ];

  return (
    <div className="space-y-3">
      {/* Radial Score */}
      <div className="flex justify-center">
        <RadialScoreIndicator size="lg" variant="auto" score={68} label="Your Score" />
      </div>

      {/* SVG Bar Gauge (compact) */}
      <div className="bg-[var(--bg-elevated)] rounded-xl p-2.5 flex justify-center overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full max-w-[400px]"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Full background bar */}
          <rect
            x={barLeft}
            y={barY}
            width={barWidth}
            height={barHeight}
            rx={4}
            fill="var(--accent-primary)"
            opacity={0.08}
          />

          {/* Hire zone band */}
          <rect
            x={zoneMinX}
            y={barY}
            width={zoneMaxX - zoneMinX}
            height={barHeight}
            fill="var(--color-success)"
            opacity={0.25}
            stroke="var(--color-success)"
            strokeWidth={1}
            strokeOpacity={0.4}
          />

          {/* Hire zone label */}
          <text
            x={(zoneMinX + zoneMaxX) / 2}
            y={barY - 10}
            textAnchor="middle"
            className="text-[9px] font-medium font-mono fill-[var(--color-success)]"
          >
            Hire Zone ({hireZoneMin}–{hireZoneMax})
          </text>

          {/* Industry average dashed line */}
          <line
            x1={industryX}
            y1={barY - 2}
            x2={industryX}
            y2={barY + barHeight + 2}
            stroke="var(--text-muted)"
            strokeWidth={1.5}
            strokeDasharray="3,2"
          />
          <text
            x={industryX}
            y={barY + barHeight + 14}
            textAnchor="middle"
            className="text-[9px] fill-[var(--text-muted)]"
          >
            Avg {industryAvg}
          </text>

          {/* User score triangle marker */}
          <polygon
            points={`${scoreX},${barY - 2} ${scoreX - 6},${barY - 10} ${scoreX + 6},${barY - 10}`}
            fill="var(--color-warning)"
          />

          {/* Full bar border */}
          <rect
            x={barLeft}
            y={barY}
            width={barWidth}
            height={barHeight}
            rx={4}
            fill="none"
            stroke="var(--border-default)"
            strokeWidth={1}
          />
        </svg>
      </div>

      {/* 2x2 Metrics Grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-xl bg-[var(--bg-elevated)] p-3 text-center card-warm-hover">
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">Your Score</p>
          <p className="mt-1 text-lg font-mono font-bold text-[var(--color-warning)]">{score}</p>
        </div>
        <div className="rounded-xl bg-[var(--bg-elevated)] p-3 text-center card-warm-hover">
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">Hire Zone</p>
          <p className="mt-1 text-lg font-mono font-bold text-[var(--accent-primary)]">
            {hireZoneMin}–{hireZoneMax}
          </p>
        </div>
        <div className="rounded-xl bg-[var(--bg-elevated)] p-3 text-center card-warm-hover">
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">Gap</p>
          <p className="mt-1 text-lg font-mono font-bold text-[var(--color-warning)]">4 pts</p>
        </div>
        <div className="rounded-xl bg-[var(--bg-elevated)] p-3 text-center card-warm-hover">
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">Percentile</p>
          <p className="mt-1 text-lg font-mono font-bold text-[var(--text-primary)]">54th</p>
        </div>
      </div>

      {/* Category Gap Bars */}
      <div className="space-y-2">
        {categoryGaps.map((cat) => (
          <div key={cat.label} className="flex items-center gap-2">
            <span className="text-[10px] text-[var(--text-muted)] w-[90px] flex-shrink-0 truncate">
              {cat.label}
            </span>
            <div className="flex-1 relative h-2 rounded-full bg-[var(--track-bg)] overflow-hidden">
              {/* Target bar (faded) */}
              <div
                className="absolute top-0 left-0 h-full rounded-full bg-[var(--color-success)] opacity-15"
                style={{ width: `${cat.target}%` }}
              />
              {/* Current bar */}
              <div
                className="absolute top-0 left-0 h-full rounded-full bg-[var(--color-warning)]"
                style={{ width: `${cat.current}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-[var(--text-muted)] w-[50px] text-right flex-shrink-0">
              {cat.current}/{cat.target}
            </span>
          </div>
        ))}
      </div>

      {/* Top Action Callout */}
      <div
        className="rounded-lg bg-[var(--bg-elevated)] p-3"
        style={{ borderLeft: '2px solid var(--color-info)' }}
      >
        <span className="text-[10px] font-medium text-[var(--color-info)] uppercase tracking-wide block mb-1">
          Top Action
        </span>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          Quantify your billing migration impact — add revenue/latency numbers
        </p>
      </div>
    </div>
  );
}

/* ─── 2. Your Interview Playbook ─── */

function PlaybookPreview() {
  const tips = [
    {
      text: 'Your resume says "improved performance" — lead with the exact number instead',
      source: 'Resume',
      icon: (
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
    },
    {
      text: 'They WILL ask system design. Use your billing migration as the walkthrough',
      source: 'Job Desc',
      icon: (
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      ),
    },
    {
      text: '"Tell me about leading a cross-functional project" — here\'s your answer framework',
      source: 'Behavioral',
      icon: (
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      ),
    },
  ];
  const questions = [
    'How does the team handle tech debt prioritization?',
    'What does 90-day success look like for this role?',
  ];

  return (
    <div className="space-y-4">
      {/* Match bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-medium text-[var(--accent-primary)] uppercase tracking-wide">
            Job Requirements Match
          </span>
          <span className="text-[10px] font-mono font-bold text-[var(--accent-primary)]">94%</span>
        </div>
        <ProgressBar value={94} size="sm" variant="accent" showValue={false} />
      </div>

      {/* Tips */}
      <div className="space-y-2">
        {tips.map((tip, i) => (
          <div
            key={i}
            className="flex items-start gap-2.5 rounded-lg border border-[var(--color-info)]/15 bg-[var(--color-info-muted)] p-3"
          >
            <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-info)]/20 text-sm font-bold text-[var(--color-info)] ring-2 ring-[var(--color-info)]/20">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                &ldquo;{tip.text}&rdquo;
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[var(--accent-primary)]">{tip.icon}</span>
                <Badge variant="accent">{tip.source}</Badge>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Questions That Impress */}
      <div>
        <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-2 block">
          Questions That Impress
        </span>
        {questions.map((q, i) => (
          <div
            key={i}
            className="rounded-lg bg-[var(--bg-elevated)] p-3 mb-2"
            style={{ borderLeft: '2px solid var(--color-tier-1)' }}
          >
            <div className="flex items-start gap-2.5">
              <svg
                className="h-4 w-4 flex-shrink-0 text-[var(--color-tier-1)] mt-0.5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2l2.09 4.26L19 7.27l-3.5 3.41.82 4.82L12 13.27l-4.32 2.23.82-4.82L5 7.27l4.91-1.01L12 2z" />
              </svg>
              <p className="text-sm text-[var(--text-primary)] leading-relaxed">&ldquo;{q}&rdquo;</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── 3. Questions They'll Ask You ─── */

function PredictedQuestionsPreview() {
  const questions = [
    {
      text: 'Design a rate limiter for an API gateway',
      likelihood: 92,
      difficulty: 'Hard' as const,
      area: 'System Design',
      source: 'Based on JD requirement: distributed systems',
    },
    {
      text: 'Describe a time you pushed back on a technical decision',
      likelihood: 88,
      difficulty: 'Medium' as const,
      area: 'Behavioral',
      source: 'Behavioral screening pattern for senior roles',
    },
    {
      text: 'Walk me through your indexing strategy in PostgreSQL',
      likelihood: 85,
      difficulty: 'Medium' as const,
      area: 'Technical',
      source: 'Based on resume: PostgreSQL experience',
    },
  ];

  const difficultyBorder = (d: 'Hard' | 'Medium') =>
    d === 'Hard' ? 'var(--color-danger)' : 'var(--color-warning)';

  return (
    <div className="space-y-3">
      {questions.map((q, i) => (
        <div
          key={i}
          className="rounded-lg bg-[var(--bg-elevated)] p-3.5"
          style={{ borderLeft: `2px solid ${difficultyBorder(q.difficulty)}` }}
        >
          <div className="flex items-start gap-2.5 flex-wrap">
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed flex-1 min-w-0">
              &ldquo;{q.text}&rdquo;
            </p>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Badge variant={q.difficulty === 'Hard' ? 'high' : 'medium'}>{q.difficulty}</Badge>
            </div>
          </div>
          <div className="mt-2">
            <ProgressBar value={q.likelihood} size="sm" variant="accent" showValue={false} />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="rounded bg-[var(--bg-primary)] px-2 py-0.5 text-[10px] font-mono uppercase text-[var(--text-muted)]">
              {q.area}
            </span>
            <span className="text-[10px] font-mono text-[var(--color-info)]">
              {q.likelihood}% likely
            </span>
          </div>
          <p className="text-[10px] text-[var(--text-muted)] mt-1 leading-relaxed">{q.source}</p>
        </div>
      ))}

      {/* Coach feedback callout */}
      <div className="mt-3 rounded-lg border border-[var(--accent-primary)]/20 bg-[var(--accent-primary)]/5 p-3 flex items-center gap-3">
        <RadialScoreIndicator size="sm" score={94} variant="auto" showPercentage={false} />
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed flex-1">
          <span className="font-semibold text-[var(--accent-primary)]">Coach-level feedback</span>{' '}
          on every answer — plus ideal responses crafted to make you the top candidate.
        </p>
      </div>
    </div>
  );
}

/* ─── 4. How Recruiters See You ─── */

function RecruiterPreview() {
  const percentile = 42;
  const pColor = 'var(--color-warning)';

  return (
    <div className="space-y-3">
      {/* Mini Percentile Bar */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-[var(--text-muted)]">0</span>
          <span className="text-xs font-semibold" style={{ color: pColor }}>
            {percentile}nd percentile
          </span>
          <span className="text-[10px] text-[var(--text-muted)]">100</span>
        </div>
        <div className="relative h-2.5 rounded-full overflow-hidden bg-[var(--bg-elevated)]">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                'linear-gradient(to right, var(--color-danger), var(--color-warning), var(--color-success))',
              opacity: 0.2,
            }}
          />
          <div
            className="absolute top-0 left-0 h-full rounded-full"
            style={{
              width: `${percentile}%`,
              background: `linear-gradient(to right, var(--color-danger), ${pColor})`,
            }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-white shadow-md"
            style={{
              left: `calc(${percentile}% - 7px)`,
              backgroundColor: pColor,
            }}
          />
        </div>
      </div>

      {/* Impression badge */}
      <div className="rounded-lg border border-[var(--color-warning)]/30 bg-[var(--color-warning-muted)] p-3">
        <div className="flex items-center gap-2.5">
          <svg
            className="h-5 w-5 text-[var(--color-warning)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <div>
            <Badge variant="medium">On the Fence</Badge>
            <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">
              67% of &ldquo;fence&rdquo; candidates get rejected
            </span>
          </div>
        </div>
      </div>

      {/* Screen time */}
      <div
        className="flex items-center justify-between rounded-lg bg-[var(--bg-elevated)] p-3"
        style={{ borderLeft: '3px solid var(--color-danger)' }}
      >
        <div>
          <span className="text-xs text-[var(--text-muted)] block">Est. Screen Time</span>
          <span className="text-[10px] text-[var(--text-muted)]">Avg for your role: 45s</span>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-[var(--color-danger)] font-mono block leading-tight">
            28s
          </span>
          <span className="text-[10px] text-[var(--text-muted)]">That&apos;s all you get</span>
        </div>
      </div>

      {/* Red Flags + Hidden Strengths */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <span className="text-[10px] font-medium text-[var(--color-danger)] uppercase tracking-wide mb-1.5 block">
            Red Flags
          </span>
          {[
            'Zero quantified results across 4 years',
            'Projects read like copy-pasted job descriptions',
          ].map((flag, i) => (
            <div
              key={i}
              className="flex items-start gap-1.5 rounded border border-[var(--color-danger)]/20 bg-[var(--color-danger-muted)] p-2 mb-1.5 text-xs text-[var(--text-secondary)]"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-danger)] mt-1 flex-shrink-0" />
              {flag}
            </div>
          ))}
        </div>
        <div>
          <span className="text-[10px] font-medium text-[var(--color-success)] uppercase tracking-wide mb-1.5 block">
            Hidden Strengths
          </span>
          {[
            'Open-source work buried on page 2 — recruiters never see it',
            'Leadership signal hidden in the wrong section',
          ].map((s, i) => (
            <div
              key={i}
              className="flex items-start gap-1.5 rounded border border-[var(--color-success)]/20 bg-[var(--color-success-muted)] p-2 mb-1.5 text-xs text-[var(--text-secondary)]"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] mt-1 flex-shrink-0" />
              {s}
            </div>
          ))}
        </div>
      </div>

      {/* Recruiter Internal Note */}
      <div
        className="rounded-lg bg-[var(--bg-elevated)] p-3"
        style={{ borderLeft: '3px solid var(--accent-secondary)' }}
      >
        <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wide block mb-1">
          Recruiter&apos;s Note
        </span>
        <p className="text-xs text-[var(--text-secondary)] italic leading-relaxed">
          &ldquo;Solid skills but presentation doesn&apos;t stand out&rdquo;
        </p>
      </div>
    </div>
  );
}

/* ─── 5. Your 14-Day Path to Interview Ready ─── */

function TrajectoryPreview() {
  const hireZoneThreshold = 72;
  const dataPoints = [
    { day: 0, score: 68, label: 'Now', milestone: '' },
    { day: 3, score: 74, label: 'Day 3', milestone: 'Resume Fixes' },
    { day: 7, score: 81, label: 'Day 7', milestone: 'Practice Done' },
    { day: 14, score: 87, label: 'Day 14', milestone: 'Interview Ready' },
  ];

  const chartWidth = 500;
  const chartHeight = 170;
  const padding = { top: 24, right: 50, bottom: 36, left: 40 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const minScore = 50;
  const maxScore = 100;
  const xScale = (day: number) => padding.left + (day / 14) * innerWidth;
  const yScale = (s: number) =>
    padding.top + innerHeight - ((s - minScore) / (maxScore - minScore)) * innerHeight;

  const linePath = dataPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.day)} ${yScale(p.score)}`)
    .join(' ');

  const areaPath = `${linePath} L ${xScale(14)} ${yScale(minScore)} L ${xScale(0)} ${yScale(minScore)} Z`;

  const getScoreColor = (s: number) => {
    if (s >= 80) return { fill: 'var(--color-success)', css: 'fill-[var(--color-success)]' };
    if (s >= hireZoneThreshold)
      return { fill: 'var(--color-warning)', css: 'fill-[var(--color-warning)]' };
    return { fill: 'var(--color-danger)', css: 'fill-[var(--color-danger)]' };
  };

  return (
    <div className="space-y-3">
      {/* Badge */}
      <div className="flex justify-end">
        <Badge variant="success">High Growth</Badge>
      </div>

      {/* Chart */}
      <div className="flex justify-center">
        <svg
          width={chartWidth}
          height={chartHeight}
          className="overflow-visible w-full"
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        >
          <defs>
            <linearGradient id="previewTrajectoryGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--color-success)" stopOpacity="0.2" />
              <stop offset="100%" stopColor="var(--color-success)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Y-axis grid */}
          {[50, 60, 70, 80, 90, 100].map((s) => (
            <g key={s}>
              <line
                x1={padding.left}
                y1={yScale(s)}
                x2={chartWidth - padding.right}
                y2={yScale(s)}
                stroke="var(--border-default)"
                strokeWidth="1"
                strokeDasharray="4"
                opacity={0.4}
              />
              <text
                x={padding.left - 8}
                y={yScale(s)}
                textAnchor="end"
                dominantBaseline="middle"
                className="text-[10px] fill-[var(--text-muted)]"
              >
                {s}
              </text>
            </g>
          ))}

          {/* Green zone fill above hire zone threshold */}
          <rect
            x={padding.left}
            y={yScale(maxScore)}
            width={innerWidth}
            height={yScale(hireZoneThreshold) - yScale(maxScore)}
            fill="var(--color-success)"
            opacity={0.04}
          />

          {/* Hire Zone threshold dashed line */}
          <line
            x1={padding.left}
            y1={yScale(hireZoneThreshold)}
            x2={chartWidth - padding.right}
            y2={yScale(hireZoneThreshold)}
            stroke="var(--color-success)"
            strokeWidth="1.5"
            strokeDasharray="6,3"
            opacity={0.7}
          />
          <text
            x={chartWidth - padding.right + 4}
            y={yScale(hireZoneThreshold)}
            dominantBaseline="middle"
            className="text-[8px] font-medium fill-[var(--color-success)]"
          >
            Hire Zone
          </text>

          {/* Area fill */}
          <path d={areaPath} fill="url(#previewTrajectoryGrad)" />

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke="var(--color-success)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Points + labels */}
          {dataPoints.map((point) => {
            const color = getScoreColor(point.score);
            return (
              <g key={point.day}>
                <circle
                  cx={xScale(point.day)}
                  cy={yScale(point.score)}
                  r="6"
                  fill="var(--bg-card)"
                  stroke={color.fill}
                  strokeWidth="2.5"
                />
                <text
                  x={xScale(point.day)}
                  y={yScale(point.score) - 12}
                  textAnchor="middle"
                  className={`text-xs font-bold ${color.css}`}
                >
                  {point.score}
                </text>
                <text
                  x={xScale(point.day)}
                  y={chartHeight - 14}
                  textAnchor="middle"
                  className="text-[10px] fill-[var(--text-secondary)]"
                >
                  {point.label}
                </text>
                {point.milestone && (
                  <text
                    x={xScale(point.day)}
                    y={chartHeight - 3}
                    textAnchor="middle"
                    className="text-[8px] fill-[var(--text-muted)]"
                  >
                    {point.milestone}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Projected Improvement Row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Day 3', score: 74, delta: '+6' },
          { label: 'Day 7', score: 81, delta: '+13' },
          { label: 'Day 14', score: 87, delta: '+19' },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-lg bg-[var(--bg-elevated)] p-2 text-center card-warm-hover"
          >
            <p className="text-[10px] text-[var(--text-muted)]">{item.label}</p>
            <p className="text-sm font-mono font-bold text-[var(--text-primary)]">{item.score}</p>
            <p className="text-[10px] font-mono text-[var(--color-success)]">{item.delta}</p>
          </div>
        ))}
      </div>

      {/* Summary Tagline */}
      <p className="text-xs text-[var(--text-muted)] text-center leading-relaxed">
        From <span className="text-[var(--color-warning)] font-semibold">below threshold</span> to{' '}
        <span className="text-[var(--color-success)] font-semibold">interview ready</span> in 14
        days
      </p>
    </div>
  );
}

/* ─── SVG Icons ─── */

const HireZoneIcon = (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
    />
  </svg>
);

const PlaybookIcon = (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
    />
  </svg>
);

const PredictedIcon = (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 10V3L4 14h7v7l9-11h-7z"
    />
  </svg>
);

const RecruiterIcon = (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
    />
  </svg>
);

const TrajectoryIcon = (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
    />
  </svg>
);

/* ─── Main Export ─── */

interface ReportPreviewShowcaseProps {
  ctaHref: string;
  ctaLabel?: string;
}

export function ReportPreviewShowcase({ ctaHref, ctaLabel }: ReportPreviewShowcaseProps) {
  return (
    <section id="report-preview" className="py-20 lg:py-28">
      <Container size="2xl">
        {/* Section header */}
        <div className="mb-10 text-center">
          <SectionBadge label="What You're Missing" />
          <h2 className="heading-modern mt-5 text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl">
            See What&apos;s Hiding in Your Resume
          </h2>
          <p className="mt-3 mx-auto max-w-lg text-[var(--text-secondary)]">
            Our AI uncovers this in 60 seconds. The full report goes even deeper.
          </p>
        </div>

        {/* Bento grid */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4 lg:grid-rows-[280px_280px_280px]">
          {/* 1. Would You Get Hired? — hero card, 2 cols + 2 rows */}
          <BlurFade inView delay={0} className="lg:col-span-2 lg:row-span-2">
            <PreviewCard
              title="Would You Get Hired?"
              icon={HireZoneIcon}
              accentColor="var(--color-warning)"
              ctaHref={ctaHref}
              ctaLabel={ctaLabel}
              hero
            >
              <HireZonePreview />
            </PreviewCard>
          </BlurFade>

          {/* 2. Your Interview Playbook — 2 cols */}
          <BlurFade inView delay={0.08} className="lg:col-span-2">
            <PreviewCard
              title="Your Interview Playbook"
              icon={PlaybookIcon}
              accentColor="var(--color-info)"
              ctaHref={ctaHref}
              ctaLabel={ctaLabel}
            >
              <PlaybookPreview />
            </PreviewCard>
          </BlurFade>

          {/* 3. Questions They'll Ask You — 2 cols */}
          <BlurFade inView delay={0.16} className="lg:col-span-2">
            <PreviewCard
              title="Questions They'll Ask You"
              icon={PredictedIcon}
              accentColor="var(--color-warning)"
              ctaHref={ctaHref}
              ctaLabel={ctaLabel}
            >
              <PredictedQuestionsPreview />
            </PreviewCard>
          </BlurFade>

          {/* 4. How Recruiters See You — 2 cols */}
          <BlurFade inView delay={0.24} className="lg:col-span-2">
            <PreviewCard
              title="How Recruiters See You"
              icon={RecruiterIcon}
              accentColor="var(--color-danger)"
              ctaHref={ctaHref}
              ctaLabel={ctaLabel}
            >
              <RecruiterPreview />
            </PreviewCard>
          </BlurFade>

          {/* 5. Your 14-Day Path to Interview Ready — 2 cols */}
          <BlurFade inView delay={0.32} className="lg:col-span-2">
            <PreviewCard
              title="Your 14-Day Path to Interview Ready"
              icon={TrajectoryIcon}
              accentColor="var(--color-success)"
              ctaHref={ctaHref}
              ctaLabel={ctaLabel}
            >
              <TrajectoryPreview />
            </PreviewCard>
          </BlurFade>
        </div>
      </Container>
    </section>
  );
}
