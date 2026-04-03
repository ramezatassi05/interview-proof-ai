'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { InterviewMotivation } from '@/types';

interface StepMotivationProps {
  value: InterviewMotivation | null;
  onChange: (motivation: InterviewMotivation) => void;
}

interface MotivationOption {
  value: InterviewMotivation;
  label: string;
  feedback: string;
}

const options: MotivationOption[] = [
  {
    value: 'dream_role',
    label: "I'd land my dream role",
    feedback: "We'll make sure you're over-prepared for that moment",
  },
  {
    value: 'break_in',
    label: "I'd finally break into the industry",
    feedback: "We'll build your confidence to break through",
  },
  {
    value: 'stop_dreading',
    label: "I'd stop dreading the process",
    feedback: "We'll turn interview prep from stressful to strategic",
  },
];

export function StepMotivation({ value, onChange }: StepMotivationProps) {
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const handleSelect = (motivation: InterviewMotivation) => {
    setFeedbackMessage(options.find((o) => o.value === motivation)?.feedback ?? null);
    onChange(motivation);
  };

  return (
    <div className="flex flex-col items-center w-full">
      <h2 className="heading-modern text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-2 text-center">
        What would change if you nailed your next interview?
      </h2>
      <p className="text-[var(--text-secondary)] mb-8 text-center">
        Keep this in mind when it gets hard.
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
