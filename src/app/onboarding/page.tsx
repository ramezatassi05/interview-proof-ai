'use client';

import { Suspense, useReducer, useEffect, useCallback, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { computeAhaScore } from '@/lib/onboarding-scoring';
import type {
  CareerStage,
  OnboardingState,
  AhaScore,
  InterviewExperience,
  TargetCompanyTier,
  JobMarketData,
  OnboardingBenchmarkData,
} from '@/types';

import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress';
import { StepWelcome } from '@/components/onboarding/StepWelcome';
import { StepResumeUpload } from '@/components/onboarding/StepResumeUpload';
import { StepCareerStage } from '@/components/onboarding/StepCareerStage';
import { StepRoleDetails } from '@/components/onboarding/StepRoleDetails';
import { StepLocation } from '@/components/onboarding/StepLocation';
import { StepUrgency } from '@/components/onboarding/StepUrgency';
import { StepAhaMoment } from '@/components/onboarding/StepAhaMoment';
import { BlurFade } from '@/components/ui/blur-fade';
import { OnboardingDotNav } from '@/components/onboarding/OnboardingDotNav';

const TOTAL_STEPS = 7;
const STORAGE_KEY = 'ip_onboarding_draft';

// ── State Machine ──────────────────────────────────────────────

type Action =
  | { type: 'SET_FIELD'; field: keyof OnboardingState; value: OnboardingState[keyof OnboardingState] }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'RESTORE'; state: OnboardingState };

