'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { ConfidenceDrop } from '@/types';

interface StepConfidenceProps {
  value: ConfidenceDrop | null;
  onChange: (confidence: ConfidenceDrop) => void;
}

interface ConfidenceOption {
  value: ConfidenceDrop;
  label: string;
  feedback: string;
}

const options: ConfidenceOption[] = [
  {
    value: 'system_design',
    label: "System design — I don't know where to start",
    feedback: "Got it — we'll build your system design framework from the ground up",
  },
  {
    value: 'behavioral',
    label: 'Behavioral — my stories feel weak',
    feedback: "Got it — we'll help you craft compelling stories from your real experience",
  },
  {
    value: 'coding',
    label: "Coding — I know the answer but can't articulate it",
    feedback: "Got it — we'll train you to think out loud clearly under pressure",
  },
  {
    value: 'everything',
    label: 'All of it honestly',
    feedback:
      "Got it — we'll create a comprehensive plan to build your confidence across the board",
  },
];

export function StepConfidence({ value, onChange }: StepConfidenceProps) {
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const handleSelect = (confidence: ConfidenceDrop) => {
    setFeedbackMessage(options.find((o) => o.value === confidence)?.feedback ?? null);
    onChange(confidence);
  };

  return (
    <div className="flex flex-col items-center w-full">
      <h2 className="heading-modern text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-2 text-center">
        Where do you lose confidence mid-interview?
      </h2>
      <p className="text-[var(--text-secondary)] mb-8 text-center">
        This shapes your priority areas.
      </p>

      <div className="w-full max-w-md space-y-3">
        {options.map((opt) => {
          const isSelected = value === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className={`
                w-full px-5 py-4 rounded-xl border-2 text-left text-sm font-medium transition-all duration-200
                ${
                  isSelected
                    ? 'border-orange-400 bg-orange-50 text-orange-700 shadow-md shadow-orange-400/10'
                    : 'border-gray-200 bg-white text-[var(--text-primary)] hover:border-gray-300 hover:shadow-sm'
                }
              `}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {feedbackMessage && (
          <motion.p
            key={feedbackMessage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="text-sm text-[var(--text-secondary)] mt-6 text-center max-w-sm italic"
          >
            {feedbackMessage}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
