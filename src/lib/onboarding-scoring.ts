import type {
  CareerStage,
  OnboardingPrepUrgency,
  AhaScore,
  ScoreBreakdownItem,
  InterviewExperience,
  TargetCompanyTier,
  TargetDomain,
} from '@/types';
import { extractResumeSignals } from './resume-signals';
import { selectFocusAreas } from './focus-area-pool';

// ============================================
// Onboarding "Aha Moment" Scoring Engine
// Deterministic — no LLM, no API calls
// ============================================

export interface OnboardingInput {
  careerStage: CareerStage | null;
  targetDomain: TargetDomain | null;
  yearsExperience: number | null;
  prepUrgency: OnboardingPrepUrgency | null;
  targetRole: string;
  biggestConcern: string;
  resumeText: string;
  interviewExperience: InterviewExperience | null;
  targetCompanyTier: TargetCompanyTier | null;
}

const CAREER_STAGE_ADJUSTMENTS: Record<CareerStage, number> = {
  student: -10,
  new_grad: -5,
  career_changer: -8,
  experienced_professional: 5,
};

const URGENCY_ADJUSTMENTS: Record<OnboardingPrepUrgency, number> = {
  interview_this_week: -15,
  interview_scheduled: -5,
  active_search: 0,
  exploring: 5,
};

const INTERVIEW_EXP_ADJUSTMENTS: Record<InterviewExperience, number> = {
  none: -5,
  a_few: 0,
  many: 3,
};

const COMPANY_TIER_ADJUSTMENTS: Record<TargetCompanyTier, number> = {
  big_tech: -3,
  startup: 2,
  any: 0,
};

const TIMELINE_MESSAGES: Record<OnboardingPrepUrgency, string> = {
  interview_this_week:
    'You have limited time — focus on your single biggest weakness first. One targeted session can still move the needle.',
  interview_scheduled:
    'With your timeline, 2-3 focused sessions can make a real difference. Prioritize the gaps that matter most.',
  active_search:
    'Build a daily prep routine. Consistency beats cramming — even 30 minutes a day compounds fast.',
  exploring:
    "You're early — that's a real advantage. Start with a baseline diagnostic to see exactly where you stand.",
};

const CAREER_STAGE_LABELS: Record<CareerStage, string> = {
  student: 'Student',
  new_grad: 'New Graduate',
  career_changer: 'Career Changer',
  experienced_professional: 'Experienced Professional',
};

const URGENCY_LABELS: Record<OnboardingPrepUrgency, string> = {
  interview_this_week: 'Interview This Week',
  interview_scheduled: 'Interview Scheduled',
  active_search: 'Actively Searching',
  exploring: 'Just Exploring',
};

const INTERVIEW_EXP_LABELS: Record<InterviewExperience, string> = {
  none: 'First-time interviewer',
  a_few: 'Some interview experience',
  many: 'Experienced interviewer',
};

const COMPANY_TIER_LABELS: Record<TargetCompanyTier, string> = {
  big_tech: 'Big Tech target',
  startup: 'Startup target',
  any: 'Open to all',
};

function sentiment(impact: number): ScoreBreakdownItem['sentiment'] {
  if (impact > 0) return 'positive';
  if (impact < 0) return 'negative';
  return 'neutral';
}

export function computeAhaScore(input: OnboardingInput): AhaScore {
  let score = 50;
  const breakdown: ScoreBreakdownItem[] = [];

  // Career stage adjustment
  if (input.careerStage) {
    const impact = CAREER_STAGE_ADJUSTMENTS[input.careerStage];
    score += impact;
    breakdown.push({
      label: 'Career Stage',
      detail: CAREER_STAGE_LABELS[input.careerStage],
      impact,
      sentiment: sentiment(impact),
    });
  }

  // Years of experience adjustment
  if (input.yearsExperience !== null) {
    const impact = input.yearsExperience <= 1 ? -5 : input.yearsExperience >= 5 ? 5 : 0;
    score += impact;
    breakdown.push({
      label: 'Experience',
      detail: `${input.yearsExperience} year${input.yearsExperience === 1 ? '' : 's'}`,
      impact,
      sentiment: sentiment(impact),
    });
  }

  // Prep urgency adjustment
  if (input.prepUrgency) {
    const impact = URGENCY_ADJUSTMENTS[input.prepUrgency];
    score += impact;
    breakdown.push({
      label: 'Timeline',
      detail: URGENCY_LABELS[input.prepUrgency],
      impact,
      sentiment: sentiment(impact),
    });
  }

  // Interview experience adjustment
  if (input.interviewExperience) {
    const impact = INTERVIEW_EXP_ADJUSTMENTS[input.interviewExperience];
    score += impact;
    breakdown.push({
      label: 'Interview Exp.',
      detail: INTERVIEW_EXP_LABELS[input.interviewExperience],
      impact,
      sentiment: sentiment(impact),
    });
  }

  // Company tier adjustment
  if (input.targetCompanyTier) {
    const impact = COMPANY_TIER_ADJUSTMENTS[input.targetCompanyTier];
    score += impact;
    breakdown.push({
      label: 'Company Tier',
      detail: COMPANY_TIER_LABELS[input.targetCompanyTier],
      impact,
      sentiment: sentiment(impact),
    });
  }

  // Bonus for having a target role (shows focus)
  const hasRole = input.targetRole.trim().length > 0;
  if (hasRole) {
    score += 5;
    breakdown.push({
      label: 'Role Focus',
      detail: 'Target role identified',
      impact: 5,
      sentiment: 'positive',
    });
  }

  // Bonus for identifying a concern (shows self-awareness)
  const hasConcern = input.biggestConcern.trim().length > 0;
  if (hasConcern) {
    score += 3;
    breakdown.push({
      label: 'Self-Awareness',
      detail: 'Key concern identified',
      impact: 3,
      sentiment: 'positive',
    });
  }

  // Clamp to [20, 75] — never show 0 or 100 for an estimate
  score = Math.max(20, Math.min(75, score));

  // Get personalized focus areas via pool-based selection
  const resumeSignals = input.resumeText ? extractResumeSignals(input.resumeText) : null;
  const focusAreas = selectFocusAreas(input, resumeSignals);

  // Get timeline message
  const timelineMessage = input.prepUrgency
    ? TIMELINE_MESSAGES[input.prepUrgency]
    : TIMELINE_MESSAGES.exploring;

  return {
    readinessEstimate: score,
    focusAreas,
    timelineMessage,
    breakdown,
  };
}
