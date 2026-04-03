'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import useEmblaCarousel from 'embla-carousel-react';
import { cn } from '@/lib/utils';

export interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface OnboardingDialogProps {
  slides: OnboardingSlide[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
  lastButtonText?: string;
}

export function OnboardingDialog({
  slides,
  open,
  onOpenChange,
  onComplete,
  lastButtonText = 'Get Started',
}: OnboardingDialogProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [activeIndex, setActiveIndex] = React.useState(0);

  React.useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setActiveIndex(emblaApi.selectedScrollSnap());
    onSelect();
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  const isFirstSlide = activeIndex === 0;
  const isLastSlide = activeIndex === slides.length - 1;
  const currentSlide = slides[activeIndex] ?? slides[0];

  const handleClose = React.useCallback(() => {
    onOpenChange(false);
    onComplete?.();
  }, [onOpenChange, onComplete]);

  const handleNext = React.useCallback(() => {
    if (isLastSlide) {
      handleClose();
      return;
    }
    emblaApi?.scrollNext();
  }, [isLastSlide, emblaApi, handleClose]);

  const handlePrevious = React.useCallback(() => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  // Reset to first slide when reopened
  React.useEffect(() => {
    if (open && emblaApi) {
      emblaApi.scrollTo(0);
      setActiveIndex(0);
    }
  }, [open, emblaApi]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Dialog */}
      <div className="relative mx-4 w-full max-w-lg overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] shadow-2xl animate-fade-in">
        <div className="p-4 sm:p-6">
          {/* Carousel */}
          <div ref={emblaRef} className="overflow-hidden rounded-lg">
            <div className="flex">
              {slides.map((slide) => (
                <div key={slide.id} className="min-w-0 flex-[0_0_100%]">
                  <div className="flex flex-col items-center px-2 py-4">
                    <div className="flex h-32 w-32 items-center justify-center sm:h-36 sm:w-36">
                      {slide.icon}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dots */}
          <div className="mt-2 flex items-center justify-center gap-2">
            {slides.map((slide, index) => (
              <motion.div
                key={slide.id}
                animate={{
                  opacity: index === activeIndex ? 1 : 0.4,
                  width: index === activeIndex ? 24 : 8,
                }}
                initial={false}
                transition={{ duration: 0.22, ease: 'easeOut' }}
              >
                <button
                  onClick={() => emblaApi?.scrollTo(index)}
                  aria-label={`Go to ${slide.title}`}
                  className={cn(
                    'h-2 w-full cursor-pointer rounded-full transition-colors',
                    index === activeIndex
                      ? 'bg-[var(--accent-primary)]'
                      : 'bg-[var(--border-default)] hover:bg-[var(--text-muted)]'
                  )}
                />
              </motion.div>
            ))}
          </div>

          {/* Title + Description — grid crossfade */}
          <div className="mt-5 grid px-1">
            {slides.map((slide) => (
              <motion.div
                key={slide.id}
                animate={{ opacity: currentSlide.id === slide.id ? 1 : 0 }}
                initial={false}
                className="col-start-1 row-start-1"
                style={{ pointerEvents: currentSlide.id === slide.id ? 'auto' : 'none' }}
                transition={{ duration: 0.24, ease: 'easeOut' }}
              >
                <h2 className="text-center text-lg font-semibold text-[var(--text-primary)] sm:text-xl">
                  {slide.title}
                </h2>
                <p className="mt-2 text-center text-sm text-[var(--text-secondary)]">
                  {slide.description}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-6 flex items-center justify-between px-1 pb-1">
            <div>
              {!isFirstSlide && (
                <button
                  onClick={handlePrevious}
                  className="cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-card-hover,var(--border-default))] hover:text-[var(--text-primary)]"
                >
                  Back
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!isLastSlide && (
                <button
                  onClick={handleClose}
                  className="cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-card-hover,var(--border-default))] hover:text-[var(--text-primary)]"
                >
                  Skip
                </button>
              )}
              <button
                onClick={handleNext}
                className="cursor-pointer rounded-full px-5 py-1.5 text-sm font-semibold text-white transition-all hover:brightness-110"
                style={{ background: 'var(--accent-gradient)' }}
              >
                {isLastSlide ? lastButtonText : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
