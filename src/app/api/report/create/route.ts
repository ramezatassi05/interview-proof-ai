import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import type { RoundType } from '@/types';

const PrepPreferencesSchema = z.object({
  timeline: z.enum(['1day', '3days', '1week', '2weeks', '4weeks_plus']),
  dailyHours: z.number().min(0.5).max(6),
  experienceLevel: z.enum(['intern', 'entry', 'mid']),
  focusAreas: z
    .array(
      z.enum([
        'technical_depth',
        'behavioral_stories',
        'system_design',
        'communication',
        'domain_knowledge',
      ])
    )
    .min(1)
    .max(3),
  additionalContext: z.string().max(500).optional(),
  careerStage: z
    .enum(['student', 'new_grad', 'career_changer', 'experienced_professional'])
    .optional(),
});

const CreateReportSchema = z.object({
  resumeText: z.string().min(50, 'Resume text too short').optional(),
  jobDescriptionText: z.string().min(50, 'Job description too short'),
  roundType: z.enum(['technical', 'behavioral', 'research']),
  prepPreferences: PrepPreferencesSchema.optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allowed = await checkRateLimit({
      prefix: 'create',
      identifier: `user:${user.id}`,
      maxRequests: 10,
      windowSeconds: 3600,
    });
    if (!allowed) return rateLimitResponse(3600);

    // Parse and validate request body
    const body = await request.json();
    const validation = CreateReportSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { resumeText: bodyResumeText, jobDescriptionText, roundType, prepPreferences } =
      validation.data;

    // Resolve resume text: use body if provided, otherwise fetch from user profile
    let resumeText = bodyResumeText;
    if (!resumeText) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('resume_text')
        .eq('user_id', user.id)
        .single();

      resumeText = profile?.resume_text ?? undefined;

      if (!resumeText || resumeText.length < 50) {
        return NextResponse.json(
          { error: 'No resume found. Please upload your resume in Account settings.' },
          { status: 400 }
        );
      }
    }

    // Create report
    const { data: report, error: insertError } = await supabase
      .from('reports')
      .insert({
        user_id: user.id,
        round_type: roundType as RoundType,
        resume_text: resumeText,
        job_description_text: jobDescriptionText,
        paid_unlocked: true,
        prep_preferences_json: prepPreferences || null,
      })
      .select('id, created_at')
      .single();

    if (insertError) {
      console.error('Failed to create report:', insertError);
      return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
    }

    return NextResponse.json({
      data: {
        reportId: report.id,
        createdAt: report.created_at,
        message: 'Report created. Call /api/report/analyze to run analysis.',
      },
    });
  } catch (error) {
    console.error('Create report error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
