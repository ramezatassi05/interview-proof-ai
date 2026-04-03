'use client';

import { useSyncExternalStore, useCallback } from 'react';
import { motion } from 'motion/react';

function useScrollProgress() {
  const subscribe = useCallback((cb: () => void) => {
    window.addEventListener('scroll', cb, { passive: true });
    return () => window.removeEventListener('scroll', cb);
  }, []);

  const getSnapshot = useCallback(() => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollable <= 0) return 0;
    return Math.min(window.scrollY / scrollable, 1);
  }, []);

  return useSyncExternalStore(subscribe, getSnapshot, () => 0);
}

interface OnboardingDotNavProps {
  currentStep: number; // 1-based step (1–5)
  totalSteps: number; // number of dot-navigable steps (5)
}

export function OnboardingDotNav({ currentStep, totalSteps }: OnboardingDotNavProps) {
  const scrollProgress = useScrollProgress();

  // Interpolate fill between current step and next step based on scroll
  const stepSize = 100 / (totalSteps - 1);
  const basePercent = (currentStep - 1) * stepSize;
  const fillPercent = basePercent + scrollProgress * stepSize;

  return (
    <nav
      className="fixed right-6 top-1/2 z-40 -translate-y-1/2 hidden sm:flex"
      aria-label="Onboarding progress"
    >
      <div className="relative flex flex-col items-center" style={{ height: 120 }}>
        {/* Track background */}
        <div
          className="absolute left-1/2 -translate-x-1/2 w-[2px] rounded-full"
          style={{
            height: '100%',
            backgroundColor: 'var(--border-primary, #e5e7eb)',
            opacity: 0.5,
          }}
        />

        {/* Animated fill */}
        <motion.div
          className="absolute left-1/2 top-0 -translate-x-1/2 w-[2px] rounded-full origin-top"
          style={{
            background: 'var(--accent-gradient, linear-gradient(180deg, #6366F1 0%, #818CF8 100%))',
          }}
          initial={false}
          animate={{ height: `${fillPercent}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />

        {/* Step tick marks */}
        {Array.from({ length: totalSteps }, (_, i) => {
          const step = i + 1;
          const isActive = currentStep === step;
          const isCompleted = currentStep > step;
          const topPercent = (i / (totalSteps - 1)) * 100;

          return (
            <div
              key={step}
              className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
              style={{ top: `${topPercent}%` }}
              aria-label={`Step ${step} of ${totalSteps}${isActive ? ' (current)' : isCompleted ? ' (completed)' : ''}`}
            >
              {isActive ? (
                /* Active step: glowing indigo dot with pulse ring */
                <div className="relative flex items-center justify-center">
                  <motion.div
                    className="absolute rounded-full"
                    style={{
                      width: 16,
                      height: 16,
                      background: 'var(--accent-primary, #6366F1)',
                      opacity: 0.15,
                    }}
                    animate={{ scale: [1, 1.6, 1], opacity: [0.15, 0, 0.15] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <motion.div
                    className="rounded-full"
                    style={{
                      width: 6,
                      height: 6,
                      background: 'var(--accent-primary, #6366F1)',
                      boxShadow: '0 0 8px rgba(99, 102, 241, 0.5)',
                    }}
                    layoutId="active-step"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                </div>
              ) : (
                /* Completed or pending: small tick */
                <div
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: isCompleted ? 4 : 3,
                    height: isCompleted ? 4 : 3,
                    backgroundColor: isCompleted
                      ? 'var(--accent-primary, #6366F1)'
                      : 'var(--border-primary, #d1d5db)',
                    opacity: isCompleted ? 0.7 : 0.4,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
