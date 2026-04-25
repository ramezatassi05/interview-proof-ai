'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TypingAnimation } from '@/components/ui/typing-animation';
import type { OnboardingPrepUrgency } from '@/types';

interface StepUrgencyProps {
  prepUrgency: OnboardingPrepUrgency | null;
  onPrepUrgencyChange: (urgency: OnboardingPrepUrgency) => void;
}

interface UrgencyOption {
  value: OnboardingPrepUrgency;
  icon: string;
  label: string;
  description: string;
  feedback: string;
}

const urgencyOptions: UrgencyOption[] = [
  {
    value: 'exploring',
    icon: '🔍',
    label: 'Just Exploring',
    description: 'No rush yet',
    feedback: "You're early — that's a real advantage. We'll help you build a strong foundation.",
  },
  {
    value: 'active_search',
    icon: '📋',
    label: 'Actively Searching',
    description: 'Applying to jobs',
    feedback: "Good timing — we'll help you build a consistent daily prep routine.",
  },
  {
    value: 'interview_scheduled',
    icon: '📅',
    label: 'Interview Scheduled',
    description: 'Have a date set',
    feedback: "We'll prioritize the highest-impact areas for your timeline.",
  },
  {
    value: 'interview_this_week',
    icon: '🔥',
    label: 'This Week!',
    description: 'Crunch time',
    feedback: "Let's focus on what moves the needle most in the time you have.",
  },
];

export const URGENCY_FEEDBACK: Record<OnboardingPrepUrgency, string> = Object.fromEntries(
  urgencyOptions.map((o) => [o.value, o.feedback])
) as Record<OnboardingPrepUrgency, string>;

export function StepUrgency({ prepUrgency, onPrepUrgencyChange }: StepUrgencyProps) {
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const handleSelect = (urgency: OnboardingPrepUrgency) => {
    setFeedbackMessage(urgencyOptions.find((o) => o.value === urgency)?.feedback ?? null);
    onPrepUrgencyChange(urgency);
  };

  return (
    <div className="flex flex-col items-center w-full">
      <h2 className="heading-modern text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-2 text-center">
        How soon is your interview?
      </h2>
      <p className="text-[var(--text-secondary)] mb-8 text-center">
        This shapes your prep priorities.
      </p>

      <div className="w-full max-w-md">
        <div className="grid grid-cols-2 gap-3">
          {urgencyOptions.map((opt, index) => {
            const isSelected = prepUrgency === opt.value;
            return (
              <motion.button
                key={opt.value}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut', delay: index * 0.08 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleSelect(opt.value)}
                className={`
                  flex flex-col items-center p-4 rounded-xl border-2 text-center transition-colors duration-200
                  ${
                    isSelected
                      ? 'border-orange-400 bg-orange-50 shadow-md shadow-orange-400/10'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }
                `}
              >
                <span className="text-xl mb-1">{opt.icon}</span>
                <span
                  className={`font-semibold text-sm ${isSelected ? 'text-orange-700' : 'text-[var(--text-primary)]'}`}
                >
                  {opt.label}
                </span>
                <span className="text-xs text-[var(--text-muted)] mt-0.5">{opt.description}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {feedbackMessage && (
          <motion.div
            key={feedbackMessage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="mt-6 text-center max-w-sm"
          >
            <TypingAnimation
              as="p"
              duration={30}
              showCursor={false}
              startOnView={false}
              className="text-sm text-[var(--text-secondary)] italic leading-relaxed"
            >
              {feedbackMessage}
            </TypingAnimation>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
