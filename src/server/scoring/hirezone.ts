import type {
  LLMAnalysis,
  RoundType,
  ScoreBreakdown,
  HireZoneAnalysis,
  HireZoneStatus,
  HireZoneCategoryGap,
  HireZoneAction,
  CompanyDifficultyContext,
} from '@/types';

const HIRE_ZONE_VERSION = 'v0.1';

// Hire zone thresholds by round type
const HIRE_ZONE_THRESHOLDS: Record<RoundType, { min: number; max: number; industryAvg: number }> = {
  technical: { min: 78, max: 85, industryAvg: 62 },
  behavioral: { min: 72, max: 80, industryAvg: 58 },
  case: { min: 75, max: 82, industryAvg: 60 },
  finance: { min: 76, max: 83, industryAvg: 61 },
};

// Per-category target scores needed to reach the hire zone
const CATEGORY_TARGETS: Record<RoundType, Record<string, { target: number; label: string }>> = {
  technical: {
    hardRequirementMatch: { target: 82, label: 'Hard Requirement Match' },
    evidenceDepth: { target: 75, label: 'Evidence Depth' },
    roundReadiness: { target: 80, label: 'Round Readiness' },
    resumeClarity: { target: 70, label: 'Resume Clarity' },
    companyProxy: { target: 68, label: 'Company Alignment' },
  },
  behavioral: {
    hardRequirementMatch: { target: 75, label: 'Hard Requirement Match' },
    evidenceDepth: { target: 78, label: 'Evidence Depth' },
    roundReadiness: { target: 74, label: 'Round Readiness' },
    resumeClarity: { target: 76, label: 'Resume Clarity' },
    companyProxy: { target: 65, label: 'Company Alignment' },
  },
  case: {
    hardRequirementMatch: { target: 78, label: 'Hard Requirement Match' },
    evidenceDepth: { target: 76, label: 'Evidence Depth' },
    roundReadiness: { target: 78, label: 'Round Readiness' },
    resumeClarity: { target: 72, label: 'Resume Clarity' },
    companyProxy: { target: 66, label: 'Company Alignment' },
  },
  finance: {
    hardRequirementMatch: { target: 80, label: 'Hard Requirement Match' },
    evidenceDepth: { target: 76, label: 'Evidence Depth' },
    roundReadiness: { target: 78, label: 'Round Readiness' },
    resumeClarity: { target: 72, label: 'Resume Clarity' },
    companyProxy: { target: 67, label: 'Company Alignment' },
  },
};

// One improvement action per category with estimated impact
const IMPROVEMENT_ACTIONS: Record<string, { action: string; impact: string }> = {
  hardRequirementMatch: {
    action:
      'For each must-have JD skill missing from your resume, add a bullet with a concrete example of adjacent experience — e.g., if the JD says "Kubernetes" and you used Docker Compose, write "orchestrated containerized services" and prepare to discuss the migration path',
    impact: '+5-8 pts',
  },
  evidenceDepth: {
    action:
      'Pick your top 5 resume bullets and add a specific metric to each — if you don\'t have exact numbers, estimate conservatively (e.g., "reduced latency by ~30%" or "served ~10K daily users")',
    impact: '+4-7 pts',
  },
  roundReadiness: {
    action:
      'Do 3 timed practice sessions targeting your weakest question category, recording yourself and reviewing for filler words, vague answers, and missing structure',
    impact: '+6-10 pts',
  },
  resumeClarity: {
    action:
      'Rewrite your top 5 bullets using: [Action verb] + [what you built/did] + [measurable result] — then read each aloud to check it takes under 10 seconds',
    impact: '+3-5 pts',
  },
  companyProxy: {
    action:
      'Find 3 recent engineering blog posts or talks from the company, identify patterns in how they describe their technical challenges, and mirror that language in your resume',
    impact: '+3-6 pts',
  },
};

/**
 * Computes a percentile estimate using a sigmoid mapping.
 * Industry average maps to the 50th percentile, with std dev ~17.
 */
function computePercentile(score: number, industryAvg: number): number {
  const stdDev = 17;
  const z = (score - industryAvg) / stdDev;
  // Sigmoid approximation of normal CDF
  const percentile = 100 / (1 + Math.exp(-1.7 * z));
  return Math.round(Math.min(99, Math.max(1, percentile)));
}

/**
 * Computes Hire Zone analysis — how the candidate's score compares to
 * the target range for historically successful candidates.
 */
export function computeHireZoneAnalysis(
  analysis: LLMAnalysis,
  score: number,
  roundType: RoundType,
  scoreBreakdown: ScoreBreakdown,
  companyDifficulty?: CompanyDifficultyContext
): HireZoneAnalysis {
  const baseThresholds = HIRE_ZONE_THRESHOLDS[roundType];
  const targets = CATEGORY_TARGETS[roundType];

  // Scale thresholds for harder companies
  const factor =
    companyDifficulty && companyDifficulty.tier !== 'STANDARD'
      ? companyDifficulty.adjustmentFactor
      : 1.0;
  const thresholds = {
    min: Math.min(95, Math.round(baseThresholds.min * factor)),
    max: Math.min(100, Math.round(baseThresholds.max * factor)),
    industryAvg: baseThresholds.industryAvg, // unchanged — baseline reference
  };

  // Determine status
  let status: HireZoneStatus;
  if (score >= thresholds.max) {
    status = 'above';
  } else if (score >= thresholds.min) {
    status = 'in_zone';
  } else {
    status = 'below';
  }

  // Gap to hire zone min (0 if already in/above)
  const gap = status === 'below' ? thresholds.min - score : 0;

  // Percentile estimate
  const percentile = computePercentile(score, thresholds.industryAvg);

  // Per-category gap analysis
  const breakdownMap: Record<string, number> = {
    hardRequirementMatch: scoreBreakdown.hardRequirementMatch,
    evidenceDepth: scoreBreakdown.evidenceDepth,
    roundReadiness: scoreBreakdown.roundReadiness,
    resumeClarity: scoreBreakdown.resumeClarity,
    companyProxy: scoreBreakdown.companyProxy,
  };

  const categoryGaps: HireZoneCategoryGap[] = Object.entries(targets)
    .map(([category, { target, label }]) => {
      const currentScore = Math.round(breakdownMap[category] ?? 0);
      const gapPoints = Math.max(0, target - currentScore);
      let priority: 'critical' | 'high' | 'medium';
      if (gapPoints >= 15) priority = 'critical';
      else if (gapPoints >= 8) priority = 'high';
      else priority = 'medium';

      return { category, label, currentScore, targetScore: target, gapPoints, priority };
    })
    .sort((a, b) => b.gapPoints - a.gapPoints);

  // Pick top 3 actions from categories with biggest gaps
  const topActions: HireZoneAction[] = categoryGaps
    .filter((g) => g.gapPoints > 0)
    .slice(0, 3)
    .map((g) => {
      const actionDef = IMPROVEMENT_ACTIONS[g.category];
      return {
        action: actionDef?.action ?? `Improve ${g.label}`,
        category: g.label,
        estimatedImpact: actionDef?.impact ?? '+3-5 pts',
      };
    });

  return {
    hireZoneMin: thresholds.min,
    hireZoneMax: thresholds.max,
    currentScore: score,
    gap,
    percentile,
    status,
    categoryGaps,
    topActions,
    roundType,
    industryAverage: thresholds.industryAvg,
    version: HIRE_ZONE_VERSION,
  };
}
