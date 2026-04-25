'use client';

import { Suspense, useReducer, useEffect, useCallback, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { computeAhaScore } from '@/lib/onboarding-scoring';
import type {
  CareerStage,
  OnboardingState,
  AhaScore,
  PracticePain,
  InterviewMotivation,
  ConfidenceDrop,
  JobMarketData,
  OnboardingBenchmarkData,
  AhaInsightData,
} from '@/types';

import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress';
import { StepWelcome } from '@/components/onboarding/StepWelcome';
import { StepResumeUpload } from '@/components/onboarding/StepResumeUpload';
import { StepCareerStage } from '@/components/onboarding/StepCareerStage';
import {
  StepRoleDetails,
  type StepRoleDetailsHandle,
} from '@/components/onboarding/StepRoleDetails';
import { StepLocation } from '@/components/onboarding/StepLocation';
import { StepUrgency, URGENCY_FEEDBACK } from '@/components/onboarding/StepUrgency';
import { StepPracticePain, PRACTICE_PAIN_FEEDBACK } from '@/components/onboarding/StepPracticePain';
import { StepMotivation, MOTIVATION_FEEDBACK } from '@/components/onboarding/StepMotivation';
import { StepConfidence, CONFIDENCE_FEEDBACK } from '@/components/onboarding/StepConfidence';
import { StepAhaMoment } from '@/components/onboarding/StepAhaMoment';
import { FloatingEdgeBubbles } from '@/components/onboarding/FloatingEdgeBubbles';
import { AnimatePresence } from 'motion/react';
import { BlurFade } from '@/components/ui/blur-fade';
import { OnboardingDotNav } from '@/components/onboarding/OnboardingDotNav';

const TOTAL_STEPS = 10;
const STORAGE_KEY = 'ip_onboarding_draft';

// ── Derived legacy fields ─────────────────────────────────────
// Maps new pain-based fields to old field values for downstream scoring/focus-area compatibility

function deriveBiggestConcern(confidenceDrop: ConfidenceDrop | null): string {
  switch (confidenceDrop) {
    case 'system_design':
      return 'System design';
    case 'behavioral':
      return 'Behavioral stories';
    case 'coding':
      return 'Coding articulation';
    case 'everything':
      return 'Overall confidence';
    default:
      return '';
  }
}

// ── State Machine ──────────────────────────────────────────────

type Action =
  | {
      type: 'SET_FIELD';
      field: keyof OnboardingState;
      value: OnboardingState[keyof OnboardingState];
    }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'RESTORE'; state: OnboardingState };

const initialState: OnboardingState = {
  step: 0,
  displayName: '',
  careerStage: null,
  targetRoles: [],
  targetDomains: [],
  yearsExperience: null,
  prepUrgency: null,
  biggestConcern: '',
  resumeText: '',
  interviewExperience: null,
  targetCompanyTier: null,
  practicePain: null,
  interviewMotivation: null,
  confidenceDrop: null,
  targetCountries: [],
  targetCities: [],
};

function reducer(state: OnboardingState, action: Action): OnboardingState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'NEXT_STEP':
      return { ...state, step: Math.min(state.step + 1, TOTAL_STEPS - 1) };
    case 'PREV_STEP':
      return { ...state, step: Math.max(state.step - 1, 0) };
    case 'RESTORE':
      return action.state;
    default:
      return state;
  }
}

