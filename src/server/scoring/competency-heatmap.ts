import type {
  LLMAnalysis,
  ScoreBreakdown,
  ExtractedJD,
  ExtractedResume,
  RoundType,
  CompanyDifficultyContext,
  CompanyTier,
  CompetencyLevel,
  GapStatus,
  InferredSeniority,
  RoleType,
  BenchmarkConfidence,
  BenchmarkMatchLevel,
  CompetencyHeatmapEntry,
  CompetencyHeatmapData,
} from '@/types';
import { normalizeCompanyName } from './company-difficulty';

const HEATMAP_VERSION = 'v0.2';

// ── Domain weights (unchanged) ──────────────────────────────────────────
const DOMAIN_WEIGHTS: Record<
  string,
  Partial<Record<'hardMatch' | 'evidenceDepth' | 'roundReadiness' | 'clarity' | 'companyProxy', number>>
> = {
  'System Design': {
    hardMatch: 0.3,
    evidenceDepth: 0.25,
    roundReadiness: 0.35,
    companyProxy: 0.1,
  },
  'Coding / Algorithms': { hardMatch: 0.5, evidenceDepth: 0.2, roundReadiness: 0.3 },
  Behavioral: { evidenceDepth: 0.3, clarity: 0.4, companyProxy: 0.3 },
  Communication: { evidenceDepth: 0.2, clarity: 0.6, companyProxy: 0.2 },
  'Domain Knowledge': { hardMatch: 0.45, evidenceDepth: 0.35, companyProxy: 0.2 },
  'Technical Depth': { hardMatch: 0.4, evidenceDepth: 0.4, roundReadiness: 0.2 },
  'Problem Solving': { hardMatch: 0.25, evidenceDepth: 0.15, roundReadiness: 0.4, clarity: 0.2 },
  'Leadership / Collab': { evidenceDepth: 0.35, clarity: 0.3, companyProxy: 0.35 },
};

const DOMAIN_KEYWORDS: Record<string, string[]> = {
  'System Design': ['system design', 'architecture', 'scalab', 'distributed', 'infra'],
  'Coding / Algorithms': [
    'coding',
    'algorithm',
    'data structure',
    'leetcode',
    'dsa',
    'implementation',
  ],
  Behavioral: ['behavioral', 'culture', 'teamwork', 'conflict', 'star method'],
  Communication: ['communication', 'clarity', 'articula', 'presentation', 'explain'],
  'Domain Knowledge': ['domain', 'industry', 'specific knowledge', 'expertise', 'specializ'],
  'Technical Depth': ['technical depth', 'deep understanding', 'fundamentals', 'core concepts'],
  'Problem Solving': ['problem solving', 'analytical', 'approach', 'structur', 'reasoning'],
  'Leadership / Collab': [
    'leadership',
    'collaborat',
    'mentor',
    'team lead',
    'cross-functional',
  ],
};

// ── Calibrated base benchmarks (numeric scores, not levels) ─────────────
// Better calibrated starting points per seniority per domain
const CALIBRATED_BASE_BENCHMARKS: Record<InferredSeniority, Record<string, number>> = {
  Intern: {
    'System Design': 25,
    'Coding / Algorithms': 50,
    Behavioral: 30,
    Communication: 30,
    'Domain Knowledge': 25,
    'Technical Depth': 35,
    'Problem Solving': 45,
    'Leadership / Collab': 20,
  },
  Junior: {
    'System Design': 35,
    'Coding / Algorithms': 55,
    Behavioral: 45,
    Communication: 45,
    'Domain Knowledge': 35,
    'Technical Depth': 50,
    'Problem Solving': 55,
    'Leadership / Collab': 30,
  },
  'Mid-Level': {
    'System Design': 55,
    'Coding / Algorithms': 65,
    Behavioral: 55,
    Communication: 55,
    'Domain Knowledge': 55,
    'Technical Depth': 65,
    'Problem Solving': 65,
    'Leadership / Collab': 50,
  },
  Senior: {
    'System Design': 72,
    'Coding / Algorithms': 72,
    Behavioral: 70,
    Communication: 70,
    'Domain Knowledge': 72,
    'Technical Depth': 75,
    'Problem Solving': 75,
    'Leadership / Collab': 70,
  },
  'Staff+': {
    'System Design': 88,
    'Coding / Algorithms': 75,
    Behavioral: 85,
    Communication: 88,
    'Domain Knowledge': 88,
    'Technical Depth': 90,
    'Problem Solving': 88,
    'Leadership / Collab': 90,
  },
  Unknown: {
    'System Design': 50,
    'Coding / Algorithms': 55,
    Behavioral: 50,
    Communication: 50,
    'Domain Knowledge': 50,
    'Technical Depth': 55,
    'Problem Solving': 55,
    'Leadership / Collab': 45,
  },
};

