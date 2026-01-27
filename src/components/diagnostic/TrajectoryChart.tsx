'use client';

import type { TrajectoryProjection } from '@/types';

interface TrajectoryChartProps {
  projection: TrajectoryProjection;
}

function getPotentialColor(potential: 'low' | 'medium' | 'high'): {
  text: string;
  bg: string;
  border: string;
} {
  switch (potential) {
    case 'high':
      return { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' };
    case 'medium':
      return { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' };
    case 'low':
      return { text: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/30' };
  }
}

function getScoreColor(score: number): string {
  if (score >= 70) return 'text-emerald-400';
  if (score >= 50) return 'text-amber-400';
  return 'text-red-400';
}

export function TrajectoryChart({ projection }: TrajectoryChartProps) {
  const { currentScore, day3Projection, day7Projection, day14Projection, improvementPotential } =
    projection;
  const potentialColors = getPotentialColor(improvementPotential);

  // Chart dimensions
  const chartWidth = 400;
  const chartHeight = 200;
  const padding = { top: 20, right: 40, bottom: 40, left: 50 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Data points (days 0, 3, 7, 14)
  const dataPoints = [
    { day: 0, score: currentScore, label: 'Now' },
    { day: 3, score: day3Projection.score, label: 'Day 3' },
    { day: 7, score: day7Projection.score, label: 'Day 7' },
    { day: 14, score: day14Projection.score, label: 'Day 14' },
  ];

  // Scale functions (0-14 days)
  const xScale = (day: number) => padding.left + (day / 14) * innerWidth;
  const yScale = (score: number) => padding.top + innerHeight - (score / 100) * innerHeight;

  // Generate line path
  const linePath = dataPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.day)} ${yScale(p.score)}`)
    .join(' ');

  // Generate area path (for gradient fill)
  const areaPath = `${linePath} L ${xScale(14)} ${yScale(0)} L ${xScale(0)} ${yScale(0)} Z`;

  return (
    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Interview Prep Trajectory
          </h3>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Estimated score improvement with focused daily prep
          </p>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${potentialColors.bg} ${potentialColors.text} ${potentialColors.border} border`}
        >
          {improvementPotential.charAt(0).toUpperCase() + improvementPotential.slice(1)} Potential
        </span>
      </div>

      {/* Chart */}
      <div className="flex justify-center overflow-x-auto">
        <svg width={chartWidth} height={chartHeight} className="overflow-visible">
          {/* Gradient definition */}
          <defs>
            <linearGradient id="trajectoryGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Y-axis grid lines */}
          {[0, 25, 50, 75, 100].map((score) => (
            <g key={score}>
              <line
                x1={padding.left}
                y1={yScale(score)}
                x2={chartWidth - padding.right}
                y2={yScale(score)}
                stroke="var(--border-default)"
                strokeWidth="1"
                strokeDasharray={score === 0 ? 'none' : '4'}
                opacity={0.5}
              />
              <text
                x={padding.left - 10}
                y={yScale(score)}
                textAnchor="end"
                dominantBaseline="middle"
                className="text-xs fill-[var(--text-muted)]"
              >
                {score}
              </text>
            </g>
          ))}

          {/* Area fill */}
          <path d={areaPath} fill="url(#trajectoryGradient)" />

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {dataPoints.map((point) => (
            <g key={point.day}>
              <circle
                cx={xScale(point.day)}
                cy={yScale(point.score)}
                r="8"
                fill="var(--bg-card)"
                stroke="var(--color-accent)"
                strokeWidth="3"
              />
              {/* Score label */}
              <text
                x={xScale(point.day)}
                y={yScale(point.score) - 15}
                textAnchor="middle"
                className={`text-sm font-bold ${getScoreColor(point.score)}`}
              >
                {point.score}
              </text>
              {/* Day label */}
              <text
                x={xScale(point.day)}
                y={chartHeight - 10}
                textAnchor="middle"
                className="text-xs fill-[var(--text-secondary)]"
              >
                {point.label}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Projections detail */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {/* Day 3 */}
        <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--text-primary)]">Day 3</span>
            <span className={`text-lg font-bold ${getScoreColor(day3Projection.score)}`}>
              {day3Projection.score}
              <span className="text-sm font-normal text-emerald-400 ml-1">
                (+{day3Projection.score - currentScore})
              </span>
            </span>
          </div>
          <div className="mt-2">
            <span className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
              Assumptions
            </span>
            <ul className="mt-1 space-y-1">
              {day3Projection.assumptions.map((assumption, i) => (
                <li key={i} className="text-xs text-[var(--text-secondary)] flex items-start gap-2">
                  <span className="text-[var(--color-accent)]">-</span>
                  {assumption}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Day 7 */}
        <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--text-primary)]">Day 7</span>
            <span className={`text-lg font-bold ${getScoreColor(day7Projection.score)}`}>
              {day7Projection.score}
              <span className="text-sm font-normal text-emerald-400 ml-1">
                (+{day7Projection.score - currentScore})
              </span>
            </span>
          </div>
          <div className="mt-2">
            <span className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
              Assumptions
            </span>
            <ul className="mt-1 space-y-1">
              {day7Projection.assumptions.map((assumption, i) => (
                <li key={i} className="text-xs text-[var(--text-secondary)] flex items-start gap-2">
                  <span className="text-[var(--color-accent)]">-</span>
                  {assumption}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Day 14 */}
        <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--text-primary)]">Day 14</span>
            <span className={`text-lg font-bold ${getScoreColor(day14Projection.score)}`}>
              {day14Projection.score}
              <span className="text-sm font-normal text-emerald-400 ml-1">
                (+{day14Projection.score - currentScore})
              </span>
            </span>
          </div>
          <div className="mt-2">
            <span className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
              Assumptions
            </span>
            <ul className="mt-1 space-y-1">
              {day14Projection.assumptions.map((assumption, i) => (
                <li key={i} className="text-xs text-[var(--text-secondary)] flex items-start gap-2">
                  <span className="text-[var(--color-accent)]">-</span>
                  {assumption}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Version tag */}
      <div className="mt-6 pt-4 border-t border-[var(--border-default)]">
        <span className="text-xs text-[var(--text-muted)]">
          Projection version {projection.version}
        </span>
      </div>
    </div>
  );
}
