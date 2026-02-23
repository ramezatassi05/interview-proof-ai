import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
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
  additionalContext: z.string().optional(),
});

const CreateReportSchema = z.object({
  resumeText: z.string().min(50, 'Resume text too short'),
  jobDescriptionText: z.string().min(50, 'Job description too short'),
  roundType: z.enum(['technical', 'behavioral', 'case', 'finance', 'research']),
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

    // Parse and validate request body
    const body = await request.json();
    const validation = CreateReportSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { resumeText, jobDescriptionText, roundType, prepPreferences } = validation.data;

    // Create report
    const { data: report, error: insertError } = await supabase
      .from('reports')
      .insert({
        user_id: user.id,
        round_type: roundType as RoundType,
        resume_text: resumeText,
        job_description_text: jobDescriptionText,
        paid_unlocked: false,
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
