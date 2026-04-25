'use client';

import { motion } from 'motion/react';
import { TIERS, getTierIndex } from './chart-constants';

interface TierProgressionTrackProps {
  currentScore: number;
  projectedScore: number;
  isVisible: boolean;
}

export function TierProgressionTrack({
  currentScore,
  projectedScore,
  isVisible,
}: TierProgressionTrackProps) {
  const currentTier = getTierIndex(currentScore);
  const projectedTier = getTierIndex(projectedScore);
  const crossesTier = projectedTier > currentTier;

  // Position as percentage of the full track (score 0-75)
  const currentPct = Math.max(3, Math.min(97, (currentScore / 75) * 100));
  const projectedPct = Math.max(3, Math.min(97, (projectedScore / 75) * 100));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: 0.5 }}
      className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm"
    >
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-400">
          Tier Progression
        </h4>
        {crossesTier && (
          <motion.span
            initial={{ opacity: 0, scale: 0 }}
            animate={isVisible ? { opacity: 1, scale: [0, 1.15, 1] } : { opacity: 0, scale: 0 }}
            transition={{ duration: 0.5, delay: 1.2 }}
            className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-emerald-50 to-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-600 shadow-sm shadow-emerald-100/50"
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m18 15-6-6-6 6" />
            </svg>
            Tier Up
          </motion.span>
        )}
      </div>

      {/* Gradient Track */}
      <div className="relative">
        <div className="flex h-3.5 w-full overflow-hidden rounded-full shadow-inner">
          {TIERS.map((tier, i) => (
            <div
              key={tier.label}
              className="h-full transition-all duration-300"
              style={{
                width: '25%',
                background: `linear-gradient(to right, ${tier.gradientFrom}, ${tier.gradientTo})`,
                borderRight: i < TIERS.length - 1 ? '1.5px solid rgba(255,255,255,0.7)' : 'none',
              }}
            />
          ))}
        </div>

        {/* Journey line connecting current to projected */}
        <svg
          className="absolute top-0 left-0 h-3.5 w-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="journeyLineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#71717a" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
            </linearGradient>
          </defs>
          <motion.line
            x1={`${currentPct}%`}
            y1="50%"
            x2={`${currentPct}%`}
            y2="50%"
            stroke="url(#journeyLineGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            animate={isVisible ? { x2: `${projectedPct}%` } : { x2: `${currentPct}%` }}
            transition={{ duration: 0.8, delay: 0.9, ease: 'easeOut' }}
          />
        </svg>

        {/* Current position marker */}
        <motion.div
          className="absolute flex flex-col items-center"
          style={{ left: `${currentPct}%`, top: '-4px', transform: 'translateX(-50%)' }}
          initial={{ scale: 0, opacity: 0 }}
          animate={isVisible ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
          transition={{ duration: 0.3, delay: 0.7 }}
        >
          {/* Tick line */}
          <div className="h-5.5 w-0.5 rounded-full bg-zinc-500/40" />
          {/* Pin head */}
          <div className="mt-[-22px] flex flex-col items-center">
            <div className="h-4 w-4 rounded-full border-[2.5px] border-white bg-zinc-600 shadow-md shadow-zinc-300/50" />
            <span className="mt-1.5 text-[9px] font-semibold text-zinc-500 whitespace-nowrap">
              Now
            </span>
          </div>
        </motion.div>

        {/* Projected position marker */}
        <motion.div
          className="absolute flex flex-col items-center"
          style={{ left: `${projectedPct}%`, top: '-4px', transform: 'translateX(-50%)' }}
          initial={{ scale: 0, opacity: 0 }}
          animate={isVisible ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
          transition={{ duration: 0.3, delay: 1.1 }}
        >
          {/* Tick line */}
          <div className="h-5.5 w-0.5 rounded-full bg-emerald-400/40" />
          {/* Pin head with pulsing ring */}
          <div className="mt-[-22px] flex flex-col items-center">
            <div className="relative">
              <div className="absolute inset-0 -m-1.5 animate-ping rounded-full bg-emerald-400/20" />
              <div className="relative h-4 w-4 rounded-full border-[2.5px] border-white bg-emerald-500 shadow-md shadow-emerald-300/50 ring-2 ring-emerald-200/60" />
            </div>
            <span className="mt-1.5 text-[9px] font-semibold text-emerald-600 whitespace-nowrap">
              7 sessions
            </span>
          </div>
        </motion.div>
      </div>

      {/* Tier labels */}
      <div className="mt-6 flex">
        {TIERS.map((tier) => (
          <div key={tier.label} className="flex-1 text-center">
            <span className={`text-[9px] font-semibold ${tier.textColor}`}>{tier.label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
