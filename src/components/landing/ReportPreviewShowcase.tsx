import Link from 'next/link';
import type { ReactNode } from 'react';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';

/* ─── Shared PreviewCard ─── */

function PreviewCard({
  title,
  icon,
  accentColor,
  colSpan,
  children,
  ctaHref,
  delay,
  height,
}: {
  title: string;
  icon: ReactNode;
  accentColor: string;
  colSpan: string;
  children: ReactNode;
  ctaHref: string;
  delay: string;
  height?: string;
}) {
  return (
    <div
      className={`group relative rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] overflow-hidden card-hover animate-fade-in ${colSpan} ${height ?? ''}`}
      style={{ animationDelay: delay }}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-5 pt-4 pb-3">
        <span style={{ color: accentColor }}>{icon}</span>
        <h4 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h4>
      </div>

      {/* Content */}
      <div className="px-5 pb-16">{children}</div>

      {/* Bottom fade gradient */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[var(--bg-card)] via-[var(--bg-card)]/80 to-transparent" />

      {/* Hover lock overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-primary)]/60 backdrop-blur-[2px] opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
        <Link href={ctaHref}>
          <Button variant="accent" size="sm">
            Unlock Full Report
          </Button>
        </Link>
      </div>
    </div>
  );
}

/* ─── 1. Would You Get Hired? (Hire Zone Gauge) ─── */

function HireZonePreview() {
  const score = 68;
  const hireZoneMin = 72;
  const hireZoneMax = 88;
  const industryAvg = 61;
  const gap = hireZoneMin - score;

  const svgWidth = 400;
  const svgHeight = 120;
  const barY = 55;
  const barHeight = 22;
  const barLeft = 20;
  const barRight = 380;
  const barWidth = barRight - barLeft;

  const scaleX = (s: number) => barLeft + (s / 100) * barWidth;

  const zoneMinX = scaleX(hireZoneMin);
  const zoneMaxX = scaleX(hireZoneMax);
  const scoreX = scaleX(score);
  const industryX = scaleX(industryAvg);

  return (
    <div className="space-y-3">
      <div className="bg-[var(--bg-elevated)] rounded-xl p-3 flex justify-center overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full max-w-[400px]"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Full background bar */}
          <rect x={barLeft} y={barY} width={barWidth} height={barHeight} rx={4} fill="var(--accent-primary)" opacity={0.08} />

          {/* Hire zone band */}
          <rect x={zoneMinX} y={barY} width={zoneMaxX - zoneMinX} height={barHeight} fill="var(--color-success)" opacity={0.25} stroke="var(--color-success)" strokeWidth={1} strokeOpacity={0.4} />

          {/* Hire zone label */}
          <text x={(zoneMinX + zoneMaxX) / 2} y={barY - 14} textAnchor="middle" className="text-[9px] font-medium font-mono fill-[var(--color-success)]">
            Hire Zone ({hireZoneMin}–{hireZoneMax})
          </text>

          {/* Industry average dashed line */}
          <line x1={industryX} y1={barY - 2} x2={industryX} y2={barY + barHeight + 2} stroke="var(--text-muted)" strokeWidth={1.5} strokeDasharray="3,2" />
          <text x={industryX} y={barY + barHeight + 16} textAnchor="middle" className="text-[9px] fill-[var(--text-muted)]">
            Avg {industryAvg}
          </text>

          {/* User score triangle marker */}
          <polygon points={`${scoreX},${barY - 2} ${scoreX - 6},${barY - 12} ${scoreX + 6},${barY - 12}`} fill="var(--color-warning)" />
          <text x={scoreX} y={barY - 20} textAnchor="middle" className="text-[11px] font-bold fill-[var(--color-warning)]">
            {score}
          </text>

          {/* Full bar border */}
          <rect x={barLeft} y={barY} width={barWidth} height={barHeight} rx={4} fill="none" stroke="var(--border-default)" strokeWidth={1} />
        </svg>
      </div>

      {/* Stat boxes */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-[var(--color-warning)]/30 bg-[var(--color-warning-muted)] p-2.5 text-center">
          <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wide block">Status</span>
          <span className="text-sm font-semibold text-[var(--color-warning)]">Below Hire Zone</span>
        </div>
        <div className="rounded-lg border border-[var(--color-warning)]/30 bg-[var(--color-warning-muted)] p-2.5 text-center">
          <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wide block">Gap</span>
          <span className="text-sm font-semibold font-mono text-[var(--color-warning)]">{gap} pts</span>
        </div>
      </div>

      <p className="text-xs text-[var(--text-muted)] text-center leading-relaxed">
        You beat the industry average — but being <span className="text-[var(--text-secondary)] font-medium">good</span> isn&apos;t the same as being <span className="text-[var(--color-warning)] font-medium">hireable</span>.
      </p>
    </div>
  );
}

/* ─── 2. Your Interview Playbook ─── */

function PlaybookPreview() {
  const tips = [
    { text: 'Your resume says "improved performance" — lead with the exact number instead', source: 'resume' },
    { text: 'They WILL ask system design. Use your billing migration as the walkthrough', source: 'job desc' },
    { text: '"Tell me about leading a cross-functional project" — here\'s your answer framework', source: 'behavioral' },
  ];
  const questions = [
    'How does the team handle tech debt prioritization?',
    'What does 90-day success look like for this role?',
  ];

  return (
    <div className="space-y-4">
      <p className="text-[10px] font-medium text-[var(--accent-primary)] uppercase tracking-wide">
        Tailored to YOUR resume + job description
      </p>

      {/* Tips */}
      <div className="space-y-2">
        {tips.map((tip, i) => (
          <div
            key={i}
            className="flex items-start gap-2.5 rounded-lg border border-[var(--color-info)]/15 bg-[var(--color-info-muted)] p-3"
          >
            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-info)]/20 text-[10px] font-bold text-[var(--color-info)]">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">&ldquo;{tip.text}&rdquo;</p>
              <span className="text-[10px] text-[var(--text-muted)] mt-0.5 block">Based on: {tip.source}</span>
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
            className="flex items-start gap-2.5 rounded-lg border border-[var(--color-tier-1)]/15 bg-[var(--color-tier-1-muted)] p-3 mb-2"
          >
            <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-tier-1)]/20 text-[10px] font-bold text-[var(--color-tier-1)] mt-0.5">
              Q
            </span>
            <p className="text-sm text-[var(--text-primary)] leading-relaxed">&ldquo;{q}&rdquo;</p>
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
      difficulty: 'Hard',
      diffColor: 'var(--color-danger)',
      diffBg: 'var(--color-danger-muted)',
      source: 'Based on JD requirement: distributed systems',
    },
    {
      text: 'Describe a time you pushed back on a technical decision',
      likelihood: 88,
      difficulty: 'Medium',
      diffColor: 'var(--color-warning)',
      diffBg: 'var(--color-warning-muted)',
      source: 'Behavioral screening pattern for senior roles',
    },
    {
      text: 'Walk me through your indexing strategy in PostgreSQL',
      likelihood: 85,
      difficulty: 'Medium',
      diffColor: 'var(--color-warning)',
      diffBg: 'var(--color-warning-muted)',
      source: 'Based on resume: PostgreSQL experience',
    },
  ];

  return (
    <div className="space-y-3">
      {questions.map((q, i) => (
        <div key={i} className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] p-3.5">
          <div className="flex items-start gap-2.5 flex-wrap">
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed flex-1 min-w-0">&ldquo;{q.text}&rdquo;</p>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="rounded-full px-2 py-0.5 text-[10px] font-bold font-mono tracking-wider bg-[var(--color-info-muted)] text-[var(--color-info)]">
                {q.likelihood}% LIKELY
              </span>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: q.diffColor, backgroundColor: q.diffBg }}
              >
                {q.difficulty}
              </span>
            </div>
          </div>
          <p className="text-[10px] text-[var(--text-muted)] mt-1.5 leading-relaxed">{q.source}</p>
        </div>
      ))}

      {/* Coach feedback callout */}
      <div className="mt-3 rounded-lg border border-[var(--accent-primary)]/20 bg-[var(--accent-primary)]/5 p-3 flex items-start gap-2.5">
        <svg className="h-4 w-4 mt-0.5 flex-shrink-0 text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          <span className="font-semibold text-[var(--accent-primary)]">Coach-level feedback</span> on every answer — plus ideal responses crafted to make you the top candidate.
        </p>
      </div>
    </div>
  );
}