const initialState: OnboardingState = {
  step: 0,
  displayName: '',
  careerStage: null,
  targetRole: '',
  targetDomain: 'swe',
  yearsExperience: null,
  prepUrgency: null,
  biggestConcern: '',
  resumeText: '',
  interviewExperience: null,
  targetCompanyTier: null,
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
      if (saved) return { ...init, ...JSON.parse(saved), step: 0 } as OnboardingState;
    } catch {
      // Ignore parse errors
    }
    return init;
  });
  const [saving, setSaving] = useState(false);
  const [jobMarketData, setJobMarketData] = useState<JobMarketData | null>(null);
  const [jobDataLoading, setJobDataLoading] = useState(false);
  const [benchmarkData, setBenchmarkData] = useState<OnboardingBenchmarkData | null>(null);
  const [benchmarkLoading, setBenchmarkLoading] = useState(false);
  const isFirstRender = useRef(true);
  const jobFetchTriggered = useRef(false);
  const benchmarkFetchTriggered = useRef(false);
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
        targetRole: state.targetRole,
        targetDomain: state.targetDomain,
        careerStage: state.careerStage,
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
    state.targetRole,
    state.targetDomain,
    state.careerStage,
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
  }, []);

  // Fetch benchmark data in background when user advances past Urgency step
  const fetchBenchmarkData = useCallback(() => {
    if (benchmarkFetchTriggered.current || !state.targetCompanyTier || !state.careerStage) return;
    benchmarkFetchTriggered.current = true;
    setBenchmarkLoading(true);
    fetch('/api/onboarding/benchmarks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetCompanyTier: state.targetCompanyTier,
        careerStage: state.careerStage,
        targetDomain: state.targetDomain,
        targetRole: state.targetRole,
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
    state.targetDomain,
    state.targetRole,
    state.yearsExperience,
  ]);

  // Auto-advance after career stage selection
  const handleCareerStageChange = useCallback(
    (stage: CareerStage) => {
      dispatch({ type: 'SET_FIELD', field: 'careerStage', value: stage });
      // Auto-advance after brief delay for visual feedback
      setTimeout(() => dispatch({ type: 'NEXT_STEP' }), 300);
    },
    []
  );

  // Build benchmark domain weights map for focus area selection
  const benchmarkDomainWeights =
    benchmarkData?.benchmarkTargets && benchmarkData.benchmarkTargets.length > 0
      ? Object.fromEntries(
          benchmarkData.benchmarkTargets.map((t) => [t.domain, t.targetScore])
        )
      : null;

  // Compute aha score from current state
  const ahaScore: AhaScore = computeAhaScore({
    careerStage: state.careerStage,
    targetDomain: state.targetDomain,
    yearsExperience: state.yearsExperience,
    prepUrgency: state.prepUrgency,
    targetRole: state.targetRole,
    biggestConcern: state.biggestConcern,
    resumeText: state.resumeText,
    interviewExperience: state.interviewExperience,
    targetCompanyTier: state.targetCompanyTier,
    jobMarketData,
    benchmarkDomainWeights,
  });

  // Save profile and complete onboarding
  const handleComplete = useCallback(async () => {
    if (!user) return;
    setSaving(true);

    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: state.displayName,
          careerStage: state.careerStage,
          targetRole: state.targetRole || undefined,
          targetDomain: state.targetDomain || undefined,
          yearsExperience: state.yearsExperience,
          prepUrgency: state.prepUrgency,
          biggestConcern: state.biggestConcern || undefined,
          resumeText: state.resumeText || undefined,
          interviewExperience: state.interviewExperience || undefined,
          targetCompanyTier: state.targetCompanyTier || undefined,
          targetCountries: state.targetCountries,
          targetCities: state.targetCities,
          ahaScore,
          onboardingCompleted: true,
        }),
      });

      if (!res.ok) {
        console.error('Failed to save profile:', await res.text());
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
      setSaving(false);
    }
  }, [user, state, ahaScore, router, redirectTarget]);

  // Don't render until auth check complete
  if (authLoading || !user) {
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
          if (state.step <= 5) invalidateJobData();
          if (state.step <= 6) invalidateBenchmarkData();
          dispatch({ type: 'PREV_STEP' });
        }}
        showBack={state.step > 0 && state.step < 6}
      />

      {/* Steps 0 + 6 render full-screen — skip constrained wrapper */}
      {state.step === 0 || state.step === 6 ? (
        <BlurFade key={state.step} duration={0.3} delay={0}>
          {state.step === 0 && (
            <StepWelcome
              displayName={state.displayName}
              onContinue={() => dispatch({ type: 'NEXT_STEP' })}
            />
          )}
          {state.step === 6 && (
            <StepAhaMoment
              ahaScore={ahaScore}
              displayName={state.displayName}
              careerStage={state.careerStage}
              targetRole={state.targetRole}
              targetDomain={state.targetDomain}
              prepUrgency={state.prepUrgency}
              biggestConcern={state.biggestConcern}
              jobMarketData={jobMarketData}
              jobDataLoading={jobDataLoading}
              benchmarkData={benchmarkData}
              benchmarkLoading={benchmarkLoading}
              targetCountries={state.targetCountries}
              targetCities={state.targetCities}
              onComplete={handleComplete}
              loading={saving}
            />
          )}
        </BlurFade>
      ) : (
        /* Content area — centered with padding for progress bar */
        <div className="flex-1 flex items-center justify-center px-6 pt-20 pb-12">
          <div className={`w-full ${state.step === 2 ? 'max-w-5xl' : 'max-w-lg'}`}>
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
                <StepCareerStage
                  value={state.careerStage}
                  onChange={handleCareerStageChange}
                />
              )}

              {state.step === 3 && (
                <StepRoleDetails
                  careerStage={state.careerStage}
                  targetRole={state.targetRole}
                  targetDomain={state.targetDomain}
                  yearsExperience={state.yearsExperience}
                  onTargetRoleChange={(v) =>
                    dispatch({ type: 'SET_FIELD', field: 'targetRole', value: v })
                  }
                  onTargetDomainChange={(v) =>
                    dispatch({ type: 'SET_FIELD', field: 'targetDomain', value: v })
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
                  careerStage={state.careerStage}
                  prepUrgency={state.prepUrgency}
                  biggestConcern={state.biggestConcern}
                  interviewExperience={state.interviewExperience}
                  targetCompanyTier={state.targetCompanyTier}
                  onPrepUrgencyChange={(v) =>
                    dispatch({ type: 'SET_FIELD', field: 'prepUrgency', value: v })
                  }
                  onBiggestConcernChange={(v) =>
                    dispatch({ type: 'SET_FIELD', field: 'biggestConcern', value: v })
                  }
                  onInterviewExperienceChange={(v: InterviewExperience) =>
                    dispatch({ type: 'SET_FIELD', field: 'interviewExperience', value: v })
                  }
                  onTargetCompanyTierChange={(v: TargetCompanyTier) =>
                    dispatch({ type: 'SET_FIELD', field: 'targetCompanyTier', value: v })
                  }
                  onContinue={() => {
                    dispatch({ type: 'NEXT_STEP' });
                    fetchBenchmarkData();
                  }}
                />
              )}
            </BlurFade>
          </div>
        </div>
      )}

      {state.step >= 1 && state.step <= 5 && (
        <OnboardingDotNav currentStep={state.step} totalSteps={5} />
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
