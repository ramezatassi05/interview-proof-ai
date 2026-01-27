import type { LLMAnalysis, CognitiveRiskMap } from '@/types';

const COGNITIVE_VERSION = 'v0.1';

// Dimension labels for display
const DIMENSION_LABELS = {
  analyticalReasoning: 'Analytical Reasoning',
  communicationClarity: 'Communication Clarity',
  technicalDepth: 'Technical Depth',
  adaptability: 'Adaptability',
  problemStructuring: 'Problem Structuring',
} as const;

/**
 * Maps LLM analysis signals to cognitive dimensions.
 * This creates a 5-dimension spider chart for visual representation.
 *
 * Mapping logic:
 * - analyticalReasoning: Derived from evidence depth and hard match
 * - communicationClarity: Directly from clarity score
 * - technicalDepth: Primarily from hard match with evidence adjustment
 * - adaptability: Derived from company proxy and round readiness
 * - problemStructuring: Combination of clarity and round readiness
 */
export function computeCognitiveRiskMap(analysis: LLMAnalysis): CognitiveRiskMap {
  const { categoryScores } = analysis;
  const { hardMatch, evidenceDepth, roundReadiness, clarity, companyProxy } = categoryScores;

  // Compute each cognitive dimension
  const dimensions = {
    // Analytical Reasoning: ability to break down and analyze information
    analyticalReasoning: Math.round((evidenceDepth * 0.6 + hardMatch * 0.4) * 100) / 100,

    // Communication Clarity: ability to express ideas clearly
    communicationClarity: Math.round(clarity * 100) / 100,

    // Technical Depth: mastery of technical concepts
    technicalDepth: Math.round((hardMatch * 0.7 + evidenceDepth * 0.3) * 100) / 100,

    // Adaptability: flexibility and cultural fit
    adaptability:
      Math.round((companyProxy * 0.5 + roundReadiness * 0.3 + clarity * 0.2) * 100) / 100,

    // Problem Structuring: ability to organize and approach problems
    problemStructuring:
      Math.round((clarity * 0.4 + roundReadiness * 0.4 + evidenceDepth * 0.2) * 100) / 100,
  };

  // Find lowest and highest dimensions
  const entries = Object.entries(dimensions) as [keyof typeof dimensions, number][];
  const sorted = entries.sort((a, b) => a[1] - b[1]);

  const lowestKey = sorted[0][0];
  const highestKey = sorted[sorted.length - 1][0];

  return {
    dimensions,
    lowestDimension: DIMENSION_LABELS[lowestKey],
    highestDimension: DIMENSION_LABELS[highestKey],
    version: COGNITIVE_VERSION,
  };
}
