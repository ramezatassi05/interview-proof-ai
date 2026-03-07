'use client';

import { motion, useScroll, useTransform } from 'motion/react';

export function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.02], [0, 1]);

  return (
    <motion.div
      className="fixed top-16 left-0 right-0 z-40 h-[2px] origin-left"
      style={{
        scaleX,
        opacity,
        background: 'var(--accent-gradient)',
      }}
    />
  );
}
