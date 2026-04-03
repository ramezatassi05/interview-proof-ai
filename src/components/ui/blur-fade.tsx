'use client';

import { useRef } from 'react';
import { AnimatePresence, motion, useInView, type Variants } from 'motion/react';

interface BlurFadeProps {
  children: React.ReactNode;
  className?: string;
  variant?: {
    hidden: { y: number };
    visible: { y: number };
  };
  duration?: number;
  delay?: number;
  offset?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  inView?: boolean;
  inViewMargin?: string;
  blur?: string;
  isVisible?: boolean;
}

export function BlurFade({
  children,
  className,
  variant,
  duration = 0.4,
  delay = 0,
  offset = 6,
  direction = 'up',
  inView = false,
  inViewMargin = '-50px',
  blur = '6px',
  isVisible,
}: BlurFadeProps) {
  const ref = useRef(null);
  const inViewResult = useInView(ref, { once: true, margin: inViewMargin as `${number}px` });
  const isInView = isVisible !== undefined ? isVisible : !inView || inViewResult;

  const isHorizontal = direction === 'left' || direction === 'right';
  const axis = isHorizontal ? 'x' : 'y';
  const sign = direction === 'right' || direction === 'down' ? -1 : 1;

  const defaultVariants: Variants = {
    hidden: {
      [axis]: sign * offset,
      opacity: 0,
      filter: `blur(${blur})`,
    },
    visible: {
      x: 0,
      y: 0,
      opacity: 1,
      filter: 'blur(0px)',
    },
  };

  const combinedVariants = variant || defaultVariants;

  return (
    <AnimatePresence>
      <motion.div
        ref={ref}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
        exit="hidden"
        variants={combinedVariants}
        transition={{
          delay: 0.04 + delay,
          duration,
          ease: 'easeOut',
        }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
