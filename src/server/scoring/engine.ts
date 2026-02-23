import type {
  LLMAnalysis,
  ScoreBreakdown,
  RiskBand,
  RecruiterSimulation,
  RecruiterInternalNotes,
  RecruiterDebriefSummary,
  CandidatePositioning,
} from '@/types';

// Re-export all scoring functions from submodules
export { classifyArchetype } from './archetype';
export { computeRoundForecasts } from './forecast';
export { computeCognitiveRiskMap } from './cognitive';
export { computeTrajectoryProjection } from './trajectory';
export { computePracticeIntelligence } from './practice';
export { computeEvidenceContext } from './evidence';
export { computeHireZoneAnalysis } from './hirezone';
export { computeCompanyDifficulty } from './company-difficulty';
export { detectPriorEmployment } from './prior-employment';

const SCORING_VERSION = 'v0.2';

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
 * adjustmentFactor: company difficulty multiplier (1.0 = standard, up to 1.5 for FAANG+)
 */
export function computeReadinessScore(
  analysis: LLMAnalysis,
  adjustmentFactor: number = 1.0
): {
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

  let score = Math.round(
    hardRequirementMatch * WEIGHTS.hardRequirementMatch +
      evidenceDepth * WEIGHTS.evidenceDepth +
      roundReadiness * WEIGHTS.roundReadiness +
      resumeClarity * WEIGHTS.resumeClarity +
      companyProxy * WEIGHTS.companyProxy
  );

  // Apply company difficulty penalty
  if (adjustmentFactor > 1.0) {
    const penalty = (adjustmentFactor - 1.0) * 30; // 0-15 points for FAANG
    score = Math.round(Math.max(0, Math.min(100, score - penalty)));
  }

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
 * Computes conversion likelihood using a sigmoid curve + company difficulty + risk severity.
 * Replaces the old linear client-side formula.
 */
export function computeConversionLikelihood(
  readinessScore: number,
  analysis: LLMAnalysis,
  adjustmentFactor: number = 1.0
): number {
  // S-curve — steep dropoff below 60, plateau above 85
  const sigmoid = (x: number, mid: number, k: number) =>
    100 / (1 + Math.exp(-k * (x - mid)));
  let base = sigmoid(readinessScore, 60, 0.08);

  // Company difficulty penalty (FAANG 1.4 => -20pts, Unicorn 1.2 => -10pts)
  if (adjustmentFactor > 1.0) {
    base -= (adjustmentFactor - 1.0) * 50;
  }

  // Risk severity penalty
  const critical = analysis.rankedRisks.filter(r => r.severity === 'critical').length;
  const high = analysis.rankedRisks.filter(r => r.severity === 'high').length;
  base -= critical * 8 + high * 3;

  // Recruiter signal
  if (analysis.recruiterSignals?.firstImpression === 'reject') base -= 10;
  else if (analysis.recruiterSignals?.firstImpression === 'proceed') base += 3;

  return Math.round(Math.max(5, Math.min(95, base)));
}

/**
 * Computes technical fit focused on hard skill alignment only.
 * Excludes clarity and companyProxy — pure technical match.
 */
export function computeTechnicalFit(
  analysis: LLMAnalysis,
  adjustmentFactor: number = 1.0
): number {
  const { categoryScores } = analysis;

  // Only technical dimensions — clarity/companyProxy excluded
  let base =
    categoryScores.hardMatch * 0.55 * 100 +
    categoryScores.roundReadiness * 0.25 * 100 +
    categoryScores.evidenceDepth * 0.20 * 100;

  // Technical bar penalty for harder companies
  if (adjustmentFactor > 1.0) {
    base -= (adjustmentFactor - 1.0) * 20;
  }

  // Penalty for JD-linked critical/high risks (technical gaps)
  const techRisks = analysis.rankedRisks.filter(
    r => (r.severity === 'critical' || r.severity === 'high') && r.jdRefs.length > 0
  );
  base -= techRisks.length * 3;

  return Math.round(Math.max(0, Math.min(100, base)));
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
  internalNotes?: RecruiterInternalNotes;
  debriefSummary?: RecruiterDebriefSummary;
  candidatePositioning?: CandidatePositioning;
}): RecruiterSimulation {
  // Generate recruiter notes based on signals
  const notes = generateRecruiterNotes(recruiterSignals);

  return {
    immediateRedFlags: recruiterSignals.immediateRedFlags,
    hiddenStrengths: recruiterSignals.hiddenStrengths,
    estimatedScreenTimeSeconds: recruiterSignals.estimatedScreenTimeSeconds,
    firstImpression: recruiterSignals.firstImpression,
    recruiterNotes: notes,
    internalNotes: recruiterSignals.internalNotes,
    debriefSummary: recruiterSignals.debriefSummary,
    candidatePositioning: recruiterSignals.candidatePositioning,
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
