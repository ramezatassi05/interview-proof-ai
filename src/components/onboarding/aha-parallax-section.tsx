'use client';

import { useRef, type ReactNode, type RefObject } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';

interface AhaParallaxSectionProps {
  children: ReactNode;
  title: ReactNode;
  description: ReactNode;
  reverseLayout?: boolean;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
}

export function AhaParallaxSection({
  children,
  title,
  description,
  reverseLayout = false,
  scrollContainerRef,
}: AhaParallaxSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    container: scrollContainerRef,
    offset: ['start end', 'end start'],
  });

  const cardY = useTransform(scrollYProgress, [0, 1], [60, -60]);
  const bgY = useTransform(scrollYProgress, [0, 1], [-40, 40]);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[80vh] flex items-center justify-center px-6 py-16 md:py-24"
    >
      {/* Decorative parallax background blob */}
      <motion.div
        style={{ y: bgY }}
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div className="h-[400px] w-[400px] rounded-full bg-indigo-50/60 blur-3xl" />
      </motion.div>

      <div
        className={`relative z-10 mx-auto grid w-full max-w-5xl grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-16 ${
          reverseLayout ? 'md:[direction:rtl]' : ''
        }`}
      >
        {/* Text side */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={reverseLayout ? 'md:[direction:ltr]' : ''}
        >
          <div className="space-y-4">
            {title}
            {description}
          </div>
        </motion.div>

        {/* Mockup card side */}
        <motion.div
          style={{ y: cardY }}
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.15 }}
          className={reverseLayout ? 'md:[direction:ltr]' : ''}
        >
          <div className="relative rounded-3xl border border-zinc-200/50 bg-white/60 p-5 shadow-xl shadow-zinc-200/30 backdrop-blur-xl">
            {children}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
