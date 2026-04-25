'use client';

import { motion } from 'motion/react';
import { NumberTicker } from '@/components/ui/number-ticker';
import type { CategoryProjection } from '@/types';
import { CATEGORY_COLORS } from './chart-constants';

interface CategoryImprovementBarsProps {
  categories: CategoryProjection[];
  isVisible: boolean;
}

function GainBadge({ gainPct, delay }: { gainPct: number; delay: number }) {
  const colorClass =
    gainPct >= 15
      ? 'bg-emerald-50 text-emerald-600'
      : gainPct >= 8
        ? 'bg-amber-50 text-amber-600'
        : 'bg-zinc-50 text-zinc-500';

  return (
    <span
      className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${colorClass}`}
    >
      +<NumberTicker value={gainPct} delay={delay} className="text-[10px] font-bold" />%
    </span>
  );
}

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  roundReadiness:
    "You'll walk into the interview knowing exactly what to expect and how to respond",
  clarity: 'Your answers will be structured, concise, and easy for interviewers to follow',
  evidenceDepth: "You'll back every claim with specific metrics, outcomes, and real examples",
  hardMatch: 'Your resume will clearly demonstrate the skills and experience the role requires',
  companyProxy:
    "You'll show genuine understanding of the company's mission, culture, and challenges",
};

// Category icons (small, inline SVGs)
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  roundReadiness: (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  clarity: (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  evidenceDepth: (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  hardMatch: (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  ),
  companyProxy: (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ),
};

export function CategoryImprovementBars({ categories, isVisible }: CategoryImprovementBarsProps) {
  const sorted = [...categories].sort((a, b) => b.gainPct - a.gainPct);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#a1a1aa"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
          </svg>
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-400">
            Where You&apos;ll Improve Most
          </h4>
        </div>
        <p className="text-[10px] text-zinc-400">Estimated growth after 7 practice sessions</p>
        {/* Legend */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="inline-block h-2 w-4 rounded-full bg-zinc-300/50" />
            <span className="text-[10px] text-zinc-400">Now</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block h-2 w-4 rounded-full bg-gradient-to-r from-indigo-400 to-indigo-600" />
            <span className="text-[10px] text-zinc-400">After practice</span>
          </div>
        </div>
      </div>

      {/* Bars */}
      <div className="space-y-3">
        {sorted.map((cat, i) => {
          const colors = CATEGORY_COLORS[cat.key] ?? {
            hex: '#6366f1',
            bg: 'bg-indigo-500',
            text: 'text-indigo-600',
          };
          const isTop = i === 0;

          return (
            <motion.div
              key={cat.key}
              initial={{ opacity: 0, x: -12 }}
              animate={isVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: -12 }}
              transition={{
                duration: 0.4,
                ease: 'easeOut',
                delay: 0.6 + i * 0.1,
              }}
              className={`rounded-lg px-3 py-2 transition-colors ${
                isTop ? 'border-l-2 border-emerald-400 bg-zinc-50/50' : ''
              }`}
            >
              {/* Label row */}
              <div className="mb-1.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="flex h-5 w-5 items-center justify-center rounded"
                    style={{ color: colors.hex, backgroundColor: `${colors.hex}10` }}
                  >
                    {CATEGORY_ICONS[cat.key]}
                  </span>
                  <span className="text-xs font-medium text-zinc-700">{cat.label}</span>
                </div>
                <GainBadge gainPct={cat.gainPct} delay={0.8 + i * 0.1} />
              </div>

              {/* Progress bar */}
              <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-zinc-100 shadow-inner shadow-zinc-200/50">
                {/* Current level (baseline) */}
                <div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: `${cat.currentPct}%`,
                    backgroundColor: `${colors.hex}30`,
                  }}
                />
                {/* Projected gain (animated) */}
                <motion.div
                  className="absolute inset-y-0 rounded-full"
                  style={{
                    left: `${cat.currentPct}%`,
                    background: `linear-gradient(90deg, ${colors.hex}90, ${colors.hex})`,
                  }}
                  initial={{ width: 0 }}
                  animate={isVisible ? { width: `${cat.gainPct}%` } : { width: 0 }}
                  transition={{
                    duration: 0.7,
                    ease: [0.25, 0.46, 0.45, 0.94],
                    delay: 0.8 + i * 0.1,
                  }}
                />
              </div>
              {/* Current → Projected labels */}
              <div className="mt-0.5 flex items-center gap-1 text-[10px] tabular-nums text-zinc-400">
                <span>{cat.currentPct}%</span>
                <span>→</span>
                <span className="font-medium" style={{ color: colors.hex }}>
                  {cat.projectedPct}%
                </span>
              </div>
              {CATEGORY_DESCRIPTIONS[cat.key] && (
                <p className="mt-0.5 text-[10px] text-zinc-400">{CATEGORY_DESCRIPTIONS[cat.key]}</p>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
