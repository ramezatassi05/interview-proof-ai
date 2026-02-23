'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Container } from '@/components/layout/Container';
import { Badge } from '@/components/ui/Badge';

interface Slide {
  badge: string;
  title: string;
  description: string;
  accent: 'coral' | 'teal' | 'amber';
  icon: React.ReactNode;
}

const ACCENT_COLORS: Record<Slide['accent'], string> = {
  coral: 'var(--color-danger)',
  teal: 'var(--color-success)',
  amber: 'var(--color-warning)',
};

const ACCENT_MUTED: Record<Slide['accent'], string> = {
  coral: 'var(--color-danger-muted)',
  teal: 'var(--color-success-muted)',
  amber: 'var(--color-warning-muted)',
};

const SLIDES: Slide[] = [
  {
    badge: 'How It Works',
    title: 'Paste Your Resume + Job Description',
    description:
      'Upload your resume and paste any job posting. Our engine cross-references them to surface what could get you rejected.',
    accent: 'coral',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-10 w-10 sm:h-12 sm:w-12">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
  {
    badge: 'Lightning Fast',
    title: 'Results in ~60 Seconds',
    description:
      'No waiting for human reviewers. Analysis engine computes your readiness score in about a minute.',
    accent: 'teal',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-10 w-10 sm:h-12 sm:w-12">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
  {
    badge: 'Your Diagnostic',
    title: 'Hire-Zone Score, Risk Map, Study Plan',
    description:
      'Get a score out of 100, top rejection risks with evidence, and a prioritized action plan.',
    accent: 'amber',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-10 w-10 sm:h-12 sm:w-12">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    badge: 'Evidence-Based',
    title: 'Not Generic Advice \u2014 Real Interview Intelligence',
    description:
      'Built from 50+ interview rubrics. Round-specific, role-specific, evidence-backed analysis.',
    accent: 'coral',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-10 w-10 sm:h-12 sm:w-12">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
];

const AUTO_ADVANCE_MS = 5500;

export function OnboardingCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [slidePhase, setSlidePhase] = useState<'visible' | 'exit' | 'enter'>('visible');
  const [progress, setProgress] = useState(0);
  const isPaused = useRef(false);
  const progressRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Touch support
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);

  // Mouse drag support
  const [dragOffsetX, setDragOffsetX] = useState(0);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragCurrentX = useRef(0);
  const rafId = useRef<number>(0);
  const wasDragged = useRef(false);

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const goToSlide = useCallback(
    (next: number) => {
      if (slidePhase !== 'visible') return;

      if (prefersReducedMotion) {
        setActiveIndex(next);
        progressRef.current = 0;
        setProgress(0);
        return;
      }

      // Reset any drag offset before transitioning
      setDragOffsetX(0);

      // 3-phase transition: exit → swap → enter
      setSlidePhase('exit');
      setTimeout(() => {
        setActiveIndex(next);
        setSlidePhase('enter');
        progressRef.current = 0;
        setProgress(0);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setSlidePhase('visible');
          });
        });
      }, 350);
    },
    [slidePhase, prefersReducedMotion]
  );

  // Auto-advance timer + progress bar
  useEffect(() => {
    const tick = 50;

    timerRef.current = setInterval(() => {
      if (isPaused.current || slidePhase !== 'visible') return;

      progressRef.current += tick;
      setProgress(progressRef.current / AUTO_ADVANCE_MS);

      if (progressRef.current >= AUTO_ADVANCE_MS) {
        const next = (activeIndex + 1) % SLIDES.length;
        goToSlide(next);
      }
    }, tick);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeIndex, slidePhase, goToSlide]);

  // Pause on hover / focus
  const pause = useCallback(() => {
    isPaused.current = true;
  }, []);
  const resume = useCallback(() => {
    if (!isDragging.current) isPaused.current = false;
  }, []);

  // Touch handlers
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  }, []);

  const onTouchEnd = useCallback(() => {
    const threshold = 50;
    if (Math.abs(touchDeltaX.current) < threshold) return;

    if (touchDeltaX.current < -threshold) {
      // Swipe left → next
      goToSlide((activeIndex + 1) % SLIDES.length);
    } else {
      // Swipe right → prev
      goToSlide((activeIndex - 1 + SLIDES.length) % SLIDES.length);
    }
  }, [activeIndex, goToSlide]);

  // Mouse drag handler
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0 || slidePhase !== 'visible') return;

      isDragging.current = true;
      wasDragged.current = false;
      dragStartX.current = e.clientX;
      dragCurrentX.current = 0;
      isPaused.current = true;
      document.body.style.cursor = 'grabbing';

      const onMouseMove = (ev: MouseEvent) => {
        dragCurrentX.current = ev.clientX - dragStartX.current;

        if (Math.abs(dragCurrentX.current) > 5) {
          wasDragged.current = true;
        }

        if (!prefersReducedMotion) {
          cancelAnimationFrame(rafId.current);
          rafId.current = requestAnimationFrame(() => {
            setDragOffsetX(dragCurrentX.current);
          });
        }
      };

      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        // Cancel any pending RAF from mousemove before resetting state
        cancelAnimationFrame(rafId.current);

        isDragging.current = false;
        document.body.style.cursor = '';
        isPaused.current = false;

        const delta = dragCurrentX.current;
        const threshold = 50;

        if (Math.abs(delta) >= threshold) {
          setDragOffsetX(0);
          if (delta < 0) {
            goToSlide((activeIndex + 1) % SLIDES.length);
          } else {
            goToSlide((activeIndex - 1 + SLIDES.length) % SLIDES.length);
          }
        } else {
          // Snap back with animation — two-frame RAF so transition applies
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              setDragOffsetX(0);
            });
          });
        }
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },
    [slidePhase, activeIndex, goToSlide, prefersReducedMotion]
  );

  // Suppress phantom clicks after drag
  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (wasDragged.current) {
      e.stopPropagation();
      e.preventDefault();
      wasDragged.current = false;
    }
  }, []);

  // Cleanup pending RAF on unmount
  useEffect(() => {
    return () => cancelAnimationFrame(rafId.current);
  }, []);

  const currentSlide = SLIDES[activeIndex];
  const accentColor = ACCENT_COLORS[currentSlide.accent];
  const accentMuted = ACCENT_MUTED[currentSlide.accent];

  const slideStyle: React.CSSProperties = prefersReducedMotion
    ? {}
    : {
        transform:
          slidePhase === 'exit'
            ? 'translateX(40px)'
            : slidePhase === 'enter'
              ? 'translateX(-40px)'
              : `translateX(${dragOffsetX}px)`,
        opacity: slidePhase === 'visible' ? 1 : 0,
        transition:
          slidePhase === 'enter'
            ? 'none'
            : isDragging.current
              ? 'opacity 0.35s ease'
              : 'transform 0.35s ease, opacity 0.35s ease',
      };

  return (
    <section>
      <Container className="py-12">
        {/* Section header */}
        <div className="flex flex-col items-center text-center">
          <Badge variant="accent">New Here?</Badge>
          <h2 className="mt-3 text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
            How <span className="text-[var(--accent-primary)]">InterviewProof</span> Works
          </h2>
        </div>

        {/* Carousel card */}
        <div
          ref={containerRef}
          className="mx-auto mt-8 max-w-2xl select-none"
          onMouseEnter={pause}
          onMouseLeave={resume}
          onFocus={pause}
          onBlur={resume}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown}
          onClickCapture={onClickCapture}
          draggable={false}
          style={{ cursor: 'grab' }}
          role="region"
          aria-roledescription="carousel"
          aria-label="How InterviewProof Works"
        >
          <div
            className="rounded-[20px] bg-[var(--bg-card)] shadow-warm overflow-hidden"
            aria-live="polite"
          >
            {/* Slide content */}
            <div className="p-6 sm:p-8" style={slideStyle}>
              <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left sm:gap-6">
                {/* Icon */}
                <div
                  className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl sm:h-20 sm:w-20"
                  style={{ backgroundColor: accentMuted, color: accentColor }}
                >
                  {currentSlide.icon}
                </div>

                {/* Text */}
                <div className="mt-4 sm:mt-0">
                  <span
                    className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider"
                    style={{ backgroundColor: accentMuted, color: accentColor }}
                  >
                    {currentSlide.badge}
                  </span>
                  <h3 className="mt-2 text-lg font-bold text-[var(--text-primary)] sm:text-xl">
                    {currentSlide.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-secondary)]">
                    {currentSlide.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation dots + progress bar */}
            <div className="px-6 pb-5 sm:px-8">
              {/* Dots */}
              <div className="flex items-center justify-center gap-2" role="tablist">
                {SLIDES.map((_, i) => (
                  <button
                    key={i}
                    role="tab"
                    aria-selected={i === activeIndex}
                    aria-label={`Slide ${i + 1}: ${SLIDES[i].title}`}
                    onClick={() => goToSlide(i)}
                    className="relative h-2 rounded-full transition-all duration-300"
                    style={{
                      width: i === activeIndex ? '24px' : '8px',
                      backgroundColor:
                        i === activeIndex
                          ? accentColor
                          : 'var(--text-muted)',
                      opacity: i === activeIndex ? 1 : 0.35,
                    }}
                  />
                ))}
              </div>

              {/* Progress bar */}
              <div className="mt-3 h-[2px] overflow-hidden rounded-full bg-[var(--track-bg)]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(progress * 100, 100)}%`,
                    backgroundColor: accentColor,
                    transition: 'width 0.05s linear',
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
