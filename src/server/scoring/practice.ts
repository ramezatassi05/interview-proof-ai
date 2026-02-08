import type {
  LLMAnalysis,
  ExtractedResume,
  ExtractedJD,
  PracticeSyncIntelligence,
  PrecisionPracticeRx,
  PracticePrescription,
  PracticeType,
  PressureHandlingIndex,
  PressureBand,
  ConsistencyMomentumScore,
  MomentumBand,
  PracticeIntelligence,
} from '@/types';

const PRACTICE_VERSION = 'v0.1';

// ============================================
// 1. Practice Sync Intelligence
// ============================================

function getLevel(score: number): 'low' | 'moderate' | 'high' {
  if (score >= 0.7) return 'high';
  if (score >= 0.4) return 'moderate';
  return 'low';
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
 * Computes coding exposure and mock readiness from LLM analysis.
 * Coding exposure: hardMatch * 0.6 + evidenceDepth * 0.4, penalized by coding-related risks.
 * Mock readiness: clarity * 0.5 + roundReadiness * 0.3 + companyProxy * 0.2.
 */
export function computePracticeSyncIntelligence(
  analysis: LLMAnalysis,
  resume?: ExtractedResume,
  jd?: ExtractedJD
): PracticeSyncIntelligence {
  const { categoryScores, rankedRisks } = analysis;

  // Cross-reference skills for evidence-backed signals
  const matchedMustHaves =
    resume && jd
      ? jd.mustHave.filter((req) =>
          resume.skills.some(
            (s) => normalize(s).includes(normalize(req)) || normalize(req).includes(normalize(s))
          )
        )
      : [];
  const matchedNiceToHaves =
    resume && jd
      ? jd.niceToHave.filter((req) =>
          [...resume.skills, ...resume.recencySignals].some(
            (s) => normalize(s).includes(normalize(req)) || normalize(req).includes(normalize(s))
          )
        )
      : [];

  // Coding exposure
  let codingScore = categoryScores.hardMatch * 0.6 + categoryScores.evidenceDepth * 0.4;

  // Penalize for coding-related risks
  const codingRiskKeywords = [
    'coding',
    'algorithm',
    'data structure',
    'leetcode',
    'technical',
    'implementation',
  ];
  const codingRisks = rankedRisks.filter((r) =>
    codingRiskKeywords.some(
      (kw) => r.title.toLowerCase().includes(kw) || r.rationale.toLowerCase().includes(kw)
    )
  );
  codingScore = Math.max(0, codingScore - codingRisks.length * 0.05);
  codingScore = Math.round(codingScore * 100) / 100;

  const codingSignals: string[] = [];
  if (categoryScores.hardMatch >= 0.7) {
    codingSignals.push(
      jd && matchedMustHaves.length > 0
        ? `Strong technical skills alignment — matched ${matchedMustHaves.join(', ')} from JD must-haves`
        : 'Strong technical skills alignment'
    );
  }
  if (categoryScores.hardMatch < 0.4) {
    codingSignals.push(
      jd && jd.mustHave.length > 0
        ? `Technical skills gap detected — missing key JD requirements: ${jd.mustHave
            .filter((r) => !matchedMustHaves.includes(r))
            .slice(0, 3)
            .join(', ')}`
        : 'Technical skills gap detected'
    );
  }
  if (categoryScores.evidenceDepth >= 0.7) {
    codingSignals.push(
      resume && resume.metrics.length > 0
        ? `Well-documented coding evidence — ${resume.metrics.length} quantified metrics including: ${resume.metrics.slice(0, 2).join('; ')}`
        : 'Well-documented coding evidence'
    );
  }
  if (categoryScores.evidenceDepth < 0.4) {
    codingSignals.push(
      resume
        ? `Limited coding evidence — only ${resume.metrics.length} quantified metric${resume.metrics.length !== 1 ? 's' : ''} found in resume`
        : 'Limited coding evidence in resume'
    );
  }
  if (codingRisks.length > 0)
    codingSignals.push(`${codingRisks.length} coding-related risk(s) flagged`);

  // Mock readiness
  let mockScore =
    categoryScores.clarity * 0.5 +
    categoryScores.roundReadiness * 0.3 +
    categoryScores.companyProxy * 0.2;
  mockScore = Math.round(mockScore * 100) / 100;

  const mockSignals: string[] = [];
  if (categoryScores.clarity >= 0.7) {
    mockSignals.push(
      resume && resume.projectEvidence.length > 0
        ? `Clear communication style — ${resume.projectEvidence.length} well-described project${resume.projectEvidence.length !== 1 ? 's' : ''} in resume`
        : 'Clear communication style detected'
    );
  }
  if (categoryScores.clarity < 0.4) mockSignals.push('Communication clarity needs work');
  if (categoryScores.roundReadiness >= 0.7)
    mockSignals.push('Good round-specific preparation signals');
  if (categoryScores.roundReadiness < 0.4) mockSignals.push('Interview readiness signals are weak');
  if (categoryScores.companyProxy >= 0.6) {
    mockSignals.push(
      jd && matchedNiceToHaves.length > 0
        ? `Culture fit alignment — ${matchedNiceToHaves.length} of ${jd.niceToHave.length} nice-to-have skills present: ${matchedNiceToHaves.join(', ')}`
        : 'Positive culture fit indicators'
    );
  }

  // Overall practice readiness (blend of both)
  const overallPracticeReadiness = Math.round((codingScore * 0.5 + mockScore * 0.5) * 100);

  // Recommendation based on relative scores
  let recommendation: string;
  if (codingScore < 0.4 && mockScore < 0.4) {
    recommendation =
      'Both coding practice and mock interviews need significant attention. Start with coding fundamentals, then layer in mock sessions.';
  } else if (codingScore < mockScore - 0.15) {
    recommendation =
      'Your communication readiness outpaces your coding exposure. Prioritize coding practice and problem-solving drills.';
  } else if (mockScore < codingScore - 0.15) {
    recommendation =
      'Your technical preparation is ahead of your interview delivery. Focus on mock interviews and presentation skills.';
  } else if (overallPracticeReadiness >= 70) {
    recommendation =
      'Practice readiness is solid. Fine-tune with targeted mock interviews and edge-case coding challenges.';
  } else {
    recommendation =
      'Balanced practice across coding and mock interviews recommended. Alternate daily between technical drills and interview simulations.';
  }

  return {
    codingExposure: {
      score: codingScore,
      level: getLevel(codingScore),
      signals: codingSignals,
    },
    mockReadiness: {
      score: mockScore,
      level: getLevel(mockScore),
      signals: mockSignals,
    },
    overallPracticeReadiness,
    recommendation,
    version: PRACTICE_VERSION,
  };
}

// ============================================
// 2. Precision Practice Rx
// ============================================

/**
 * Infers practice type from risk text keywords.
 */
function inferPracticeType(risk: LLMAnalysis['rankedRisks'][0]): PracticeType {
  const text = `${risk.title} ${risk.rationale}`.toLowerCase();

  if (
    text.includes('coding') ||
    text.includes('algorithm') ||
    text.includes('data structure') ||
    text.includes('leetcode')
  ) {
    return 'coding';
  }
  if (
    text.includes('behavioral') ||
    text.includes('communication') ||
    text.includes('storytelling') ||
    text.includes('star')
  ) {
    return 'mock_interview';
  }
  if (text.includes('system design') || text.includes('architecture') || text.includes('scalab')) {
    return 'project';
  }
  if (text.includes('practice') || text.includes('preparation') || text.includes('mock')) {
    return 'drill';
  }
  return 'review';
}

/**
 * Maps severity to session count and difficulty.
 */
function getSeverityConfig(severity: string): {
  sessions: number;
  minutesPerSession: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  priority: 'critical' | 'high' | 'medium';
} {
  switch (severity) {
    case 'critical':
      return { sessions: 8, minutesPerSession: 45, difficulty: 'advanced', priority: 'critical' };
    case 'high':
      return { sessions: 5, minutesPerSession: 40, difficulty: 'intermediate', priority: 'high' };
    default:
      return { sessions: 3, minutesPerSession: 30, difficulty: 'beginner', priority: 'medium' };
  }
}

/**
 * Generates targeted practice prescriptions from ranked risks.
 * Iterates up to 6 risks, creating one PracticePrescription per risk.
 */
export function computePracticeRx(analysis: LLMAnalysis): PrecisionPracticeRx {
  const risks = analysis.rankedRisks.slice(0, 6);

  const prescriptions: PracticePrescription[] = risks.map((risk, index) => {
    const practiceType = inferPracticeType(risk);
    const config = getSeverityConfig(risk.severity);

    return {
      id: `rx-${index + 1}`,
      title: getPrescriptionTitle(practiceType, risk.title),
      targetGap: risk.title,
      mappedRiskId: risk.id,
      practiceType,
      estimatedSessions: config.sessions,
      estimatedMinutesPerSession: config.minutesPerSession,
      difficulty: config.difficulty,
      priority: config.priority,
      rationale: risk.rationale,
    };
  });

  // Calculate total hours
  const totalMinutes = prescriptions.reduce(
    (sum, rx) => sum + rx.estimatedSessions * rx.estimatedMinutesPerSession,
    0
  );
  const totalEstimatedHours = Math.round((totalMinutes / 60) * 10) / 10;

  // Build focus summary from top priorities
  const criticalCount = prescriptions.filter((p) => p.priority === 'critical').length;
  const highCount = prescriptions.filter((p) => p.priority === 'high').length;
  const parts: string[] = [];
  if (criticalCount > 0) parts.push(`${criticalCount} critical-priority prescription(s)`);
  if (highCount > 0) parts.push(`${highCount} high-priority prescription(s)`);
  const focusSummary =
    parts.length > 0
      ? `Your plan includes ${parts.join(' and ')}, totaling ~${totalEstimatedHours} hours of targeted practice.`
      : `${prescriptions.length} prescriptions totaling ~${totalEstimatedHours} hours of balanced practice.`;

  return {
    prescriptions,
    totalEstimatedHours,
    focusSummary,
    version: PRACTICE_VERSION,
  };
}

/**
 * Generates a prescription title based on practice type and risk.
 */
function getPrescriptionTitle(practiceType: PracticeType, riskTitle: string): string {
  const prefixes: Record<PracticeType, string> = {
    coding: 'Coding Drill:',
    mock_interview: 'Mock Interview:',
    review: 'Concept Review:',
    drill: 'Practice Drill:',
    project: 'Design Exercise:',
  };
  // Truncate risk title if too long
  const shortTitle = riskTitle.length > 50 ? riskTitle.slice(0, 47) + '...' : riskTitle;
  return `${prefixes[practiceType]} ${shortTitle}`;
}

// ============================================
// 3. Pressure Handling Index
// ============================================

const PRESSURE_DIMENSION_LABELS: Record<keyof PressureHandlingIndex['dimensions'], string> = {
  timeConstraintResilience: 'Time Constraint Resilience',
  ambiguityTolerance: 'Ambiguity Tolerance',
  technicalConfidence: 'Technical Confidence',
  communicationUnderStress: 'Communication Under Stress',
};

const PRESSURE_COACHING: Record<keyof PressureHandlingIndex['dimensions'], string> = {
  timeConstraintResilience:
    'Practice timed coding challenges and mock interviews with strict time limits to build speed under pressure.',
  ambiguityTolerance:
    'Work on open-ended problems without clear constraints. Practice asking clarifying questions before diving in.',
  technicalConfidence:
    'Deepen your fundamentals in core areas. Confidence comes from mastery — drill until concepts feel automatic.',
  communicationUnderStress:
    'Record yourself explaining solutions under time pressure. Practice structured responses (situation, approach, result).',
};

/**
 * Computes a 0-100 pressure handling index from category scores and risk profile.
 * 4 dimensions blended from categoryScores, penalized by critical/high risks.
 */
export function computePressureIndex(analysis: LLMAnalysis): PressureHandlingIndex {
  const { categoryScores, rankedRisks } = analysis;

  // Compute 4 dimensions
  let timeConstraintResilience =
    categoryScores.roundReadiness * 0.6 + categoryScores.hardMatch * 0.4;
  let ambiguityTolerance =
    categoryScores.companyProxy * 0.4 +
    categoryScores.clarity * 0.3 +
    categoryScores.evidenceDepth * 0.3;
  let technicalConfidence = categoryScores.hardMatch * 0.7 + categoryScores.evidenceDepth * 0.3;
  let communicationUnderStress =
    categoryScores.clarity * 0.6 +
    categoryScores.roundReadiness * 0.2 +
    categoryScores.companyProxy * 0.2;

  // Risk penalty
  const criticalRisks = rankedRisks.filter((r) => r.severity === 'critical').length;
  const highRisks = rankedRisks.filter((r) => r.severity === 'high').length;
  const penalty = criticalRisks * 0.03 + highRisks * 0.015;

  timeConstraintResilience = Math.max(
    0,
    Math.round((timeConstraintResilience - penalty) * 100) / 100
  );
  ambiguityTolerance = Math.max(0, Math.round((ambiguityTolerance - penalty) * 100) / 100);
  technicalConfidence = Math.max(0, Math.round((technicalConfidence - penalty) * 100) / 100);
  communicationUnderStress = Math.max(
    0,
    Math.round((communicationUnderStress - penalty) * 100) / 100
  );

  const dimensions = {
    timeConstraintResilience,
    ambiguityTolerance,
    technicalConfidence,
    communicationUnderStress,
  };

  // Weighted average for overall score
  const overall =
    timeConstraintResilience * 0.3 +
    ambiguityTolerance * 0.2 +
    technicalConfidence * 0.3 +
    communicationUnderStress * 0.2;
  const score = Math.round(overall * 100);

  // Band thresholds
  let band: PressureBand;
  if (score >= 80) band = 'elite';
  else if (score >= 60) band = 'high';
  else if (score >= 40) band = 'moderate';
  else band = 'low';

  // Find weakest and strongest
  const entries = Object.entries(dimensions) as [keyof typeof dimensions, number][];
  const weakest = entries.reduce((min, curr) => (curr[1] < min[1] ? curr : min));
  const strongest = entries.reduce((max, curr) => (curr[1] > max[1] ? curr : max));

  const weakestDimension = PRESSURE_DIMENSION_LABELS[weakest[0]];
  const strongestDimension = PRESSURE_DIMENSION_LABELS[strongest[0]];
  const coachingNote = PRESSURE_COACHING[weakest[0]];

  return {
    score,
    band,
    dimensions,
    weakestDimension,
    strongestDimension,
    coachingNote,
    version: PRACTICE_VERSION,
  };
}

// ============================================
// 4. Consistency & Momentum Score
// ============================================

/**
 * Computes consistency & momentum score from LLM analysis signals.
 * 4 signal blends with bonus for study plan length.
 */
export function computeConsistencyMomentum(
  analysis: LLMAnalysis,
  resume?: ExtractedResume
): ConsistencyMomentumScore {
  const { categoryScores, studyPlan, rankedRisks } = analysis;

  // Signal blends
  let skillBreadth =
    categoryScores.hardMatch * 0.4 +
    categoryScores.companyProxy * 0.3 +
    categoryScores.clarity * 0.3;

  let evidenceRecency = categoryScores.evidenceDepth * 0.6 + categoryScores.roundReadiness * 0.4;

  let depthVsBreadth = categoryScores.hardMatch * 0.5 + categoryScores.evidenceDepth * 0.5;

  let progressionClarity =
    categoryScores.clarity * 0.4 +
    categoryScores.roundReadiness * 0.3 +
    categoryScores.evidenceDepth * 0.3;

  // Bonus if studyPlan length >= 5
  if (studyPlan.length >= 5) {
    const bonus = Math.min((studyPlan.length - 4) * 0.05, 0.15);
    skillBreadth = Math.min(1.0, skillBreadth + bonus);
    evidenceRecency = Math.min(1.0, evidenceRecency + bonus);
    depthVsBreadth = Math.min(1.0, depthVsBreadth + bonus);
    progressionClarity = Math.min(1.0, progressionClarity + bonus);
  }

  // Round to 2 decimals
  skillBreadth = Math.round(skillBreadth * 100) / 100;
  evidenceRecency = Math.round(evidenceRecency * 100) / 100;
  depthVsBreadth = Math.round(depthVsBreadth * 100) / 100;
  progressionClarity = Math.round(progressionClarity * 100) / 100;

  const signals = { skillBreadth, evidenceRecency, depthVsBreadth, progressionClarity };

  // Overall = average * 100
  const average = (skillBreadth + evidenceRecency + depthVsBreadth + progressionClarity) / 4;
  const score = Math.round(average * 100);

  // Band thresholds
  let band: MomentumBand;
  if (score >= 75) band = 'strong_momentum';
  else if (score >= 55) band = 'steady';
  else if (score >= 35) band = 'inconsistent';
  else band = 'stalled';

  // Insights based on relative signal strengths (evidence-backed when resume data available)
  const uniqueCompanies = resume ? new Set(resume.experiences.map((e) => e.company)).size : 0;
  const insights: string[] = [];
  if (skillBreadth >= 0.7) {
    insights.push(
      resume
        ? `Broad skill coverage (${resume.skills.length} skills across ${uniqueCompanies} role${uniqueCompanies !== 1 ? 's' : ''}) signals well-rounded preparation`
        : 'Broad skill coverage signals well-rounded preparation'
    );
  }
  if (skillBreadth < 0.4)
    insights.push('Narrow skill coverage — consider expanding practice areas');
  if (evidenceRecency >= 0.7) {
    insights.push(
      resume && resume.recencySignals.length > 0
        ? `Recent experience signals: ${resume.recencySignals.slice(0, 3).join(', ')}`
        : 'Strong evidence of recent, relevant experience'
    );
  }
  if (evidenceRecency < 0.4)
    insights.push('Evidence may appear dated — refresh with recent examples');
  if (depthVsBreadth >= 0.7) {
    insights.push(
      resume && resume.metrics.length > 0
        ? `Good depth with ${resume.metrics.length} quantified achievement${resume.metrics.length !== 1 ? 's' : ''} backing technical claims`
        : 'Good balance of depth and breadth in technical areas'
    );
  }
  if (depthVsBreadth < 0.4) insights.push('Consider going deeper in your strongest technical area');
  if (progressionClarity >= 0.7) {
    insights.push(
      resume && resume.experiences.length > 1
        ? `Career progression across ${resume.experiences.length} roles tells a clear story`
        : 'Career progression tells a clear story'
    );
  }
  if (progressionClarity < 0.4)
    insights.push('Career narrative could be clearer — practice your story');

  // Add risk-based insight
  const criticalRiskCount = rankedRisks.filter((r) => r.severity === 'critical').length;
  if (criticalRiskCount >= 3) {
    insights.push('Multiple critical gaps suggest inconsistent preparation across areas');
  }

  // Recommendation
  let recommendation: string;
  if (score >= 75) {
    recommendation =
      'Strong momentum — maintain your current preparation cadence and focus on peak performance for interview day.';
  } else if (score >= 55) {
    recommendation =
      'Steady progress. Increase consistency by setting daily practice targets and tracking completion.';
  } else if (score >= 35) {
    recommendation =
      'Preparation is inconsistent. Create a structured daily schedule and commit to at least one focused practice session per day.';
  } else {
    recommendation =
      'Preparation momentum is stalled. Start with small, achievable daily goals (30 min) and build gradually. Focus on one area at a time.';
  }

  return {
    score,
    band,
    signals,
    insights,
    recommendation,
    version: PRACTICE_VERSION,
  };
}

// ============================================
// Convenience Wrapper
// ============================================

/**
 * Computes all practice intelligence features from LLM analysis.
 * Deterministic — same inputs always produce same outputs.
 */
export function computePracticeIntelligence(
  analysis: LLMAnalysis,
  resume?: ExtractedResume,
  jd?: ExtractedJD
): PracticeIntelligence {
  const practiceSync = computePracticeSyncIntelligence(analysis, resume, jd);
  const practiceRx = computePracticeRx(analysis);
  const pressureIndex = computePressureIndex(analysis);
  const consistencyMomentum = computeConsistencyMomentum(analysis, resume);

  return {
    practiceSync,
    practiceRx,
    pressureIndex,
    consistencyMomentum,
    generatedAt: new Date().toISOString(),
    version: PRACTICE_VERSION,
  };
}
