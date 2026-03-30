'use client';

import type {
  AhaScore,
  CareerStage,
  TargetDomain,
  OnboardingPrepUrgency,
  FocusAreaItem,
  JobMarketData,
} from '@/types';
import { getCountryByCode } from '@/lib/location-data';
import { SIGNAL_SOURCE_LABELS } from '@/lib/focus-area-pool';
import { BlurFade } from '@/components/ui/blur-fade';
import RadialOrbitalTimeline from '@/components/ui/radial-orbital-timeline';
import type { OrbitalNode } from '@/components/ui/radial-orbital-timeline';
import { NumberTicker } from '@/components/ui/number-ticker';
import { TextAnimate } from '@/components/ui/text-animate';
import { ShineBorder } from '@/components/ui/shine-border';

interface StepAhaMomentProps {
  ahaScore: AhaScore;
  displayName: string;
  careerStage: CareerStage | null;
  targetRole: string;
  targetDomain: TargetDomain | null;
  prepUrgency: OnboardingPrepUrgency | null;
  biggestConcern: string;
  jobMarketData?: JobMarketData | null;
  jobDataLoading?: boolean;
  targetCountries?: string[];
  targetCities?: string[];
  onComplete: () => void;
  loading?: boolean;
}

const DOMAIN_LABELS: Record<TargetDomain, string> = {
  swe: 'Software Engineering',
  ds: 'Data Science',
  design: 'Design',
  pm: 'Product Management',
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
  <svg key="target" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>,
  <svg key="book" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>,
  <svg key="bulb" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" /><path d="M9 18h6" /><path d="M10 22h4" /></svg>,
  <svg key="zap" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" /></svg>,
];