// ── Tier benchmark multipliers ──────────────────────────────────────────
// Raise targets for harder companies
const TIER_BENCHMARK_MULTIPLIERS: Record<CompanyTier, number> = {
  FAANG_PLUS: 1.3,
  BIG_TECH: 1.18,
  TOP_FINANCE: 1.22,
  UNICORN: 1.12,
  GROWTH: 1.05,
  STANDARD: 1.0,
};

// ── Role-type domain multipliers ────────────────────────────────────────
// Adjust targets based on what the role emphasizes
const ROLE_DOMAIN_MULTIPLIERS: Record<RoleType, Partial<Record<string, number>>> = {
  backend: {
    'System Design': 1.15,
    'Coding / Algorithms': 1.1,
    'Technical Depth': 1.1,
  },
  frontend: {
    Communication: 1.1,
    'Domain Knowledge': 1.05,
    'System Design': 0.9,
  },
  fullstack: {
    'System Design': 1.05,
    'Coding / Algorithms': 1.05,
    'Domain Knowledge': 1.05,
  },
  ml_ai: {
    'Technical Depth': 1.2,
    'Domain Knowledge': 1.15,
    'Coding / Algorithms': 1.05,
    'System Design': 0.95,
  },
  data: {
    'Domain Knowledge': 1.15,
    'Technical Depth': 1.1,
    'Problem Solving': 1.1,
  },
  devops_infra: {
    'System Design': 1.2,
    'Technical Depth': 1.1,
    'Coding / Algorithms': 0.9,
  },
  mobile: {
    'Domain Knowledge': 1.1,
    'Technical Depth': 1.05,
    'System Design': 0.9,
  },
  systems: {
    'System Design': 1.15,
    'Technical Depth': 1.15,
    'Coding / Algorithms': 1.1,
  },
  security: {
    'Technical Depth': 1.2,
    'Domain Knowledge': 1.15,
    'System Design': 1.05,
  },
  management: {
    'Leadership / Collab': 1.2,
    Communication: 1.15,
    Behavioral: 1.1,
    'Coding / Algorithms': 0.8,
  },
  general: {},
};

// ── Role type display labels ────────────────────────────────────────────
const ROLE_TYPE_LABELS: Record<RoleType, string> = {
  backend: 'Backend',
  frontend: 'Frontend',
  fullstack: 'Full-Stack',
  ml_ai: 'ML / AI',
  data: 'Data',
  devops_infra: 'DevOps / Infra',
  mobile: 'Mobile',
  systems: 'Systems',
  security: 'Security',
  management: 'Engineering Management',
  general: 'General',
};

// ── Role classification ─────────────────────────────────────────────────

interface RoleSignalPattern {
  roleType: RoleType;
  keywords: string[];
  weight: number; // higher = stronger signal
}

