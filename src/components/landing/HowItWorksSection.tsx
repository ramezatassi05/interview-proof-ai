'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Container } from '@/components/layout/Container';
import { SectionBadge } from './SectionBadge';
import { UploadMockup } from './mockups/UploadMockup';
import { AnalysisMockup } from './mockups/AnalysisMockup';
import { ScoreMockup } from './mockups/ScoreMockup';
import { RisksMockup } from './mockups/RisksMockup';
import { PracticeMockup } from './mockups/PracticeMockup';

interface Step {
  number: number;
  title: string;
  description: string;
  mockup: React.ReactNode;
}

const STEPS: Step[] = [
  {
    number: 1,
    title: 'Upload Resume + JD',
    description: 'Paste your resume and job description. Select your interview round type.',
    mockup: <UploadMockup />,
  },
  {
    number: 2,
    title: 'AI Analyzes Your Profile',
    description: 'Our engine cross-references your experience against the role requirements using 50+ rubrics.',
    mockup: <AnalysisMockup />,
  },
  {
    number: 3,
    title: 'Get Your Hire-Zone Score',
    description: 'Receive a deterministic readiness score across 6 weighted dimensions.',
    mockup: <ScoreMockup />,
  },
  {
    number: 4,
    title: 'See Rejection Risks',
    description: 'Discover the exact gaps that could get you rejected — ranked by severity.',
    mockup: <RisksMockup />,
  },
  {
    number: 5,
    title: 'Practice & Improve',
    description: 'Practice with predicted questions and get AI coaching on your answers.',
    mockup: <PracticeMockup />,
  },
];

const AUTO_ADVANCE_MS = 6000;

export function HowItWorksSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const isPaused = useRef(false);
  const progressRef = useRef(0);

  const goToStep = useCallback((index: number) => {
    setActiveIndex(index);
    progressRef.current = 0;
    setProgress(0);
  }, []);

  useEffect(() => {
    const tick = 50;
    const interval = setInterval(() => {
      if (isPaused.current) return;
      progressRef.current += tick;
      setProgress(progressRef.current / AUTO_ADVANCE_MS);
      if (progressRef.current >= AUTO_ADVANCE_MS) {
        const next = (activeIndex + 1) % STEPS.length;
        goToStep(next);
      }
    }, tick);
    return () => clearInterval(interval);
  }, [activeIndex, goToStep]);

  const currentStep = STEPS[activeIndex];

  return (
    <section id="how-it-works" className="py-20 lg:py-28 bg-[var(--bg-secondary)]/50">
      <Container size="2xl">
        <div className="text-center">
          <SectionBadge label="How it works" />
          <h2 className="heading-modern mt-5 text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">
            An end-to-end diagnostic in minutes
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-[var(--text-secondary)]">
            From upload to actionable insights — five simple steps.
          </p>
        </div>

        <div
          className="mt-14 flex flex-col lg:flex-row lg:gap-14"
          onMouseEnter={() => { isPaused.current = true; }}
          onMouseLeave={() => { isPaused.current = false; }}
        >
          {/* Left — step tabs */}
          <div className="lg:w-[380px] flex-shrink-0">
            <div className="space-y-1">
              {STEPS.map((step, i) => {
                const isActive = i === activeIndex;
                return (
                  <button
                    key={step.number}
                    onClick={() => goToStep(i)}
                    className={`flex w-full items-start gap-4 rounded-xl px-4 py-4 text-left transition-all duration-200 ${
                      isActive
                        ? 'bg-[var(--bg-card)] border border-[var(--border-accent)] shadow-sm'
                        : 'hover:bg-[var(--bg-card)]/50 border border-transparent'
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                        isActive
                          ? 'bg-[var(--accent-primary)] text-white'
                          : 'bg-[var(--bg-elevated)] text-[var(--text-muted)]'
                      }`}
                    >
                      {step.number}
                    </span>
                    <div>
                      <p className={`text-sm font-semibold ${isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                        {step.title}
                      </p>
                      {isActive && (
                        <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
                          {step.description}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Progress bar */}
            <div className="mt-4 mx-4 h-[2px] rounded-full bg-[var(--track-bg)] overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--accent-primary)]"
                style={{
                  width: `${Math.min(progress * 100, 100)}%`,
                  transition: 'width 0.05s linear',
                }}
              />
            </div>
          </div>

          {/* Right — mockup */}
          <div className="mt-8 lg:mt-0 flex-1 flex items-center justify-center min-w-0">
            <div className="w-full max-w-md" key={activeIndex}>
              {currentStep.mockup}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
