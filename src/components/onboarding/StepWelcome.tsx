'use client';

import { useRef, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { InsightOwlWaving } from '@/components/svg/InsightOwlMascot';
import { LiquidButton } from '@/components/ui/liquid-glass-button';

interface StepWelcomeProps {
  displayName: string;
  onContinue: () => void;
}

function ElegantShape({
  className,
  delay = 0,
  width = 400,
  height = 100,
  rotate = 0,
  gradient = 'from-orange-200/[0.18]',
}: {
  className?: string;
  delay?: number;
  width?: number;
  height?: number;
  rotate?: number;
  gradient?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -150, rotate: rotate - 15 }}
      animate={{ opacity: 1, y: 0, rotate }}
      transition={{
        duration: 2.4,
        delay,
        ease: [0.23, 0.86, 0.39, 0.96],
        opacity: { duration: 1.2 },
      }}
      className={cn('absolute', className)}
      aria-hidden="true"
    >
      <motion.div
        animate={{ y: [0, 15, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        style={{ width, height }}
        className="relative"
      >
        <div
          className={cn(
            'absolute inset-0 rounded-full',
            'bg-gradient-to-r to-transparent',
            gradient,
            'backdrop-blur-[2px] border-2 border-black/[0.10]',
            'shadow-[0_8px_32px_0_rgba(251,146,60,0.15)]',
            'after:absolute after:inset-0 after:rounded-full',
            'after:bg-[radial-gradient(circle_at_50%_50%,rgba(251,146,60,0.12),transparent_70%)]'
          )}
        />
      </motion.div>
    </motion.div>
  );
}

/* ── Pick the flattest letter in the name for the owl to perch on ── */

const PERCH_SCORES: Record<string, number> = {
  // Flat horizontal top stroke — best perches
  z: 10,
  t: 9,
  f: 8,
  // Relatively flat-ish tops at x-height
  x: 7,
  r: 7,
  n: 6,
  a: 6,
  u: 6,
  // Rounded/curved tops — poor perches
  m: 5,
  w: 5,
  e: 5,
  c: 5,
  s: 4,
  o: 3,
  v: 3,
  // Uppercase with flat horizontal tops
  T: 10,
  Z: 10,
  E: 9,
  F: 9,
  H: 9,
  I: 8,
  N: 8,
  M: 7,
  B: 7,
  D: 7,
  P: 7,
  R: 7,
  K: 7,
  L: 7,
  W: 5,
  // Uppercase pointy or round
  A: 3,
  V: 3,
  O: 3,
  Q: 3,
  C: 4,
  S: 3,
  U: 4,
  G: 4,
  X: 6,
  Y: 5,
  // Ascenders — owl floats too high, unnatural
  h: 5,
  d: 4,
  b: 4,
  k: 4,
  l: 3,
  // Dot on top or narrow — no perch surface
  i: 2,
  j: 2,
  // Descenders
  y: 4,
  g: 4,
  p: 4,
  q: 4,
};

function findBestPerchIndex(name: string): number {
  let bestIdx = 0;
  let bestScore = -1;
  for (let i = 0; i < name.length; i++) {
    let score = PERCH_SCORES[name[i]] ?? 5;
    // Avoid first letter (owl would obscure it)
    if (i === 0) score -= 3;
    // Slight penalty for last letter
    if (i === name.length - 1) score -= 1;
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }
  return bestIdx;
}

const fadeUpVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 1,
      delay: 0.5 + i * 0.2,
      ease: [0.25, 0.4, 0.25, 1] as [number, number, number, number],
    },
  }),
};

const OWL_SIZE = 36;
const OWL_OVERLAP = 4; // px of talon overlap onto the glyph top

