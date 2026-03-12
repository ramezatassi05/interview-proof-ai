'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useInView } from '@/hooks/useInView';
import { useCursorWaypoints } from '@/hooks/useCursorWaypoints';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';
import { BrowserFrame } from './mockups/BrowserFrame';
import { FlowUploadPage, FlowAnalysisPage, FlowReportPage } from './mockups/FlowPages';
import { AnimatedCursor } from './mockups/AnimatedCursor';
import { BorderBeam } from '@/components/ui/border-beam';

const WAITLIST_MODE = process.env.NEXT_PUBLIC_WAITLIST_MODE === 'true';

/* ====== Flow timing ====== */

type FlowPhase =
  | 'upload'
  | 'fade-to-analysis'
  | 'analysis'
  | 'fade-to-report'
  | 'report-score'
  | 'report-risks'
  | 'report-questions'
  | 'hold'
  | 'fade-out';

const PHASE_BOUNDARIES: [number, FlowPhase][] = [
  [0, 'upload'],
  [1100, 'fade-to-analysis'],
  [1300, 'analysis'],
  [4000, 'fade-to-report'],
  [4200, 'report-score'],
  [7200, 'report-risks'],
  [10200, 'report-questions'],
  [14200, 'hold'],
  [15000, 'fade-out'],
];

const TOTAL_DURATION = 15500;
const TICK = 50;
const ANALYSIS_START = 1300;
const ANALYSIS_END = 4000;
const RISKS_START = 7200;

/* ====== Phase → derived values ====== */

function getVisiblePage(phase: FlowPhase): 'upload' | 'analysis' | 'report' {
  switch (phase) {
    case 'upload':
    case 'fade-to-analysis':
      return 'upload';
    case 'analysis':
    case 'fade-to-report':
      return 'analysis';
    default:
      return 'report';
  }
}

function getContentVisible(phase: FlowPhase): boolean {
  return phase !== 'fade-to-analysis' && phase !== 'fade-to-report' && phase !== 'fade-out';
}

function getActiveTab(phase: FlowPhase): 'score' | 'risks' | 'questions' {
  if (phase === 'report-risks') return 'risks';
  if (phase === 'report-questions' || phase === 'hold' || phase === 'fade-out') return 'questions';
  return 'score';
}

function getUrl(phase: FlowPhase): string {
  switch (phase) {
    case 'upload':
      return 'interviewproof.ai/new';
    case 'fade-to-analysis':
    case 'analysis':
      return 'interviewproof.ai/analyzing';
    default:
      return 'interviewproof.ai/r/a3f\u2026';
  }
}

/* ====== Component ====== */

