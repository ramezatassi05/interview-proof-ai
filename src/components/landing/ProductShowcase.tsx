'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';
import { UploadMockup } from './mockups/UploadMockup';
import { AnalysisMockup } from './mockups/AnalysisMockup';
import { ScoreMockup } from './mockups/ScoreMockup';
import { RisksMockup } from './mockups/RisksMockup';
import { PracticeMockup } from './mockups/PracticeMockup';
import { AnimatedCursor, type CursorWaypoint } from './mockups/AnimatedCursor';

const WAITLIST_MODE = process.env.NEXT_PUBLIC_WAITLIST_MODE === 'true';

const SCENES = [
  { label: 'Upload Resume + JD', mockup: <UploadMockup /> },
  { label: 'AI Analysis', mockup: <AnalysisMockup /> },
  { label: 'Readiness Score', mockup: <ScoreMockup /> },
  { label: 'Risk Breakdown', mockup: <RisksMockup /> },
  { label: 'Practice Questions', mockup: <PracticeMockup /> },
];

const SCENE_DURATION = 5000; // 5 seconds per scene
const TICK_INTERVAL = 50; // progress update interval

/** Cursor waypoints per scene — timed to match CSS animation delays */
const SCENE_CHOREOGRAPHY: CursorWaypoint[][] = [
  // Scene 0: Upload — click resume, JD, pill, then CTA
  [
    { x: 35, y: 30, delay: 0, duration: 0 },
    { x: 55, y: 32, delay: 200, duration: 500, action: 'click' },
    { x: 35, y: 48, delay: 1200, duration: 500 },
    { x: 55, y: 49, delay: 1800, duration: 400, action: 'click' },
    { x: 36, y: 62, delay: 2800, duration: 400, action: 'click' },
    { x: 50, y: 72, delay: 3800, duration: 400, action: 'click' },
  ],
  // Scene 1: Analysis — cursor idles while watching progress
  [
    { x: 62, y: 48, delay: 0, duration: 0 },
    { x: 60, y: 55, delay: 2000, duration: 2000 },
  ],
  // Scene 2: Score — hover down each dimension bar
  [
    { x: 50, y: 30, delay: 0, duration: 0 },
    { x: 45, y: 60, delay: 600, duration: 700 },
    { x: 46, y: 66, delay: 1500, duration: 400 },
    { x: 47, y: 72, delay: 2200, duration: 400 },
    { x: 48, y: 78, delay: 2900, duration: 400 },
  ],
  // Scene 3: Risks — click each risk card as it slides in
  [
    { x: 50, y: 28, delay: 0, duration: 0 },
    { x: 50, y: 44, delay: 300, duration: 500, action: 'click' },
    { x: 50, y: 58, delay: 1200, duration: 400, action: 'click' },
    { x: 50, y: 72, delay: 2100, duration: 400, action: 'click' },
  ],
  // Scene 4: Practice — click answer area, then drift to AI feedback
  [
    { x: 50, y: 28, delay: 0, duration: 0 },
    { x: 50, y: 55, delay: 700, duration: 500, action: 'click' },
    { x: 50, y: 80, delay: 2500, duration: 600 },
  ],
];

export function ProductShowcase() {
  const { user } = useAuth();
  const [activeScene, setActiveScene] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0); // 0-100 overall progress
  const [transitioning, setTransitioning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sceneProgressRef = useRef(0); // ms elapsed in current scene

  const advanceScene = useCallback(() => {
    setTransitioning(true);
    setTimeout(() => {
      setActiveScene((prev) => (prev + 1) % SCENES.length);
      sceneProgressRef.current = 0;
      setTransitioning(false);
    }, 250);
  }, []);

  useEffect(() => {
    if (!playing) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      sceneProgressRef.current += TICK_INTERVAL;

      // Calculate overall progress
      const sceneIndex =
        sceneProgressRef.current >= SCENE_DURATION ? activeScene + 1 : activeScene;
      const sceneElapsed =
        sceneProgressRef.current >= SCENE_DURATION ? 0 : sceneProgressRef.current;
      const overall =
        ((sceneIndex % SCENES.length) / SCENES.length + sceneElapsed / SCENE_DURATION / SCENES.length) *
        100;
      setProgress(overall);

      if (sceneProgressRef.current >= SCENE_DURATION) {
        advanceScene();
        sceneProgressRef.current = 0;
      }
    }, TICK_INTERVAL);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing, activeScene, advanceScene]);

  const togglePlay = () => setPlaying((p) => !p);

  const ctaHref = user ? '/new' : '/auth/login?redirect=/new';

  return (
    <section id="showcase" className="py-20 lg:py-28 bg-[var(--bg-secondary)]/50">
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

          {/* Right — showcase carousel */}
          <div className="mt-14 lg:mt-0 lg:flex-1">
            {/* Gradient mesh container */}
            <div className="relative overflow-hidden rounded-3xl" style={{ minHeight: 500 }}>
              {/* Gradient blobs */}
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

              {/* Scene label */}
              <div className="relative z-10 pt-8 text-center">
                <span
                  className="inline-block rounded-full bg-[var(--bg-primary)]/60 px-4 py-1.5 text-xs font-medium text-[var(--text-secondary)] backdrop-blur-sm border border-[var(--border-default)]"
                  style={{
                    transition: 'opacity 0.3s ease',
                    opacity: transitioning ? 0 : 1,
                  }}
                >
                  {SCENES[activeScene].label}
                </span>
              </div>

              {/* Floating card */}
              <div className="relative z-10 flex items-center justify-center px-4 py-8">
                <div
                  className="w-full max-w-md transition-opacity duration-500 ease-in-out"
                  style={{ opacity: transitioning ? 0 : 1 }}
                >
                  {SCENES[activeScene].mockup}
                </div>
              </div>

              {/* Animated demo cursor */}
              <AnimatedCursor
                waypoints={SCENE_CHOREOGRAPHY[activeScene]}
                playing={playing}
                sceneIndex={activeScene}
                transitioning={transitioning}
              />

              {/* Play/Pause button */}
              <button
                onClick={togglePlay}
                className="absolute bottom-6 left-6 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg-primary)]/80 backdrop-blur-sm border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                aria-label={playing ? 'Pause demo' : 'Play demo'}
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
