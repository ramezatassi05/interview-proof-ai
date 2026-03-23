'use client';

import { useReducer, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingProgress } from './OnboardingProgress';
import { OnboardingNavigation } from './OnboardingNavigation';
import { StepWelcomeName } from './StepWelcomeName';
import { StepResumeUpload } from './StepResumeUpload';
import { StepCareerStatus } from './StepCareerStatus';
import { StepExperience } from './StepExperience';
import { StepIndustryFunction } from './StepIndustryFunction';
import { StepCurrentSituation } from './StepCurrentSituation';
import { StepTargetRole } from './StepTargetRole';
import { StepTargetCompanies } from './StepTargetCompanies';
import { StepTimeline } from './StepTimeline';
import { StepConcerns } from './StepConcerns';
import { StepCompensation } from './StepCompensation';
import { StepProfileSummary } from './StepProfileSummary';
import { inferProfileFromResume, TOTAL_ONBOARDING_STEPS } from '@/lib/profile';
import type {
  UserProfile,
  CareerStatus,
  OnboardingInterviewTimeline,
  ProfileIndustry,
  ProfileFunction,
  InterviewConcern,
  TargetCompany,
  ExtractedResume,
  ProfileSummary,
} from '@/types';

// ============================================
// State Management
// ============================================

interface OnboardingState {
  displayName: string;
  hasResume: boolean;
  resumeParsedJson: ExtractedResume | null;
  careerStatus: CareerStatus | null;
  yearsOfExperience: number | null;
  industries: ProfileIndustry[];
  functions: ProfileFunction[];
  currentRole: string;
  currentCompany: string;
  autoFilledFromResume: boolean;
  targetRole: string;
  targetCompanies: TargetCompany[];
  interviewTimeline: OnboardingInterviewTimeline | null;
  concerns: InterviewConcern[];
  currentCompensationRange: string | null;
  targetCompensationRange: string | null;
  profileSummary: ProfileSummary | null;
}

type Action =
  | { type: 'SET_DISPLAY_NAME'; payload: string }
  | { type: 'SET_RESUME'; payload: { parsed: ExtractedResume | null; text: string } }
  | { type: 'SET_CAREER_STATUS'; payload: CareerStatus }
  | { type: 'SET_EXPERIENCE'; payload: number }
  | { type: 'SET_INDUSTRIES'; payload: ProfileIndustry[] }
  | { type: 'SET_FUNCTIONS'; payload: ProfileFunction[] }
  | { type: 'SET_CURRENT_ROLE'; payload: string }
  | { type: 'SET_CURRENT_COMPANY'; payload: string }
  | { type: 'SET_TARGET_ROLE'; payload: string }
  | { type: 'SET_TARGET_COMPANIES'; payload: TargetCompany[] }
  | { type: 'SET_TIMELINE'; payload: OnboardingInterviewTimeline }
  | { type: 'SET_CONCERNS'; payload: InterviewConcern[] }
  | { type: 'SET_COMPENSATION'; payload: { field: 'currentCompensationRange' | 'targetCompensationRange'; value: string } }
  | { type: 'SET_SUMMARY'; payload: ProfileSummary };

function reducer(state: OnboardingState, action: Action): OnboardingState {
  switch (action.type) {
    case 'SET_DISPLAY_NAME':
      return { ...state, displayName: action.payload };
    case 'SET_RESUME': {
      const inferred = action.payload.parsed
        ? inferProfileFromResume(action.payload.parsed)
        : null;
      return {
        ...state,
        hasResume: true,
        resumeParsedJson: action.payload.parsed,
        // Auto-fill fields from resume
        ...(inferred?.currentRole && !state.currentRole
          ? { currentRole: inferred.currentRole, autoFilledFromResume: true }
          : {}),
        ...(inferred?.currentCompany && !state.currentCompany
          ? { currentCompany: inferred.currentCompany }
          : {}),
        ...(inferred?.yearsOfExperience != null && state.yearsOfExperience === null
          ? { yearsOfExperience: inferred.yearsOfExperience }
          : {}),
      };
    }
    case 'SET_CAREER_STATUS':
      return { ...state, careerStatus: action.payload };
    case 'SET_EXPERIENCE':
      return { ...state, yearsOfExperience: action.payload };
    case 'SET_INDUSTRIES':
      return { ...state, industries: action.payload };
    case 'SET_FUNCTIONS':
      return { ...state, functions: action.payload };
    case 'SET_CURRENT_ROLE':
      return { ...state, currentRole: action.payload, autoFilledFromResume: false };
    case 'SET_CURRENT_COMPANY':
      return { ...state, currentCompany: action.payload };
    case 'SET_TARGET_ROLE':
      return { ...state, targetRole: action.payload };
    case 'SET_TARGET_COMPANIES':
      return { ...state, targetCompanies: action.payload };
    case 'SET_TIMELINE':
      return { ...state, interviewTimeline: action.payload };
    case 'SET_CONCERNS':
      return { ...state, concerns: action.payload };
    case 'SET_COMPENSATION':
      return { ...state, [action.payload.field]: action.payload.value };
    case 'SET_SUMMARY':
      return { ...state, profileSummary: action.payload };
    default:
      return state;
  }
}