const ROLE_SIGNAL_PATTERNS: RoleSignalPattern[] = [
  {
    roleType: 'ml_ai',
    keywords: [
      'machine learning',
      'deep learning',
      'pytorch',
      'tensorflow',
      'nlp',
      'computer vision',
      'neural network',
      'model training',
      'llm',
      'reinforcement learning',
      'ml engineer',
      'ai engineer',
      'data scientist',
      'ml ops',
      'feature engineering',
    ],
    weight: 3,
  },
  {
    roleType: 'data',
    keywords: [
      'data engineer',
      'data pipeline',
      'etl',
      'data warehouse',
      'bigquery',
      'redshift',
      'snowflake',
      'dbt',
      'apache spark',
      'kafka',
      'airflow',
      'data lake',
      'analytics engineer',
    ],
    weight: 2,
  },
  {
    roleType: 'devops_infra',
    keywords: [
      'devops',
      'sre',
      'site reliability',
      'infrastructure',
      'terraform',
      'kubernetes',
      'k8s',
      'docker',
      'ci/cd',
      'aws',
      'gcp',
      'azure',
      'cloud engineer',
      'platform engineer',
      'helm',
      'ansible',
    ],
    weight: 2,
  },
  {
    roleType: 'mobile',
    keywords: [
      'ios',
      'android',
      'swift',
      'kotlin',
      'react native',
      'flutter',
      'mobile engineer',
      'mobile developer',
      'xcode',
      'swiftui',
      'jetpack compose',
    ],
    weight: 2,
  },
  {
    roleType: 'security',
    keywords: [
      'security engineer',
      'cybersecurity',
      'penetration test',
      'vulnerability',
      'infosec',
      'soc',
      'threat',
      'incident response',
      'appsec',
      'application security',
    ],
    weight: 2,
  },
  {
    roleType: 'systems',
    keywords: [
      'systems engineer',
      'embedded',
      'firmware',
      'kernel',
      'operating system',
      'low-level',
      'c++',
      'rust',
      'real-time',
      'fpga',
      'hardware',
      'driver',
    ],
    weight: 2,
  },
  {
    roleType: 'management',
    keywords: [
      'engineering manager',
      'tech lead',
      'technical lead',
      'director of engineering',
      'vp of engineering',
      'head of engineering',
      'people management',
      'team lead',
      'staff manager',
    ],
    weight: 3,
  },
  {
    roleType: 'frontend',
    keywords: [
      'frontend',
      'front-end',
      'front end',
      'react',
      'vue',
      'angular',
      'css',
      'html',
      'javascript',
      'typescript',
      'ui engineer',
      'ui developer',
      'web developer',
      'next.js',
      'tailwind',
    ],
    weight: 1,
  },
  {
    roleType: 'backend',
    keywords: [
      'backend',
      'back-end',
      'back end',
      'api',
      'microservice',
      'server-side',
      'node.js',
      'java',
      'python',
      'golang',
      'go',
      'ruby',
      'rest api',
      'graphql',
      'database',
      'sql',
      'postgresql',
    ],
    weight: 1,
  },
];

/**
 * Classifies the role type from JD data using deterministic keyword matching.
 * No LLM involved — pure pattern matching with weighted scoring.
 */
export function classifyRoleType(extractedJD: ExtractedJD): RoleType {
  const text = [
    extractedJD.jobTitle ?? '',
    ...extractedJD.mustHave,
    ...extractedJD.niceToHave,
    ...extractedJD.keywords,
  ]
    .join(' ')
    .toLowerCase();

  const scores: Partial<Record<RoleType, number>> = {};

  for (const { roleType, keywords, weight } of ROLE_SIGNAL_PATTERNS) {
    let count = 0;
    for (const kw of keywords) {
      if (text.includes(kw)) count++;
    }
    if (count > 0) {
      scores[roleType] = (scores[roleType] ?? 0) + count * weight;
    }
  }

  // If no matches, return general
  const entries = Object.entries(scores) as [RoleType, number][];
  if (entries.length === 0) return 'general';

  // Sort by score descending
  entries.sort((a, b) => b[1] - a[1]);

  const [topRole, topScore] = entries[0];

  // If frontend and backend score equally, classify as fullstack
  const frontendScore = scores.frontend ?? 0;
  const backendScore = scores.backend ?? 0;
  if (
    frontendScore > 0 &&
    backendScore > 0 &&
    Math.abs(frontendScore - backendScore) <= 2 &&
    topRole !== 'ml_ai' &&
    topRole !== 'management'
  ) {
    return 'fullstack';
  }

  // If the top role has a clear lead (2x the second), use it
  if (entries.length > 1) {
    const [, secondScore] = entries[1];
    if (topScore >= secondScore * 1.5) return topRole;
  }

  return topRole;
}

