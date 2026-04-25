'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DotPattern } from '@/components/ui/dot-pattern';

interface AnalysisAnimationProps {
  messages: string[];
  onComplete: () => void;
  dataReady: boolean;
}

const STEP_DURATION = 4500; // ms per message
const MAX_WAIT = 30000; // max wait even if data not ready

export function AnalysisAnimation({ messages, onComplete, dataReady }: AnalysisAnimationProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [animationDone, setAnimationDone] = useState(false);
  const completeCalled = useRef(false);
  const mountTime = useRef(0);

  // Initialize mount time once
  useEffect(() => {
    mountTime.current = Date.now();
  }, []);

  // Step through messages
  useEffect(() => {
    if (animationDone) return;

    const timer = setTimeout(() => {
      if (currentStep < messages.length - 1) {
        setCurrentStep((s) => s + 1);
      } else {
        setAnimationDone(true);
      }
    }, STEP_DURATION);

    return () => clearTimeout(timer);
  }, [currentStep, messages.length, animationDone]);

  // Wait for animation + data, then call onComplete
  useEffect(() => {
    if (!animationDone || completeCalled.current) return;

    // Check immediately if data is ready
    if (dataReady) {
      completeCalled.current = true;
      const timer = setTimeout(onComplete, 600);
      return () => clearTimeout(timer);
    }

    // Poll until data ready or max wait
    const interval = setInterval(() => {
      if (completeCalled.current) return;
      const elapsed = Date.now() - mountTime.current;
      if (dataReady || elapsed >= MAX_WAIT) {
        completeCalled.current = true;
        setTimeout(onComplete, 600);
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [animationDone, dataReady, onComplete]);

  const progress = ((currentStep + 1) / messages.length) * 100;

  return (
    <div
      className="relative flex h-screen w-full flex-col items-center justify-center bg-white"
      style={{ '--dot-grid-color': 'rgba(0,0,0,0.04)' } as React.CSSProperties}
    >
      <DotPattern className="opacity-30" />

      <div className="relative z-10 flex flex-col items-center gap-8 px-6 max-w-md">
        {/* Pulsing orbital graphic */}
        <div className="relative flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            className="absolute h-24 w-24 rounded-full border border-indigo-200/60"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
            className="absolute h-32 w-32 rounded-full border border-indigo-100/40"
          />
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-50 to-violet-50 shadow-lg shadow-indigo-100/50"
          >
            <svg
              className="h-7 w-7 text-indigo-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </motion.div>
        </div>

        {/* Stepped message */}
        <div className="h-14 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={animationDone && !dataReady ? 'finalizing' : currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="text-center text-sm font-medium text-zinc-600"
            >
              {animationDone && !dataReady
                ? 'Finalizing your readiness map...'
                : messages[currentStep]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-xs">
          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: animationDone && !dataReady ? '95%' : `${progress}%`,
              }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-indigo-400 to-violet-400"
            />
          </div>
        </div>

        {/* Step dots */}
        <div className="flex items-center gap-2">
          {messages.map((_, i) => (
            <motion.div
              key={i}
              animate={{
                backgroundColor: i <= currentStep ? '#6366f1' : '#d1d5db',
                scale: i === currentStep ? 1.2 : 1,
              }}
              transition={{ duration: 0.3 }}
              className="h-2 w-2 rounded-full"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
