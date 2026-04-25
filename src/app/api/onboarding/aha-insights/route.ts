import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { getOpenAIClient, MODELS } from '@/lib/openai';
import { createEmbedding } from '@/server/rag/retrieval';
import { extractResumeSignals } from '@/lib/resume-signals';
import type { AhaInsightData, CohortPercentile, InsightCategory } from '@/types';

// ── Request Validation ────────────────────────────────────────

const RequestSchema = z.object({
  careerStage: z.enum(['student', 'new_grad', 'career_changer', 'experienced_professional']),
  targetDomains: z.array(z.string()).default([]),
  targetRoles: z.array(z.string().max(200)).max(3).default([]),
  yearsExperience: z.number().nullable().default(null),
  confidenceDrop: z
    .enum(['system_design', 'behavioral', 'coding', 'everything'])
    .nullable()
    .default(null),
  practicePain: z.enum(['ramble', 'freeze', 'no_benchmark', 'no_offers']).nullable().default(null),
  resumeText: z.string().max(10000).default(''),
});

// ── Domain mapping for vector search ──────────────────────────

function mapDomainForQuery(domains: string[]): string | null {
  const primary = domains[0] ?? null;
  switch (primary) {
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

// ── Stage labels for cohort descriptions ──────────────────────

const STAGE_LABELS: Record<string, string> = {
  student: 'students',
  new_grad: 'new grads',
  career_changer: 'career changers',
  experienced_professional: 'experienced professionals',
};

// ── Deterministic fallback insight generator ──────────────────

function generateDeterministicInsight(input: z.infer<typeof RequestSchema>): {
  insight: string;
  category: InsightCategory;
} {
  const resumeSignals = input.resumeText ? extractResumeSignals(input.resumeText) : null;
  const roleCount = input.targetRoles.length;

  // Contradiction: multiple roles + broad confidence gap
  if (roleCount >= 2 && input.confidenceDrop === 'everything') {
    return {
      insight: `You're targeting ${roleCount} different roles but feel uncertain across the board. Spreading prep across ${roleCount} role types without a focused strategy is the fastest way to stay stuck. Pick your strongest fit and nail it first.`,
      category: 'contradiction',
    };
  }

  // Gap: resume lacks skills matching concern
  if (
    input.confidenceDrop === 'coding' &&
    resumeSignals &&
    !resumeSignals.detectedSkills.includes('algorithms')
  ) {
    return {
      insight:
        "You flagged coding articulation as your gap, and your resume doesn't highlight algorithm experience. Interviewers will probe this hard — it's your highest-leverage area to fix.",
      category: 'gap',
    };
  }

  // Hidden strength: substantial resume + low confidence
  if (
    resumeSignals?.resumeDepth === 'substantial' &&
    resumeSignals.hasQuantifiedImpact &&
    (input.confidenceDrop === 'everything' || input.practicePain === 'freeze')
  ) {
    return {
      insight:
        "Your resume shows quantified impact and real depth, but you reported low confidence. The gap isn't knowledge — it's performance under pressure. That's one of the fastest things to fix.",
      category: 'hidden_strength',
    };
  }

  // Risk: career changer with no behavioral prep
  if (input.careerStage === 'career_changer' && input.confidenceDrop !== 'behavioral') {
    return {
      insight:
        "As a career changer, behavioral rounds are where most pivots fail — interviewers want proof your old skills transfer. You didn't flag this as a concern, which means it might be a blind spot.",
      category: 'risk',
    };
  }

  // Risk: interview this week + freeze
  if (input.practicePain === 'freeze') {
    return {
      insight:
        "Freezing on unseen questions costs more points than wrong answers. Interviewers evaluate your problem-solving process, not just the solution. A structured approach to 'I don't know' is worth more than memorizing 50 more problems.",
      category: 'risk',
    };
  }

  // Default: role-based insight
  if (roleCount > 0 && input.targetRoles[0]) {
    return {
      insight: `Most ${input.targetRoles[0]} candidates prep broadly but miss the specific evaluation criteria interviewers actually use. Your diagnostic will show exactly what those criteria are for your target role.`,
      category: 'gap',
    };
  }

  return {
    insight:
      'Your profile reveals a specific pattern of strengths and gaps. Your diagnostic will turn that into a targeted prep plan — not generic advice.',
    category: 'gap',
  };
}

// ── Route Handler ─────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting (10 per hour, same as benchmarks)
    const allowed = await checkRateLimit({
      prefix: 'aha_insights',
      identifier: user.id,
      maxRequests: 10,
      windowSeconds: 3600,
    });
    if (!allowed) return rateLimitResponse();

    // Parse + validate request body
    const body = await request.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const input = parsed.data;

    const serviceClient = await createServiceClient();
    const domainFilter = mapDomainForQuery(input.targetDomains);

    // Run all async operations in parallel
    const [cohort, vectorResults] = await Promise.all([
      // 1. Cohort percentile query
      computeCohortPercentile(serviceClient, input, user.id),
      // 2. Embedding + vector search + LLM insight
      computeVectorInsight(input, domainFilter),
    ]);

    const result: AhaInsightData = {
      insight: vectorResults.insight,
      insightCategory: vectorResults.category,
      sampleQuestion: vectorResults.sampleQuestion,
      cohort,
      retrievedDomains: vectorResults.retrievedDomains,
    };

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Aha insights error:', error);

    // Graceful fallback — return minimal data so the UI still works
    return NextResponse.json({
      data: {
        insight: '',
        insightCategory: 'gap',
        cohort: {
          percentile: 50,
          cohortSize: 0,
          cohortLabel: 'similar candidates',
          isBlended: true,
        },
        retrievedDomains: [],
        fetchError: 'Service temporarily unavailable',
      } satisfies AhaInsightData,
    });
  }
}

