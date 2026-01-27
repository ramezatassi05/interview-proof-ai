import type { LLMAnalysis, TrajectoryProjection, PrepPreferences } from '@/types';

const TRAJECTORY_VERSION = 'v0.2';

// Improvement rates per category (score points per day with intensive prep)
const DAILY_IMPROVEMENT_RATES = {
  hardMatch: 0.005, // Technical skills - slow even with practice
  evidenceDepth: 0.008, // Can prep stories/examples faster
  roundReadiness: 0.015, // Interview prep improves fastest
  clarity: 0.01, // Communication improves with practice
  companyProxy: 0.003, // Culture fit signals hardest to change
} as const;

// Diminishing returns - harder to improve as you get higher
const DIMINISHING_FACTOR = 0.7; // Multiplier when score > 0.7

/**
 * Gets improvement multiplier based on daily hours.
 * 0.5x for 1hr or less, 1x for 2-3hr, 1.5x for 4+hr
 */
function getHoursMultiplier(dailyHours?: number): number {
  if (!dailyHours) return 1.0; // Default assumption
  if (dailyHours <= 1) return 0.5;
  if (dailyHours <= 3) return 1.0;
  return 1.5;
}

/**
 * Projects score improvement at a given day.
 */
function projectScoreAtDay(
  currentScore: number,
  categoryScores: LLMAnalysis['categoryScores'],
  days: number,
  dailyHours?: number
): { score: number; assumptions: string[] } {
  const assumptions: string[] = [];
  const hoursMultiplier = getHoursMultiplier(dailyHours);

  // Calculate potential improvement for each category
  let totalImprovement = 0;

  for (const [category, rate] of Object.entries(DAILY_IMPROVEMENT_RATES)) {
    const currentCategoryScore = categoryScores[category as keyof typeof categoryScores];

    // Apply diminishing returns for high scores
    let adjustedRate = currentCategoryScore > 0.7 ? rate * DIMINISHING_FACTOR : rate;

    // Apply hours multiplier
    adjustedRate *= hoursMultiplier;

    // Calculate improvement (capped at 1.0 - current score)
    const maxImprovement = 1.0 - currentCategoryScore;
    const potentialImprovement = Math.min(maxImprovement, adjustedRate * days);

    // Weight improvement by category importance
    const weight = getCategoryWeight(category);
    totalImprovement += potentialImprovement * weight * 100;
  }

  // Project new score (capped at 100)
  const projectedScore = Math.min(100, Math.round(currentScore + totalImprovement));

  // Generate assumptions based on user's time commitment
  if (dailyHours) {
    assumptions.push(`${dailyHours}h daily focused prep`);
    if (days >= 7) {
      const mockCount = Math.min(Math.floor(days / 3), 10);
      assumptions.push(`${mockCount}+ mock interviews completed`);
    }
    if (days >= 3) {
      assumptions.push('Top risks systematically addressed');
    }
  } else {
    // Default assumptions when no preferences
    if (days === 3) {
      assumptions.push('2-3 hours daily focused prep');
      assumptions.push('Review top 3 risks identified');
      assumptions.push('Practice behavioral STAR responses');
    } else if (days === 7) {
      assumptions.push('Consistent daily practice maintained');
      assumptions.push('2+ mock interviews completed');
      assumptions.push('Technical concepts reviewed');
    } else if (days === 14) {
      assumptions.push('Intensive prep regimen maintained');
      assumptions.push('5+ mock interviews completed');
      assumptions.push('All critical risks addressed');
    }
  }

  return { score: projectedScore, assumptions };
}

/**
 * Gets the weight for a category in overall score calculation.
 */
function getCategoryWeight(category: string): number {
  const weights: Record<string, number> = {
    hardMatch: 0.35,
    evidenceDepth: 0.25,
    roundReadiness: 0.2,
    clarity: 0.1,
    companyProxy: 0.1,
  };
  return weights[category] || 0.2;
}

/**
 * Determines improvement potential based on current score and risk profile.
 */
function determineImprovementPotential(
  currentScore: number,
  analysis: LLMAnalysis
): 'low' | 'medium' | 'high' {
  const { categoryScores, rankedRisks } = analysis;

  // Count how many categories have significant room for improvement
  const improvableCategories = Object.values(categoryScores).filter((s) => s < 0.6).length;

  // Count actionable risks (medium/high severity that can be addressed)
  const actionableRisks = rankedRisks.filter(
    (r) => r.severity === 'medium' || r.severity === 'high'
  ).length;

  // High potential: low score but many actionable improvements
  if (currentScore < 50 && improvableCategories >= 3 && actionableRisks >= 5) {
    return 'high';
  }

  // Low potential: already high score or few improvement areas
  if (currentScore >= 75 || improvableCategories <= 1) {
    return 'low';
  }

  return 'medium';
}

/**
 * Maps timeline to number of days.
 */
function getTimelineDays(timeline: PrepPreferences['timeline']): number {
  const mapping: Record<PrepPreferences['timeline'], number> = {
    '1day': 1,
    '3days': 3,
    '1week': 7,
    '2weeks': 14,
    '4weeks_plus': 28,
  };
  return mapping[timeline];
}

/**
 * Computes trajectory projections based on current score and analysis.
 * Uses days (3, 7, 14) by default, or user's actual timeline if provided.
 * Deterministic computation - same inputs always produce same outputs.
 */
export function computeTrajectoryProjection(
  currentScore: number,
  analysis: LLMAnalysis,
  prepPreferences?: PrepPreferences
): TrajectoryProjection {
  const dailyHours = prepPreferences?.dailyHours;

  // If user has preferences, use their timeline for projections
  if (prepPreferences) {
    const userDays = getTimelineDays(prepPreferences.timeline);

    // Generate projections at meaningful intervals within user's timeline
    let day3Days = Math.min(3, userDays);
    let day7Days = Math.min(7, userDays);
    let day14Days = userDays;

    // For short timelines, adjust intervals
    if (userDays <= 3) {
      day3Days = 1;
      day7Days = Math.ceil(userDays / 2);
      day14Days = userDays;
    } else if (userDays <= 7) {
      day3Days = 3;
      day7Days = Math.ceil(userDays * 0.7);
      day14Days = userDays;
    }

    const day3 = projectScoreAtDay(currentScore, analysis.categoryScores, day3Days, dailyHours);
    const day7 = projectScoreAtDay(currentScore, analysis.categoryScores, day7Days, dailyHours);
    const day14 = projectScoreAtDay(currentScore, analysis.categoryScores, day14Days, dailyHours);
    const improvementPotential = determineImprovementPotential(currentScore, analysis);

    return {
      currentScore,
      day3Projection: day3,
      day7Projection: day7,
      day14Projection: day14,
      improvementPotential,
      version: TRAJECTORY_VERSION,
    };
  }

  // Default behavior without preferences
  const day3 = projectScoreAtDay(currentScore, analysis.categoryScores, 3);
  const day7 = projectScoreAtDay(currentScore, analysis.categoryScores, 7);
  const day14 = projectScoreAtDay(currentScore, analysis.categoryScores, 14);
  const improvementPotential = determineImprovementPotential(currentScore, analysis);

  return {
    currentScore,
    day3Projection: day3,
    day7Projection: day7,
    day14Projection: day14,
    improvementPotential,
    version: TRAJECTORY_VERSION,
  };
}
