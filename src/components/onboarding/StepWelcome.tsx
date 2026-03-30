'use client';

import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { InsightOwlWaving } from '@/components/svg/InsightOwlMascot';

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
  gradient = 'from-orange-200/[0.08]',
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
            'backdrop-blur-[2px] border-2 border-black/[0.06]',
            'shadow-[0_8px_32px_0_rgba(251,146,60,0.08)]',
            'after:absolute after:inset-0 after:rounded-full',
            'after:bg-[radial-gradient(circle_at_50%_50%,rgba(251,146,60,0.06),transparent_70%)]'
          )}
        />
      </motion.div>
    </motion.div>
  );
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

export function StepWelcome({ displayName, onContinue }: StepWelcomeProps) {
  const firstName = displayName.split(' ')[0] || 'there';

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
          gradient="from-orange-300/[0.15]"
          className="left-[-10%] md:left-[-5%] top-[15%] md:top-[20%]"
        />
        <ElegantShape
          delay={0.5}
          width={500}
          height={120}
          rotate={-15}
          gradient="from-pink-300/[0.12]"
          className="right-[-5%] md:right-[0%] top-[70%] md:top-[75%]"
        />
        <ElegantShape
          delay={0.4}
          width={300}
          height={80}
          rotate={-8}
          gradient="from-purple-300/[0.12]"
          className="left-[5%] md:left-[10%] bottom-[5%] md:bottom-[10%]"
        />
        <ElegantShape
          delay={0.6}
          width={200}
          height={60}
          rotate={20}
          gradient="from-amber-200/[0.10]"
          className="right-[15%] md:right-[20%] top-[10%] md:top-[15%]"
        />
        <ElegantShape
          delay={0.7}
          width={150}
          height={40}
          rotate={-25}
          gradient="from-rose-200/[0.10]"
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
              <span className="text-gradient-accent">{firstName}</span>
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
            <button
              onClick={onContinue}
              className="group relative rounded-full bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 p-[2px] cursor-pointer"
            >
              <span className="flex items-center justify-center rounded-full bg-black px-10 py-3.5 text-base font-semibold text-white transition-colors group-hover:bg-black/90">
                Let&apos;s Go
              </span>
            </button>
          </motion.div>

          {/* Owl mascot saying hi */}
          <motion.div
            custom={4}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center mt-8"
          >
            <div className="relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-sm text-[var(--text-primary)] text-sm font-semibold px-3 py-1 rounded-full border border-[var(--border-default)] shadow-sm">
                Hi!
              </span>
              <InsightOwlWaving size={120} />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Edge fades */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#FAFBFF] via-transparent to-[#FAFBFF]/80 pointer-events-none" />
    </div>
  );
}