export function StepWelcome({ displayName, onContinue }: StepWelcomeProps) {
  const firstName = displayName.split(' ')[0] || 'there';
  const perchIdx = findBestPerchIndex(firstName);
  const perchRef = useRef<HTMLSpanElement>(null);
  const [owlTop, setOwlTop] = useState<number | null>(null);

  useEffect(() => {
    const positionOwl = () => {
      const el = perchRef.current;
      if (!el) return;

      const style = getComputedStyle(el);
      const fontSize = parseFloat(style.fontSize);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.font = `${style.fontWeight} ${fontSize}px ${style.fontFamily}`;
      const metrics = ctx.measureText(firstName[perchIdx]);

      // Exact glyph position within the line box
      const fontAscent = metrics.fontBoundingBoxAscent;
      const fontDescent = metrics.fontBoundingBoxDescent;
      const glyphAscent = metrics.actualBoundingBoxAscent;
      const elHeight = el.offsetHeight;

      // Baseline position from top of line box (text is vertically centered)
      const baselineFromTop = (elHeight - (fontAscent + fontDescent)) / 2 + fontAscent;
      // Top of the actual glyph
      const glyphTopFromElTop = baselineFromTop - glyphAscent;

      // Place owl so its bottom overlaps the glyph top by OWL_OVERLAP px (talons gripping)
      setOwlTop(glyphTopFromElTop - OWL_SIZE + OWL_OVERLAP);
    };

    document.fonts.ready.then(positionOwl);
    window.addEventListener('resize', positionOwl);
    return () => window.removeEventListener('resize', positionOwl);
  }, [firstName, perchIdx]);

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#FAFBFF]">
      {/* Subtle ambient gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-100/[0.4] via-transparent to-pink-100/[0.3] blur-3xl" />

      {/* Floating shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <ElegantShape
          delay={0.3}
          width={600}
          height={140}
          rotate={12}
          gradient="from-orange-300/[0.30]"
          className="left-[-10%] md:left-[-5%] top-[15%] md:top-[20%]"
        />
        <ElegantShape
          delay={0.5}
          width={500}
          height={120}
          rotate={-15}
          gradient="from-pink-300/[0.25]"
          className="right-[-5%] md:right-[0%] top-[70%] md:top-[75%]"
        />
        <ElegantShape
          delay={0.4}
          width={300}
          height={80}
          rotate={-8}
          gradient="from-purple-300/[0.25]"
          className="left-[5%] md:left-[10%] bottom-[5%] md:bottom-[10%]"
        />
        <ElegantShape
          delay={0.6}
          width={200}
          height={60}
          rotate={20}
          gradient="from-amber-200/[0.22]"
          className="right-[15%] md:right-[20%] top-[10%] md:top-[15%]"
        />
        <ElegantShape
          delay={0.7}
          width={150}
          height={40}
          rotate={-25}
          gradient="from-rose-200/[0.22]"
          className="left-[20%] md:left-[25%] top-[5%] md:top-[10%]"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge pill */}
          <motion.div
            custom={0}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-default)] mb-8 md:mb-12"
          >
            <span className="h-2 w-2 rounded-full bg-gradient-to-r from-orange-400 to-purple-500" />
            <span className="text-sm text-[var(--text-muted)] tracking-wide">InterviewProof</span>
          </motion.div>

          {/* Heading */}
          <motion.div custom={1} variants={fadeUpVariants} initial="hidden" animate="visible">
            <h1 className="heading-modern text-4xl sm:text-6xl md:text-8xl font-bold mb-6 md:mb-8">
              <span className="text-[var(--text-primary)]">Welcome,</span>
              <br />
              <span className="text-gradient-accent">
                {firstName.slice(0, perchIdx)}
                <span ref={perchRef} className="relative inline-block text-gradient-accent">
                  {firstName[perchIdx]}
                  <motion.span
                    className="absolute pointer-events-none"
                    style={{ top: owlTop ?? -OWL_SIZE, left: '50%' }}
                    initial={{ opacity: 0, y: -20, x: '-50%' }}
                    animate={{
                      opacity: owlTop !== null ? 1 : 0,
                      y: 0,
                      x: '-50%',
                    }}
                    transition={{
                      delay: 1.3,
                      duration: 0.5,
                      ease: [0.34, 1.56, 0.64, 1],
                    }}
                  >
                    <InsightOwlWaving size={OWL_SIZE} />
                  </motion.span>
                </span>
                {firstName.slice(perchIdx + 1)}
              </span>
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.div custom={2} variants={fadeUpVariants} initial="hidden" animate="visible">
            <p className="text-base sm:text-lg md:text-xl text-[var(--text-secondary)] mb-10 leading-relaxed font-light tracking-wide max-w-xl mx-auto px-4">
              Let&apos;s personalize your interview prep in under a minute.
            </p>
          </motion.div>

          {/* CTA Button */}
          <motion.div
            custom={3}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="flex justify-center"
          >
            <LiquidButton variant="gradient" size="xxl" onClick={onContinue}>
              Let&apos;s Go
            </LiquidButton>
          </motion.div>
        </div>
      </div>

      {/* Edge fades */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#FAFBFF] via-transparent to-[#FAFBFF]/80 pointer-events-none" />
    </div>
  );
}