function initState(profile: UserProfile): OnboardingState {
  return {
    displayName: profile.displayName || '',
    hasResume: !!profile.resumeText,
    resumeParsedJson: profile.resumeParsedJson,
    careerStatus: profile.careerStatus,
    yearsOfExperience: profile.yearsOfExperience,
    industries: profile.industries,
    functions: profile.functions,
    currentRole: profile.currentRole || '',
    currentCompany: profile.currentCompany || '',
    autoFilledFromResume: false,
    targetRole: profile.targetRole || '',
    targetCompanies: profile.targetCompanies || [],
    interviewTimeline: profile.interviewTimeline,
    concerns: profile.concerns as InterviewConcern[],
    currentCompensationRange: profile.currentCompensationRange,
    targetCompensationRange: profile.targetCompensationRange,
    profileSummary: profile.profileSummaryJson,
  };
}

// ============================================
// Validation
// ============================================

function validateStep(step: number, state: OnboardingState): boolean {
  switch (step) {
    case 1:
      return state.displayName.trim().length > 0;
    case 2:
      return true; // Skippable
    case 3:
      return state.careerStatus !== null;
    case 4:
      return state.yearsOfExperience !== null;
    case 5:
      return state.industries.length > 0 && state.functions.length > 0;
    case 6:
      return state.currentRole.trim().length > 0;
    case 7:
      return state.targetRole.trim().length > 0;
    case 8:
      return true; // Skippable
    case 9:
      return state.interviewTimeline !== null;
    case 10:
      return state.concerns.length > 0;
    case 11:
      return true; // Skippable
    case 12:
      return true; // Summary step
    default:
      return false;
  }
}

function getStepData(step: number, state: OnboardingState): Record<string, unknown> {
  switch (step) {
    case 1:
      return { displayName: state.displayName.trim() };
    case 2:
      return {};
    case 3:
      return { careerStatus: state.careerStatus };
    case 4:
      return { yearsOfExperience: state.yearsOfExperience };
    case 5:
      return { industries: state.industries, functions: state.functions };
    case 6:
      return { currentRole: state.currentRole.trim(), currentCompany: state.currentCompany.trim() || undefined };
    case 7:
      return { targetRole: state.targetRole.trim() };
    case 8:
      return { targetCompanies: state.targetCompanies };
    case 9:
      return { interviewTimeline: state.interviewTimeline };
    case 10:
      return { concerns: state.concerns };
    case 11:
      return { currentCompensationRange: state.currentCompensationRange, targetCompensationRange: state.targetCompensationRange };
    case 12:
      return {};
    default:
      return {};
  }
}

// ============================================
// Main Component
// ============================================

interface OnboardingWizardProps {
  initialProfile: UserProfile;
}

