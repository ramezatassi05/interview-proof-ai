import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit';
import {
  ROLE_DOMAIN_MULTIPLIERS,
  CALIBRATED_BASE_BENCHMARKS,
} from '@/server/scoring/competency-heatmap';
import type {
  CareerStage,
  TargetCompanyTier,
  TargetDomain,
  CompanyTier,
  InferredSeniority,
  RoleType,
  BenchmarkConfidence,
  OnboardingBenchmarkData,
  OnboardingBenchmarkTarget,
  KnowledgeBaseStats,
} from '@/types';

// ── Request Validation ────────────────────────────────────────

const RequestSchema = z.object({
  targetCompanyTier: z.enum(['big_tech', 'startup', 'any']),
  careerStage: z.enum(['student', 'new_grad', 'career_changer', 'experienced_professional']),
  targetDomain: z.enum(['swe', 'ds', 'design', 'pm', 'general']).nullable(),
  targetRole: z.string().max(200).default(''),
  yearsExperience: z.number().nullable().default(null),
});

// ── Mapping Functions ─────────────────────────────────────────

function mapTierToBenchmarkTier(tier: TargetCompanyTier): CompanyTier {
  switch (tier) {
    case 'big_tech':
      return 'BIG_TECH';
    case 'startup':
      return 'GROWTH';
    case 'any':
      return 'STANDARD';
  }
}

function mapToSeniority(
  stage: CareerStage,
  yearsExperience: number | null
): InferredSeniority {
  switch (stage) {
    case 'student':
      return 'Intern';
    case 'new_grad':
      return 'Junior';
    case 'career_changer':
      return yearsExperience !== null && yearsExperience >= 3 ? 'Mid-Level' : 'Junior';
    case 'experienced_professional': {
      if (yearsExperience === null) return 'Mid-Level';
      if (yearsExperience >= 8) return 'Staff+';
      if (yearsExperience >= 5) return 'Senior';
      return 'Mid-Level';
    }
  }
}

function mapToRoleType(domain: TargetDomain | null, targetRole: string): RoleType {
  // Try to infer from target role text first
  if (targetRole) {
    const lower = targetRole.toLowerCase();
    if (/\b(frontend|front[- ]end|ui|react|vue|angular)\b/.test(lower)) return 'frontend';
    if (/\b(backend|back[- ]end|server|api|infrastructure|platform)\b/.test(lower))
      return 'backend';
    if (/\b(full[- ]?stack)\b/.test(lower)) return 'fullstack';
    if (/\b(mobile|ios|android|react native|flutter)\b/.test(lower)) return 'mobile';
    if (/\b(ml|machine learning|ai|data scientist)\b/.test(lower)) return 'ml_ai';
    if (/\b(data analyst|analytics|bi|business intelligence)\b/.test(lower)) return 'data';
    if (/\b(devops|sre|site reliability|cloud|infrastructure)\b/.test(lower)) return 'devops_infra';
    if (/\b(security|cybersecurity|appsec)\b/.test(lower)) return 'security';
    if (/\b(manager|director|vp|head of|engineering manager|em)\b/.test(lower))
      return 'management';
  }

  // Fall back to domain mapping
  switch (domain) {
    case 'ds':
      return 'data';
    case 'pm':
      return 'management';
    default:
      return 'general';
  }
}

const TIER_DISPLAY_LABELS: Record<string, string> = {
  FAANG_PLUS: 'FAANG+',
  BIG_TECH: 'Big Tech',
  TOP_FINANCE: 'Top Finance',
  UNICORN: 'Unicorn',
  GROWTH: 'Growth-Stage',
  STANDARD: 'General',
};

// ── Domain mapping for knowledge stats queries ────────────────

function mapDomainForQuery(domain: TargetDomain | null): string | null {
  switch (domain) {
    case 'swe':
      return 'swe';
    case 'ds':
      return 'ds';
    case 'design':
    case 'pm':
    case 'general':
      return 'general';
    default:
      return null;
  }
}

