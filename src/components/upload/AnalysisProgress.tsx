'use client';

import { useEffect, useState, useRef } from 'react';
import { Spinner } from '@/components/ui/Spinner';
import { INTERVIEW_INSIGHTS, type InterviewInsight } from '@/lib/insights';

const SCORING_INSIGHTS = INTERVIEW_INSIGHTS.filter((i) => i.category !== 'industry');
const INDUSTRY_INSIGHTS = INTERVIEW_INSIGHTS.filter((i) => i.category === 'industry');

const ANALYSIS_STEPS = [
  { key: 'create', label: 'Creating report', duration: 2000 },
  { key: 'extract', label: 'Parsing your documents', duration: 8000 },
  { key: 'retrieve', label: 'Matching against rubrics', duration: 5000 },
  { key: 'analyze', label: 'Running diagnostic analysis', duration: 20000 },
  { key: 'score', label: 'Computing readiness score', duration: 5000 },
];

const CATEGORY_LABELS: Record<InterviewInsight['category'], string> = {
  scoring: 'Scoring',
  hiring: 'Hiring',
  preparation: 'Prep',
  strategy: 'Strategy',
  risk: 'Risk',
  rubric: 'Rubric',
  industry: 'Did You Know?',
};

function InsightIcon({ icon }: { icon: InterviewInsight['icon'] }) {
  const paths: Record<InterviewInsight['icon'], string> = {
    chart: 'M3 13h2v8H3zm6-4h2v12H9zm6-6h2v18h-2zm-12 10h2v8H3z',
    target:
      'M12 2a10 10 0 100 20 10 10 0 000-20zm0 4a6 6 0 110 12 6 6 0 010-12zm0 4a2 2 0 100 4 2 2 0 000-4z',
    brain:
      'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z',
    shield:
      'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z',
    clock:
      'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z',
    trophy:
      'M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z',
    lightbulb:
      'M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z',
  };

  return (
    <svg
      className="h-4 w-4 flex-shrink-0 text-[var(--accent-primary)]"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d={paths[icon]} />
    </svg>
  );
}

interface AnalysisProgressProps {
  isAnalyzing: boolean;
}

export function AnalysisProgress({ isAnalyzing }: AnalysisProgressProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const wasAnalyzingRef = useRef(isAnalyzing);
  const [insightIndex, setInsightIndex] = useState(0);
  const [insightSlide, setInsightSlide] = useState<'visible' | 'exit' | 'enter'>('visible');

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

  // Rotate insights every 5.5s with slide-out-right / slide-in-from-left
  useEffect(() => {
    if (!isAnalyzing) return;

    const timer = setInterval(() => {
      // Phase 1: slide out to the right
      setInsightSlide('exit');
      setTimeout(() => {
        // Phase 2: swap content, instantly reposition off-screen left (no transition)
        setInsightIndex((prev) => (prev + 1) % SCORING_INSIGHTS.length);
        setInsightSlide('enter');
        // Phase 3: after browser paints the 'enter' position, transition to center
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setInsightSlide('visible');
          });
        });
      }, 400);
    }, 5500);

    return () => clearInterval(timer);
  }, [isAnalyzing]);

  if (!isAnalyzing) return null;

  const currentInsight = SCORING_INSIGHTS[insightIndex];

  return (
    <div className="card-warm shadow-warm rounded-[20px] p-6 space-y-6">
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

      {/* Rotating insight card */}
      <div
        className="overflow-hidden rounded-[20px] bg-[var(--bg-card)] shadow-warm p-4"
        style={{
          transform:
            insightSlide === 'exit'
              ? 'translateX(40px)'
              : insightSlide === 'enter'
                ? 'translateX(-40px)'
                : 'translateX(0)',
          opacity: insightSlide === 'visible' ? 1 : 0,
          transition: insightSlide === 'enter' ? 'none' : 'transform 0.4s ease, opacity 0.4s ease',
        }}
      >
        <div className="flex items-start gap-3">
          <InsightIcon icon={currentInsight.icon} />
          <div className="min-w-0 flex-1">
            <span className="inline-block rounded-full bg-[var(--bg-elevated)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
              {CATEGORY_LABELS[currentInsight.category]}
            </span>
            <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
              {currentInsight.text}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Did You Know? card (rendered separately below the analysis box) ── */

interface DidYouKnowCardProps {
  isAnalyzing: boolean;
}

export function DidYouKnowCard({ isAnalyzing }: DidYouKnowCardProps) {
  const [factIndex, setFactIndex] = useState(0);
  const [factSlide, setFactSlide] = useState<'visible' | 'exit' | 'enter'>('visible');

  useEffect(() => {
    if (!isAnalyzing) return;

    let intervalId: ReturnType<typeof setInterval>;

    // Offset by 2.75s so the two cards don't switch simultaneously
    const timeoutId = setTimeout(() => {
      intervalId = setInterval(() => {
        setFactSlide('exit');
        setTimeout(() => {
          setFactIndex((prev) => (prev + 1) % INDUSTRY_INSIGHTS.length);
          setFactSlide('enter');
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              setFactSlide('visible');
            });
          });
        }, 400);
      }, 5500);
    }, 2750);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [isAnalyzing]);

  if (!isAnalyzing) return null;

  const fact = INDUSTRY_INSIGHTS[factIndex];

  return (
    <div
      className="overflow-hidden rounded-[20px] bg-[var(--bg-card)] shadow-warm p-4"
      style={{
        transform:
          factSlide === 'exit'
            ? 'translateX(40px)'
            : factSlide === 'enter'
              ? 'translateX(-40px)'
              : 'translateX(0)',
        opacity: factSlide === 'visible' ? 1 : 0,
        transition: factSlide === 'enter' ? 'none' : 'transform 0.4s ease, opacity 0.4s ease',
      }}
    >
      <div className="flex items-start gap-3">
        <InsightIcon icon={fact.icon} />
        <div className="min-w-0 flex-1">
          <span className="inline-block rounded-full bg-[var(--accent-primary)]/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[var(--accent-primary)]">
            Did You Know?
          </span>
          <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">{fact.text}</p>
        </div>
      </div>
    </div>
  );
}