const ORBITAL_NODES: OrbitalNode[] = [
  {
    id: 'risk-analysis',
    title: 'Risk Analysis',
    description: 'We flag hidden rejection risks before they cost you an offer — things most candidates never see coming.',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>,
  },
  {
    id: 'practice-questions',
    title: 'Practice Qs',
    description: 'AI-generated practice questions tailored to your specific role, company tier, and interview round.',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /></svg>,
  },
  {
    id: 'star-stories',
    title: 'STAR Stories',
    description: 'Turn coursework, projects, and side work into structured stories that prove your impact — even without years of experience.',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
  },
  {
    id: 'study-plan',
    title: 'Study Plan',
    description: 'A personalized prep roadmap calibrated to your timeline — whether you have months or days until your interview.',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
  },
  {
    id: 'score-insights',
    title: 'Score Insights',
    description: 'See exactly how interviewers will evaluate you — with a detailed breakdown of strengths and gaps.',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>,
  },
  {
    id: 'coaching',
    title: 'Coaching',
    description: 'Get targeted feedback on your weakest areas with actionable advice you can apply immediately.',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" /><path d="M9 18h6" /><path d="M10 22h4" /></svg>,
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

/** Type guard: is this a rich FocusAreaItem or a legacy plain string? */
function isFocusAreaItem(area: FocusAreaItem | string): area is FocusAreaItem {
  return typeof area === 'object' && 'id' in area;
}

export function StepAhaMoment({
  ahaScore,
  displayName,
  careerStage,
  targetRole,
  targetDomain,
  prepUrgency,
  biggestConcern,
  jobMarketData,
  jobDataLoading,
  targetCountries,
  targetCities,
  onComplete,
  loading,
}: StepAhaMomentProps) {
  const scoreColorClass = getScoreColorClass(ahaScore.readinessEstimate);
  const firstName = getFirstName(displayName);

  // Build context pills
  const pills: string[] = [];
  if (careerStage) pills.push(STAGE_LABELS[careerStage]);
  if (targetRole) pills.push(targetRole);
  else if (targetDomain) pills.push(DOMAIN_LABELS[targetDomain]);
  if (prepUrgency) pills.push(URGENCY_LABELS[prepUrgency]);

  // Add location pills
  if (targetCities && targetCities.length > 0) {
    // Show first 2 cities
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

  // Job market context for display
  const jobContext = jobMarketData?.contexts?.[0] ?? null;
  const hasJobData = jobContext && !jobMarketData?.fetchError;

  return (
    <div className="h-screen w-full bg-white flex flex-col overflow-hidden">
      {/* ── Header (centered, full width) ── */}
      <div className="pt-6 pb-2 px-6 text-center flex-shrink-0">
        <BlurFade delay={0}>
          <h2 className="heading-modern text-xl sm:text-2xl font-bold text-[var(--text-primary)] mb-2">
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

      {/* ── Two-column grid — vertically centered in remaining space ── */}
      <div className="flex-1 flex items-center justify-center px-6 pb-4 min-h-0">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8 items-center">

          {/* ─── LEFT COLUMN: Orbital Timeline + Score + Breakdown ─── */}
          <div className="flex flex-col items-center">
            {/* Radial Orbital Timeline */}
            <BlurFade delay={0.25}>
              <div className="relative h-[220px] w-[220px] lg:h-[260px] lg:w-[260px] mb-2">
                <RadialOrbitalTimeline
                  nodes={ORBITAL_NODES}
                  radius={90}
                  className="h-full w-full"
                  centerContent={
                    <div className="relative flex h-[60px] w-[60px] lg:h-[68px] lg:w-[68px] items-center justify-center rounded-full bg-white">
                      <div className="absolute inset-0 rounded-full overflow-hidden">
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
                            className={`text-2xl lg:text-3xl font-bold tracking-tighter ${scoreColorClass}`}
                          />
                          <span className="text-sm font-semibold text-zinc-400">%</span>
                        </div>
                        <span className="text-[8px] uppercase tracking-[0.2em] text-zinc-400 mt-0.5">
                          Readiness
                        </span>
                      </div>
                    </div>
                  }
                />
              </div>
            </BlurFade>

            {/* Score Breakdown */}
            {ahaScore.breakdown.length > 0 && (
              <BlurFade delay={0.5}>
                <div className="w-full max-w-xs">
                  <h3 className="text-[11px] uppercase tracking-[0.15em] text-zinc-400 mb-2 text-center">
                    Score Breakdown
                  </h3>
                  <div className="space-y-0.5">
                    {ahaScore.breakdown.map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between px-3 py-1 rounded-lg bg-zinc-50 border border-zinc-100"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-zinc-700">{item.label}</span>
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
                          {item.impact > 0 ? '+' : ''}{item.impact}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </BlurFade>
            )}

            {/* Timeline message */}
            <BlurFade delay={0.6}>
              <p className="text-xs text-zinc-400 leading-relaxed text-center italic mt-2 max-w-xs">
                {ahaScore.timelineMessage}
              </p>
            </BlurFade>

            {/* Job Market Context */}
            {(jobDataLoading || hasJobData) && (
              <BlurFade delay={0.7}>
                <div className="mt-2 w-full max-w-xs">
                  {jobDataLoading && !hasJobData ? (
                    <div className="flex items-center gap-2 justify-center">
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-500" />
                      <span className="text-[11px] text-zinc-400">Analyzing job market...</span>
                    </div>
                  ) : hasJobData ? (
                    <div className="rounded-xl bg-indigo-50/50 border border-indigo-100 p-2 space-y-1.5">
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
                        <p className="text-[11px] text-zinc-600 leading-relaxed">
                          Based on{' '}
                          <span className="font-semibold text-indigo-600">
                            {jobContext!.totalListings}{' '}
                            {jobContext!.isInternshipOnly ? 'internship' : ''} position
                            {jobContext!.totalListings !== 1 ? 's' : ''}
                          </span>{' '}
                          for{' '}
                          <span className="font-medium">{jobContext!.roleSummary}</span> in{' '}
                          <span className="font-medium">{jobContext!.locationSummary}</span>
                        </p>
                      </div>
                      {jobContext!.topEmployers.length > 0 && (
                        <p className="text-[10px] text-zinc-400 leading-relaxed pl-5">
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
              </BlurFade>
            )}
          </div>

          {/* ─── RIGHT COLUMN: Focus + Concern + Next Steps + CTA ─── */}
          <div className="flex flex-col gap-2.5 max-h-[calc(100vh-120px)] overflow-y-auto pr-1">
            {/* Focus Areas */}
            <BlurFade delay={0.4}>
              <div>
                <h3 className="text-[11px] uppercase tracking-[0.15em] text-zinc-400 mb-2 text-center lg:text-left">
                  Your Focus Areas
                </h3>
                <div className="space-y-2">
                  {ahaScore.focusAreas.map((area, i) => {
                    if (isFocusAreaItem(area)) {
                      return (
                        <div
                          key={area.id}
                          className="p-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50"
                        >
                          {/* Title row */}
                          <div className="flex items-start gap-3">
                            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-white text-zinc-500 border border-zinc-200 mt-0.5">
                              {focusIcons[i] ?? focusIcons[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-zinc-800 leading-snug">
                                  {area.title}
                                </span>
                                {area.priority === 'high' && (
                                  <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-600 border border-indigo-200">
                                    Priority
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-zinc-500 leading-relaxed mt-0.5">
                                {area.description}
                              </p>
                            </div>
                          </div>

                          {/* Reason */}
                          <div className="mt-2 ml-10 pl-2.5 border-l-2 border-indigo-200">
                            <p className="text-[11px] text-indigo-600/80 leading-relaxed italic">
                              {area.reason}
                            </p>
                          </div>

                          {/* Signal source tags */}
                          {area.signalSources.length > 0 && (
                            <div className="mt-2 ml-10 flex flex-wrap gap-1">
                              {area.signalSources.map((signal) => (
                                <span
                                  key={signal}
                                  className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-zinc-100 text-zinc-400 border border-zinc-150"
                                >
                                  {SIGNAL_SOURCE_LABELS[signal] ?? signal}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    }

                    // Legacy fallback: plain string focus areas
                    return (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-3 rounded-xl border border-zinc-200 bg-zinc-50/50"
                      >
                        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-white text-zinc-500 border border-zinc-200 mt-0.5">
                          {focusIcons[i]}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-medium text-zinc-800 leading-snug">
                            {area}
                          </span>
                          <span className="text-xs text-zinc-400 leading-relaxed">
                            InterviewProof will build a targeted plan for this.
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </BlurFade>

            {/* Biggest Concern Acknowledgment */}
            {biggestConcern && (
              <BlurFade delay={0.55}>
                <div className="p-2.5 rounded-xl border border-indigo-100 bg-indigo-50/50">
                  <div className="flex items-start gap-2.5">
                    <svg className="h-4 w-4 text-indigo-500 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                    <div>
                      <p className="text-xs font-medium text-zinc-700 mb-0.5">We heard you</p>
                      <p className="text-xs text-zinc-500 leading-relaxed">
                        &ldquo;{biggestConcern}&rdquo; — your first diagnostic will specifically flag risks related to this.
                      </p>
                    </div>
                  </div>
                </div>
              </BlurFade>
            )}

            {/* What Happens Next */}
            <BlurFade delay={0.65}>
              <div>
                <h3 className="text-[11px] uppercase tracking-[0.15em] text-zinc-400 mb-2 text-center lg:text-left">
                  What Happens Next
                </h3>
                <div className="space-y-1.5">
                  {[
                    { step: '1', title: 'Upload a job description', desc: 'Pair it with your resume for a targeted analysis' },
                    { step: '2', title: 'Get your AI diagnostic', desc: 'We score fit, flag risks, and generate practice questions' },
                    { step: '3', title: 'Follow your prep plan', desc: 'Prioritized tasks calibrated to your timeline' },
                  ].map((item) => (
                    <div key={item.step} className="flex items-start gap-2">
                      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-bold text-zinc-500 border border-zinc-200">
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
            </BlurFade>

            {/* CTA */}
            <BlurFade delay={0.75}>
              <div className="mt-1">
                <button
                  onClick={onComplete}
                  disabled={loading}
                  className="w-full py-3 rounded-lg text-sm font-semibold bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    'Start Your First Analysis'
                  )}
                </button>
                <p className="text-xs text-zinc-400 text-center mt-2">
                  Takes about 2 minutes
                </p>
              </div>
            </BlurFade>
          </div>
        </div>
      </div>
    </div>
  );
}
