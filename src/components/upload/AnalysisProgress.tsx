'use client';

import { useEffect, useState, useRef } from 'react';
import { Spinner } from '@/components/ui/Spinner';

const ANALYSIS_STEPS = [
  { key: 'create', label: 'Creating report', duration: 2000 },
  { key: 'extract', label: 'Parsing your documents', duration: 8000 },
  { key: 'retrieve', label: 'Matching against rubrics', duration: 5000 },
  { key: 'analyze', label: 'Running diagnostic analysis', duration: 20000 },
  { key: 'score', label: 'Computing readiness score', duration: 5000 },
];

interface AnalysisProgressProps {
  isAnalyzing: boolean;
}

export function AnalysisProgress({ isAnalyzing }: AnalysisProgressProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const wasAnalyzingRef = useRef(isAnalyzing);

  // Reset state when isAnalyzing changes from true to false
  useEffect(() => {
    if (wasAnalyzingRef.current && !isAnalyzing) {
      // Use requestAnimationFrame to avoid synchronous setState in effect
      requestAnimationFrame(() => {
        setCurrentStep(0);
        setProgress(0);
      });
    }
    wasAnalyzingRef.current = isAnalyzing;
  }, [isAnalyzing]);

  // Progress animation when analyzing
  useEffect(() => {
    if (!isAnalyzing) {
      return;
    }

    let stepIndex = 0;
    let elapsed = 0;
    const totalDuration = ANALYSIS_STEPS.reduce((sum, s) => sum + s.duration, 0);

    const interval = setInterval(() => {
      elapsed += 100;

      // Calculate overall progress
      setProgress(Math.min((elapsed / totalDuration) * 100, 95));

      // Calculate which step we're on
      let stepElapsed = 0;
      for (let i = 0; i < ANALYSIS_STEPS.length; i++) {
        stepElapsed += ANALYSIS_STEPS[i].duration;
        if (elapsed < stepElapsed) {
          stepIndex = i;
          break;
        }
        stepIndex = i;
      }
      setCurrentStep(stepIndex);
    }, 100);

    return () => clearInterval(interval);
  }, [isAnalyzing]);

  if (!isAnalyzing) return null;

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="relative h-3 overflow-hidden rounded-full bg-[var(--track-bg)]">
        <div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {ANALYSIS_STEPS.map((step, i) => (
          <div
            key={step.key}
            className={`flex items-center gap-3 ${
              i < currentStep
                ? 'text-[var(--color-success)]'
                : i === currentStep
                  ? 'text-[var(--text-primary)]'
                  : 'text-[var(--text-muted)]'
            }`}
          >
            <div className="flex h-6 w-6 items-center justify-center">
              {i < currentStep ? (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-success)]">
                  <svg
                    className="h-3 w-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              ) : i === currentStep ? (
                <Spinner size="sm" />
              ) : (
                <div className="h-2 w-2 rounded-full bg-current" />
              )}
            </div>
            <span className="text-sm font-medium">{step.label}</span>
          </div>
        ))}
      </div>

      <p className="text-center text-sm text-[var(--text-muted)]">
        This usually takes 30-60 seconds
      </p>
    </div>
  );
}
