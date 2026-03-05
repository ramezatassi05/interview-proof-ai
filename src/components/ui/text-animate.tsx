'use client';

import { useMemo } from 'react';
import { motion, type Variants } from 'motion/react';
import { cn } from '@/lib/utils';

type AnimationType = 'blurInUp' | 'fadeIn';

interface TextAnimateProps {
  children: string;
  className?: string;
  animation?: AnimationType;
  by?: 'word' | 'character';
  delay?: number;
  duration?: number;
  startOnView?: boolean;
}

const animationVariants: Record<AnimationType, Variants> = {
  blurInUp: {
    hidden: { opacity: 0, y: 10, filter: 'blur(8px)' },
    visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
  },
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
};

export function TextAnimate({
  children,
  className,
  animation = 'blurInUp',
  by = 'word',
  delay = 0,
  duration = 0.3,
  startOnView = true,
}: TextAnimateProps) {
  const segments = useMemo(() => {
    if (by === 'word') return children.split(/(\s+)/);
    return children.split('');
  }, [children, by]);

  const variants = animationVariants[animation];

  return (
    <motion.span
      className={cn('inline', className)}
      initial="hidden"
      {...(startOnView ? { whileInView: 'visible', viewport: { once: true } } : { animate: 'visible' })}
      transition={{ staggerChildren: by === 'word' ? 0.08 : 0.03, delayChildren: delay }}
    >
      {segments.map((segment, i) => (
        <motion.span
          key={`${segment}-${i}`}
          variants={variants}
          transition={{ duration, ease: 'easeOut' }}
          className="inline-block whitespace-pre"
        >
          {segment}
        </motion.span>
      ))}
    </motion.span>
  );
}
