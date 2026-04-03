import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { searchJobs } from '@/lib/jsearch';
import { searchJobsAdzuna } from '@/lib/adzuna';
import type { JobMarketData, JobMarketContext } from '@/types';
import crypto from 'crypto';

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

const RequestSchema = z.object({
  countries: z.array(z.string().max(5)).min(1).max(10),
  cities: z.array(z.string().max(100)).max(20).default([]),
  targetRoles: z.array(z.string().max(200)).max(3).default([]),
  targetDomains: z.array(z.enum(['swe', 'ds', 'design', 'pm', 'general'])).default([]),
  careerStage: z
    .enum(['student', 'new_grad', 'career_changer', 'experienced_professional'])
    .nullable()
    .default(null),
});

function buildCacheKey(input: z.infer<typeof RequestSchema>): string {
  const raw = JSON.stringify({
    c: input.countries.sort(),
    ci: input.cities.sort(),
    r: input.targetRoles.map((r) => r.toLowerCase().trim()).sort(),
    d: [...input.targetDomains].sort(),
    s: input.careerStage,
  });
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 32);
}

/**
 * Compute a calibration adjustment (-10 to +10) based on job market data.
 * Positive = less competitive, negative = highly competitive.
 */
function computeCalibration(context: JobMarketContext | null): number {
  if (!context) return 0;

  let adjustment = 0;

  // Market saturation signal
  if (context.totalListings > 100) {
    adjustment -= 3; // Competitive market
  } else if (context.totalListings < 10 && context.totalListings > 0) {
    adjustment += 3; // Niche market, less competition
  }

  // Internship-specific: fewer internship slots = more competitive
  if (context.isInternshipOnly && context.totalListings < 20) {
    adjustment -= 2;
  }

  // Many top employers = talent wars = slightly easier
  if (context.topEmployers.length >= 4) {
    adjustment += 2;
  }

  return Math.max(-10, Math.min(10, adjustment));
}

async function getCachedResult(cacheKey: string): Promise<JobMarketData | null> {
  try {
    const supabase = await createServiceClient();
    const cutoff = new Date(Date.now() - CACHE_TTL_MS).toISOString();

    const { data } = await supabase
      .from('job_market_cache')
      .select('response_data, created_at')
      .eq('cache_key', cacheKey)
      .gte('created_at', cutoff)
      .single();

    if (data?.response_data) {
      return data.response_data as JobMarketData;
    }
  } catch {
    // Cache miss or error — proceed to API
  }
  return null;
}

async function setCachedResult(cacheKey: string, result: JobMarketData): Promise<void> {
  try {
    const supabase = await createServiceClient();
    await supabase
      .from('job_market_cache')
      .upsert(
        { cache_key: cacheKey, response_data: result, created_at: new Date().toISOString() },
        { onConflict: 'cache_key' }
      );
  } catch {
    // Non-critical — skip cache write
  }
}

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
      prefix: 'job_search',
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
    const cacheKey = buildCacheKey(input);

    // Check cache
    const cached = await getCachedResult(cacheKey);
    if (cached) {
      return NextResponse.json({ data: cached });
    }

    // Try JSearch first, then Adzuna fallback
    let context: JobMarketContext | null = null;

    const primaryDomain = input.targetDomains[0] ?? null;
    const primaryRole = input.targetRoles[0] || '';

    context = await searchJobs({
      countries: input.countries,
      cities: input.cities,
      targetRole: primaryRole,
      targetDomain: primaryDomain,
      careerStage: input.careerStage,
    });

    if (!context) {
      context = await searchJobsAdzuna({
        countries: input.countries,
        cities: input.cities,
        targetRole: primaryRole,
        targetDomain: primaryDomain,
        careerStage: input.careerStage,
      });
    }

    const calibrationAdjustment = computeCalibration(context);

    const result: JobMarketData = {
      contexts: context ? [context] : [],
      aggregateListings: context?.totalListings ?? 0,
      calibrationAdjustment,
      fetchError: context
        ? undefined
        : 'Unable to fetch job market data. Score uses baseline estimate.',
    };

    // Cache the result (even empty results to avoid hammering)
    await setCachedResult(cacheKey, result);

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error('Job search API error:', err);

    // Always return a valid response — never block onboarding
    const fallback: JobMarketData = {
      contexts: [],
      aggregateListings: 0,
      calibrationAdjustment: 0,
      fetchError: 'Service temporarily unavailable',
    };

    return NextResponse.json({ data: fallback });
  }
}