// ── Helper functions ────────────────────────────────────────────────────

function scoreToLevel(score: number): CompetencyLevel {
  if (score >= 80) return 'Expert';
  if (score >= 60) return 'High';
  if (score >= 35) return 'Intermediate';
  return 'Beginner';
}

function inferSeniority(extractedJD: ExtractedJD): { seniority: InferredSeniority; label: string } {
  const signals = (extractedJD.senioritySignals ?? []).map((s) => s.toLowerCase());
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

// ── DB benchmark lookup ─────────────────────────────────────────────────

interface DBBenchmarkRow {
  domain: string;
  target_score: number;
  confidence: string;
  match_level: string;
}

async function fetchBenchmarksFromDB(
  tier: CompanyTier,
  seniority: InferredSeniority,
  roleType: RoleType,
  companyName?: string
): Promise<{ rows: DBBenchmarkRow[]; matchLevel: BenchmarkMatchLevel } | null> {
  try {
    const { createServiceClient } = await import('@/lib/supabase/server');
    const supabase = await createServiceClient();

    const { data, error } = await supabase.rpc('get_competency_benchmarks', {
      p_tier: tier,
      p_seniority: seniority,
      p_role_type: roleType,
      p_company_name: companyName ? normalizeCompanyName(companyName) : null,
    });

    if (error || !data || data.length === 0) return null;

    const rows = data as DBBenchmarkRow[];
    const matchLevel = rows[0].match_level as BenchmarkMatchLevel;
    return { rows, matchLevel };
  } catch {
    // DB unavailable — fall back to calibrated tables
    return null;
  }
}

// ── Benchmark computation ───────────────────────────────────────────────

interface ComputedBenchmark {
  domain: string;
  targetScore: number;
  confidence: BenchmarkConfidence;
  source: BenchmarkMatchLevel;
}

function computeCalibratedBenchmarks(
  seniority: InferredSeniority,
  tier: CompanyTier,
  roleType: RoleType
): ComputedBenchmark[] {
  const baseBenchmarks = CALIBRATED_BASE_BENCHMARKS[seniority];
  const tierMultiplier = TIER_BENCHMARK_MULTIPLIERS[tier];
  const roleDomainMultipliers = ROLE_DOMAIN_MULTIPLIERS[roleType];

  return Object.keys(DOMAIN_WEIGHTS).map((domain) => {
    const base = baseBenchmarks[domain] ?? 50;
    const roleMultiplier = roleDomainMultipliers[domain] ?? 1.0;
    const rawTarget = base * tierMultiplier * roleMultiplier;
    const targetScore = Math.max(0, Math.min(100, Math.round(rawTarget)));

    return {
      domain,
      targetScore,
      confidence: 'calibrated' as BenchmarkConfidence,
      source: 'fallback' as BenchmarkMatchLevel,
    };
  });
}

function buildBenchmarkDescription(
  tier: CompanyTier,
  seniority: InferredSeniority,
  roleType: RoleType,
  companyName?: string
): string {
  const tierLabels: Record<CompanyTier, string> = {
    FAANG_PLUS: 'FAANG+',
    BIG_TECH: 'Big Tech',
    TOP_FINANCE: 'Top Finance',
    UNICORN: 'Unicorn',
    GROWTH: 'Growth-stage',
    STANDARD: 'Standard',
  };

  const tierLabel = tierLabels[tier];
  const roleLabel = roleType !== 'general' ? ` ${ROLE_TYPE_LABELS[roleType]}` : '';
  const companyPart = companyName && tier !== 'STANDARD' ? `${companyName}` : tierLabel;

  return `${companyPart} ${seniority} benchmarks for${roleLabel} roles`;
}

// ── Main computation ────────────────────────────────────────────────────

export async function computeCompetencyHeatmap(
  analysis: LLMAnalysis,
  scoreBreakdown: ScoreBreakdown,
  extractedJD: ExtractedJD,
  _extractedResume: ExtractedResume,
  _roundType: RoundType,
  companyDifficulty?: CompanyDifficultyContext
): Promise<CompetencyHeatmapData> {
  const { rankedRisks } = analysis;

  // Map category scores to 0-100 scale
  const catScores = {
    hardMatch: scoreBreakdown.hardRequirementMatch,
    evidenceDepth: scoreBreakdown.evidenceDepth,
    roundReadiness: scoreBreakdown.roundReadiness,
    clarity: scoreBreakdown.resumeClarity,
    companyProxy: scoreBreakdown.companyProxy,
  };

  // Infer seniority and classify role type
  const { seniority, label: seniorityLabel } = inferSeniority(extractedJD);
  const roleType = classifyRoleType(extractedJD);
  const tier = companyDifficulty?.tier ?? 'STANDARD';
  const companyName = companyDifficulty?.companyName;

  // Try DB lookup, fall back to calibrated tables
  let benchmarks: ComputedBenchmark[];
  const dbResult = await fetchBenchmarksFromDB(tier, seniority, roleType, companyName);

  if (dbResult && dbResult.rows.length > 0) {
    // Use DB benchmarks, apply role-type multipliers on top
    const roleDomainMultipliers = ROLE_DOMAIN_MULTIPLIERS[roleType];
    benchmarks = dbResult.rows.map((row) => {
      const roleMultiplier = roleDomainMultipliers[row.domain] ?? 1.0;
      return {
        domain: row.domain,
        targetScore: Math.max(0, Math.min(100, Math.round(row.target_score * roleMultiplier))),
        confidence: row.confidence as BenchmarkConfidence,
        source: dbResult.matchLevel,
      };
    });

    // Fill in any missing domains from calibrated tables
    const dbDomains = new Set(benchmarks.map((b) => b.domain));
    const calibrated = computeCalibratedBenchmarks(seniority, tier, roleType);
    for (const cb of calibrated) {
      if (!dbDomains.has(cb.domain)) {
        benchmarks.push(cb);
      }
    }
  } else {
    benchmarks = computeCalibratedBenchmarks(seniority, tier, roleType);
  }

  // Build benchmark lookup
  const benchmarkMap = new Map(benchmarks.map((b) => [b.domain, b]));

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
      const matches = keywords.some((kw) => text.includes(kw));
      if (matches) {
        if (risk.severity === 'critical') criticalRiskCount++;
        else if (risk.severity === 'high') highRiskCount++;
      }
    }
    rawScore -= criticalRiskCount * 5 + highRiskCount * 2;

    // Apply company difficulty adjustment to raw score
    if (companyDifficulty && companyDifficulty.tier !== 'STANDARD') {
      rawScore *= 2 - companyDifficulty.adjustmentFactor;
    }

    rawScore = Math.max(0, Math.min(100, Math.round(rawScore)));

    const benchmark = benchmarkMap.get(domain);
    const targetScore = benchmark?.targetScore ?? 55;
    const yourLevel = scoreToLevel(rawScore);
    const targetBenchmark = scoreToLevel(targetScore);
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
      benchmarkSource: benchmark?.source,
      benchmarkConfidence: benchmark?.confidence,
    });
  }

  // Sort: Critical first, then Warning, then Pass (by gapPoints desc within group)
  const statusOrder: Record<GapStatus, number> = { Critical: 0, Warning: 1, Pass: 2 };
  entries.sort((a, b) => {
    const statusDiff = statusOrder[a.gapStatus] - statusOrder[b.gapStatus];
    if (statusDiff !== 0) return statusDiff;
    return b.gapPoints - a.gapPoints;
  });

  const criticalGaps = entries.filter((e) => e.gapStatus === 'Critical').length;
  const warningGaps = entries.filter((e) => e.gapStatus === 'Warning').length;
  const passCount = entries.filter((e) => e.gapStatus === 'Pass').length;

  const benchmarkDescription = buildBenchmarkDescription(
    tier,
    seniority,
    roleType,
    companyName
  );

  return {
    entries,
    inferredSeniority: seniority,
    seniorityLabel,
    totalDomains: entries.length,
    criticalGaps,
    warningGaps,
    passCount,
    roleType,
    roleTypeLabel: roleType !== 'general' ? ROLE_TYPE_LABELS[roleType] : undefined,
    benchmarkDescription,
    version: HEATMAP_VERSION,
  };
}
