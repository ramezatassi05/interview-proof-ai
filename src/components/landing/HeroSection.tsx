'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';
import { Badge, riskBandToVariant } from '@/components/ui/Badge';
import { RadialScoreIndicator } from '@/components/ui/RadialScoreIndicator';
import { InsightOwlMascot, InsightOwlWaving } from '@/components/svg/InsightOwlMascot';
import { WaitlistForm } from '@/components/waitlist/WaitlistForm';
import { BlurFade } from '@/components/ui/blur-fade';
import { TextAnimate } from '@/components/ui/text-animate';
import { RotatingText } from '@/components/ui/rotating-text';
import { BorderBeam } from '@/components/ui/border-beam';
import { DotPattern } from '@/components/ui/dot-pattern';
import { BackgroundBeams } from '@/components/ui/background-beams';
import { ShineBorder } from '@/components/ui/shine-border';
import { motion, useScroll, useTransform } from 'motion/react';

const WAITLIST_MODE = process.env.NEXT_PUBLIC_WAITLIST_MODE === 'true';

interface LastReport {
  id: string;
  readinessScore: number;
  riskBand: string;
  roundType: string;
  paidUnlocked: boolean;
  createdAt: string;
  companyName: string | null;
}

interface HeroSectionProps {
  referralCode?: string;
}

