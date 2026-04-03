'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { PracticePain } from '@/types';

interface StepPracticePainProps {
  value: PracticePain | null;
  onChange: (pain: PracticePain) => void;
}

interface PainOption {
  value: PracticePain;
  label: string;
  feedback: string;
}

const options: PainOption[] = [
  {
    value: 'ramble',
    label: 'I ramble and lose structure',
    feedback: "Got it — we'll prioritize structured answer frameworks in your prep plan",
  },
  {
    value: 'freeze',
    label: "I freeze on questions I haven't seen",
    feedback: "Got it — we'll focus on building your question pattern recognition",
  },
  {
    value: 'no_benchmark',
    label: "I don't know what good looks like",
    feedback: "Got it — we'll show you exactly what strong answers look like",
  },
  {
    value: 'no_offers',
    label: 'I feel fine but never get offers',
    feedback: "Got it — we'll help you identify the blind spots holding you back",
  },
];

export function StepPracticePain({ value, onChange }: StepPracticePainProps) {
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const handleSelect = (pain: PracticePain) => {
    setFeedbackMessage(options.find((o) => o.value === pain)?.feedback ?? null);
    onChange(pain);
  };

  return (
    <div className="flex flex-col items-center w-full">
      <h2 className="heading-modern text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-2 text-center">
        What happens when you practice alone?
      </h2>
      <p className="text-[var(--text-secondary)] mb-8 text-center">
        Be honest — it helps us help you.
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
