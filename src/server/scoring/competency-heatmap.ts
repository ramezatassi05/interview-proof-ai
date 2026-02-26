import type {
  LLMAnalysis,
  ScoreBreakdown,
  ExtractedJD,
  ExtractedResume,
  RoundType,
  CompanyDifficultyContext,
  CompetencyLevel,
  GapStatus,
  InferredSeniority,
  CompetencyHeatmapEntry,
  CompetencyHeatmapData,
} from '@/types';

const HEATMAP_VERSION = 'v0.1';

// 8 competency domains with weighted category contributions
const DOMAIN_WEIGHTS: Record<
  string,
  Partial<Record<'hardMatch' | 'evidenceDepth' | 'roundReadiness' | 'clarity' | 'companyProxy', number>>
> = {
  'System Design':       { hardMatch: 0.30, evidenceDepth: 0.25, roundReadiness: 0.35, companyProxy: 0.10 },
  'Coding / Algorithms': { hardMatch: 0.50, evidenceDepth: 0.20, roundReadiness: 0.30 },
  'Behavioral':          { evidenceDepth: 0.30, clarity: 0.40, companyProxy: 0.30 },
  'Communication':       { evidenceDepth: 0.20, clarity: 0.60, companyProxy: 0.20 },
  'Domain Knowledge':    { hardMatch: 0.45, evidenceDepth: 0.35, companyProxy: 0.20 },
  'Technical Depth':     { hardMatch: 0.40, evidenceDepth: 0.40, roundReadiness: 0.20 },
  'Problem Solving':     { hardMatch: 0.25, evidenceDepth: 0.15, roundReadiness: 0.40, clarity: 0.20 },
  'Leadership / Collab': { evidenceDepth: 0.35, clarity: 0.30, companyProxy: 0.35 },
};

// Keywords for matching risks to domains
const DOMAIN_KEYWORDS: Record<string, string[]> = {
  'System Design':       ['system design', 'architecture', 'scalab', 'distributed', 'infra'],
  'Coding / Algorithms': ['coding', 'algorithm', 'data structure', 'leetcode', 'dsa', 'implementation'],
  'Behavioral':          ['behavioral', 'culture', 'teamwork', 'conflict', 'star method'],
  'Communication':       ['communication', 'clarity', 'articula', 'presentation', 'explain'],
  'Domain Knowledge':    ['domain', 'industry', 'specific knowledge', 'expertise', 'specializ'],
  'Technical Depth':     ['technical depth', 'deep understanding', 'fundamentals', 'core concepts'],
  'Problem Solving':     ['problem solving', 'analytical', 'approach', 'structur', 'reasoning'],
  'Leadership / Collab': ['leadership', 'collaborat', 'mentor', 'team lead', 'cross-functional'],
};

// Target benchmark per seniority level per domain
const SENIORITY_BENCHMARKS: Record<InferredSeniority, Record<string, CompetencyLevel>> = {
  'Intern': {
    'System Design': 'Beginner', 'Coding / Algorithms': 'Intermediate', 'Behavioral': 'Beginner',
    'Communication': 'Beginner', 'Domain Knowledge': 'Beginner', 'Technical Depth': 'Beginner',
    'Problem Solving': 'Intermediate', 'Leadership / Collab': 'Beginner',
  },
  'Junior': {
    'System Design': 'Beginner', 'Coding / Algorithms': 'Intermediate', 'Behavioral': 'Intermediate',
    'Communication': 'Intermediate', 'Domain Knowledge': 'Beginner', 'Technical Depth': 'Intermediate',
    'Problem Solving': 'Intermediate', 'Leadership / Collab': 'Beginner',
  },
  'Mid-Level': {
    'System Design': 'Intermediate', 'Coding / Algorithms': 'High', 'Behavioral': 'Intermediate',
    'Communication': 'Intermediate', 'Domain Knowledge': 'Intermediate', 'Technical Depth': 'High',
    'Problem Solving': 'High', 'Leadership / Collab': 'Intermediate',
  },
  'Senior': {
    'System Design': 'High', 'Coding / Algorithms': 'High', 'Behavioral': 'High',
    'Communication': 'High', 'Domain Knowledge': 'High', 'Technical Depth': 'High',
    'Problem Solving': 'High', 'Leadership / Collab': 'High',
  },
  'Staff+': {
    'System Design': 'Expert', 'Coding / Algorithms': 'High', 'Behavioral': 'Expert',
    'Communication': 'Expert', 'Domain Knowledge': 'Expert', 'Technical Depth': 'Expert',
    'Problem Solving': 'Expert', 'Leadership / Collab': 'Expert',
  },
  'Unknown': {
    'System Design': 'Intermediate', 'Coding / Algorithms': 'Intermediate', 'Behavioral': 'Intermediate',
    'Communication': 'Intermediate', 'Domain Knowledge': 'Intermediate', 'Technical Depth': 'Intermediate',
    'Problem Solving': 'Intermediate', 'Leadership / Collab': 'Intermediate',
  },
};

const LEVEL_TO_SCORE: Record<CompetencyLevel, number> = {
  'Beginner': 30,
  'Intermediate': 55,
  'High': 75,
  'Expert': 90,
};

