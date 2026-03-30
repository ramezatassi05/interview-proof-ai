import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import type { UserProfile } from '@/types';

// Focus area item schema (rich format)
const FocusAreaItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  reason: z.string(),
  priority: z.enum(['high', 'medium']),
  signalSources: z.array(z.string()),
});

// Zod schema for profile upsert
const ProfileSchema = z.object({
  displayName: z.string().max(100).optional(),
  careerStage: z.enum(['student', 'new_grad', 'career_changer', 'experienced_professional']),
  targetRole: z.string().max(200).optional(),
  targetDomain: z.enum(['swe', 'ds', 'design', 'pm', 'general']).optional(),
  yearsExperience: z.number().int().min(0).max(50).nullable().optional(),
  prepUrgency: z.enum(['exploring', 'active_search', 'interview_scheduled', 'interview_this_week']),
  biggestConcern: z.string().max(500).optional(),
  resumeText: z.string().max(100000).optional(),
  interviewExperience: z.enum(['none', 'a_few', 'many']).nullable().optional(),
  targetCompanyTier: z.enum(['big_tech', 'startup', 'any']).nullable().optional(),
  ahaScore: z
    .object({
      readinessEstimate: z.number(),
      focusAreas: z.array(z.union([z.string(), FocusAreaItemSchema])),
      timelineMessage: z.string(),
    })
    .optional(),
  onboardingCompleted: z.boolean().optional(),
});

/** Map snake_case DB row to camelCase UserProfile */
function mapRowToProfile(row: Record<string, unknown>): UserProfile {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    displayName: row.display_name as string | null,
    careerStage: row.career_stage as UserProfile['careerStage'],
    targetRole: row.target_role as string | null,
    targetDomain: row.target_domain as UserProfile['targetDomain'],
    yearsExperience: row.years_experience as number | null,
    prepUrgency: row.prep_urgency as UserProfile['prepUrgency'],
    biggestConcern: row.biggest_concern as string | null,
    interviewExperience: row.interview_experience as UserProfile['interviewExperience'],
    targetCompanyTier: row.target_company_tier as UserProfile['targetCompanyTier'],
    segment: row.segment as string | null,
    resumeText: row.resume_text as string | null,
    onboardingCompleted: row.onboarding_completed as boolean,
    onboardingStep: row.onboarding_step as number,
    onboardingCompletedAt: row.onboarding_completed_at as string | null,
    ahaScore: row.aha_score as UserProfile['ahaScore'],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = "no rows returned" — means profile doesn't exist yet
      console.error('Failed to fetch profile:', error);
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }

    return NextResponse.json({ data: data ? mapRowToProfile(data) : null });
  } catch (err) {
    console.error('Profile GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = ProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const input = parsed.data;

    // Compute segment from career stage + prep urgency
    const segment = `${input.careerStage}_${input.prepUrgency}`;

    const upsertData: Record<string, unknown> = {
      user_id: user.id,
      display_name: input.displayName ?? null,
      career_stage: input.careerStage,
      target_role: input.targetRole ?? null,
      target_domain: input.targetDomain ?? null,
      years_experience: input.yearsExperience ?? null,
      prep_urgency: input.prepUrgency,
      biggest_concern: input.biggestConcern ?? null,
      resume_text: input.resumeText ?? null,
      interview_experience: input.interviewExperience ?? null,
      target_company_tier: input.targetCompanyTier ?? null,
      segment,
      aha_score: input.ahaScore ?? null,
    };

    // Mark onboarding as completed if requested
    if (input.onboardingCompleted) {
      upsertData.onboarding_completed = true;
      upsertData.onboarding_completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .upsert(upsertData, { onConflict: 'user_id' })
      .select('*')
      .single();

    if (error) {
      console.error('Failed to upsert profile:', error);
      return NextResponse.json(
        { error: 'Failed to save profile', details: error.message, code: error.code },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: mapRowToProfile(data) });
  } catch (err) {
    console.error('Profile POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
