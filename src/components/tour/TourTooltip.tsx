'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  InsightOwlWaving,
  InsightOwlReading,
  InsightOwlProfessional,
  InsightOwlThinking,
  InsightOwlAnalyzing,
  InsightOwlCelebrating,
} from '@/components/svg/InsightOwlMascot';
import { useTourPositioning } from './use-tour-positioning';
import type { TourStep, TourMascot } from './types';

function getMascotComponent(mascot: TourMascot, size: number) {
  switch (mascot) {
    case 'waving':
      return <InsightOwlWaving size={size} />;
    case 'analyzing':
      return <InsightOwlAnalyzing size={size} />;
    case 'reading':
      return <InsightOwlReading size={size} />;
    case 'thinking':
      return <InsightOwlThinking size={size} />;
    case 'professional':
      return <InsightOwlProfessional size={size} />;
    case 'celebrating':
      return <InsightOwlCelebrating size={size} />;
  }
}

function getArrowRotation(placement: 'top' | 'bottom' | 'left' | 'right'): string {
  switch (placement) {
    case 'bottom':
      return 'rotate(45deg)'; // arrow points up
    case 'top':
      return 'rotate(225deg)'; // arrow points down
    case 'right':
      return 'rotate(315deg)'; // arrow points left
    case 'left':
      return 'rotate(135deg)'; // arrow points right
  }
}

function getAnimationOffset(placement: 'top' | 'bottom' | 'left' | 'right') {
  switch (placement) {
    case 'bottom':
      return { y: -8 };
    case 'top':
      return { y: 8 };
    case 'right':
      return { x: -8 };
    case 'left':
      return { x: 8 };
  }
}

interface TourTooltipProps {
  step: TourStep | null;
  stepIndex: number;
  totalSteps: number;
  onDismiss: () => void;
  onSkip: () => void;
}

export function TourTooltip({ step, stepIndex, totalSteps, onDismiss, onSkip }: TourTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const gotItRef = useRef<HTMLButtonElement>(null);

  const position = useTourPositioning({
    targetSelector: step?.target ?? null,
    preferredPlacement: step?.placement ?? 'auto',
    tooltipRef,
  });

  // Focus "Got it" button when tooltip appears
  useEffect(() => {
    if (step && gotItRef.current) {
      const timer = setTimeout(() => gotItRef.current?.focus(), 200);
      return () => clearTimeout(timer);
    }
  }, [step]);

  // Escape key dismisses
  useEffect(() => {
    if (!step) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step, onDismiss]);

  if (typeof window === 'undefined') return null;

  return createPortal(
    <AnimatePresence mode="wait">
      {step && position && (
        <motion.div
          key={step.id}
          ref={tooltipRef}
          role="dialog"
          aria-label={step.title}
          className="fixed z-[60] w-[300px] max-w-[calc(100vw-24px)]"
          style={{
            top: position.top,
            left: position.left,
            position: 'absolute',
          }}
          initial={{ opacity: 0, scale: 0.96, ...getAnimationOffset(position.actualPlacement) }}
          animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {/* Tooltip card */}
          <div className="rounded-xl border border-[var(--border-accent)] bg-[var(--bg-card)] p-4 shadow-lg">
            {/* Header: mascot + title + step counter */}
            <div className="flex items-start gap-2.5">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center">
                {getMascotComponent(step.mascot, 32)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] font-serif leading-tight">
                    {step.title}
                  </h3>
                  <span className="flex-shrink-0 text-[10px] font-medium tabular-nums text-[var(--text-muted)]">
                    {stepIndex + 1}/{totalSteps}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="mt-2.5 text-xs leading-relaxed text-[var(--text-secondary)]">
              {step.description}
            </p>

            {/* Actions */}
            <div className="mt-3.5 flex items-center justify-between">
              <button
                onClick={onSkip}
                className="cursor-pointer rounded-md px-2 py-1 text-[11px] font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-card-hover,var(--border-default))] hover:text-[var(--text-secondary)]"
              >
                Skip tour
              </button>
              <button
                ref={gotItRef}
                onClick={onDismiss}
                className="cursor-pointer rounded-full px-4 py-1.5 text-xs font-semibold text-white transition-all hover:brightness-110"
                style={{ background: 'var(--accent-gradient)' }}
              >
                Got it
              </button>
            </div>
          </div>

          {/* Arrow */}
          <div
            className="pointer-events-none absolute h-3 w-3 border border-[var(--border-accent)] bg-[var(--bg-card)]"
            style={{
              left: position.arrowLeft - 6,
              top: position.arrowTop - 6,
              transform: getArrowRotation(position.actualPlacement),
              clipPath:
                position.actualPlacement === 'bottom'
                  ? 'polygon(0 0, 100% 0, 0 100%)'
                  : position.actualPlacement === 'top'
                    ? 'polygon(100% 0, 100% 100%, 0 100%)'
                    : position.actualPlacement === 'right'
                      ? 'polygon(0 0, 0 100%, 100% 100%)'
                      : 'polygon(0 0, 100% 0, 100% 100%)',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