export function ProductShowcase() {
  const { user } = useAuth();
  const [flowPhase, setFlowPhase] = useState<FlowPhase>('upload');
  const [flowKey, setFlowKey] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const elapsedRef = useRef(0);
  const phaseRef = useRef<FlowPhase>('upload');
  const { ref: sectionRef, isInView } = useInView<HTMLElement>({ threshold: 0.3, once: false });

  /* Auto-play on scroll into view, restart each time */
  useEffect(() => {
    const id = setTimeout(() => {
      if (isInView) {
        elapsedRef.current = 0;
        phaseRef.current = 'upload';
        setFlowPhase('upload');
        setProgress(0);
        setFlowKey((k) => k + 1);
        setPlaying(true);
      } else {
        setPlaying(false);
      }
    }, 0);
    return () => clearTimeout(id);
  }, [isInView]);

  /* Timer loop */
  useEffect(() => {
    if (!playing) return;

    const timer = setInterval(() => {
      elapsedRef.current += TICK;
      const elapsed = elapsedRef.current;

      if (elapsed >= TOTAL_DURATION) {
        elapsedRef.current = 0;
        phaseRef.current = 'upload';
        setFlowPhase('upload');
        setProgress(0);
        setFlowKey((k) => k + 1);
        return;
      }

      // Determine current phase
      let newPhase: FlowPhase = 'upload';
      for (const [boundary, phase] of PHASE_BOUNDARIES) {
        if (elapsed >= boundary) newPhase = phase;
      }

      if (newPhase !== phaseRef.current) {
        phaseRef.current = newPhase;
        setFlowPhase(newPhase);
      }

      setProgress((elapsed / TOTAL_DURATION) * 100);
    }, TICK);

    return () => clearInterval(timer);
  }, [playing]);

  const togglePlay = () => {
    if (playing) {
      setPlaying(false);
    } else {
      // Restart from beginning
      elapsedRef.current = 0;
      phaseRef.current = 'upload';
      setFlowPhase('upload');
      setProgress(0);
      setFlowKey((k) => k + 1);
      setPlaying(true);
    }
  };

  /* Derived rendering values */
  const visiblePage = getVisiblePage(flowPhase);
  const contentVisible = getContentVisible(flowPhase);
  const activeTab = getActiveTab(flowPhase);
  const url = getUrl(flowPhase);

  const elapsed = (progress / 100) * TOTAL_DURATION;

  const analysisProgress = (() => {
    if (elapsed >= ANALYSIS_START && elapsed < ANALYSIS_END) {
      return ((elapsed - ANALYSIS_START) / (ANALYSIS_END - ANALYSIS_START)) * 90;
    }
    return elapsed >= ANALYSIS_END ? 90 : 0;
  })();

  const scrollOffset = (() => {
    if (flowPhase === 'report-risks') {
      const phaseElapsed = elapsed - RISKS_START;
      return phaseElapsed > 1500
        ? Math.min(Math.round(((phaseElapsed - 1500) / 1000) * 20), 20)
        : 0;
    }
    return 0;
  })();

  const dynamicWaypoints = useCursorWaypoints(containerRef, flowKey);
  const ctaHref = user ? '/new' : '/auth/login?redirect=/new';

  return (
    <section ref={sectionRef} id="showcase" className="py-20 lg:py-28 bg-[var(--bg-section-alt)]">
      <Container size="2xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:gap-20">
          {/* Left — description */}
          <div className="flex-1 lg:max-w-[45%]">
            <h2 className="heading-modern text-3xl font-bold text-[var(--text-primary)] sm:text-4xl lg:text-5xl">
              Your interview risks,{' '}
              <span className="text-gradient-accent">exposed in seconds</span>
            </h2>

            <p className="mt-6 max-w-lg text-base leading-relaxed text-[var(--text-secondary)]">
              Upload your resume and job description. Our AI cross-references every detail against
              real hiring rubrics to surface the exact gaps that get candidates rejected — so you can
              fix them before the interview.
            </p>

            {!WAITLIST_MODE && (
              <div className="mt-10">
                <Link href={ctaHref}>
                  <Button variant="gradient" size="lg" rounded>
                    Run My Diagnostic
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Right — continuous flow animation */}
          <div className="mt-14 lg:mt-0 lg:flex-1">
            <div
              ref={containerRef}
              className="relative overflow-hidden rounded-3xl"
              style={{ minHeight: 500 }}
            >
              {/* Gradient mesh blobs */}
              <div
                className="absolute -left-20 -top-20 h-72 w-72 rounded-full opacity-60 blur-[80px] dark:opacity-60"
                style={{
                  background: 'linear-gradient(135deg, #fb923c, #f97316)',
                  animation: 'gradient-shift 8s ease-in-out infinite',
                }}
              />
              <div
                className="absolute left-1/2 top-1/4 h-64 w-64 -translate-x-1/2 rounded-full opacity-50 blur-[80px]"
                style={{
                  background: 'linear-gradient(135deg, #ec4899, #f472b6)',
                  animation: 'gradient-shift 8s ease-in-out infinite 2s',
                }}
              />
              <div
                className="absolute -right-16 top-1/3 h-60 w-60 rounded-full opacity-50 blur-[80px]"
                style={{
                  background: 'linear-gradient(135deg, #a855f7, #c084fc)',
                  animation: 'gradient-shift 8s ease-in-out infinite 4s',
                }}
              />
              <div
                className="absolute bottom-0 left-1/3 h-56 w-56 rounded-full opacity-30 blur-[80px]"
                style={{
                  background: 'linear-gradient(135deg, #d946ef, #e879f9)',
                  animation: 'gradient-shift 8s ease-in-out infinite 6s',
                }}
              />

              {/* Dark overlay to tone down blobs in light mode */}
              <div className="absolute inset-0 bg-[var(--bg-primary)]/40" />

              {/* Browser frame with flow content */}
              <div className="relative z-10 flex items-center justify-center px-4 py-10">
                <div className="relative w-full max-w-md rounded-2xl">
                  <BorderBeam size={300} duration={10} delay={0} />
                  <BrowserFrame url={url}>
                    <div
                      style={{
                        opacity: contentVisible ? 1 : 0,
                        transition: 'opacity 200ms ease',
                        minHeight: 280,
                      }}
                    >
                      {visiblePage === 'upload' && <FlowUploadPage />}
                      {visiblePage === 'analysis' && (
                        <FlowAnalysisPage progress={analysisProgress} />
                      )}
                      {visiblePage === 'report' && (
                        <FlowReportPage
                          activeTab={activeTab}
                          animKey={flowKey}
                          scrollOffset={scrollOffset}
                        />
                      )}
                    </div>
                  </BrowserFrame>
                </div>
              </div>

              {/* Animated demo cursor */}
              <AnimatedCursor
                waypoints={dynamicWaypoints}
                playing={playing}
                flowKey={flowKey}
                transitioning={!contentVisible}
              />

              {/* Play/Pause button */}
              <button
                onClick={togglePlay}
                className="absolute bottom-6 left-6 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg-primary)]/80 backdrop-blur-sm border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                aria-label={playing ? 'Pause demo' : 'Replay demo'}
              >
                {playing ? (
                  /* Pause icon — two bars */
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <rect x="3" y="2" width="4" height="12" rx="1" />
                    <rect x="9" y="2" width="4" height="12" rx="1" />
                  </svg>
                ) : (
                  /* Play icon — triangle */
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M4 2.5v11l9-5.5-9-5.5z" />
                  </svg>
                )}
              </button>

              {/* Progress bar */}
              <div className="absolute bottom-0 left-0 right-0 z-20 h-1 bg-[var(--bg-primary)]/30">
                <div
                  className="h-full rounded-r-full transition-all duration-100 ease-linear"
                  style={{
                    width: `${progress}%`,
                    background: 'var(--gradient-accent-text)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