// ── Cohort Percentile ─────────────────────────────────────────

async function computeCohortPercentile(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  input: z.infer<typeof RequestSchema>,
  userId: string
): Promise<CohortPercentile> {
  try {
    // Query completed onboarding profiles with matching career stage
    const { data, error } = await supabase
      .from('user_profiles')
      .select('aha_score')
      .eq('onboarding_completed', true)
      .eq('career_stage', input.careerStage)
      .neq('user_id', userId)
      .not('aha_score', 'is', null);

    if (error || !data) {
      return blendedPercentile(input, []);
    }

    // Extract readiness estimates from JSONB
    const scores: number[] = data
      .map((row: { aha_score: { readinessEstimate?: number } }) => row.aha_score?.readinessEstimate)
      .filter((s: number | undefined): s is number => typeof s === 'number' && s >= 20 && s <= 75);

    // Filter by overlapping domains if we have enough data
    // (skip domain filtering if < 30 results to avoid tiny cohorts)
    if (scores.length < 30) {
      return blendedPercentile(input, scores);
    }

    // Compute percentile
    const currentScore = computeApproxScore(input);
    const belowCount = scores.filter((s) => s < currentScore).length;
    const percentile = Math.round((belowCount / scores.length) * 100);

    const stageLabel = STAGE_LABELS[input.careerStage] ?? 'candidates';
    const roleLabel = input.targetRoles[0] || 'similar roles';

    return {
      percentile,
      cohortSize: scores.length,
      cohortLabel: `${stageLabel} targeting ${roleLabel}`,
      isBlended: false,
    };
  } catch {
    return blendedPercentile(input, []);
  }
}

/** Approximate the user's score without running the full scoring engine */
function computeApproxScore(input: z.infer<typeof RequestSchema>): number {
  let score = 50;

  const stageAdj: Record<string, number> = {
    student: -10,
    new_grad: -5,
    career_changer: -8,
    experienced_professional: 5,
  };
  score += stageAdj[input.careerStage] ?? 0;

  if (input.yearsExperience !== null) {
    if (input.yearsExperience <= 1) score -= 5;
    else if (input.yearsExperience >= 5) score += 5;
  }

  if (input.practicePain === 'freeze') score -= 5;
  else if (input.practicePain === 'ramble') score -= 2;
  else if (input.practicePain === 'no_benchmark') score -= 3;
  else if (input.practicePain === 'no_offers') score += 2;

  if (input.confidenceDrop === 'everything') score -= 2;
  if (input.targetRoles.length > 0) score += 5;
  if (input.confidenceDrop) score += 3;

  return Math.max(20, Math.min(75, score));
}

/** Blend real scores with synthetic distribution when cohort is small */
function blendedPercentile(
  input: z.infer<typeof RequestSchema>,
  realScores: number[]
): CohortPercentile {
  // Calibrated median scores by career stage (from CALIBRATED_BASE_BENCHMARKS patterns)
  const medians: Record<string, number> = {
    student: 35,
    new_grad: 40,
    career_changer: 37,
    experienced_professional: 50,
  };

  const median = medians[input.careerStage] ?? 42;
  const currentScore = computeApproxScore(input);

  // Simple z-score approach with synthetic normal distribution (std dev ~10)
  const stdDev = 10;
  const zScore = (currentScore - median) / stdDev;
  // CDF approximation: 0.5 * (1 + erf(z / sqrt(2)))
  const erf = Math.tanh(Math.sqrt(Math.PI) * zScore * 0.5);
  let percentile = Math.round(50 * (1 + erf));
  percentile = Math.max(5, Math.min(95, percentile));

  const stageLabel = STAGE_LABELS[input.careerStage] ?? 'candidates';
  const roleLabel = input.targetRoles[0] || 'similar roles';

  return {
    percentile,
    cohortSize: realScores.length,
    cohortLabel: `${stageLabel} targeting ${roleLabel}`,
    isBlended: true,
  };
}

// ── Vector Search + LLM Insight ───────────────────────────────