// ── Route Handler ─────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit: 10 requests per user per hour
    const allowed = await checkRateLimit({
      prefix: 'onboarding_benchmarks',
      identifier: user.id,
      maxRequests: 10,
      windowSeconds: 3600,
    });

    if (!allowed) {
      return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
    }

    // Parse request
    const body = await request.json();
    const parsed = RequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const input = parsed.data;

    // Map onboarding inputs to benchmark params
    const benchmarkTier = mapTierToBenchmarkTier(input.targetCompanyTier);
    const seniority = mapToSeniority(input.careerStage, input.yearsExperience);
    const roleType = mapToRoleType(input.targetDomain, input.targetRole);
    const tierLabel = TIER_DISPLAY_LABELS[benchmarkTier];
    const seniorityLabel = seniority;
    const dbDomain = mapDomainForQuery(input.targetDomain);

    const serviceClient = await createServiceClient();

    // Run benchmark + knowledge stats queries in parallel
    const [benchmarkResult, rubricTotal, rubricDomain, questionTotal, questionDomain, companiesResult] =
      await Promise.all([
        // Benchmark targets via RPC
        serviceClient.rpc('get_competency_benchmarks', {
          p_tier: benchmarkTier,
          p_seniority: seniority,
          p_role_type: roleType,
          p_company_name: null,
        }),

        // Knowledge stats: total rubric chunks
        serviceClient
          .from('rubric_chunks')
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true),

        // Knowledge stats: domain-filtered rubric chunks
        dbDomain
          ? serviceClient
              .from('rubric_chunks')
              .select('id', { count: 'exact', head: true })
              .eq('is_active', true)
              .eq('domain', dbDomain)
          : Promise.resolve({ count: 0, error: null }),

        // Knowledge stats: total question archetypes
        serviceClient
          .from('question_archetypes')
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true),

        // Knowledge stats: domain-filtered question archetypes
        dbDomain
          ? serviceClient
              .from('question_archetypes')
              .select('id', { count: 'exact', head: true })
              .eq('is_active', true)
              .eq('domain', dbDomain)
          : Promise.resolve({ count: 0, error: null }),

        // Knowledge stats: distinct calibrated companies
        serviceClient
          .from('competency_benchmarks')
          .select('company_name')
          .not('company_name', 'is', null),
      ]);

    // Process benchmark targets
    let benchmarkTargets: OnboardingBenchmarkTarget[] = [];
    const roleDomainMultipliers = ROLE_DOMAIN_MULTIPLIERS[roleType];

    if (benchmarkResult.data && benchmarkResult.data.length > 0) {
      benchmarkTargets = (benchmarkResult.data as { domain: string; target_score: number; confidence: string }[])
        .map((row) => {
          const roleMultiplier = roleDomainMultipliers[row.domain] ?? 1.0;
          return {
            domain: row.domain,
            targetScore: Math.max(0, Math.min(100, Math.round(row.target_score * roleMultiplier))),
            tierLabel,
            seniorityLabel,
            confidence: row.confidence as BenchmarkConfidence,
          };
        })
        .sort((a, b) => b.targetScore - a.targetScore)
        .slice(0, 3);
    } else {
      // Fallback to calibrated in-memory benchmarks
      const baseBenchmarks = CALIBRATED_BASE_BENCHMARKS[seniority] ?? CALIBRATED_BASE_BENCHMARKS.Unknown;
      benchmarkTargets = Object.entries(baseBenchmarks)
        .map(([domain, score]) => {
          const roleMultiplier = roleDomainMultipliers[domain] ?? 1.0;
          return {
            domain,
            targetScore: Math.max(0, Math.min(100, Math.round(score * roleMultiplier))),
            tierLabel,
            seniorityLabel,
            confidence: 'estimated' as BenchmarkConfidence,
          };
        })
        .sort((a, b) => b.targetScore - a.targetScore)
        .slice(0, 3);
    }

    // Find top weighted domain
    const topWeightedDomain = benchmarkTargets.length > 0 ? benchmarkTargets[0].domain : null;

    // Count distinct companies
    const distinctCompanies = new Set(
      (companiesResult.data ?? []).map((r: { company_name: string }) => r.company_name)
    );

    const knowledgeStats: KnowledgeBaseStats = {
      totalRubricChunks: rubricTotal.count ?? 0,
      totalQuestionArchetypes: questionTotal.count ?? 0,
      totalCalibratedCompanies: distinctCompanies.size,
      domainRubricCount: (rubricDomain as { count: number | null }).count ?? 0,
      domainQuestionCount: (questionDomain as { count: number | null }).count ?? 0,
      topWeightedDomain,
    };

    const result: OnboardingBenchmarkData = {
      benchmarkTargets,
      knowledgeStats,
      tierLabel,
      seniorityLabel,
    };

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error('Onboarding benchmarks API error:', err);

    const fallback: OnboardingBenchmarkData = {
      benchmarkTargets: [],
      knowledgeStats: {
        totalRubricChunks: 0,
        totalQuestionArchetypes: 0,
        totalCalibratedCompanies: 0,
        domainRubricCount: 0,
        domainQuestionCount: 0,
        topWeightedDomain: null,
      },
      tierLabel: '',
      seniorityLabel: '',
      fetchError: 'Service temporarily unavailable',
    };

    return NextResponse.json({ data: fallback });
  }
}
