'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { motion } from 'motion/react';
import type {
  AhaScore,
  CareerStage,
  TargetDomain,
  OnboardingPrepUrgency,
  FocusAreaItem,
  JobMarketData,
  OnboardingBenchmarkData,
  AhaInsightData,
  ConfidenceDrop,
  PracticePain,
  InterviewMotivation,
} from '@/types';
import { getCountryByCode } from '@/lib/location-data';
import { SIGNAL_SOURCE_LABELS } from '@/lib/focus-area-pool';
import { extractResumeSignals } from '@/lib/resume-signals';
import { computeEmotionalAnchor } from '@/lib/onboarding-emotional-anchor';
import { computeStrengthAcknowledgments } from '@/lib/onboarding-strength-acknowledgment';
import { computeOnboardingTrajectory } from '@/lib/onboarding-trajectory';
import { BlurFade } from '@/components/ui/blur-fade';
import RadialOrbitalTimeline from '@/components/ui/radial-orbital-timeline';
import type { OrbitalNode } from '@/components/ui/radial-orbital-timeline';
import { NumberTicker } from '@/components/ui/number-ticker';
import { TextAnimate } from '@/components/ui/text-animate';
import { ShineBorder } from '@/components/ui/shine-border';
import { BorderBeam } from '@/components/ui/border-beam';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { DotPattern } from '@/components/ui/dot-pattern';
import { fireConfetti } from '@/components/ui/confetti';
import { TrajectoryGrowthChart } from '@/components/onboarding/charts/TrajectoryGrowthChart';
import { CategoryImprovementBars } from '@/components/onboarding/charts/CategoryImprovementBars';
import { TierProgressionTrack } from '@/components/onboarding/charts/TierProgressionTrack';

interface StepAhaMomentProps {
  ahaScore: AhaScore;
  displayName: string;
  careerStage: CareerStage | null;
  targetRoles: string[];
  targetDomains: TargetDomain[];
  prepUrgency: OnboardingPrepUrgency | null;
  biggestConcern: string;
  jobMarketData?: JobMarketData | null;
  jobDataLoading?: boolean;
  benchmarkData?: OnboardingBenchmarkData | null;
  benchmarkLoading?: boolean;
  insightData?: AhaInsightData | null;
  insightLoading?: boolean;
  confidenceDrop?: ConfidenceDrop | null;
  practicePain?: PracticePain | null;
  interviewMotivation?: InterviewMotivation | null;
  resumeText?: string;
  yearsExperience?: number | null;
  targetCountries?: string[];
  targetCities?: string[];
  onComplete: () => void;
  loading?: boolean;
  error?: string | null;
}

const INSIGHT_CATEGORY_LABELS: Record<string, string> = {
  gap: 'Gap detected',
  contradiction: 'Contradiction',
  hidden_strength: 'Hidden strength',
  risk: 'Risk flag',
};

const INSIGHT_CATEGORY_STYLES: Record<string, { bg: string; text: string; ring: string }> = {
  gap: { bg: 'bg-amber-50', text: 'text-amber-600', ring: 'ring-amber-100' },
  contradiction: { bg: 'bg-rose-50', text: 'text-rose-600', ring: 'ring-rose-100' },
  hidden_strength: { bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'ring-emerald-100' },
  risk: { bg: 'bg-red-50', text: 'text-red-600', ring: 'ring-red-100' },
};

const DOMAIN_LABELS: Record<TargetDomain, string> = {
  swe: 'Software Engineering',
  ds: 'Data Science',
  design: 'Design',
  pm: 'Product Management',
  security: 'Cybersecurity',
  cloud: 'Cloud & DevOps',
  marketing: 'Marketing',
  business: 'Business & Consulting',
  general: 'General',
};

const STAGE_LABELS: Record<CareerStage, string> = {
  student: 'Student',
  new_grad: 'New Grad',
  career_changer: 'Career Changer',
  experienced_professional: 'Experienced',
};

const URGENCY_LABELS: Record<OnboardingPrepUrgency, string> = {
  exploring: 'Exploring',
  active_search: 'Active Search',
  interview_scheduled: 'Scheduled',
  interview_this_week: 'This Week',
};

const focusIcons = [
  <svg
    key="target"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>,
  <svg
    key="book"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
  </svg>,
  <svg
    key="bulb"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
    <path d="M9 18h6" />
    <path d="M10 22h4" />
  </svg>,
  <svg
    key="zap"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>,
];