async function computeVectorInsight(
  input: z.infer<typeof RequestSchema>,
  domainFilter: string | null
): Promise<{
  insight: string;
  category: InsightCategory;
  sampleQuestion?: string;
  retrievedDomains: string[];
}> {
  try {
    const resumeSignals = input.resumeText ? extractResumeSignals(input.resumeText) : null;
    const skillsList = resumeSignals?.detectedSkills.join(', ') || 'not provided';

    // Build embedding query from user profile
    const embeddingQuery = [
      `${input.careerStage} candidate`,
      input.targetRoles.length > 0 ? `targeting ${input.targetRoles.join(', ')}` : '',
      input.targetDomains.length > 0 ? `in ${input.targetDomains.join(', ')}` : '',
      input.confidenceDrop ? `concern: ${input.confidenceDrop}` : '',
      input.practicePain ? `struggles with: ${input.practicePain}` : '',
      `skills: ${skillsList}`,
    ]
      .filter(Boolean)
      .join('. ');

    // Create embedding
    const embedding = await createEmbedding(embeddingQuery);

    // Search rubric chunks and question archetypes in parallel
    const serviceClient = await createServiceClient();

    const rubricParams: Record<string, unknown> = {
      query_embedding: embedding,
      match_threshold: 0.45,
      match_count: 3,
    };
    if (domainFilter) rubricParams.filter_domain = domainFilter;

    const questionParams: Record<string, unknown> = {
      query_embedding: embedding,
      match_threshold: 0.45,
      match_count: 2,
    };
    if (domainFilter) questionParams.filter_domain = domainFilter;

    const [rubricResult, questionResult] = await Promise.all([
      serviceClient.rpc('match_rubric_chunks', rubricParams),
      serviceClient.rpc('match_question_archetypes', questionParams),
    ]);

    const rubricChunks = rubricResult.data ?? [];
    const questionArchetypes = questionResult.data ?? [];

    // Extract domains from retrieved chunks
    const retrievedDomains = [
      ...new Set(rubricChunks.map((c: { domain: string }) => c.domain).filter((d: string) => d)),
    ] as string[];

    // Extract a sample question
    const sampleQuestion =
      questionArchetypes.length > 0
        ? (questionArchetypes[0] as { question_template: string }).question_template
        : undefined;

    // Build rubric context for LLM
    const rubricContext = rubricChunks
      .slice(0, 3)
      .map((c: { chunk_text: string }, i: number) => `[Rubric ${i + 1}]: ${c.chunk_text}`)
      .join('\n\n');

    // If no rubric context found, fall back to deterministic
    if (!rubricContext) {
      const fallback = generateDeterministicInsight(input);
      return { ...fallback, sampleQuestion, retrievedDomains };
    }

    // Generate insight with gpt-4o-mini
    const openai = getOpenAIClient();

    const response = await openai.chat.completions.create({
      model: MODELS.extraction,
      temperature: 0.3,
      max_tokens: 150,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are an interview diagnostic engine. Given a candidate's profile and real interview evaluation rubrics, identify ONE specific, surprising insight about their situation. The insight must:
1. Connect two or more specific details from their profile in a non-obvious way
2. Reference real evaluation criteria from the rubric context
3. Feel diagnostic and analytical — NOT motivational or generic
4. Be 1-2 sentences, direct and pointed
5. Make the candidate feel "how did it know that about me?"

Respond with JSON: { "insight": string, "category": "gap" | "contradiction" | "hidden_strength" | "risk" }`,
        },
        {
          role: 'user',
          content: `<profile>
Career stage: ${input.careerStage}
Target roles: ${input.targetRoles.join(', ') || 'not specified'}
Years experience: ${input.yearsExperience ?? 'not specified'}
Confidence gap: ${input.confidenceDrop ?? 'none specified'}
Practice struggle: ${input.practicePain ?? 'none specified'}
Detected resume skills: ${skillsList}
Resume depth: ${resumeSignals?.resumeDepth ?? 'no resume'}
Has quantified impact: ${resumeSignals?.hasQuantifiedImpact ?? false}
Has leadership signals: ${resumeSignals?.hasLeadershipSignals ?? false}
</profile>

<rubric_context>
${rubricContext}
</rubric_context>`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      const fallback = generateDeterministicInsight(input);
      return { ...fallback, sampleQuestion, retrievedDomains };
    }

    const parsed = JSON.parse(content) as { insight?: string; category?: string };
    const insight = parsed.insight || '';
    const category = (
      ['gap', 'contradiction', 'hidden_strength', 'risk'] as InsightCategory[]
    ).includes(parsed.category as InsightCategory)
      ? (parsed.category as InsightCategory)
      : 'gap';

    return {
      insight: insight || generateDeterministicInsight(input).insight,
      category,
      sampleQuestion,
      retrievedDomains,
    };
  } catch (error) {
    console.error('Vector insight error:', error);
    const fallback = generateDeterministicInsight(input);
    return { ...fallback, retrievedDomains: [] };
  }
}
