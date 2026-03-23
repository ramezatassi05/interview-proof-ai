import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import type { UserProfile } from '@/types';

// ============================================
// Helpers
// ============================================

function rowToProfile(row: Record<string, unknown>): UserProfile {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    displayName: row.display_name as string | null,
    resumeFilePath: row.resume_file_path as string | null,
    resumeText: row.resume_text as string | null,
    resumeParsedJson: row.resume_parsed_json as UserProfile['resumeParsedJson'],
    careerStatus: row.career_status as UserProfile['careerStatus'],
    yearsOfExperience: row.years_of_experience as number | null,
    industries: (row.industries as UserProfile['industries']) ?? [],
    functions: (row.job_functions as UserProfile['functions']) ?? [],
    currentRole: row.current_job_role as string | null,
    currentCompany: row.current_company as string | null,
    targetRole: row.target_role as string | null,
    targetCompanies: (row.target_companies as UserProfile['targetCompanies']) ?? [],
    interviewTimeline: row.interview_timeline as UserProfile['interviewTimeline'],
    concerns: (row.concerns as UserProfile['concerns']) ?? [],
    currentCompensationRange: row.current_compensation_range as string | null,
    targetCompensationRange: row.target_compensation_range as string | null,
    onboardingCompleted: row.onboarding_completed as boolean,
    onboardingCurrentStep: row.onboarding_current_step as number,
    profileSummaryJson: row.profile_summary_json as UserProfile['profileSummaryJson'],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ============================================
// GET — Fetch user profile
// ============================================

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
      // PGRST116 = no rows found
      console.error('Profile fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }

    return NextResponse.json({ data: data ? rowToProfile(data) : null });
  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// POST — Create initial profile
// ============================================

const createSchema = z.object({
  displayName: z.string().max(100).optional(),
});

export async function POST(request: NextRequest) {
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
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    // Pre-fill display name from OAuth metadata if not provided
    const displayName =
      parsed.data.displayName ||
      (user.user_metadata?.full_name as string) ||
      (user.user_metadata?.name as string) ||
      null;

    const { data, error } = await supabase
      .from('user_profiles')
      .upsert(
        {
          user_id: user.id,
          display_name: displayName,
          onboarding_current_step: 1,
          onboarding_completed: false,
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single();

    if (error) {
      console.error('Profile create error:', error);
      return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
    }

    return NextResponse.json({ data: rowToProfile(data) });
  } catch (error) {
    console.error('Profile POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// PATCH — Update step data
// ============================================

const stepSchemas: Record<number, z.ZodSchema> = {
  1: z.object({
    displayName: z.string().min(1).max(100),
  }),
  2: z.object({}).optional(), // Handled by upload-resume route; step can be skipped
  3: z.object({
    careerStatus: z.enum([
      'student',
      'early_career',
      'mid_career',
      'senior',
      'executive',
      'career_changer',
    ]),
  }),
  4: z.object({
    yearsOfExperience: z.number().int().min(0).max(21),
  }),
  5: z.object({
    industries: z.array(z.string()).min(1),
    functions: z.array(z.string()).min(1),
  }),
  6: z.object({
    currentRole: z.string().min(1).max(200),
    currentCompany: z.string().max(200).optional(),
  }),
  7: z.object({
    targetRole: z.string().min(1).max(200),
  }),
  8: z.object({
    targetCompanies: z
      .array(z.object({ name: z.string(), tier: z.string().optional() }))
      .optional(),
  }),
  9: z.object({
    interviewTimeline: z.enum([
      'this_week',
      'two_weeks',
      'one_month',
      'one_to_three_months',
      'exploring',
    ]),
  }),
  10: z.object({
    concerns: z.array(z.string()).min(1).max(5),
  }),
  11: z.object({
    currentCompensationRange: z.string().optional(),
    targetCompensationRange: z.string().optional(),
  }),
  12: z.object({}), // Summary step — no user input, just marks completion
};

// Map camelCase field names to snake_case DB columns
const fieldToColumn: Record<string, string> = {
  displayName: 'display_name',
  careerStatus: 'career_status',
  yearsOfExperience: 'years_of_experience',
  currentRole: 'current_job_role',
  currentCompany: 'current_company',
  functions: 'job_functions',
  targetRole: 'target_role',
  targetCompanies: 'target_companies',
  interviewTimeline: 'interview_timeline',
  currentCompensationRange: 'current_compensation_range',
  targetCompensationRange: 'target_compensation_range',
};

export async function PATCH(request: NextRequest) {
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
    const step = body.step as number;

    if (!step || step < 1 || step > 12) {
      return NextResponse.json({ error: 'Invalid step number' }, { status: 400 });
    }

    const schema = stepSchemas[step];
    if (!schema) {
      return NextResponse.json({ error: 'Invalid step' }, { status: 400 });
    }

    const parsed = schema.safeParse(body.data ?? {});
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Build the update object with snake_case columns
    const updateData: Record<string, unknown> = {};
    const stepData = parsed.data as Record<string, unknown>;

    for (const [key, value] of Object.entries(stepData)) {
      const column = fieldToColumn[key] || key;
      updateData[column] = value;
    }

    // Always advance the step counter
    const nextStep = Math.min(step + 1, 12);
    updateData.onboarding_current_step = nextStep;

    // Mark completed on step 12
    if (step === 12) {
      updateData.onboarding_completed = true;
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Profile update error:', error);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({ data: rowToProfile(data) });
  } catch (error) {
    console.error('Profile PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