const ORBITAL_NODES: OrbitalNode[] = [
  {
    id: 'risk-analysis',
    title: 'Risk Analysis',
    description:
      'We flag hidden rejection risks before they cost you an offer — things most candidates never see coming.',
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
  },
  {
    id: 'practice-questions',
    title: 'Practice Qs',
    description:
      'AI-generated practice questions tailored to your specific role, company tier, and interview round.',
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      </svg>
    ),
  },
  {
    id: 'star-stories',
    title: 'STAR Stories',
    description:
      'Turn coursework, projects, and side work into structured stories that prove your impact — even without years of experience.',
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  {
    id: 'study-plan',
    title: 'Study Plan',
    description:
      'A personalized prep roadmap calibrated to your timeline — whether you have months or days until your interview.',
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    id: 'score-insights',
    title: 'Score Insights',
    description:
      'See exactly how interviewers will evaluate you — with a detailed breakdown of strengths and gaps.',
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    id: 'coaching',
    title: 'Coaching',
    description:
      'Get targeted feedback on your weakest areas with actionable advice you can apply immediately.',
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
        <path d="M9 18h6" />
        <path d="M10 22h4" />
      </svg>
    ),
  },
];

function getScoreColorClass(score: number): string {
  if (score >= 60) return 'text-emerald-600';
  if (score >= 40) return 'text-amber-500';
  return 'text-red-500';
}

function getFirstName(name: string): string {
  return name.split(' ')[0] || name;
}

function isFocusAreaItem(area: FocusAreaItem | string): area is FocusAreaItem {
  return typeof area === 'object' && 'id' in area;
}

const SLIDE_LABELS = ['Your Readiness', 'Your Focus Areas', 'Built for You'];

const SCROLL_DOT_COUNT = 10;

