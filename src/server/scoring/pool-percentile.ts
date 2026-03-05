import type { LLMAnalysis, ScoreBreakdown, CompanyDifficultyContext } from '@/types';

const POOL_PERCENTILE_VERSION = 'v0.1';

/**
 * Computes a deterministic pool percentile for candidate positioning.
 * Uses a multi-dimensional composite signal + sigmoid mapping (same pattern as hirezone.ts).
 *
 * The LLM is NOT the scoring authority — this function overrides any LLM-estimated percentile.
 */
export function computePoolPercentile(
  analysis: LLMAnalysis,
  readinessScore: number,
  scoreBreakdown: ScoreBreakdown,
  companyDifficulty?: CompanyDifficultyContext
): number {
  const { categoryScores, rankedRisks } = analysis;

  // Risk severity drag: penalize based on critical/high/medium risk counts
  const critical = rankedRisks.filter((r) => r.severity === 'critical').length;
  const high = rankedRisks.filter((r) => r.severity === 'high').length;
  const medium = rankedRisks.filter((r) => r.severity === 'medium').length;
  const riskPenalty = Math.max(0, Math.min(100, 100 - critical * 15 - high * 8 - medium * 3));

  // Build composite signal from multiple dimensions
  const composite =
    readinessScore * 0.35 +
    categoryScores.hardMatch * 100 * 0.15 +
    categoryScores.evidenceDepth * 100 * 0.15 +
    categoryScores.roundReadiness * 100 * 0.1 +
    categoryScores.companyProxy * 100 * 0.1 +
    categoryScores.clarity * 100 * 0.05 +
    riskPenalty * 0.1;

  // Adjust pool average for company difficulty — harder companies have stronger pools
  const adjustmentFactor = companyDifficulty?.adjustmentFactor ?? 1.0;
  // Standard (1.0) -> 55, Unicorn (1.2) -> 63, FAANG (1.4) -> 71
  const poolAverage = 55 + (adjustmentFactor - 1.0) * 40;

  // First impression nudge (if recruiter signals available)
  let nudge = 0;
  if (analysis.recruiterSignals) {
    const impression = analysis.recruiterSignals.firstImpression;
    if (impression === 'proceed') nudge = 3;
    else if (impression === 'reject') nudge = -5;
    // 'maybe' -> 0
  }

  // Sigmoid mapping (same as hirezone.ts)
  const z = (composite + nudge - poolAverage) / 17;
  const percentile = 100 / (1 + Math.exp(-1.7 * z));

  return Math.round(Math.max(1, Math.min(99, percentile)));
}

export function getPoolPercentileVersion(): string {
  return POOL_PERCENTILE_VERSION;
}