export function OnboardingWizard({ initialProfile }: OnboardingWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(
    Math.max(1, Math.min(initialProfile.onboardingCurrentStep, TOTAL_ONBOARDING_STEPS))
  );
  const [state, dispatch] = useReducer(reducer, initialProfile, initState);
  const [saving, setSaving] = useState(false);

  const saveStep = useCallback(
    async (step: number) => {
      setSaving(true);
      try {
        await fetch('/api/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ step, data: getStepData(step, state) }),
        });
      } catch (error) {
        console.error('Save step error:', error);
      } finally {
        setSaving(false);
      }
    },
    [state]
  );

  const handleContinue = useCallback(async () => {
    if (!validateStep(currentStep, state)) return;

    await saveStep(currentStep);

    if (currentStep === TOTAL_ONBOARDING_STEPS) {
      // Onboarding complete
      document.cookie = 'ip_onboarded=1; path=/; max-age=31536000; SameSite=Lax';
      router.push('/dashboard');
    } else {
      setCurrentStep((prev) => Math.min(prev + 1, TOTAL_ONBOARDING_STEPS));
    }
  }, [currentStep, state, saveStep, router]);

  const handleBack = useCallback(() => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  }, []);

  const handleSkip = useCallback(async () => {
    await saveStep(currentStep);
    setCurrentStep((prev) => Math.min(prev + 1, TOTAL_ONBOARDING_STEPS));
  }, [currentStep, saveStep]);

  const isValid = validateStep(currentStep, state);

  return (
    <div className="relative flex min-h-screen flex-col">
      <OnboardingProgress currentStep={currentStep} />

      {/* Logo */}
      <div className="fixed top-4 left-6 z-50">
        <span className="font-serif text-lg font-bold text-[var(--accent-primary)]">
          InterviewProof
        </span>
      </div>

      {/* Step content */}
      <div className="flex flex-1 items-center justify-center px-6 py-20">
        <div className="w-full max-w-2xl">
          {currentStep === 1 && (
            <StepWelcomeName
              displayName={state.displayName}
              onChange={(name) => dispatch({ type: 'SET_DISPLAY_NAME', payload: name })}
            />
          )}

          {currentStep === 2 && (
            <StepResumeUpload
              hasResume={state.hasResume}
              onUpload={(parsed, text) =>
                dispatch({ type: 'SET_RESUME', payload: { parsed, text } })
              }
            />
          )}

          {currentStep === 3 && (
            <StepCareerStatus
              value={state.careerStatus}
              onChange={(status) => dispatch({ type: 'SET_CAREER_STATUS', payload: status })}
            />
          )}

          {currentStep === 4 && (
            <StepExperience
              value={state.yearsOfExperience}
              onChange={(years) => dispatch({ type: 'SET_EXPERIENCE', payload: years })}
            />
          )}

          {currentStep === 5 && (
            <StepIndustryFunction
              industries={state.industries}
              functions={state.functions}
              onIndustriesChange={(industries) =>
                dispatch({ type: 'SET_INDUSTRIES', payload: industries })
              }
              onFunctionsChange={(functions) =>
                dispatch({ type: 'SET_FUNCTIONS', payload: functions })
              }
            />
          )}

          {currentStep === 6 && (
            <StepCurrentSituation
              currentRole={state.currentRole}
              currentCompany={state.currentCompany}
              autoFilled={state.autoFilledFromResume}
              onChange={(field, value) => {
                if (field === 'currentRole')
                  dispatch({ type: 'SET_CURRENT_ROLE', payload: value });
                else dispatch({ type: 'SET_CURRENT_COMPANY', payload: value });
              }}
            />
          )}

          {currentStep === 7 && (
            <StepTargetRole
              value={state.targetRole}
              onChange={(role) => dispatch({ type: 'SET_TARGET_ROLE', payload: role })}
            />
          )}

          {currentStep === 8 && (
            <StepTargetCompanies
              companies={state.targetCompanies}
              onChange={(companies) =>
                dispatch({ type: 'SET_TARGET_COMPANIES', payload: companies })
              }
            />
          )}

          {currentStep === 9 && (
            <StepTimeline
              value={state.interviewTimeline}
              onChange={(timeline) => dispatch({ type: 'SET_TIMELINE', payload: timeline })}
            />
          )}

          {currentStep === 10 && (
            <StepConcerns
              concerns={state.concerns}
              onChange={(concerns) => dispatch({ type: 'SET_CONCERNS', payload: concerns })}
            />
          )}

          {currentStep === 11 && (
            <StepCompensation
              currentRange={state.currentCompensationRange}
              targetRange={state.targetCompensationRange}
              onChange={(field, value) =>
                dispatch({ type: 'SET_COMPENSATION', payload: { field, value } })
              }
            />
          )}

          {currentStep === 12 && (
            <StepProfileSummary
              summary={state.profileSummary}
              onSummaryGenerated={(summary) =>
                dispatch({ type: 'SET_SUMMARY', payload: summary })
              }
            />
          )}

          {/* Navigation */}
          <OnboardingNavigation
            currentStep={currentStep}
            onBack={handleBack}
            onContinue={handleContinue}
            onSkip={handleSkip}
            continueDisabled={!isValid}
            continueLoading={saving}
            continueLabel={currentStep === TOTAL_ONBOARDING_STEPS ? 'Start My Journey' : 'Continue'}
          />
        </div>
      </div>
    </div>
  );
}
