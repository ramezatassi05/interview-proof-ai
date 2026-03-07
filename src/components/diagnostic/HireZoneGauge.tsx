'use client';

import { useInView } from '@/hooks/useInView';
import type { HireZoneAnalysis } from '@/types';

interface HireZoneGaugeProps {
  hireZone: HireZoneAnalysis;
}

const ZONE_COLORS = [
  { label: 'Reject', color: 'var(--color-danger)', opacity: 0.7 },
  { label: 'Maybe', color: 'var(--color-warning)', opacity: 0.7 },
  { label: 'Likely', color: 'var(--color-success)', opacity: 0.6 },
  { label: 'Strong', color: 'var(--color-success)', opacity: 1 },
];

export function HireZoneGauge({ hireZone }: HireZoneGaugeProps) {
  const { ref, isInView } = useInView<HTMLDivElement>({ threshold: 0.3 });

  const markerPosition = Math.min(100, Math.max(0, hireZone.currentScore));

  return (
    <div ref={ref} className="space-y-3">
      {/* Zone labels */}
      <div className="flex text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
        {ZONE_COLORS.map((zone) => (
          <span key={zone.label} className="flex-1 text-center">
            {zone.label}
          </span>
        ))}
      </div>

      {/* Gauge bar */}
      <div className="relative h-4 rounded-full overflow-hidden bg-[var(--track-bg)]">
        {/* Zone segments */}
        <div className="absolute inset-0 flex">
          {ZONE_COLORS.map((zone, i) => (
            <div
              key={i}
              className="flex-1"
              style={{ backgroundColor: zone.color, opacity: zone.opacity }}
            />
          ))}
        </div>

        {/* Hire zone overlay */}
        <div
          className="absolute inset-y-0 border-x-2 border-white/40"
          style={{
            left: `${hireZone.hireZoneMin}%`,
            width: `${hireZone.hireZoneMax - hireZone.hireZoneMin}%`,
          }}
        />

        {/* Animated marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-6 w-6 rounded-full border-2 border-white bg-[var(--accent-primary)] shadow-lg"
          style={{
            left: isInView ? `${markerPosition}%` : '0%',
            transition: isInView
              ? 'left 800ms cubic-bezier(0.34, 1.56, 0.64, 1)'
              : 'none',
          }}
        >
          <span className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-[var(--bg-elevated)] px-2 py-0.5 text-xs font-bold text-[var(--text-primary)] shadow-sm border border-[var(--border-default)]">
            {hireZone.currentScore}
          </span>
        </div>
      </div>

      {/* Scale */}
      <div className="flex justify-between text-[10px] text-[var(--text-muted)] font-mono">
        <span>0</span>
        <span>25</span>
        <span>50</span>
        <span>75</span>
        <span>100</span>
      </div>
    </div>
  );
}