function scoreToLevel(score: number): CompetencyLevel {
  if (score >= 80) return 'Expert';
  if (score >= 60) return 'High';
  if (score >= 35) return 'Intermediate';
  return 'Beginner';
}

function inferSeniority(extractedJD: ExtractedJD): { seniority: InferredSeniority; label: string } {
  const signals = (extractedJD.senioritySignals ?? []).map(s => s.toLowerCase());
  const title = (extractedJD.jobTitle ?? '').toLowerCase();
  const combined = [...signals, title].join(' ');

  if (/\b(staff|principal|l7|l8|distinguished)\b/.test(combined)) {
    return { seniority: 'Staff+', label: 'L7+ / Staff Level' };
  }
  if (/\b(senior|sr\.|l5|l6|lead)\b/.test(combined)) {
    return { seniority: 'Senior', label: 'L5-L6 / Senior Level' };
  }
  if (/\b(mid|intermediate|l4)\b/.test(combined)) {
    return { seniority: 'Mid-Level', label: 'L4 / Mid-Level' };
  }
  if (/\b(junior|jr\.|entry|l3|new grad)\b/.test(combined)) {
    return { seniority: 'Junior', label: 'L3 / Junior Level' };
  }
  if (/\bintern\b/.test(combined)) {
    return { seniority: 'Intern', label: 'Intern Level' };
  }
  return { seniority: 'Unknown', label: 'General Benchmark' };
}

function computeGapStatus(gapPoints: number): GapStatus {
  if (gapPoints >= 20) return 'Critical';
  if (gapPoints >= 8) return 'Warning';
  return 'Pass';
}

export function computeCompetencyHeatmap(
  analysis: LLMAnalysis,
  scoreBreakdown: ScoreBreakdown,
  extractedJD: ExtractedJD,
  _extractedResume: ExtractedResume,
  _roundType: RoundType,
  companyDifficulty?: CompanyDifficultyContext
): CompetencyHeatmapData {
  const { rankedRisks } = analysis;

  // Map category scores to 0-100 scale
  const catScores = {
    hardMatch: scoreBreakdown.hardRequirementMatch,
    evidenceDepth: scoreBreakdown.evidenceDepth,
    roundReadiness: scoreBreakdown.roundReadiness,
    clarity: scoreBreakdown.resumeClarity,
    companyProxy: scoreBreakdown.companyProxy,
  };

  // Infer seniority
  const { seniority, label: seniorityLabel } = inferSeniority(extractedJD);
  const benchmarks = SENIORITY_BENCHMARKS[seniority];

  const entries: CompetencyHeatmapEntry[] = [];

  for (const [domain, weights] of Object.entries(DOMAIN_WEIGHTS)) {
    // Compute weighted raw score
    let rawScore = 0;
    for (const [cat, weight] of Object.entries(weights)) {
      const catKey = cat as keyof typeof catScores;
      rawScore += (catScores[catKey] ?? 0) * (weight as number);
    }

    // Apply risk penalty
    const keywords = DOMAIN_KEYWORDS[domain] ?? [];
    let criticalRiskCount = 0;
    let highRiskCount = 0;
    for (const risk of rankedRisks) {
      const text = `${risk.title} ${risk.rationale}`.toLowerCase();
      const matches = keywords.some(kw => text.includes(kw));
      if (matches) {
        if (risk.severity === 'critical') criticalRiskCount++;
        else if (risk.severity === 'high') highRiskCount++;
      }
    }
    rawScore -= (criticalRiskCount * 5) + (highRiskCount * 2);

    // Apply company difficulty adjustment
    if (companyDifficulty && companyDifficulty.tier !== 'STANDARD') {
      rawScore *= (2 - companyDifficulty.adjustmentFactor);
    }

    rawScore = Math.max(0, Math.min(100, Math.round(rawScore)));

    const yourLevel = scoreToLevel(rawScore);
    const targetBenchmark = benchmarks[domain] ?? 'Intermediate';
    const targetScore = LEVEL_TO_SCORE[targetBenchmark];
    const gapPoints = Math.max(0, targetScore - rawScore);
    const gapStatus = computeGapStatus(gapPoints);

    entries.push({
      domain,
      rawScore,
      yourLevel,
      targetBenchmark,
      targetScore,
      gapStatus,
      gapPoints,
    });
  }

  // Sort: Critical first, then Warning, then Pass (by gapPoints desc within group)
  const statusOrder: Record<GapStatus, number> = { 'Critical': 0, 'Warning': 1, 'Pass': 2 };
  entries.sort((a, b) => {
    const statusDiff = statusOrder[a.gapStatus] - statusOrder[b.gapStatus];
    if (statusDiff !== 0) return statusDiff;
    return b.gapPoints - a.gapPoints;
  });

  const criticalGaps = entries.filter(e => e.gapStatus === 'Critical').length;
  const warningGaps = entries.filter(e => e.gapStatus === 'Warning').length;
  const passCount = entries.filter(e => e.gapStatus === 'Pass').length;

  return {
    entries,
    inferredSeniority: seniority,
    seniorityLabel,
    totalDomains: entries.length,
    criticalGaps,
    warningGaps,
    passCount,
    version: HEATMAP_VERSION,
  };
}
