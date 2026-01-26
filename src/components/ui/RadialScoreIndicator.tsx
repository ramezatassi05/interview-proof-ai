'use client';

import { useEffect, useRef, useMemo, useCallback, useSyncExternalStore } from 'react';

type RadialSize = 'sm' | 'md' | 'lg' | 'xl';
type RadialVariant = 'default' | 'success' | 'warning' | 'danger' | 'auto';

interface RadialScoreIndicatorProps {
  score: number;
  size?: RadialSize;
  label?: string;
  sublabel?: string;
  animated?: boolean;
  variant?: RadialVariant;
  showPercentage?: boolean;
  className?: string;
}

const sizeConfig: Record<
  RadialSize,
  { width: number; strokeWidth: number; fontSize: string; labelSize: string }
> = {
  sm: { width: 64, strokeWidth: 4, fontSize: 'text-lg', labelSize: 'text-[10px]' },
  md: { width: 96, strokeWidth: 6, fontSize: 'text-2xl', labelSize: 'text-xs' },
  lg: { width: 128, strokeWidth: 8, fontSize: 'text-3xl', labelSize: 'text-sm' },
  xl: { width: 160, strokeWidth: 10, fontSize: 'text-4xl', labelSize: 'text-base' },
};

function getAutoVariant(score: number): 'success' | 'warning' | 'danger' {
  if (score >= 70) return 'success';
  if (score >= 40) return 'warning';
  return 'danger';
}

// Custom hook for animation state using external store pattern
function useAnimatedValue(targetValue: number, shouldAnimate: boolean, duration: number = 800) {
  const storeRef = useRef({
    value: shouldAnimate ? 0 : targetValue,
    listeners: new Set<() => void>(),
    animationId: null as number | null,
    hasAnimated: false,
  });

  const subscribe = useCallback((listener: () => void) => {
    storeRef.current.listeners.add(listener);
    return () => storeRef.current.listeners.delete(listener);
  }, []);

  const getSnapshot = useCallback(() => storeRef.current.value, []);

  const value = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    const store = storeRef.current;

    if (!shouldAnimate || store.hasAnimated) {
      store.value = targetValue;
      store.listeners.forEach((l) => l());
      return;
    }

    store.hasAnimated = true;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progressRatio = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progressRatio, 3);

      store.value = Math.round(eased * targetValue);
      store.listeners.forEach((l) => l());

      if (progressRatio < 1) {
        store.animationId = requestAnimationFrame(animate);
      }
    };

    store.animationId = requestAnimationFrame(animate);

    return () => {
      if (store.animationId) {
        cancelAnimationFrame(store.animationId);
      }
    };
  }, [targetValue, shouldAnimate, duration]);

  return value;
}

export function RadialScoreIndicator({
  score,
  size = 'md',
  label,
  sublabel,
  animated = true,
  variant = 'auto',
  showPercentage = true,
  className = '',
}: RadialScoreIndicatorProps) {
  const displayScore = useAnimatedValue(score, animated);

  const config = sizeConfig[size];
  const radius = (config.width - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;

  const resolvedVariant = variant === 'auto' ? getAutoVariant(score) : variant;

  const colorClass = useMemo(() => {
    switch (resolvedVariant) {
      case 'success':
        return 'stroke-[var(--color-success)]';
      case 'warning':
        return 'stroke-[var(--color-warning)]';
      case 'danger':
        return 'stroke-[var(--color-danger)]';
      default:
        return 'stroke-[var(--accent-primary)]';
    }
  }, [resolvedVariant]);

  const textColorClass = useMemo(() => {
    switch (resolvedVariant) {
      case 'success':
        return 'text-[var(--color-success)]';
      case 'warning':
        return 'text-[var(--color-warning)]';
      case 'danger':
        return 'text-[var(--color-danger)]';
      default:
        return 'text-[var(--accent-primary)]';
    }
  }, [resolvedVariant]);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative" style={{ width: config.width, height: config.width }}>
        <svg
          width={config.width}
          height={config.width}
          viewBox={`0 0 ${config.width} ${config.width}`}
          className="transform -rotate-90"
          style={{ overflow: 'visible' }}
        >
          {/* Background track */}
          <circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={radius}
            fill="none"
            className="stroke-[var(--track-bg)]"
            strokeWidth={config.strokeWidth}
          />
          {/* Progress arc */}
          <circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={radius}
            fill="none"
            className={colorClass}
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-bold tabular-nums ${config.fontSize} ${textColorClass}`}>
            {displayScore}
            {showPercentage && <span className="text-[0.6em] opacity-70">%</span>}
          </span>
        </div>
      </div>
      {label && (
        <div className="mt-2 text-center">
          <p className={`font-medium text-[var(--text-primary)] ${config.labelSize}`}>{label}</p>
          {sublabel && <p className={`text-[var(--text-muted)] ${config.labelSize}`}>{sublabel}</p>}
        </div>
      )}
    </div>
  );
}
