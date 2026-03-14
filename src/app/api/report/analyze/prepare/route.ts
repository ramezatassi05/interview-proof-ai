import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { pipelinePrepare, type PipelineState } from '@/server/pipeline';
import type { RoundType } from '@/types';

export const maxDuration = 60;

const PrepareSchema = z.object({
  reportId: z.string().uuid(),
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
    const validation = PrepareSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { reportId } = validation.data;

    const { data: report, error: fetchError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Check if analysis already exists (run_index = 0)
    const { data: existingRun } = await supabase
      .from('runs')
      .select('id')
      .eq('report_id', reportId)
      .eq('run_index', 0)
      .single();

    if (existingRun) {
      return NextResponse.json(
        { error: 'Report already analyzed. Use rerun endpoint for re-analysis.' },
        { status: 400 }
      );
    }

    const prepareOutput = await pipelinePrepare({
      resumeText: report.resume_text,
      jobDescriptionText: report.job_description_text,
      roundType: report.round_type as RoundType,
      prepPreferences: report.prep_preferences_json || undefined,
    });

    const state: PipelineState = {
      step: 'prepared',
      extractedResume: prepareOutput.extractedResume,
      extractedJD: prepareOutput.extractedJD,
      retrievalResult: prepareOutput.retrievalResult,
      priorEmployment: prepareOutput.priorEmployment,
    };

    const { error: updateError } = await supabase
      .from('reports')
      .update({ pipeline_state_json: state })
      .eq('id', reportId);

    if (updateError) {
      console.error('Failed to save pipeline state:', updateError);
      return NextResponse.json({ error: 'Failed to save pipeline state' }, { status: 500 });
    }

    return NextResponse.json({ data: { step: 'prepared' } });
  } catch (error) {
    console.error('Pipeline prepare error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
