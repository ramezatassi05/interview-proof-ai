import type {
  CareerStage,
  OnboardingPrepUrgency,
  PracticePain,
  ConfidenceDrop,
  OnboardingTrajectory,
  OnboardingTrajectoryPoint,
  CategoryProjection,
} from '@/types';
import type { ResumeSignals } from './resume-signals';

// ============================================
// Onboarding Trajectory Projection
// Deterministic — adapted from src/server/scoring/trajectory.ts
// Shows before/after readiness estimates at 3 and 7 sessions
// ============================================

// Same rates as the full trajectory engine, scaled to "sessions" (1 session ~ 1.5 days)
const SESSION_IMPROVEMENT_RATES = {
  hardMatch: 0.0225, // 3x base — capped at MAX_IMPROVEMENT limits
  evidenceDepth: 0.036, // 3x base
  roundReadiness: 0.0675, // 3x base — fastest to improve
  clarity: 0.045, // 3x base
  companyProxy: 0.0135, // 3x base — hardest to change
} as const;

const DIMINISHING_FACTOR = 0.7;
const MAX_IMPROVEMENT_3 = 15;
const MAX_IMPROVEMENT_7 = 25;
const SCORE_CEILING = 75;

// Category weights — same as scoring engine
const CATEGORY_WEIGHTS = {
  hardMatch: 0.35,
  evidenceDepth: 0.25,
  roundReadiness: 0.2,
  clarity: 0.1,
  companyProxy: 0.1,
} as const;

interface TrajectoryInput {
  currentScore: number;
  careerStage: CareerStage | null;
  yearsExperience: number | null;
  practicePain: PracticePain | null;
  confidenceDrop: ConfidenceDrop | null;
  prepUrgency: OnboardingPrepUrgency | null;
  resumeSignals: ResumeSignals | null;
  topRubricDomain?: string | null;
  biggestConcern?: string;
}

/**
 * Maps onboarding signals to approximate category scores (0-1 scale).
 * These are rough estimates — the full analysis pipeline produces precise ones.
 */
function approximateCategoryScores(input: TrajectoryInput): Record<string, number> {
  // hardMatch: career stage + years of experience
  let hardMatch = 0.4;
  if (input.careerStage === 'experienced_professional') hardMatch = 0.6;
  else if (input.careerStage === 'career_changer') hardMatch = 0.35;
  else if (input.careerStage === 'student') hardMatch = 0.25;
  if (input.yearsExperience !== null) {
    if (input.yearsExperience >= 5) hardMatch += 0.1;
    else if (input.yearsExperience <= 1) hardMatch -= 0.1;
  }

  // evidenceDepth: resume depth + quantified impact
  let evidenceDepth = 0.35;
  if (input.resumeSignals) {
    if (input.resumeSignals.resumeDepth === 'substantial') evidenceDepth = 0.55;
    else if (input.resumeSignals.resumeDepth === 'moderate') evidenceDepth = 0.4;
    if (input.resumeSignals.hasQuantifiedImpact) evidenceDepth += 0.1;
    if (input.resumeSignals.hasLeadershipSignals) evidenceDepth += 0.05;
  }

  // roundReadiness: practice pain + general readiness
  let roundReadiness = 0.35;
  if (input.practicePain === 'no_offers') roundReadiness = 0.5;
  else if (input.practicePain === 'freeze') roundReadiness = 0.2;
  else if (input.practicePain === 'ramble') roundReadiness = 0.3;
  else if (input.practicePain === 'no_benchmark') roundReadiness = 0.25;

  // clarity: confidence drop indicator
  let clarity = 0.4;
  if (input.confidenceDrop === 'coding') clarity = 0.3;
  else if (input.confidenceDrop === 'everything') clarity = 0.25;
  else if (input.confidenceDrop === 'behavioral') clarity = 0.35;

  // companyProxy: stays moderate (hard to estimate without JD)
  const companyProxy = 0.35;

  return {
    hardMatch: Math.max(0, Math.min(1, hardMatch)),
    evidenceDepth: Math.max(0, Math.min(1, evidenceDepth)),
    roundReadiness: Math.max(0, Math.min(1, roundReadiness)),
    clarity: Math.max(0, Math.min(1, clarity)),
    companyProxy: Math.max(0, Math.min(1, companyProxy)),
  };
}

function projectImprovement(categoryScores: Record<string, number>, sessions: number): number {
  let totalImprovement = 0;

  for (const [category, rate] of Object.entries(SESSION_IMPROVEMENT_RATES)) {
    const currentScore = categoryScores[category] ?? 0.4;
    const adjustedRate = currentScore > 0.7 ? rate * DIMINISHING_FACTOR : rate;
    const maxImprovement = 1.0 - currentScore;
    const improvement = Math.min(maxImprovement, adjustedRate * sessions);
    const weight = CATEGORY_WEIGHTS[category as keyof typeof CATEGORY_WEIGHTS] ?? 0;
    totalImprovement += improvement * weight * 100;
  }

  return Math.round(totalImprovement);
}

