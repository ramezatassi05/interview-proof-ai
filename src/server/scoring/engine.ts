import type { LLMAnalysis, ScoreBreakdown, RiskBand } from '@/types';

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