// ── Page Component ─────────────────────────────────────────────

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  // Lazy initializer reads localStorage synchronously — no effect needed
  const [state, dispatch] = useReducer(reducer, initialState, (init) => {
    if (typeof window === 'undefined') return init;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Migrate old single-role format to array
        if (typeof parsed.targetRole === 'string' && !parsed.targetRoles) {
          parsed.targetRoles = parsed.targetRole ? [parsed.targetRole] : [];
          delete parsed.targetRole;
        }
        return { ...init, ...parsed, step: 0 } as OnboardingState;
      }
    } catch {
      // Ignore parse errors
    }
    return init;
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [profileChecked, setProfileChecked] = useState(false);
  const [jobMarketData, setJobMarketData] = useState<JobMarketData | null>(null);
  const [jobDataLoading, setJobDataLoading] = useState(false);
  const [benchmarkData, setBenchmarkData] = useState<OnboardingBenchmarkData | null>(null);
  const [benchmarkLoading, setBenchmarkLoading] = useState(false);
  const [insightData, setInsightData] = useState<AhaInsightData | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const isFirstRender = useRef(true);
  const jobFetchTriggered = useRef(false);
  const benchmarkFetchTriggered = useRef(false);
  const insightFetchTriggered = useRef(false);
  const roleDetailsRef = useRef<StepRoleDetailsHandle>(null);
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const redirectTarget = searchParams.get('redirect') ?? '/new';

  // Persist to localStorage on every change (skip initial render)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage errors (private browsing, quota)
    }
  }, [state]);

  // Clean up auto-advance timer on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    };
  }, []);

  // Set display name from auth user
  useEffect(() => {
    if (user && !state.displayName) {
      const name =
        (user.user_metadata?.full_name as string) ||
        (user.user_metadata?.name as string) ||
        user.email?.split('@')[0] ||
        '';
      dispatch({ type: 'SET_FIELD', field: 'displayName', value: name });
    }
  }, [user, state.displayName]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth/login?redirect=/onboarding');
    }
  }, [authLoading, user, router]);

  // Redirect away if user already completed onboarding
  useEffect(() => {
    if (authLoading || !user) return;

    fetch('/api/profile')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        const DEMO_EMAILS = ['ramezfatassi@gmail.com'];
        if (
          json?.data?.onboardingCompleted &&
          searchParams.get('force') !== 'true' &&
          !DEMO_EMAILS.includes(user.email ?? '')
        ) {
          router.replace(redirectTarget);
        } else {
          setProfileChecked(true);
        }
      })
      .catch(() => {
        setProfileChecked(true);
      });
  }, [authLoading, user, router, redirectTarget]);

  // Fetch job market data in background when user reaches Urgency step
  const fetchJobData = useCallback(() => {
    if (jobFetchTriggered.current || state.targetCountries.length === 0) return;
    jobFetchTriggered.current = true;
    setJobDataLoading(true);
    fetch('/api/jobs/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        countries: state.targetCountries,
        cities: state.targetCities,
        targetRoles: state.targetRoles,
        targetDomains: state.targetDomains,
        careerStage: state.careerStage,
        yearsExperience: state.yearsExperience ?? null,
      }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.data) setJobMarketData(data.data);
      })
      .catch(() => {
        // Non-blocking — job data is additive
      })
      .finally(() => setJobDataLoading(false));
  }, [
    state.targetCountries,
    state.targetCities,
    state.targetRoles,
    state.targetDomains,
    state.careerStage,
    state.yearsExperience,
  ]);

  // Invalidate job data if user navigates back before the Urgency step
  const invalidateJobData = useCallback(() => {
    jobFetchTriggered.current = false;
    setJobMarketData(null);
  }, []);

  // Invalidate benchmark data if user navigates back before the Aha step
  const invalidateBenchmarkData = useCallback(() => {
    benchmarkFetchTriggered.current = false;
    setBenchmarkData(null);
    insightFetchTriggered.current = false;
    setInsightData(null);
  }, []);

  // Fetch benchmark data in background when user advances to Aha step
  const fetchBenchmarkData = useCallback(() => {
    if (benchmarkFetchTriggered.current || !state.careerStage) return;
    benchmarkFetchTriggered.current = true;
    setBenchmarkLoading(true);
    fetch('/api/onboarding/benchmarks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetCompanyTier: state.targetCompanyTier ?? 'any',
        careerStage: state.careerStage,
        targetDomains: state.targetDomains,
        targetRoles: state.targetRoles,
        yearsExperience: state.yearsExperience,
      }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.data) setBenchmarkData(data.data);
      })
      .catch(() => {
        // Non-blocking — benchmark data is additive
      })
      .finally(() => setBenchmarkLoading(false));
  }, [
    state.targetCompanyTier,
    state.careerStage,
    state.targetDomains,
    state.targetRoles,
    state.yearsExperience,
  ]);

  // Fetch aha insights (vector search + LLM) in background alongside benchmarks
  const fetchInsightData = useCallback(() => {
    if (insightFetchTriggered.current || !state.careerStage) return;
    insightFetchTriggered.current = true;
    setInsightLoading(true);
    fetch('/api/onboarding/aha-insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        careerStage: state.careerStage,
        targetDomains: state.targetDomains,
        targetRoles: state.targetRoles,
        yearsExperience: state.yearsExperience,
        confidenceDrop: state.confidenceDrop,
        practicePain: state.practicePain,
        resumeText: state.resumeText,
      }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.data) setInsightData(data.data);
      })
      .catch(() => {
        // Non-blocking — insight data is additive
      })
      .finally(() => setInsightLoading(false));
  }, [
    state.careerStage,
    state.targetDomains,
    state.targetRoles,
    state.yearsExperience,
    state.confidenceDrop,
    state.practicePain,
    state.resumeText,
  ]);

  // Auto-advance helper: set field, show feedback, then advance after delay
  const autoAdvance = useCallback(
    (field: keyof OnboardingState, value: OnboardingState[keyof OnboardingState], delay = 1200) => {
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
      dispatch({ type: 'SET_FIELD', field, value });
      autoAdvanceTimer.current = setTimeout(() => dispatch({ type: 'NEXT_STEP' }), delay);
    },
    []
  );

  /** Compute auto-advance delay: typing animation time + read buffer */
  const typingDelay = (text: string, speed = 30, buffer = 800) => text.length * speed + buffer;

  // Auto-advance after career stage selection
  const handleCareerStageChange = useCallback((stage: CareerStage) => {
    dispatch({ type: 'SET_FIELD', field: 'careerStage', value: stage });
    // Auto-advance after brief delay for visual feedback
    setTimeout(() => dispatch({ type: 'NEXT_STEP' }), 300);
  }, []);

  // Auto-advance handlers for pain-based steps
  const handleUrgencyChange = useCallback(
    (v: OnboardingState['prepUrgency']) => {
      const text = v ? URGENCY_FEEDBACK[v] : '';
      autoAdvance('prepUrgency', v, typingDelay(text));
    },
    [autoAdvance]
  );

  const handlePracticePainChange = useCallback(
    (v: PracticePain) => {
      const text = PRACTICE_PAIN_FEEDBACK[v] ?? '';
      autoAdvance('practicePain', v, typingDelay(text));
    },
    [autoAdvance]
  );

  const handleMotivationChange = useCallback(
    (v: InterviewMotivation) => {
      const text = MOTIVATION_FEEDBACK[v] ?? '';
      autoAdvance('interviewMotivation', v, typingDelay(text));
    },
    [autoAdvance]
  );

  const handleConfidenceChange = useCallback(
    (v: ConfidenceDrop) => {
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
      dispatch({ type: 'SET_FIELD', field: 'confidenceDrop', value: v });
      // Also derive biggestConcern for downstream compatibility
      dispatch({
        type: 'SET_FIELD',
        field: 'biggestConcern',
        value: deriveBiggestConcern(v),
      });
      const text = CONFIDENCE_FEEDBACK[v] ?? '';
      autoAdvanceTimer.current = setTimeout(() => {
        dispatch({ type: 'NEXT_STEP' });
        fetchBenchmarkData();
        fetchInsightData();
      }, typingDelay(text));
    },
    [fetchBenchmarkData, fetchInsightData]
  );

  // Build benchmark domain weights map for focus area selection
  const benchmarkDomainWeights =
    benchmarkData?.benchmarkTargets && benchmarkData.benchmarkTargets.length > 0
      ? Object.fromEntries(benchmarkData.benchmarkTargets.map((t) => [t.domain, t.targetScore]))
      : null;

  // Compute aha score from current state
  const ahaScore: AhaScore = computeAhaScore({
    careerStage: state.careerStage,
    targetDomains: state.targetDomains,
    yearsExperience: state.yearsExperience,
    prepUrgency: state.prepUrgency,
    targetRoles: state.targetRoles,
    biggestConcern: state.biggestConcern,
    resumeText: state.resumeText,
    interviewExperience: state.interviewExperience,
    targetCompanyTier: state.targetCompanyTier,
    practicePain: state.practicePain,
    interviewMotivation: state.interviewMotivation,
    confidenceDrop: state.confidenceDrop,
    jobMarketData,
    benchmarkDomainWeights,
  });

  // Save profile and complete onboarding
  const handleComplete = useCallback(async () => {
    if (!user) return;
    setSaving(true);
    setSaveError(null);

    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: state.displayName,
          careerStage: state.careerStage,
          targetRoles: state.targetRoles,
          targetDomains: state.targetDomains,
          yearsExperience: state.yearsExperience,
          prepUrgency: state.prepUrgency,
          biggestConcern: state.biggestConcern || undefined,
          resumeText: state.resumeText || undefined,
          interviewExperience: state.interviewExperience || undefined,
          targetCompanyTier: state.targetCompanyTier || undefined,
          practicePain: state.practicePain || undefined,
          interviewMotivation: state.interviewMotivation || undefined,
          confidenceDrop: state.confidenceDrop || undefined,
          targetCountries: state.targetCountries,
          targetCities: state.targetCities,
          ahaScore,
          onboardingCompleted: true,
        }),
      });

      if (!res.ok) {
        console.error('Failed to save profile:', await res.text());
        setSaveError('Something went wrong saving your profile. Please try again.');
        setSaving(false);
        return;
      }

      // Clear draft
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore
      }

      // Redirect
      router.push(redirectTarget);
    } catch (err) {
      console.error('Onboarding completion error:', err);
      setSaveError('Something went wrong. Please try again.');
      setSaving(false);
    }
  }, [user, state, ahaScore, router, redirectTarget]);

  // Don't render until auth check complete
  if (authLoading || !user || !profileChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <OnboardingProgress
        currentStep={state.step}
        totalSteps={TOTAL_STEPS}
        onBack={() => {
          // Cancel any pending auto-advance
          if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
          // If on step 3 (role details), let sub-step handle back first
          if (state.step === 3 && roleDetailsRef.current?.handleBack()) return;
          if (state.step <= 5) invalidateJobData();
          if (state.step <= 9) invalidateBenchmarkData();
          dispatch({ type: 'PREV_STEP' });
        }}
        showBack={state.step > 0 && state.step < 9}
      />

      <AnimatePresence>
        {state.step >= 5 && state.step <= 8 && <FloatingEdgeBubbles key="edge-bubbles" />}
      </AnimatePresence>

      {/* Steps 0 + 9 render full-screen — skip constrained wrapper */}
      {state.step === 0 || state.step === 9 ? (
        <BlurFade key={state.step} duration={0.3} delay={0}>
          {state.step === 0 && (
            <StepWelcome
              displayName={state.displayName}
              onContinue={() => dispatch({ type: 'NEXT_STEP' })}
            />
          )}
          {state.step === 9 && (
            <StepAhaMoment
              ahaScore={ahaScore}
              displayName={state.displayName}
              careerStage={state.careerStage}
              targetRoles={state.targetRoles}
              targetDomains={state.targetDomains}
              prepUrgency={state.prepUrgency}
              biggestConcern={state.biggestConcern}
              jobMarketData={jobMarketData}
              jobDataLoading={jobDataLoading}
              benchmarkData={benchmarkData}
              benchmarkLoading={benchmarkLoading}
              insightData={insightData}
              insightLoading={insightLoading}
              confidenceDrop={state.confidenceDrop}
              practicePain={state.practicePain}
              interviewMotivation={state.interviewMotivation}
              resumeText={state.resumeText}
              yearsExperience={state.yearsExperience}
              targetCountries={state.targetCountries}
              targetCities={state.targetCities}
              onComplete={handleComplete}
              loading={saving}
              error={saveError}
            />
          )}
        </BlurFade>
      ) : (
        /* Content area — centered with padding for progress bar */
        <div className="flex-1 flex items-center justify-center px-6 pt-20 pb-12">
          <div
            className={`w-full ${state.step === 2 ? 'max-w-5xl' : state.step === 3 || state.step === 4 ? 'max-w-4xl' : 'max-w-lg'}`}
          >
            <BlurFade key={state.step} duration={0.3} delay={0}>
              {state.step === 1 && (
                <StepResumeUpload
                  resumeText={state.resumeText}
                  onResumeTextChange={(v) =>
                    dispatch({ type: 'SET_FIELD', field: 'resumeText', value: v })
                  }
                  onContinue={() => dispatch({ type: 'NEXT_STEP' })}
                  onSkip={() => dispatch({ type: 'NEXT_STEP' })}
                />
              )}

              {state.step === 2 && (
                <StepCareerStage value={state.careerStage} onChange={handleCareerStageChange} />
              )}

              {state.step === 3 && (
                <StepRoleDetails
                  ref={roleDetailsRef}
                  careerStage={state.careerStage}
                  targetRoles={state.targetRoles}
                  targetDomains={state.targetDomains}
                  yearsExperience={state.yearsExperience}
                  onTargetRolesChange={(v) =>
                    dispatch({ type: 'SET_FIELD', field: 'targetRoles', value: v })
                  }
                  onTargetDomainsChange={(v) =>
                    dispatch({ type: 'SET_FIELD', field: 'targetDomains', value: v })
                  }
                  onYearsExperienceChange={(v) =>
                    dispatch({ type: 'SET_FIELD', field: 'yearsExperience', value: v })
                  }
                  onContinue={() => dispatch({ type: 'NEXT_STEP' })}
                />
              )}

              {state.step === 4 && (
                <StepLocation
                  targetCountries={state.targetCountries}
                  targetCities={state.targetCities}
                  onTargetCountriesChange={(v) =>
                    dispatch({ type: 'SET_FIELD', field: 'targetCountries', value: v })
                  }
                  onTargetCitiesChange={(v) =>
                    dispatch({ type: 'SET_FIELD', field: 'targetCities', value: v })
                  }
                  onContinue={() => {
                    dispatch({ type: 'NEXT_STEP' });
                    fetchJobData();
                  }}
                />
              )}

              {state.step === 5 && (
                <StepUrgency
                  prepUrgency={state.prepUrgency}
                  onPrepUrgencyChange={handleUrgencyChange}
                />
              )}

              {state.step === 6 && (
                <StepPracticePain value={state.practicePain} onChange={handlePracticePainChange} />
              )}

              {state.step === 7 && (
                <StepMotivation
                  value={state.interviewMotivation}
                  onChange={handleMotivationChange}
                />
              )}

              {state.step === 8 && (
                <StepConfidence value={state.confidenceDrop} onChange={handleConfidenceChange} />
              )}
            </BlurFade>
          </div>
        </div>
      )}

      {state.step >= 1 && state.step <= 8 && (
        <OnboardingDotNav currentStep={state.step} totalSteps={8} />
      )}
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-500" />
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
