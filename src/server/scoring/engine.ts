import type { LLMAnalysis, ScoreBreakdown, RiskBand, RecruiterSimulation } from '@/types';

// Re-export all scoring functions from submodules
export { classifyArchetype } from './archetype';
export { computeRoundForecasts } from './forecast';
export { computeCognitiveRiskMap } from './cognitive';
export { computeTrajectoryProjection } from './trajectory';
export { computePracticeIntelligence } from './practice';
export { computeEvidenceContext } from './evidence';
export { computeHireZoneAnalysis } from './hirezone';

const SCORING_VERSION = 'v0.1';

// Weights per PRD - deterministic scoring
const WEIGHTS = {
  hardRequirementMatch: 0.35,
  evidenceDepth: 0.25,
  roundReadiness: 0.2,
  resumeClarity: 0.1,
  companyProxy: 0.1,
} as const;

/**
 * Computes the readiness score from LLM analysis output.
 * This is the deterministic scoring layer - LLM is analyst, this is authority.
 */
export function computeReadinessScore(analysis: LLMAnalysis): {
  score: number;
  breakdown: ScoreBreakdown;
} {
  const { categoryScores } = analysis;

  // Each category score is 0-1, we multiply by weight and sum
  const hardRequirementMatch = categoryScores.hardMatch * 100;
  const evidenceDepth = categoryScores.evidenceDepth * 100;
  const roundReadiness = categoryScores.roundReadiness * 100;
  const resumeClarity = categoryScores.clarity * 100;
  const companyProxy = categoryScores.companyProxy * 100;

  const score = Math.round(
    hardRequirementMatch * WEIGHTS.hardRequirementMatch +
      evidenceDepth * WEIGHTS.evidenceDepth +
      roundReadiness * WEIGHTS.roundReadiness +
      resumeClarity * WEIGHTS.resumeClarity +
      companyProxy * WEIGHTS.companyProxy
  );

  const breakdown: ScoreBreakdown = {
    hardRequirementMatch,
    evidenceDepth,
    roundReadiness,
    resumeClarity,
    companyProxy,
    weights: WEIGHTS,
    version: SCORING_VERSION,
  };

  return { score, breakdown };
}

/**
 * Determines risk band from readiness score.
 * 0-39: High risk
 * 40-69: Medium risk
 * 70-100: Low risk
 */
export function computeRiskBand(score: number): RiskBand {
  if (score < 40) return 'High';
  if (score < 70) return 'Medium';
  return 'Low';
}

/**
 * Validates that same inputs produce same outputs (determinism check).
 */
export function getScoringVersion(): string {
  return SCORING_VERSION;
}

/**
 * Builds recruiter simulation from LLM-provided recruiter signals.
 * This is a pass-through with added deterministic processing.
 */
export function buildRecruiterSimulation(recruiterSignals: {
  immediateRedFlags: string[];
  hiddenStrengths: string[];
  estimatedScreenTimeSeconds: number;
  firstImpression: 'proceed' | 'maybe' | 'reject';
}): RecruiterSimulation {
  // Generate recruiter notes based on signals
  const notes = generateRecruiterNotes(recruiterSignals);

  return {
    immediateRedFlags: recruiterSignals.immediateRedFlags,
    hiddenStrengths: recruiterSignals.hiddenStrengths,
    estimatedScreenTimeSeconds: recruiterSignals.estimatedScreenTimeSeconds,
    firstImpression: recruiterSignals.firstImpression,
    recruiterNotes: notes,
    version: SCORING_VERSION,
  };
}

/**
 * Generates recruiter notes based on the simulation signals.
 */
function generateRecruiterNotes(signals: {
  immediateRedFlags: string[];
  hiddenStrengths: string[];
  estimatedScreenTimeSeconds: number;
  firstImpression: 'proceed' | 'maybe' | 'reject';
}): string {
  const { immediateRedFlags, hiddenStrengths, estimatedScreenTimeSeconds, firstImpression } =
    signals;

  const parts: string[] = [];

  // Screen time assessment
  if (estimatedScreenTimeSeconds < 30) {
    parts.push('Very quick scan - resume may not stand out.');
  } else if (estimatedScreenTimeSeconds < 60) {
    parts.push('Standard review time.');
  } else {
    parts.push('Extended review - something caught attention.');
  }

  // Red flag summary
  if (immediateRedFlags.length === 0) {
    parts.push('No immediate concerns.');
  } else if (immediateRedFlags.length <= 2) {
    parts.push('Minor concerns to address.');
  } else {
    parts.push('Multiple red flags may cause hesitation.');
  }

  // Hidden strengths
  if (hiddenStrengths.length >= 3) {
    parts.push('Hidden strengths could differentiate in interview.');
  }

  // First impression context
  const impressionMap = {
    proceed: 'Likely to advance to phone screen.',
    maybe: 'On the fence - may depend on candidate pool.',
    reject: 'Risk of being filtered out early.',
  };
  parts.push(impressionMap[firstImpression]);

  return parts.join(' ');
}
