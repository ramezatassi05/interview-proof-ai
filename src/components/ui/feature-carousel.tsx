'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';

export interface CarouselItem {
  id: string;
  label: string;
  icon: IconSvgElement;
  image: string;
  description: string;
}

interface FeatureCarouselProps {
  items: CarouselItem[];
  selectedId?: string;
  selectedIds?: string[];
  multiSelect?: boolean;
  onSelect?: (id: string) => void;
  accentColor?: string;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  className?: string;
}

const ITEM_HEIGHT = 65;

const wrap = (min: number, max: number, v: number) => {
  const rangeSize = max - min;
  return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min;
};

export function FeatureCarousel({
  items,
  selectedId,
  selectedIds,
  multiSelect = false,
  onSelect,
  accentColor = '#6366F1',
  autoPlay = true,
  autoPlayInterval = 3000,
  className,
}: FeatureCarouselProps) {
  const [step, setStep] = useState(() => {
    if (selectedId) {
      const idx = items.findIndex((item) => item.id === selectedId);
      return idx >= 0 ? idx : 0;
    }
    return 0;
  });
  const [isPaused, setIsPaused] = useState(false);

  const currentIndex = ((step % items.length) + items.length) % items.length;

  const lastWheelTime = useRef(0);
  const leftPanelRef = useRef<HTMLDivElement>(null);

  const nextStep = useCallback(() => {
    setStep((prev) => prev + 1);
  }, []);

  const prevStep = useCallback(() => {
    setStep((prev) => prev - 1);
  }, []);

  // Attach wheel listener with { passive: false } so preventDefault() works
  useEffect(() => {
    const el = leftPanelRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const now = Date.now();
      if (now - lastWheelTime.current < 300) return;
      lastWheelTime.current = now;

      if (e.deltaY > 0) {
        nextStep();
      } else if (e.deltaY < 0) {
        prevStep();
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [nextStep, prevStep]);

  const handleChipClick = (index: number) => {
    const diff = (index - currentIndex + items.length) % items.length;
    if (diff > 0) {
      setStep((s) => s + diff);
    }
    onSelect?.(items[index].id);
  };

  useEffect(() => {
    if (!autoPlay || isPaused) return;
    const interval = setInterval(nextStep, autoPlayInterval);
    return () => clearInterval(interval);
  }, [nextStep, isPaused, autoPlay, autoPlayInterval]);

  const getCardStatus = (index: number) => {
    const diff = index - currentIndex;
    const len = items.length;

    let normalizedDiff = diff;
    if (diff > len / 2) normalizedDiff -= len;
    if (diff < -len / 2) normalizedDiff += len;

    if (normalizedDiff === 0) return 'active';
    if (normalizedDiff === -1) return 'prev';
    if (normalizedDiff === 1) return 'next';
    return 'hidden';
  };

  return (
    <div className={cn('w-full max-w-5xl mx-auto', className)}>
      <div className="relative overflow-hidden rounded-[2.5rem] lg:rounded-[3rem] flex flex-col lg:flex-row min-h-[500px] lg:min-h-[420px] border border-border/40">
        {/* Left panel — item list */}
        <div
          className="w-full lg:w-[40%] min-h-[300px] md:min-h-[350px] relative z-30 flex flex-col items-start justify-center overflow-hidden px-8 md:px-16 lg:pl-12"
          ref={leftPanelRef}
          style={{ backgroundColor: accentColor }}
        >
          <div
            className="absolute inset-x-0 top-0 h-12 md:h-16 z-40"
            style={{
              background: `linear-gradient(to bottom, ${accentColor}, ${accentColor}CC, transparent)`,
            }}
          />
          <div
            className="absolute inset-x-0 bottom-0 h-12 md:h-16 z-40"
            style={{
              background: `linear-gradient(to top, ${accentColor}, ${accentColor}CC, transparent)`,
            }}
          />
          <div className="relative w-full h-full flex items-center justify-center lg:justify-start z-20">
            {items.map((item, index) => {
              const isActive = index === currentIndex;
              const isSelected = multiSelect
                ? (selectedIds ?? []).includes(item.id)
                : item.id === selectedId;
              const distance = index - currentIndex;
              const wrappedDistance = wrap(-(items.length / 2), items.length / 2, distance);

              return (
                <motion.div
                  key={item.id}
                  style={{
                    height: ITEM_HEIGHT,
                    width: 'fit-content',
                  }}
                  animate={{
                    y: wrappedDistance * ITEM_HEIGHT,
                    opacity: 1 - Math.abs(wrappedDistance) * 0.25,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 90,
                    damping: 22,
                    mass: 1,
                  }}
                  className="absolute flex items-center justify-start"
                >
                  <button
                    onClick={() => handleChipClick(index)}
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                    className={cn(
                      'relative flex items-center gap-3 px-5 md:px-8 lg:px-6 py-3 md:py-4 lg:py-3.5 rounded-full transition-all duration-700 text-left group border',
                      isActive || isSelected
                        ? 'bg-white text-gray-800 border-white z-10'
                        : 'bg-transparent text-white/60 border-white/20 hover:border-white/40 hover:text-white'
                    )}
                  >
                    {isSelected && (
                      <div className="absolute -right-1 -top-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center z-20">
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="white"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      </div>
                    )}

                    <div
                      className={cn(
                        'flex items-center justify-center transition-colors duration-500',
                        isActive || isSelected ? 'text-gray-800' : 'text-white/40'
                      )}
                    >
                      <HugeiconsIcon icon={item.icon} size={18} strokeWidth={2} />
                    </div>

                    <span className="font-medium text-sm md:text-[15px] tracking-tight whitespace-nowrap">
                      {item.label}
                    </span>
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right panel — card stack */}
        <div className="flex-1 min-h-[400px] md:min-h-[450px] lg:h-full relative bg-secondary/30 flex items-center justify-center py-12 md:py-16 lg:py-12 px-6 md:px-12 lg:px-10 overflow-hidden border-t lg:border-t-0 lg:border-l border-border/20">
          <div className="relative w-full max-w-[360px] aspect-[4/5] flex items-center justify-center">
            {items.map((item, index) => {
              const status = getCardStatus(index);
              const isActive = status === 'active';
              const isPrev = status === 'prev';
              const isNext = status === 'next';

              return (
                <motion.div
                  key={item.id}
                  initial={false}
                  animate={{
                    x: isActive ? 0 : isPrev ? -80 : isNext ? 80 : 0,
                    scale: isActive ? 1 : isPrev || isNext ? 0.85 : 0.7,
                    opacity: isActive ? 1 : isPrev || isNext ? 0.4 : 0,
                    rotate: isPrev ? -3 : isNext ? 3 : 0,
                    zIndex: isActive ? 20 : isPrev || isNext ? 10 : 0,
                    pointerEvents: isActive ? ('auto' as const) : ('none' as const),
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 260,
                    damping: 25,
                    mass: 0.8,
                  }}
                  className="absolute inset-0 rounded-[2rem] md:rounded-[2.5rem] overflow-hidden border-4 md:border-6 border-background bg-background origin-center"
                >
                  <img
                    src={item.image}
                    alt={item.label}
                    className={cn(
                      'w-full h-full object-cover transition-all duration-700',
                      isActive ? 'grayscale-0 blur-0' : 'grayscale blur-[2px] brightness-75'
                    )}
                  />

                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute inset-x-0 bottom-0 p-8 pt-24 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end pointer-events-none"
                      >
                        <div className="bg-background text-foreground px-3 py-1 rounded-full text-[11px] font-medium uppercase tracking-[0.15em] w-fit shadow-lg mb-2.5 border border-border/50">
                          {item.label}
                        </div>
                        <p className="text-white font-normal text-lg md:text-xl leading-tight drop-shadow-md tracking-tight">
                          {item.description}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FeatureCarousel;
