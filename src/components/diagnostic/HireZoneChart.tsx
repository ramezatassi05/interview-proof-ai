'use client';

import type { HireZoneAnalysis } from '@/types';

interface HireZoneChartProps {
  hireZone: HireZoneAnalysis;
  companyName?: string;
}

function getStatusBadge(status: HireZoneAnalysis['status']) {
  switch (status) {
    case 'above':
      return {
        label: 'Above Zone',
        className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      };
    case 'in_zone':
      return {
        label: 'In the Hire Zone',
        className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      };
    case 'below':
      return {
        label: 'Below Zone',
        className: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      };
  }
}

function getPriorityColor(priority: 'critical' | 'high' | 'medium') {
  switch (priority) {
    case 'critical':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'high':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'medium':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  }
}

export function HireZoneChart({ hireZone, companyName }: HireZoneChartProps) {
  const badge = getStatusBadge(hireZone.status);

  // SVG gauge dimensions
  const svgWidth = 500;
  const svgHeight = 100;
  const barY = 40;
  const barHeight = 20;
  const barLeft = 40;
  const barRight = 460;
  const barWidth = barRight - barLeft;

  // Scale helper: score 0-100 → x position
  const scaleX = (score: number) => barLeft + (score / 100) * barWidth;

  const zoneMinX = scaleX(hireZone.hireZoneMin);
  const zoneMaxX = scaleX(hireZone.hireZoneMax);
  const scoreX = scaleX(Math.min(100, Math.max(0, hireZone.currentScore)));
  const industryX = scaleX(hireZone.industryAverage);

  // Tick marks
  const ticks = [0, 25, 50, 75, 100];

  return (
    <div className="rounded-[20px] bg-[var(--bg-card)] shadow-warm p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            {companyName ? `${companyName} Hire Zone Analysis` : 'Hire Zone Analysis'}
          </h3>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            How your readiness compares to historically successful candidates
          </p>
        </div>
        <span
          className={`inline-flex items-center self-start rounded-full border px-3 py-1 text-xs font-medium ${badge.className}`}
        >
          {badge.label}
        </span>
      </div>

      {/* SVG Horizontal Gauge */}
      <div className="flex justify-center overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full max-w-[500px]"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Background bar — red zone (0-39) */}
          <rect
            x={barLeft}
            y={barY}
            width={scaleX(39) - barLeft}
            height={barHeight}
            rx={4}
            fill="rgba(239, 68, 68, 0.25)"
          />
          {/* Amber zone (40 to hire zone min) */}
          <rect
            x={scaleX(39)}
            y={barY}
            width={zoneMinX - scaleX(39)}
            height={barHeight}
            fill="rgba(245, 158, 11, 0.25)"
          />
          {/* Green hire zone band */}
          <rect
            x={zoneMinX}
            y={barY}
            width={zoneMaxX - zoneMinX}
            height={barHeight}
            fill="rgba(16, 185, 129, 0.3)"
            stroke="rgba(16, 185, 129, 0.6)"
            strokeWidth={1.5}
          />
          {/* Light emerald above zone */}
          <rect
            x={zoneMaxX}
            y={barY}
            width={barRight - zoneMaxX}
            height={barHeight}
            rx={4}
            fill="rgba(16, 185, 129, 0.12)"
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

          {/* Hire Zone label */}
          <text
            x={(zoneMinX + zoneMaxX) / 2}
            y={barY - 6}
            textAnchor="middle"
            className="text-[9px] font-medium fill-emerald-400"
          >
            Hire Zone
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
            className="text-[8px] fill-[var(--text-muted)]"
          >
            Avg {hireZone.industryAverage}
          </text>

          {/* User score triangle marker */}
          <polygon
            points={`${scoreX},${barY - 3} ${scoreX - 6},${barY - 13} ${scoreX + 6},${barY - 13}`}
            fill={hireZone.status === 'below' ? 'rgb(245, 158, 11)' : 'rgb(16, 185, 129)'}
          />
          <text
            x={scoreX}
            y={barY - 16}
            textAnchor="middle"
            className="text-[10px] font-bold fill-[var(--text-primary)]"
          >
            {hireZone.currentScore}
          </text>

          {/* Tick marks */}
          {ticks.map((tick) => {
            const x = scaleX(tick);
            return (
              <g key={tick}>
                <line
                  x1={x}
                  y1={barY + barHeight}
                  x2={x}
                  y2={barY + barHeight + 4}
                  stroke="var(--border-default)"
                  strokeWidth={1}
                />
                <text
                  x={x}
                  y={barY + barHeight + 14}
                  textAnchor="middle"
                  className="text-[8px] fill-[var(--text-muted)]"
                >
                  {tick}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Key Metrics Row */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-[var(--bg-elevated)] shadow-warm p-3 text-center">
          <p className="text-xs text-[var(--text-muted)]">Your Score</p>
          <p className="mt-1 text-xl font-bold text-[var(--text-primary)]">
            {hireZone.currentScore}
          </p>
        </div>
        <div className="rounded-xl bg-[var(--bg-elevated)] shadow-warm p-3 text-center">
          <p className="text-xs text-[var(--text-muted)]">Hire Zone</p>
          <p className="mt-1 text-xl font-bold text-emerald-400">
            {hireZone.hireZoneMin}–{hireZone.hireZoneMax}
          </p>
        </div>
        <div className="rounded-xl bg-[var(--bg-elevated)] shadow-warm p-3 text-center">
          <p className="text-xs text-[var(--text-muted)]">Gap</p>
          <p
            className={`mt-1 text-xl font-bold ${hireZone.gap > 0 ? 'text-amber-400' : 'text-emerald-400'}`}
          >
            {hireZone.gap > 0 ? `${hireZone.gap} pts` : 'None'}
          </p>
        </div>
        <div className="rounded-xl bg-[var(--bg-elevated)] shadow-warm p-3 text-center">
          <p className="text-xs text-[var(--text-muted)]">Percentile</p>
          <p className="mt-1 text-xl font-bold text-[var(--text-primary)]">
            {hireZone.percentile}th
          </p>
        </div>
      </div>

      {/* Category Gap Breakdown */}
      <div className="mt-6">
        <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
          Category Gap Breakdown
        </h4>
        <div className="space-y-3">
          {hireZone.categoryGaps.map((gap) => {
            const currentPct = Math.min(100, gap.currentScore);
            const targetPct = Math.min(100, gap.targetScore);
            const priorityColor = getPriorityColor(gap.priority);

            return (
              <div key={gap.category} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">{gap.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--text-muted)]">
                      {gap.currentScore} / {gap.targetScore}
                    </span>
                    {gap.gapPoints > 0 && (
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${priorityColor}`}
                      >
                        -{gap.gapPoints}
                      </span>
                    )}
                  </div>
                </div>
                <div className="relative h-2 rounded-full bg-[var(--bg-elevated)]">
                  {/* Current score bar */}
                  <div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      width: `${currentPct}%`,
                      backgroundColor:
                        gap.gapPoints >= 15
                          ? 'rgb(239, 68, 68)'
                          : gap.gapPoints >= 8
                            ? 'rgb(245, 158, 11)'
                            : 'rgb(16, 185, 129)',
                    }}
                  />
                  {/* Target score marker */}
                  <div
                    className="absolute top-[-2px] h-3 w-0.5 bg-emerald-400"
                    style={{ left: `${targetPct}%` }}
                    title={`Target: ${gap.targetScore}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Actions */}
      {hireZone.topActions.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
            Top Actions to Close the Gap
          </h4>
          <ol className="space-y-3">
            {hireZone.topActions.map((action, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-xl bg-[var(--bg-elevated)] shadow-warm p-3"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)]/20 text-xs font-bold text-[var(--color-accent)]">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <p className="text-sm text-[var(--text-secondary)]">{action.action}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="rounded bg-[var(--bg-primary)] px-2 py-0.5 text-[10px] text-[var(--text-muted)]">
                      {action.category}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-medium">
                      {action.estimatedImpact}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Version tag */}
      <div className="mt-6 pt-4 border-t border-[var(--border-default)]">
        <span className="text-xs text-[var(--text-muted)]">Hire Zone model {hireZone.version}</span>
      </div>
    </div>
  );
}