function SlideScrollIndicator({
  scrollRef,
}: {
  scrollRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollable = el.scrollHeight - el.clientHeight;
    if (scrollable <= 0) {
      setActiveIndex(0);
      return;
    }
    const progress = el.scrollTop / scrollable;
    setActiveIndex(Math.round(progress * (SCROLL_DOT_COUNT - 1)));
  }, [scrollRef]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    const raf = requestAnimationFrame(handleScroll);
    return () => {
      el.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(raf);
    };
  }, [scrollRef, handleScroll]);

  return (
    <div className="absolute right-3 top-1/2 z-30 -translate-y-1/2 hidden sm:flex">
      <div className="flex flex-col items-center gap-2 rounded-full bg-white/70 backdrop-blur-sm border border-gray-200/60 px-1.5 py-3 shadow-sm">
        {Array.from({ length: SCROLL_DOT_COUNT }, (_, i) => (
          <span
            key={i}
            className="block rounded-full transition-all duration-300"
            style={{
              width: i === activeIndex ? 8 : 6,
              height: i === activeIndex ? 8 : 6,
              backgroundColor: i === activeIndex ? '#6366f1' : '#d1d5db',
              opacity: i === activeIndex ? 1 : 0.4,
              boxShadow: i === activeIndex ? '0 0 6px rgba(99, 102, 241, 0.5)' : 'none',
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function StepAhaMoment({
  ahaScore,
  displayName,
  careerStage,
  targetRoles,
  targetDomains,
  prepUrgency,
  biggestConcern,
  jobMarketData,
  jobDataLoading,
  benchmarkData,
  benchmarkLoading,
  insightData,
  insightLoading,
  confidenceDrop = null,
  practicePain = null,
  interviewMotivation = null,
  resumeText,
  yearsExperience = null,
  targetCountries,
  targetCities,
  onComplete,
  loading,
  error,
}: StepAhaMomentProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, watchDrag: true, duration: 30 });
  const [activeIndex, setActiveIndex] = useState(0);
  const slide1Ref = useRef<HTMLDivElement>(null);
  const slide2Ref = useRef<HTMLDivElement>(null);
  const slide3Ref = useRef<HTMLDivElement>(null);
  const scoreColorClass = getScoreColorClass(ahaScore.readinessEstimate);
  const firstName = getFirstName(displayName);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setActiveIndex(emblaApi.selectedScrollSnap());
    onSelect();
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  // Build context pills
  const pills: string[] = [];
  if (careerStage) pills.push(STAGE_LABELS[careerStage]);
  if (targetRoles.length > 0) pills.push(...targetRoles);
  else if (targetDomains.length > 0) pills.push(...targetDomains.map((d) => DOMAIN_LABELS[d]));
  if (prepUrgency) pills.push(URGENCY_LABELS[prepUrgency]);

  if (targetCities && targetCities.length > 0) {
    const cityLabels = targetCities.slice(0, 2).map((c) => c.split(',')[0].trim());
    pills.push(...cityLabels);
    if (targetCities.length > 2) pills.push(`+${targetCities.length - 2} more`);
  } else if (targetCountries && targetCountries.length > 0) {
    const countryLabels = targetCountries
      .slice(0, 2)
      .map((code) => getCountryByCode(code)?.name ?? code);
    pills.push(...countryLabels);
    if (targetCountries.length > 2) pills.push(`+${targetCountries.length - 2} more`);
  }

  const jobContext = jobMarketData?.contexts?.[0] ?? null;
  const hasJobData = jobContext && !jobMarketData?.fetchError;

  const hasBenchmarks =
    benchmarkData && !benchmarkData.fetchError && benchmarkData.benchmarkTargets.length > 0;
  const hasKnowledgeStats =
    benchmarkData &&
    !benchmarkData.fetchError &&
    benchmarkData.knowledgeStats.totalRubricChunks > 0;

  // Derived data for new aha-moment sections
  const resumeSignals = useMemo(
    () => (resumeText ? extractResumeSignals(resumeText) : null),
    [resumeText]
  );

  const emotionalAnchor = useMemo(
    () => computeEmotionalAnchor(confidenceDrop, practicePain, interviewMotivation),
    [confidenceDrop, practicePain, interviewMotivation]
  );

  const strengthAcks = useMemo(
    () =>
      computeStrengthAcknowledgments({
        careerStage,
        yearsExperience,
        resumeSignals,
        targetDomains,
        scoreBreakdown: ahaScore.breakdown,
      }),
    [careerStage, yearsExperience, resumeSignals, targetDomains, ahaScore.breakdown]
  );

  const trajectory = useMemo(
    () =>
      computeOnboardingTrajectory({
        currentScore: ahaScore.readinessEstimate,
        careerStage,
        yearsExperience,
        practicePain,
        confidenceDrop,
        prepUrgency,
        resumeSignals,
        topRubricDomain: benchmarkData?.knowledgeStats.topWeightedDomain ?? null,
        biggestConcern,
      }),
    [
      ahaScore.readinessEstimate,
      careerStage,
      yearsExperience,
      practicePain,
      confidenceDrop,
      prepUrgency,
      resumeSignals,
      benchmarkData?.knowledgeStats.topWeightedDomain,
      biggestConcern,
    ]
  );

  const projectedScore7 =
    trajectory.intermediatePoints[trajectory.intermediatePoints.length - 1]?.projectedScore ??
    trajectory.current;

  const insightCategoryStyle = insightData
    ? (INSIGHT_CATEGORY_STYLES[insightData.insightCategory] ?? INSIGHT_CATEGORY_STYLES.gap)
    : INSIGHT_CATEGORY_STYLES.gap;
  const hasInsight = Boolean(insightData?.insight && !insightData.fetchError);
  const hasCohort = Boolean(
    insightData?.cohort && (insightData.cohort.cohortSize > 0 || insightData.cohort.isBlended)
  );

  const handleComplete = () => {
    try {
      fireConfetti();
    } catch {
      // Non-critical — continue with onboarding completion
    }
    onComplete();
  };

  const isFirstSlide = activeIndex === 0;
  const isLastSlide = activeIndex === 2;

  return (
    <div
      className="relative flex h-screen w-full flex-col bg-white"
      style={{ '--dot-grid-color': 'rgba(0,0,0,0.04)' } as React.CSSProperties}
    >
      <DotPattern className="opacity-40" />

      {/* ── Sticky Header ── */}
      <div className="relative z-20 bg-white/80 backdrop-blur-md border-b border-zinc-100/60 pt-14 pb-4 px-6 text-center flex-shrink-0">
        <BlurFade delay={0}>
          <h2 className="heading-modern text-2xl sm:text-3xl font-bold text-zinc-900 mb-3">
            <TextAnimate animation="blurInUp" by="word" delay={0.1}>
              {`Here's your plan, ${firstName}`}
            </TextAnimate>
          </h2>
        </BlurFade>

        <BlurFade delay={0.15}>
          <div className="flex flex-wrap justify-center gap-2">
            {pills.map((pill) => (
              <span
                key={pill}
                className="px-3 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-600 border border-zinc-200"
              >
                {pill}
              </span>
            ))}
          </div>
        </BlurFade>
      </div>

      {/* ── Carousel ── */}
      <div className="relative z-10 flex-1 min-h-0 flex flex-col">
        <div ref={emblaRef} className="flex-1 min-h-0 overflow-hidden">
          <div className="flex h-full">
            {/* ── Slide 1: Your Readiness ── */}
            <div ref={slide1Ref} className="relative min-w-0 flex-[0_0_100%] overflow-y-auto">
              <SlideScrollIndicator scrollRef={slide1Ref} />
              <div className="mx-auto max-w-2xl px-6 py-10">
                <BlurFade
                  direction="left"
                  offset={40}
                  duration={0.5}
                  blur="8px"
                  isVisible={activeIndex === 0}
                  className="space-y-8"
                >
                  {/* Emotional Anchor — "we heard you" mirror moment */}
                  {emotionalAnchor && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={activeIndex === 0 ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
                      transition={{ duration: 0.45, delay: 0.05, ease: 'easeOut' }}
                      className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-violet-50/40 p-4"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-600">
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          </svg>
                        </span>
                        <div className="space-y-1">
                          <p className="text-sm font-semibold leading-snug text-zinc-800">
                            {emotionalAnchor.message}
                          </p>
                          <p className="text-xs leading-relaxed text-zinc-500">
                            {emotionalAnchor.followUp}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Strength Acknowledgments — validate before diagnosing */}
                  {strengthAcks.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[11px] uppercase tracking-[0.15em] text-zinc-400">
                        What&apos;s already working
                      </h4>
                      <div className="space-y-2">
                        {strengthAcks.map((strength, i) => (
                          <motion.div
                            key={strength.source}
                            initial={{ opacity: 0, x: -10 }}
                            animate={
                              activeIndex === 0 ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }
                            }
                            transition={{
                              duration: 0.4,
                              ease: 'easeOut',
                              delay: 0.15 + i * 0.1,
                            }}
                            className="flex items-start gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50/40 p-3"
                          >
                            <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </span>
                            <p className="text-xs leading-relaxed text-zinc-600">
                              {strength.message}
                            </p>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Section header */}
                  <div className="text-center">
                    <span className="mb-2 inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-600">
                      Your Readiness
                    </span>
                    <h3 className="text-xl font-bold text-zinc-900 sm:text-2xl">
                      We analyzed your profile
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                      Here&apos;s how your background, timeline, and goals translate into interview
                      readiness.
                    </p>
                  </div>

                  {/* Orbital Timeline */}
                  <div className="relative mx-auto flex flex-col items-center rounded-3xl border border-zinc-200/50 bg-white/60 p-5 shadow-xl shadow-zinc-200/30 backdrop-blur-xl">
                    <BorderBeam size={300} duration={12} />
                    <div className="relative h-[240px] w-[240px] lg:h-[280px] lg:w-[280px]">
                      <RadialOrbitalTimeline
                        nodes={ORBITAL_NODES}
                        radius={95}
                        className="h-full w-full"
                        centerContent={
                          <div className="relative flex h-[68px] w-[68px] lg:h-[76px] lg:w-[76px] items-center justify-center rounded-full bg-white">
                            <div className="absolute inset-0 overflow-hidden rounded-full">
                              <ShineBorder
                                shineColor={['#6366f1', '#8b5cf6', '#a78bfa']}
                                duration={8}
                                borderWidth={1}
                              />
                            </div>
                            <div className="z-10 flex flex-col items-center justify-center">
                              <div className="flex items-baseline gap-0.5">
                                <NumberTicker
                                  value={ahaScore.readinessEstimate}
                                  delay={0.6}
                                  className={`text-3xl lg:text-4xl font-bold tracking-tighter ${scoreColorClass}`}
                                />
                                <span className="text-sm font-semibold text-zinc-400">%</span>
                              </div>
                              <span className="mt-0.5 text-[9px] uppercase tracking-[0.2em] text-zinc-400">
                                Readiness
                              </span>
                            </div>
                          </div>
                        }
                      />
                    </div>
                    <p className="mt-3 text-center text-xs text-zinc-400">
                      Your personalized interview readiness score
                    </p>
                  </div>

                  {/* Score Breakdown */}
                  {ahaScore.breakdown.length > 0 && (
                    <div>
                      <h4 className="text-[11px] uppercase tracking-[0.15em] text-zinc-400 mb-2">
                        Score Breakdown
                      </h4>
                      <div className="space-y-1">
                        {ahaScore.breakdown.map((item) => (
                          <div
                            key={item.label}
                            className="flex items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-1.5"
                          >
                            <div className="flex flex-col">
                              <span className="text-xs font-medium text-zinc-700">
                                {item.label}
                              </span>
                              <span className="text-[10px] text-zinc-400">{item.detail}</span>
                            </div>
                            <span
                              className={`text-xs font-semibold tabular-nums ${
                                item.sentiment === 'positive'
                                  ? 'text-emerald-600'
                                  : item.sentiment === 'negative'
                                    ? 'text-red-500'
                                    : 'text-zinc-400'
                              }`}
                            >
                              {item.impact > 0 ? '+' : ''}
                              {item.impact}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Timeline message */}
                  <p className="text-xs italic leading-relaxed text-zinc-400">
                    {ahaScore.timelineMessage}
                  </p>

                  {/* Aha Insight — diagnostic "they get me" moment */}
                  {(insightLoading || hasInsight || hasCohort) && (
                    <div className="space-y-2">
                      <h4 className="text-[11px] uppercase tracking-[0.15em] text-zinc-400">
                        What stood out about your profile
                      </h4>
                      {insightLoading && !hasInsight ? (
                        <div className="flex items-center gap-2 rounded-xl border border-zinc-150 bg-zinc-50/60 p-3">
                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-500" />
                          <span className="text-[11px] text-zinc-400">
                            Cross-referencing benchmarks...
                          </span>
                        </div>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0, y: 12 }}
                          animate={activeIndex === 0 ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
                          transition={{ duration: 0.4, delay: 0.3, ease: 'easeOut' }}
                          className={`relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-4 ring-1 ${insightCategoryStyle.ring}`}
                        >
                          {hasInsight && insightData && (
                            <>
                              <span
                                className={`mb-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${insightCategoryStyle.bg} ${insightCategoryStyle.text}`}
                              >
                                {INSIGHT_CATEGORY_LABELS[insightData.insightCategory] ?? 'Insight'}
                              </span>
                              <p className="text-sm leading-relaxed text-zinc-700">
                                {insightData.insight}
                              </p>
                              {insightData.sampleQuestion && (
                                <div className="mt-3 rounded-lg border border-zinc-100 bg-zinc-50/60 p-2.5">
                                  <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                                    Sample question you may face
                                  </p>
                                  <p className="text-[11px] leading-relaxed italic text-zinc-600">
                                    &ldquo;{insightData.sampleQuestion}&rdquo;
                                  </p>
                                </div>
                              )}
                            </>
                          )}
                          {hasCohort && insightData?.cohort && (
                            <div
                              className={`flex items-baseline gap-2 ${
                                hasInsight ? 'mt-3 border-t border-zinc-100 pt-2.5' : ''
                              }`}
                            >
                              <span className="text-2xl font-bold tabular-nums text-indigo-600">
                                <NumberTicker
                                  value={insightData.cohort.percentile}
                                  delay={0.6}
                                  className="text-2xl font-bold tabular-nums text-indigo-600"
                                />
                                <span className="text-sm text-zinc-400">th</span>
                              </span>
                              <span className="text-[11px] leading-tight text-zinc-500">
                                percentile among {insightData.cohort.cohortLabel}
                                {insightData.cohort.cohortSize > 0 &&
                                  !insightData.cohort.isBlended && (
                                    <span className="ml-1 text-zinc-400">
                                      (n={insightData.cohort.cohortSize})
                                    </span>
                                  )}
                              </span>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </div>
                  )}

                  {/* Tier Progression — current → projected after 7 sessions */}
                  <TierProgressionTrack
                    currentScore={trajectory.current}
                    projectedScore={projectedScore7}
                    isVisible={activeIndex === 0}
                  />

                  {/* Job Market Context */}
                  {(jobDataLoading || hasJobData) && (
                    <div>
                      {jobDataLoading && !hasJobData ? (
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-500" />
                          <span className="text-[11px] text-zinc-400">Analyzing job market...</span>
                        </div>
                      ) : hasJobData ? (
                        <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3 space-y-1.5">
                          <div className="flex items-start gap-2">
                            <svg
                              className="h-3.5 w-3.5 text-indigo-500 mt-0.5 flex-shrink-0"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <circle cx="11" cy="11" r="8" />
                              <path d="m21 21-4.3-4.3" />
                            </svg>
                            <p className="text-[11px] leading-relaxed text-zinc-600">
                              Based on{' '}
                              <span className="font-semibold text-indigo-600">
                                {jobContext!.totalListings}{' '}
                                {jobContext!.isInternshipOnly ? 'internship' : ''} position
                                {jobContext!.totalListings !== 1 ? 's' : ''}
                              </span>{' '}
                              for <span className="font-medium">{jobContext!.roleSummary}</span> in{' '}
                              <span className="font-medium">{jobContext!.locationSummary}</span>
                            </p>
                          </div>
                          {jobContext!.topEmployers.length > 0 && (
                            <p className="pl-5 text-[10px] leading-relaxed text-zinc-400">
                              Hiring now:{' '}
                              <span className="text-zinc-500">
                                {jobContext!.topEmployers.slice(0, 3).join(', ')}
                                {jobContext!.topEmployers.length > 3 ? ' and more' : ''}
                              </span>
                            </p>
                          )}
                        </div>
                      ) : null}
                    </div>
                  )}
                </BlurFade>
              </div>
            </div>

            {/* ── Slide 2: Your Focus Areas ── */}
            <div ref={slide2Ref} className="relative min-w-0 flex-[0_0_100%] overflow-y-auto">
              <SlideScrollIndicator scrollRef={slide2Ref} />
              <div className="mx-auto max-w-2xl px-6 py-10">
                <BlurFade
                  direction="left"
                  offset={40}
                  duration={0.5}
                  blur="8px"
                  isVisible={activeIndex >= 1}
                  className="space-y-8"
                >
                  {/* Section header */}
                  <div className="text-center">
                    <span className="mb-2 inline-block rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-600">
                      Your Focus Areas
                    </span>
                    <h3 className="text-xl font-bold text-zinc-900 sm:text-2xl">
                      Personalized just for you
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                      Based on your career stage, target role, and timeline, we&apos;ve identified
                      the areas that will have the biggest impact on your interview performance.
                    </p>
                  </div>

                  {/* Biggest Concern Acknowledgment */}
                  {biggestConcern && (
                    <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3">
                      <div className="flex items-start gap-2.5">
                        <svg
                          className="h-4 w-4 mt-0.5 flex-shrink-0 text-indigo-500"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                          <path d="m9 12 2 2 4-4" />
                        </svg>
                        <div>
                          <p className="text-xs font-medium text-zinc-700 mb-0.5">We heard you</p>
                          <p className="text-xs leading-relaxed text-zinc-500">
                            &ldquo;{biggestConcern}&rdquo; — your first diagnostic will specifically
                            flag risks related to this.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Focus Area Cards */}
                  <div className="space-y-2.5">
                    {ahaScore.focusAreas.map((area, i) => {
                      if (isFocusAreaItem(area)) {
                        return (
                          <motion.div
                            key={area.id}
                            initial={{ opacity: 0, y: 16 }}
                            animate={
                              activeIndex >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }
                            }
                            transition={{
                              duration: 0.4,
                              ease: 'easeOut',
                              delay: 0.1 + i * 0.08,
                            }}
                            className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-3"
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500">
                                {focusIcons[i] ?? focusIcons[0]}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold leading-snug text-zinc-800">
                                    {area.title}
                                  </span>
                                  {area.priority === 'high' && (
                                    <span className="flex-shrink-0 rounded border border-indigo-200 bg-indigo-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-indigo-600">
                                      Priority
                                    </span>
                                  )}
                                </div>
                                <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">
                                  {area.description}
                                </p>
                              </div>
                            </div>

                            <div className="ml-10 mt-2 border-l-2 border-indigo-200 pl-2.5">
                              <p className="text-[11px] italic leading-relaxed text-indigo-600/80">
                                {area.reason}
                              </p>
                            </div>

                            {area.signalSources.length > 0 && (
                              <div className="ml-10 mt-2 flex flex-wrap gap-1">
                                {area.signalSources.map((signal) => (
                                  <span
                                    key={signal}
                                    className="rounded border border-zinc-150 bg-zinc-100 px-1.5 py-0.5 text-[9px] font-medium text-zinc-400"
                                  >
                                    {SIGNAL_SOURCE_LABELS[signal] ?? signal}
                                  </span>
                                ))}
                              </div>
                            )}
                          </motion.div>
                        );
                      }

                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 16 }}
                          animate={activeIndex >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
                          transition={{
                            duration: 0.4,
                            ease: 'easeOut',
                            delay: 0.1 + i * 0.08,
                          }}
                          className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50/50 p-3"
                        >
                          <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500">
                            {focusIcons[i]}
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-medium leading-snug text-zinc-800">
                              {area}
                            </span>
                            <span className="text-xs leading-relaxed text-zinc-400">
                              InterviewProof will build a targeted plan for this.
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </BlurFade>
              </div>
            </div>

            {/* ── Slide 3: Built for You ── */}
            <div ref={slide3Ref} className="relative min-w-0 flex-[0_0_100%] overflow-y-auto">
              <SlideScrollIndicator scrollRef={slide3Ref} />
              <div className="mx-auto max-w-2xl px-6 py-10">
                <BlurFade
                  direction="left"
                  offset={40}
                  duration={0.5}
                  blur="8px"
                  isVisible={activeIndex >= 2}
                  className="space-y-8"
                >
                  {/* Section header */}
                  <div className="text-center">
                    <span className="mb-2 inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-600">
                      Built for You
                    </span>
                    <h3 className="text-xl font-bold text-zinc-900 sm:text-2xl">
                      Where you can go from here
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                      Projected readiness with focused prep — calibrated against real interview
                      standards, not generic advice.
                    </p>
                  </div>

                  {/* Trajectory Growth Chart — main "wow" visual */}
                  <TrajectoryGrowthChart
                    trajectory={trajectory}
                    isVisible={activeIndex === 2}
                    percentImprovement={trajectory.percentImprovement7}
                  />

                  {/* Category Improvement Bars — where you'll improve most */}
                  {trajectory.categoryBreakdown7.length > 0 && (
                    <CategoryImprovementBars
                      categories={trajectory.categoryBreakdown7}
                      isVisible={activeIndex === 2}
                    />
                  )}

                  {/* Benchmark Targets */}
                  {(benchmarkLoading || hasBenchmarks) && (
                    <div>
                      {benchmarkLoading && !hasBenchmarks ? (
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-500" />
                          <span className="text-[11px] text-zinc-400">Loading benchmarks...</span>
                        </div>
                      ) : hasBenchmarks ? (
                        <div>
                          <h4 className="mb-2 text-[11px] uppercase tracking-[0.15em] text-zinc-400">
                            What {benchmarkData!.tierLabel} {benchmarkData!.seniorityLabel} roles
                            expect
                          </h4>
                          <div className="space-y-1.5">
                            {benchmarkData!.benchmarkTargets.map((target, i) => (
                              <div
                                key={target.domain}
                                className="flex items-center gap-2 rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2"
                              >
                                <span className="min-w-0 flex-1 truncate text-xs font-medium text-zinc-700">
                                  {target.domain}
                                </span>
                                <div className="flex flex-shrink-0 items-center gap-2">
                                  <div className="h-2 w-20 overflow-hidden rounded-full bg-zinc-200">
                                    <div
                                      className={`h-full rounded-full ${
                                        i === 0
                                          ? 'bg-indigo-500'
                                          : i === 1
                                            ? 'bg-indigo-400'
                                            : 'bg-indigo-300'
                                      }`}
                                      style={{ width: `${target.targetScore}%` }}
                                    />
                                  </div>
                                  <span className="w-7 text-right text-[11px] font-semibold tabular-nums text-zinc-500">
                                    {target.targetScore}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}

                  {/* Knowledge Stats */}
                  {hasKnowledgeStats && (
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50/30 p-3">
                      <p className="mb-1.5 text-[11px] font-medium text-zinc-600">
                        Your diagnostic is calibrated against
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                        <span className="text-[11px] text-zinc-500">
                          <span className="font-semibold text-zinc-700">
                            {benchmarkData!.knowledgeStats.totalRubricChunks}+
                          </span>{' '}
                          evaluation criteria
                        </span>
                        <span className="text-[11px] text-zinc-500">
                          <span className="font-semibold text-zinc-700">
                            {benchmarkData!.knowledgeStats.totalQuestionArchetypes}+
                          </span>{' '}
                          practice questions
                        </span>
                        <span className="text-[11px] text-zinc-500">
                          <span className="font-semibold text-zinc-700">
                            {benchmarkData!.knowledgeStats.totalCalibratedCompanies}
                          </span>{' '}
                          calibrated companies
                        </span>
                      </div>
                      {benchmarkData!.knowledgeStats.topWeightedDomain && (
                        <p className="mt-1.5 text-[10px] text-indigo-500">
                          {benchmarkData!.knowledgeStats.topWeightedDomain} is the #1 weighted
                          domain for{' '}
                          {targetRoles[0] ||
                            (targetDomains.length > 0
                              ? targetDomains.map((d) => DOMAIN_LABELS[d]).join(' & ')
                              : 'your role')}{' '}
                          at {benchmarkData!.tierLabel}
                        </p>
                      )}
                    </div>
                  )}

                  {/* What Happens Next */}
                  <div>
                    <h4 className="mb-3 text-[11px] uppercase tracking-[0.15em] text-zinc-400">
                      What Happens Next
                    </h4>
                    <div className="space-y-3">
                      {[
                        {
                          step: '1',
                          title: 'Upload a job description',
                          desc: 'Pair it with your resume for a targeted analysis',
                        },
                        {
                          step: '2',
                          title: 'Get your AI diagnostic',
                          desc: 'We score fit, flag risks, and generate practice questions',
                        },
                        {
                          step: '3',
                          title: 'Follow your prep plan',
                          desc: 'Prioritized tasks calibrated to your timeline',
                        },
                      ].map((item) => (
                        <div key={item.step} className="flex items-start gap-3">
                          <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-indigo-200 bg-indigo-50 text-[11px] font-bold text-indigo-600">
                            {item.step}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-zinc-700">{item.title}</p>
                            <p className="text-xs text-zinc-400">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CTA */}
                  <ShimmerButton
                    onClick={handleComplete}
                    disabled={loading}
                    shimmerColor="#a78bfa"
                    background="rgba(79, 70, 229, 1)"
                    className="w-full py-3.5 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Saving...
                      </span>
                    ) : (
                      'Start Your First Analysis'
                    )}
                  </ShimmerButton>
                  {error && <p className="text-center text-xs text-red-500">{error}</p>}
                  <p className="text-center text-xs text-zinc-400">Takes about 2 minutes</p>
                </BlurFade>
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom Navigation ── */}
        <div className="relative z-20 flex-shrink-0 border-t border-zinc-100/60 bg-white/80 backdrop-blur-md px-6 py-4">
          <div className="mx-auto flex max-w-2xl items-center justify-between">
            {/* Prev button */}
            <div>
              {!isFirstSlide && (
                <button
                  onClick={() => emblaApi?.scrollPrev()}
                  className="cursor-pointer flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                  Back
                </button>
              )}
            </div>

            {/* Dot indicators */}
            <div className="flex items-center gap-2">
              {SLIDE_LABELS.map((label, index) => (
                <motion.div
                  key={label}
                  animate={{
                    opacity: index === activeIndex ? 1 : 0.4,
                    width: index === activeIndex ? 24 : 8,
                  }}
                  initial={false}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                >
                  <button
                    onClick={() => emblaApi?.scrollTo(index)}
                    aria-label={`Go to ${label}`}
                    className={`h-2 w-full cursor-pointer rounded-full transition-colors ${
                      index === activeIndex ? 'bg-indigo-500' : 'bg-zinc-300 hover:bg-zinc-400'
                    }`}
                  />
                </motion.div>
              ))}
            </div>

            {/* Next button */}
            <div>
              {!isLastSlide ? (
                <button
                  onClick={() => emblaApi?.scrollNext()}
                  className="cursor-pointer flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-50"
                >
                  Next
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              ) : (
                <div className="w-[72px]" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
