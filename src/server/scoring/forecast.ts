import type {
  LLMAnalysis,
  ExtractedResume,
  ExtractedJD,
  InterviewRoundForecasts,
  RoundForecastItem,
  CompanyDifficultyContext,
} from '@/types';

const FORECAST_VERSION = 'v0.2';

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
 * When adjustmentFactor > 1.0 (harder company), applies exponential dampening
 * which naturally compresses higher probabilities more (e.g., 0.8^1.3 ≈ 0.74).
 */
function computeRoundProbability(
  categoryScores: LLMAnalysis['categoryScores'],
  roundType: 'technical' | 'behavioral' | 'case',
  adjustmentFactor: number = 1.0
): number {
  const weights = ROUND_WEIGHTS[roundType];

  let probability =
    categoryScores.hardMatch * weights.hardMatch +
    categoryScores.evidenceDepth * weights.evidenceDepth +
    categoryScores.roundReadiness * weights.roundReadiness +
    categoryScores.clarity * weights.clarity +
    categoryScores.companyProxy * weights.companyProxy;

  // Apply exponential dampening for harder companies
  if (adjustmentFactor > 1.0) {
    probability = Math.pow(probability, adjustmentFactor);
  }

  // Clamp to 0-1 range and round to 2 decimal places
  return Math.round(Math.max(0, Math.min(1, probability)) * 100) / 100;
}

/**
 * Normalizes a string for fuzzy matching.
 */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

/**
 * Finds the primary strength and risk for a round type based on weights.
 * When resume/JD data is provided, appends evidence counts.
 */
function findStrengthAndRisk(
  categoryScores: LLMAnalysis['categoryScores'],
  roundType: 'technical' | 'behavioral' | 'case',
  resume?: ExtractedResume,
  jd?: ExtractedJD
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

  let strengthLabel: string = DIMENSION_LABELS[strengthKey];
  let riskLabel: string = DIMENSION_LABELS[riskKey];

  // Append evidence counts when extracted data is available
  if (resume && jd) {
    const matchedMustHaves = jd.mustHave.filter((req) =>
      resume.skills.some(
        (s) => normalize(s).includes(normalize(req)) || normalize(req).includes(normalize(s))
      )
    );
    const matchedNiceToHaves = jd.niceToHave.filter((req) =>
      [...resume.skills, ...resume.recencySignals].some(
        (s) => normalize(s).includes(normalize(req)) || normalize(req).includes(normalize(s))
      )
    );

    if (strengthKey === 'hardMatch' && jd.mustHave.length > 0) {
      strengthLabel = `${DIMENSION_LABELS.hardMatch} (${matchedMustHaves.length}/${jd.mustHave.length} must-haves)`;
    } else if (strengthKey === 'companyProxy' && jd.niceToHave.length > 0) {
      strengthLabel = `${DIMENSION_LABELS.companyProxy} (${matchedNiceToHaves.length}/${jd.niceToHave.length} nice-to-haves)`;
    } else if (strengthKey === 'evidenceDepth' && resume.metrics.length > 0) {
      strengthLabel = `${DIMENSION_LABELS.evidenceDepth} (${resume.metrics.length} quantified metrics)`;
    }

    if (riskKey === 'hardMatch' && jd.mustHave.length > 0) {
      const unmatchedCount = jd.mustHave.length - matchedMustHaves.length;
      riskLabel = `${DIMENSION_LABELS.hardMatch} (${unmatchedCount} unmatched must-have${unmatchedCount !== 1 ? 's' : ''})`;
    } else if (riskKey === 'companyProxy' && jd.niceToHave.length > 0) {
      const unmatchedNice = jd.niceToHave.length - matchedNiceToHaves.length;
      riskLabel = `${DIMENSION_LABELS.companyProxy} (${unmatchedNice} unmatched nice-to-have${unmatchedNice !== 1 ? 's' : ''})`;
    } else if (riskKey === 'evidenceDepth') {
      riskLabel = `${DIMENSION_LABELS.evidenceDepth} (${resume.metrics.length} metric${resume.metrics.length !== 1 ? 's' : ''} found)`;
    }
  }

  return {
    strength: strengthLabel,
    risk: riskLabel,
  };
}

/**
 * Computes interview round forecasts based on category scores.
 * Deterministic computation - same inputs always produce same outputs.
 *
 * @param analysis - The LLM analysis output
 * @param personalizedFocus - Optional LLM-generated focus to override hardcoded defaults
 * @param resume - Optional extracted resume data for evidence-backed labels
 * @param jd - Optional extracted JD data for evidence-backed labels
 */
export function computeRoundForecasts(
  analysis: LLMAnalysis,
  personalizedFocus?: string,
  resume?: ExtractedResume,
  jd?: ExtractedJD,
  companyDifficulty?: CompanyDifficultyContext
): InterviewRoundForecasts {
  const { categoryScores } = analysis;
  const adjustmentFactor = companyDifficulty?.adjustmentFactor ?? 1.0;

  const roundTypes: ('technical' | 'behavioral' | 'case')[] = ['technical', 'behavioral', 'case'];

  const forecasts: RoundForecastItem[] = roundTypes.map((roundType) => {
    const probability = computeRoundProbability(categoryScores, roundType, adjustmentFactor);
    const { strength, risk } = findStrengthAndRisk(categoryScores, roundType, resume, jd);

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

  // Use personalized focus if provided, otherwise fall back to hardcoded defaults
  const focusMap: Record<string, string> = {
    technical: 'Focus on technical fundamentals and coding practice',
    behavioral: 'Practice storytelling and refine your narrative',
    case: 'Study problem-solving frameworks and structured thinking',
  };

  const focus =
    personalizedFocus && personalizedFocus.length >= 30
      ? personalizedFocus
      : focusMap[lowestForecast.roundType];

  return {
    forecasts,
    recommendedFocus: focus,
    roundCoaching: analysis.roundCoaching,
    version: FORECAST_VERSION,
  };
}