export function HeroSection({ referralCode }: HeroSectionProps) {
  const { user } = useAuth();
  const [lastReport, setLastReport] = useState<LastReport | null>(null);
  const [waitlistCount, setWaitlistCount] = useState<number | null>(null);

  const ctaHref = WAITLIST_MODE ? '#' : user ? '/new' : '/auth/login?redirect=/new';

  useEffect(() => {
    if (!user) return;
    fetch('/api/account')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.data?.reports?.length) return;
        const r = data.data.reports[0];
        if (r.readinessScore != null) {
          setLastReport({
            id: r.id,
            readinessScore: r.readinessScore,
            riskBand: r.riskBand ?? 'Medium',
            roundType: r.roundType,
            paidUnlocked: r.paidUnlocked,
            createdAt: r.createdAt,
            companyName: r.companyName ?? null,
          });
        }
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!WAITLIST_MODE) return;
    fetch('/api/waitlist/count')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.data?.count != null) setWaitlistCount(data.data.count);
      })
      .catch(() => {});
  }, []);

  const { scrollY } = useScroll();
  const scrollIndicatorOpacity = useTransform(scrollY, [0, 150], [1, 0]);

  return (
    <section id="hero" className="relative overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--accent-primary)]/[0.03] to-transparent pointer-events-none" />
      <DotPattern className="opacity-30 [mask-image:linear-gradient(to_bottom,white,transparent)]" />

      <Container size="2xl" className="relative py-20 lg:py-28">
        <div className="flex flex-col lg:flex-row lg:items-center lg:gap-20">
          {/* Left — text */}
          <div className="flex-1 lg:max-w-[55%]">
            <BlurFade inView delay={0}>
              <h1 className="heading-modern text-4xl font-bold text-[var(--text-primary)] sm:text-5xl lg:text-6xl">
                <TextAnimate animation="blurInUp" by="word">
                  Know Exactly What Will
                </TextAnimate>{' '}
                <RotatingText
                  words={['Sink', 'Reject', 'Expose', 'Blindside', 'Cost']}
                  interval={2500}
                  className="text-gradient-accent"
                />{' '}
                <span className="text-gradient-accent">You</span>
              </h1>
            </BlurFade>

            <BlurFade inView delay={0.1}>
              <p className="mt-4 text-xl font-medium text-[var(--text-secondary)] sm:text-2xl">
                Turn Anxiety Into Clear Action.
              </p>
            </BlurFade>

            <BlurFade inView delay={0.15}>
              <p className="mt-6 max-w-lg text-base leading-relaxed text-[var(--text-secondary)]">
                Upload your resume and job description. Get an evidence-backed diagnostic that shows
                exactly what recruiters will reject you for — before the interview.
              </p>
            </BlurFade>

            <BlurFade inView delay={0.17}>
              <a
                href="#vertical-ai"
                className="mt-2 inline-block text-base text-[var(--accent-primary)] hover:underline cursor-pointer transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('vertical-ai')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Trained on the Best Interview Intelligence Available →
              </a>
            </BlurFade>

            <BlurFade inView delay={0.2}>
            <div className="relative mt-10">
              <div className="pointer-events-none absolute -inset-32 [mask-image:radial-gradient(ellipse_at_center,white_30%,transparent_70%)]">
                <BackgroundBeams />
              </div>
              {WAITLIST_MODE ? (
                <div className="relative">
                  <div className="flex items-end gap-4">
                    <div className="flex-1">
                      <WaitlistForm referralCode={referralCode} compact />
                    </div>
                    <div className="relative hidden sm:flex flex-shrink-0 items-center justify-center rounded-full bg-[var(--bg-elevated)]/60 p-2">
                      <ShineBorder shineColor={['#FB923C', '#F472B6', '#E879F9']} borderWidth={2} duration={10} />
                      <InsightOwlWaving size={72} />
                    </div>
                  </div>
                  {waitlistCount != null && waitlistCount >= 500 && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-success)] opacity-75" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--color-success)]" />
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">
                        {waitlistCount.toLocaleString()} people on the waitlist
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative flex flex-wrap items-center gap-4">
                  <Link href={ctaHref}>
                    <Button variant="gradient" size="lg" rounded>
                      Run My Diagnostic
                    </Button>
                  </Link>
                  <InsightOwlMascot size={44} />
                </div>
              )}
            </div>

            </BlurFade>

            {/* Trust badge */}
            <div className="mt-6 flex items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-[var(--bg-elevated)] px-3 py-1.5 text-xs text-[var(--text-muted)]">
                <svg className="h-3.5 w-3.5 flex-shrink-0 text-[var(--color-success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                {WAITLIST_MODE ? 'Top 100 get a lifetime discount' : 'No credit card required'}
              </span>
            </div>
          </div>

          {/* Right — preview card */}
          <div className="mt-14 flex justify-center lg:mt-0 lg:flex-1">
            {lastReport ? (
              <div className="relative w-full max-w-sm rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] overflow-hidden shadow-xl shadow-black/5">
                <BorderBeam size={250} duration={12} delay={0} />

                {/* Header */}
                <div className="flex items-center justify-between border-b border-[var(--border-default)] bg-[var(--bg-secondary)] px-5 py-3">
                  <span className="text-xs font-medium text-[var(--text-muted)]">
                    Your Last Diagnostic
                  </span>
                  <Badge variant={riskBandToVariant(lastReport.riskBand as 'High' | 'Medium' | 'Low')}>
                    {lastReport.riskBand} Risk
                  </Badge>
                </div>

                <div className="p-6">
                  {/* Company & round info */}
                  {(lastReport.companyName || lastReport.roundType) && (
                    <div className="mb-4 text-center">
                      {lastReport.companyName && (
                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                          {lastReport.companyName}
                        </p>
                      )}
                      <p className="mt-0.5 text-xs text-[var(--text-muted)] capitalize">
                        {lastReport.roundType.replace(/_/g, ' ')} round
                      </p>
                    </div>
                  )}

                  {/* Score */}
                  <div className="flex justify-center py-2">
                    <RadialScoreIndicator
                      score={lastReport.readinessScore}
                      size="lg"
                      variant="auto"
                      display="clean"
                      label="Readiness"
                    />
                  </div>

                  {/* Date */}
                  <p className="mt-3 text-center text-[11px] text-[var(--text-muted)]">
                    Analyzed{' '}
                    {new Date(lastReport.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>

                  {/* Actions */}
                  <div className="mt-5 flex flex-col gap-2">
                    <Link
                      href={`/r/${lastReport.id}${lastReport.paidUnlocked ? '/full' : ''}`}
                      className="block"
                    >
                      <Button variant="accent" size="sm" className="w-full">
                        View Full Report
                      </Button>
                    </Link>
                    <Link href="/new" className="block">
                      <Button variant="secondary" size="sm" className="w-full">
                        Run New Analysis
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              /* Clean product preview card */
              <div className="relative w-full max-w-sm rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] overflow-hidden shadow-xl shadow-black/5">
                <BorderBeam size={250} duration={12} delay={0} />
                {/* Header bar */}
                <div className="flex items-center gap-2 border-b border-[var(--border-default)] px-5 py-3 bg-[var(--bg-secondary)]">
                  <div className="flex gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-[#EF4444]/60" />
                    <span className="h-3 w-3 rounded-full bg-[#F59E0B]/60" />
                    <span className="h-3 w-3 rounded-full bg-[#22C55E]/60" />
                  </div>
                  <span className="ml-2 text-xs text-[var(--text-muted)]">
                    interviewproof.ai/diagnostic
                  </span>
                </div>
                {/* Content */}
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[var(--text-primary)]">Readiness Score</span>
                    <span className="rounded-full bg-[var(--color-warning)]/10 px-2.5 py-0.5 text-xs font-semibold text-[var(--color-warning)]">
                      Medium Risk
                    </span>
                  </div>

                  <div className="flex justify-center py-3">
                    <RadialScoreIndicator
                      score={73}
                      size="lg"
                      variant="warning"
                      display="clean"
                      label="Readiness"
                    />
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3">
                      <span className="h-2 w-2 rounded-full bg-[var(--color-danger)]" />
                      <span className="text-sm text-[var(--text-secondary)]">Generic leadership example</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="h-2 w-2 rounded-full bg-[var(--color-danger)]" />
                      <span className="text-sm text-[var(--text-secondary)]">No CI/CD pipeline experience</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="h-2 w-2 rounded-full bg-[var(--color-warning)]" />
                      <span className="text-sm text-[var(--text-secondary)]">Missing system design depth</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="h-10 rounded-lg bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 flex items-center justify-center text-sm font-semibold text-white">
                      View Full Diagnostic
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Container>

      {/* Scroll to explore indicator */}
      <motion.div
        className="pointer-events-none absolute inset-x-0 bottom-6 flex flex-col items-center gap-2"
        style={{ opacity: scrollIndicatorOpacity }}
      >
        <span className="text-xs font-medium text-[var(--text-muted)]">Scroll to explore</span>
        <svg
          className="h-5 w-5 text-[var(--text-muted)] animate-scroll-cta"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </motion.div>
    </section>
  );
}