/* ─── 4. How Recruiters See You ─── */

function RecruiterPreview() {
  return (
    <div className="space-y-3">
      {/* Impression badge */}
      <div className="rounded-lg border border-[var(--color-warning)]/30 bg-[var(--color-warning-muted)] p-3">
        <div className="flex items-center gap-2.5">
          <svg className="h-5 w-5 text-[var(--color-warning)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <span className="text-sm font-semibold text-[var(--color-warning)] block">On the Fence</span>
            <span className="text-[10px] text-[var(--text-muted)]">67% of &ldquo;fence&rdquo; candidates get rejected</span>
          </div>
        </div>
      </div>

      {/* Screen time */}
      <div className="flex items-center justify-between rounded-lg bg-[var(--bg-elevated)] p-3" style={{ borderLeft: '3px solid var(--color-danger)' }}>
        <span className="text-xs text-[var(--text-muted)]">Est. Screen Time</span>
        <div className="text-right">
          <span className="text-lg font-bold text-[var(--color-danger)] font-mono block leading-tight">28s</span>
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
            <div key={i} className="flex items-start gap-1.5 rounded border border-[var(--color-danger)]/20 bg-[var(--color-danger-muted)] p-2 mb-1.5 text-xs text-[var(--text-secondary)]">
              <span className="text-[var(--color-danger)] mt-px font-bold">-</span>
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
            <div key={i} className="flex items-start gap-1.5 rounded border border-[var(--color-success)]/20 bg-[var(--color-success-muted)] p-2 mb-1.5 text-xs text-[var(--text-secondary)]">
              <span className="text-[var(--color-success)] mt-px font-bold">+</span>
              {s}
            </div>
          ))}
        </div>
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
  const yScale = (score: number) => padding.top + innerHeight - ((score - minScore) / (maxScore - minScore)) * innerHeight;

  const linePath = dataPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.day)} ${yScale(p.score)}`)
    .join(' ');

  const areaPath = `${linePath} L ${xScale(14)} ${yScale(minScore)} L ${xScale(0)} ${yScale(minScore)} Z`;

  const getScoreColor = (score: number) => {
    if (score >= 80) return { fill: 'var(--color-success)', css: 'fill-[var(--color-success)]' };
    if (score >= hireZoneThreshold) return { fill: 'var(--color-warning)', css: 'fill-[var(--color-warning)]' };
    return { fill: 'var(--color-danger)', css: 'fill-[var(--color-danger)]' };
  };

  return (
    <div className="flex justify-center">
      <svg width={chartWidth} height={chartHeight} className="overflow-visible w-full" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
        <defs>
          <linearGradient id="previewTrajectoryGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--color-success)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--color-success)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Y-axis grid */}
        {[50, 60, 70, 80, 90, 100].map((score) => (
          <g key={score}>
            <line
              x1={padding.left}
              y1={yScale(score)}
              x2={chartWidth - padding.right}
              y2={yScale(score)}
              stroke="var(--border-default)"
              strokeWidth="1"
              strokeDasharray="4"
              opacity={0.4}
            />
            <text x={padding.left - 8} y={yScale(score)} textAnchor="end" dominantBaseline="middle" className="text-[10px] fill-[var(--text-muted)]">
              {score}
            </text>
          </g>
        ))}

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
        <path d={linePath} fill="none" stroke="var(--color-success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Points + labels */}
        {dataPoints.map((point) => {
          const color = getScoreColor(point.score);
          return (
            <g key={point.day}>
              <circle cx={xScale(point.day)} cy={yScale(point.score)} r="6" fill="var(--bg-card)" stroke={color.fill} strokeWidth="2.5" />
              <text x={xScale(point.day)} y={yScale(point.score) - 12} textAnchor="middle" className={`text-xs font-bold ${color.css}`}>
                {point.score}
              </text>
              <text x={xScale(point.day)} y={chartHeight - 14} textAnchor="middle" className="text-[10px] fill-[var(--text-secondary)]">
                {point.label}
              </text>
              {point.milestone && (
                <text x={xScale(point.day)} y={chartHeight - 3} textAnchor="middle" className="text-[8px] fill-[var(--text-muted)]">
                  {point.milestone}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ─── SVG Icons ─── */

const HireZoneIcon = (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const PlaybookIcon = (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const PredictedIcon = (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const RecruiterIcon = (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const TrajectoryIcon = (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

/* ─── Main Export ─── */

interface ReportPreviewShowcaseProps {
  ctaHref: string;
}

export function ReportPreviewShowcase({ ctaHref }: ReportPreviewShowcaseProps) {
  return (
    <section>
      <Container className="py-16">
        {/* Section header */}
        <div className="mb-10 text-center">
          <span className="text-xs font-mono font-medium uppercase tracking-widest text-[var(--accent-primary)]">
            What You&apos;re Missing
          </span>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
            See What&apos;s Hiding in Your Resume
          </h2>
          <p className="mt-3 mx-auto max-w-lg text-[var(--text-secondary)]">
            Our AI uncovers this in 60 seconds. The full report goes even deeper.
          </p>
        </div>

        {/* Bento grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* 1. Would You Get Hired? — spans 2 cols */}
          <PreviewCard
            title="Would You Get Hired?"
            icon={HireZoneIcon}
            accentColor="var(--color-warning)"
            colSpan="lg:col-span-2"
            ctaHref={ctaHref}
            delay="0ms"
            height="h-[340px]"
          >
            <HireZonePreview />
          </PreviewCard>

          {/* 2. Your Interview Playbook — spans 2 cols */}
          <PreviewCard
            title="Your Interview Playbook"
            icon={PlaybookIcon}
            accentColor="var(--color-info)"
            colSpan="lg:col-span-2"
            ctaHref={ctaHref}
            delay="80ms"
            height="h-[340px]"
          >
            <PlaybookPreview />
          </PreviewCard>

          {/* 3. Questions They'll Ask You — spans 2 cols */}
          <PreviewCard
            title="Questions They'll Ask You"
            icon={PredictedIcon}
            accentColor="var(--color-warning)"
            colSpan="lg:col-span-2"
            ctaHref={ctaHref}
            delay="160ms"
            height="h-[480px]"
          >
            <PredictedQuestionsPreview />
          </PreviewCard>

          {/* 4. How Recruiters See You — spans 2 cols */}
          <PreviewCard
            title="How Recruiters See You"
            icon={RecruiterIcon}
            accentColor="var(--color-danger)"
            colSpan="lg:col-span-2"
            ctaHref={ctaHref}
            delay="240ms"
            height="h-[480px]"
          >
            <RecruiterPreview />
          </PreviewCard>

          {/* 5. Your 14-Day Path to Interview Ready — full width */}
          <PreviewCard
            title="Your 14-Day Path to Interview Ready"
            icon={TrajectoryIcon}
            accentColor="var(--color-success)"
            colSpan="lg:col-span-4"
            ctaHref={ctaHref}
            delay="320ms"
            height="h-[260px]"
          >
            <TrajectoryPreview />
          </PreviewCard>
        </div>
      </Container>
    </section>
  );
}
