'use client';

import { motion } from 'motion/react';

interface SubStepDotsProps {
  current: 0 | 1;
  labels?: [string, string];
}

export function SubStepDots({ current, labels }: SubStepDotsProps) {
  return (
    <div className="flex items-center justify-center gap-3 mt-1 mb-6">
      {[0, 1].map((i) => (
        <div key={i} className="flex items-center gap-1.5">
          <motion.div
            animate={{
              width: i === current ? 24 : 8,
              opacity: i === current ? 1 : 0.4,
            }}
            initial={false}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="h-2 rounded-full"
            style={{
              backgroundColor:
                i === current ? 'var(--accent-primary, #6366F1)' : 'var(--border-default, #d1d5db)',
            }}
          />
          {labels && (
            <span
              className="text-[11px] font-medium tracking-wide uppercase transition-opacity duration-200"
              style={{ opacity: i === current ? 1 : 0.4, color: 'var(--text-secondary, #6b7280)' }}
            >
              {labels[i]}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
