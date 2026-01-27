import type { LLMAnalysis, InterviewRoundForecasts, RoundForecastItem } from '@/types';

const FORECAST_VERSION = 'v0.1';

// Weights for each round type (sum to 1.0)
const ROUND_WEIGHTS = {
  technical: {
    hardMatch: 0.4,
    roundReadiness: 0.4,
    evidenceDepth: 0.2,
    clarity: 0,
    companyProxy: 0,
  },
  behavioral: {
    clarity: 0.4,
    companyProxy: 0.3,
    evidenceDepth: 0.2,
    hardMatch: 0.1,
    roundReadiness: 0,
  },
  case: {
    hardMatch: 0.3,
    roundReadiness: 0.3,
    clarity: 0.2,
    companyProxy: 0.2,
    evidenceDepth: 0,
  },
} as const;

// Labels for identifying strengths/risks
const DIMENSION_LABELS = {
  hardMatch: 'Technical Skills Match',
  evidenceDepth: 'Demonstrated Impact',
  roundReadiness: 'Interview Preparation',
  clarity: 'Communication Clarity',
  companyProxy: 'Culture Fit Signals',
} as const;

/**
 * Computes pass probability for a specific round type.
 */
function computeRoundProbability(
  categoryScores: LLMAnalysis['categoryScores'],
  roundType: 'technical' | 'behavioral' | 'case'
): number {
  const weights = ROUND_WEIGHTS[roundType];

  const probability =
    categoryScores.hardMatch * weights.hardMatch +
    categoryScores.evidenceDepth * weights.evidenceDepth +
    categoryScores.roundReadiness * weights.roundReadiness +
    categoryScores.clarity * weights.clarity +
    categoryScores.companyProxy * weights.companyProxy;

  // Clamp to 0-1 range and round to 2 decimal places
  return Math.round(Math.max(0, Math.min(1, probability)) * 100) / 100;
}

/**
 * Finds the primary strength and risk for a round type based on weights.
 */
function findStrengthAndRisk(
  categoryScores: LLMAnalysis['categoryScores'],
  roundType: 'technical' | 'behavioral' | 'case'
): { strength: string; risk: string } {
  const weights = ROUND_WEIGHTS[roundType];

  // Only consider dimensions with non-zero weight for this round
  const relevantDimensions = (Object.entries(weights) as [keyof typeof weights, number][]).filter(
    ([, weight]) => weight > 0
  );

  // Find highest and lowest scoring relevant dimensions
  let highestScore = -1;
  let lowestScore = 2;
  let strengthKey: keyof typeof DIMENSION_LABELS = 'hardMatch';
  let riskKey: keyof typeof DIMENSION_LABELS = 'hardMatch';

  for (const [key] of relevantDimensions) {
    const score = categoryScores[key as keyof typeof categoryScores];
    if (score > highestScore) {
      highestScore = score;
      strengthKey = key as keyof typeof DIMENSION_LABELS;
    }
    if (score < lowestScore) {
      lowestScore = score;
      riskKey = key as keyof typeof DIMENSION_LABELS;
    }
  }

  return {
    strength: DIMENSION_LABELS[strengthKey],
    risk: DIMENSION_LABELS[riskKey],
  };
}

/**
 * Computes interview round forecasts based on category scores.
 * Deterministic computation - same inputs always produce same outputs.
 */
export function computeRoundForecasts(analysis: LLMAnalysis): InterviewRoundForecasts {
  const { categoryScores } = analysis;

  const roundTypes: ('technical' | 'behavioral' | 'case')[] = ['technical', 'behavioral', 'case'];

  const forecasts: RoundForecastItem[] = roundTypes.map((roundType) => {
    const probability = computeRoundProbability(categoryScores, roundType);
    const { strength, risk } = findStrengthAndRisk(categoryScores, roundType);

    return {
      roundType,
      passProbability: probability,
      primaryStrength: strength,
      primaryRisk: risk,
    };
  });

  // Determine recommended focus based on lowest probability round
  const lowestForecast = forecasts.reduce((min, f) =>
    f.passProbability < min.passProbability ? f : min
  );

  const focusMap: Record<string, string> = {
    technical: 'Focus on technical fundamentals and coding practice',
    behavioral: 'Practice storytelling and refine your narrative',
    case: 'Study problem-solving frameworks and structured thinking',
  };

  return {
    forecasts,
    recommendedFocus: focusMap[lowestForecast.roundType],
    version: FORECAST_VERSION,
  };
}