function buildRiskBullets(input: TrajectoryInput): string[] {
  const bullets: string[] = [];

  // Risk from self-reported weak spot
  if (input.confidenceDrop === 'system_design') {
    bullets.push('System design is your self-reported gap — this is where most points are lost');
  } else if (input.confidenceDrop === 'behavioral') {
    bullets.push(
      'Behavioral storytelling gaps lose offers at the final round — address this first'
    );
  } else if (input.confidenceDrop === 'coding') {
    bullets.push(
      'Knowing answers but failing to articulate them is the #1 reason for "almost" offers'
    );
  } else if (input.confidenceDrop === 'everything') {
    bullets.push('Broad confidence gaps signal to interviewers — focused prep narrows this fast');
  }

  // Risk from practice pain
  if (input.practicePain === 'freeze') {
    bullets.push('Freezing on unseen questions costs more points than wrong answers');
  } else if (input.practicePain === 'ramble') {
    bullets.push('Unstructured answers make interviewers tune out within 60 seconds');
  } else if (input.practicePain === 'no_offers') {
    bullets.push("Something specific is costing you offers — you just can't see it yet");
  }

  // Risk from timeline urgency
  if (input.prepUrgency === 'interview_this_week') {
    bullets.push('With days left, every session needs to target your single biggest weakness');
  } else if (input.prepUrgency === 'interview_scheduled') {
    bullets.push('Your scheduled interview means prep time is finite — prioritize ruthlessly');
  }

  // Risk from top rubric domain gap
  if (input.topRubricDomain) {
    bullets.push(
      `${input.topRubricDomain} is the highest-weighted evaluation area for your target role`
    );
  }

  return bullets.slice(0, 3);
}

const CATEGORY_LABELS: Record<string, string> = {
  hardMatch: 'Resume Match',
  evidenceDepth: 'Evidence Depth',
  roundReadiness: 'Round Readiness',
  clarity: 'Communication',
  companyProxy: 'Company Fit',
};

function projectCategoryBreakdown(
  categoryScores: Record<string, number>,
  sessions: number
): CategoryProjection[] {
  return Object.entries(SESSION_IMPROVEMENT_RATES).map(([category, rate]) => {
    const currentScore = categoryScores[category] ?? 0.4;
    const adjustedRate = currentScore > 0.7 ? rate * DIMINISHING_FACTOR : rate;
    const maxImprovement = 1.0 - currentScore;
    const improvement = Math.min(maxImprovement, adjustedRate * sessions);
    return {
      key: category,
      label: CATEGORY_LABELS[category] ?? category,
      currentPct: Math.round(currentScore * 100),
      projectedPct: Math.round((currentScore + improvement) * 100),
      gainPct: Math.round(improvement * 100),
    };
  });
}

export function computeOnboardingTrajectory(input: TrajectoryInput): OnboardingTrajectory {
  const categoryScores = approximateCategoryScores(input);

  const improvement3 = Math.min(MAX_IMPROVEMENT_3, projectImprovement(categoryScores, 3));
  const improvement7 = Math.min(MAX_IMPROVEMENT_7, projectImprovement(categoryScores, 7));

  const projections: OnboardingTrajectoryPoint[] = [
    {
      sessions: 3,
      projectedScore: Math.min(SCORE_CEILING, input.currentScore + improvement3),
      label: '3 focused sessions',
    },
    {
      sessions: 7,
      projectedScore: Math.min(SCORE_CEILING, input.currentScore + improvement7),
      label: '7 focused sessions',
    },
  ];

  // Intermediate points for smooth trajectory curve (sessions 0-7)
  const intermediatePoints: OnboardingTrajectoryPoint[] = [];
  for (let s = 0; s <= 7; s++) {
    const rawImprovement = projectImprovement(categoryScores, s);
    // Apply proportional cap: linearly interpolate between 3-session cap and 7-session cap
    let cappedImprovement: number;
    if (s <= 3) {
      cappedImprovement = Math.min(MAX_IMPROVEMENT_3 * (s / 3), rawImprovement);
    } else {
      const cap3Value = Math.min(MAX_IMPROVEMENT_3, projectImprovement(categoryScores, 3));
      const remaining = rawImprovement - projectImprovement(categoryScores, 3);
      const remainingCap = (MAX_IMPROVEMENT_7 - cap3Value) * ((s - 3) / 4);
      cappedImprovement = cap3Value + Math.min(remainingCap, remaining);
    }
    cappedImprovement = Math.min(MAX_IMPROVEMENT_7, cappedImprovement);

    intermediatePoints.push({
      sessions: s,
      projectedScore: Math.min(SCORE_CEILING, input.currentScore + Math.round(cappedImprovement)),
      label: s === 0 ? 'Now' : `${s}`,
    });
  }

  // Category-level breakdown at 7 sessions
  const categoryBreakdown7 = projectCategoryBreakdown(categoryScores, 7);

  // Percentage improvement
  const score7 = Math.min(SCORE_CEILING, input.currentScore + improvement7);
  const percentImprovement7 =
    input.currentScore > 0
      ? Math.round(((score7 - input.currentScore) / input.currentScore) * 100)
      : 0;

  return {
    current: input.currentScore,
    projections,
    intermediatePoints,
    categoryBreakdown7,
    percentImprovement7,
    riskBullets: buildRiskBullets(input),
  };
}
