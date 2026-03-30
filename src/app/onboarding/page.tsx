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
} from '@/types';

import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress';
import { StepWelcome } from '@/components/onboarding/StepWelcome';
import { StepResumeUpload } from '@/components/onboarding/StepResumeUpload';
import { StepCareerStage } from '@/components/onboarding/StepCareerStage';
import { StepRoleDetails } from '@/components/onboarding/StepRoleDetails';
import { StepUrgency } from '@/components/onboarding/StepUrgency';
import { StepAhaMoment } from '@/components/onboarding/StepAhaMoment';
import { BlurFade } from '@/components/ui/blur-fade';

const TOTAL_STEPS = 6;
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
  const isFirstRender = useRef(true);

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

  // Auto-advance after career stage selection
  const handleCareerStageChange = useCallback(
    (stage: CareerStage) => {
      dispatch({ type: 'SET_FIELD', field: 'careerStage', value: stage });
      // Auto-advance after brief delay for visual feedback
      setTimeout(() => dispatch({ type: 'NEXT_STEP' }), 300);
    },
    []
  );

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
        onBack={() => dispatch({ type: 'PREV_STEP' })}
        showBack={state.step > 0 && state.step < TOTAL_STEPS - 1}
      />

      {/* Steps 0 + 5 render full-screen — skip constrained wrapper */}
      {state.step === 0 || state.step === 5 ? (
        <BlurFade key={state.step} duration={0.3} delay={0}>
          {state.step === 0 && (
            <StepWelcome
              displayName={state.displayName}
              onContinue={() => dispatch({ type: 'NEXT_STEP' })}
            />
          )}
          {state.step === 5 && (
            <StepAhaMoment
              ahaScore={ahaScore}
              displayName={state.displayName}
              careerStage={state.careerStage}
              targetRole={state.targetRole}
              targetDomain={state.targetDomain}
              prepUrgency={state.prepUrgency}
              biggestConcern={state.biggestConcern}
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
                  onContinue={() => dispatch({ type: 'NEXT_STEP' })}
                />
              )}
            </BlurFade>
          </div>
        </div>
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
