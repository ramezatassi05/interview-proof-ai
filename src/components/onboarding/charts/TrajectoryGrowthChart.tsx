'use client';

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { motion } from 'motion/react';
import type { OnboardingTrajectory } from '@/types';
import { NumberTicker } from '@/components/ui/number-ticker';
import { TIER_BOUNDARIES } from './chart-constants';

interface TrajectoryGrowthChartProps {
  trajectory: OnboardingTrajectory;
  isVisible: boolean;
  percentImprovement: number;
}

// Custom dot renderer for milestone sessions (0, 3, 7)
const MILESTONE_SESSIONS = new Set([0, 3, 7]);

function MilestoneDot(props: {
  cx?: number;
  cy?: number;
  payload?: { sessions: number; projectedScore: number };
}) {
  const { cx, cy, payload } = props;
  if (!cx || !cy || !payload || !MILESTONE_SESSIONS.has(payload.sessions)) return null;

  const isFirst = payload.sessions === 0;
  const isLast = payload.sessions === 7;
  const fillColor = isFirst ? '#71717a' : isLast ? '#10b981' : '#6366f1';
  const ringColor = isLast ? '#10b981' : 'transparent';

  return (
    <g>
      {/* Pulsing glow for session 7 */}
      {isLast && (
        <>
          <circle cx={cx} cy={cy} r="14" fill={ringColor} opacity="0.1">
            <animate attributeName="r" values="10;16;10" dur="2s" repeatCount="indefinite" />
            <animate
              attributeName="opacity"
              values="0.15;0.05;0.15"
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>
          <circle
            cx={cx}
            cy={cy}
            r="10"
            fill="none"
            stroke={ringColor}
            strokeWidth="1.5"
            opacity="0.3"
          >
            <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" />
            <animate
              attributeName="opacity"
              values="0.3;0.1;0.3"
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>
        </>
      )}
      {/* Outer ring */}
      <circle cx={cx} cy={cy} r="7" fill="white" stroke={fillColor} strokeWidth="2.5" />
      {/* Inner dot */}
      <circle cx={cx} cy={cy} r="3" fill={fillColor} />
      {/* Score label above */}
      <text
        x={cx}
        y={cy - 14}
        textAnchor="middle"
        fontSize="12"
        fontWeight="700"
        fill={fillColor}
        fontFamily="'Source Sans 3', sans-serif"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {payload.projectedScore}
      </text>
    </g>
  );
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: { sessions: number; projectedScore: number; label: string } }>;
}) {
  if (!active || !payload?.[0]) return null;
  const data = payload[0].payload;
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 shadow-lg shadow-zinc-200/50">
      <p className="text-[11px] font-semibold text-zinc-700">
        {data.sessions === 0 ? 'Current' : `After ${data.sessions} sessions`}
      </p>
      <p className="text-lg font-bold tabular-nums text-indigo-600">{data.projectedScore}</p>
    </div>
  );
}

// Custom X-axis tick for milestone labels
function CustomXTick(props: { x?: number; y?: number; payload?: { value: number } }) {
  const { x, y, payload } = props;
  if (!x || !y || !payload) return null;
  if (!MILESTONE_SESSIONS.has(payload.value)) return null;

  const label = payload.value === 0 ? 'Now' : `${payload.value} sessions`;
  return (
    <text
      x={x}
      y={y + 12}
      textAnchor="middle"
      fontSize="10"
      fontWeight="500"
      fill="#a1a1aa"
      fontFamily="'Source Sans 3', sans-serif"
    >
      {label}
    </text>
  );
}

export function TrajectoryGrowthChart({
  trajectory,
  isVisible,
  percentImprovement,
}: TrajectoryGrowthChartProps) {
  const points = trajectory.intermediatePoints;
  const score7 = points[points.length - 1]?.projectedScore ?? trajectory.current;

  // Compute Y domain with padding — must be before any early return
  const yDomain = useMemo(() => {
    const yMin = Math.max(0, Math.floor((trajectory.current - 12) / 5) * 5);
    const yMax = Math.min(100, Math.ceil((score7 + 10) / 5) * 5);
    return [yMin, yMax] as [number, number];
  }, [trajectory, score7]);

  if (points.length === 0) return null;

  // Filter tier boundaries visible in range
  const visibleBoundaries = TIER_BOUNDARIES.filter(
    (b) => b.value > yDomain[0] && b.value < yDomain[1]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-lg shadow-indigo-100/20"
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-zinc-800">Your Projected Growth Curve</h4>
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={isVisible ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.4, delay: 1.4 }}
          className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m7 17 5-5 5 5" />
            <path d="m7 11 5-5 5 5" />
          </svg>
          +
          <NumberTicker
            value={percentImprovement}
            delay={1.6}
            className="text-xs font-bold text-emerald-600"
          />
          %
        </motion.span>
      </div>

      {/* Chart */}
      <div className="h-[200px] w-full">
        {isVisible && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ top: 8, right: 16, left: -8, bottom: 4 }}>
              <defs>
                <linearGradient id="onboardingAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="50%" stopColor="#818cf8" stopOpacity={0.1} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="onboardingStrokeGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#a1a1aa" />
                  <stop offset="30%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="sessions"
                axisLine={false}
                tickLine={false}
                tick={<CustomXTick />}
                ticks={[0, 3, 7]}
              />
              <YAxis
                domain={yDomain}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#a1a1aa', fontWeight: 500 }}
                width={32}
              />

              {/* Tier boundary reference lines */}
              {visibleBoundaries.map((b) => (
                <ReferenceLine
                  key={b.value}
                  y={b.value}
                  stroke={b.color}
                  strokeDasharray="6 4"
                  strokeOpacity={0.35}
                  label={{
                    value: b.label,
                    position: 'right',
                    fontSize: 9,
                    fontWeight: 600,
                    fill: b.color,
                    offset: 4,
                  }}
                />
              ))}

              <Tooltip content={<CustomTooltip />} cursor={false} />

              <Area
                type="monotone"
                dataKey="projectedScore"
                stroke="url(#onboardingStrokeGradient)"
                strokeWidth={2.5}
                fill="url(#onboardingAreaGradient)"
                fillOpacity={1}
                dot={<MilestoneDot />}
                activeDot={false}
                isAnimationActive={true}
                animationDuration={1400}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <p className="mt-2 text-center text-[10px] text-zinc-400">
        Projected readiness with 2-3 hours of focused prep per session
      </p>
    </motion.div>
  );
}
