import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { pipelineLLM, type PipelineState } from '@/server/pipeline';
import type { RoundType } from '@/types';

export const maxDuration = 60;

const LLMSchema = z.object({
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
    const validation = LLMSchema.safeParse(body);

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

    const state = report.pipeline_state_json as PipelineState | null;

    if (!state || state.step !== 'prepared') {
      return NextResponse.json(
        { error: 'Pipeline not in expected state. Run prepare step first.' },
        { status: 400 }
      );
    }

    const { llmAnalysis } = await pipelineLLM(
      {
        extractedResume: state.extractedResume,
        extractedJD: state.extractedJD,
        retrievalResult: state.retrievalResult,
        priorEmployment: state.priorEmployment,
      },
      report.round_type as RoundType,
      report.prep_preferences_json || undefined
    );

    const analyzedState: PipelineState = {
      step: 'analyzed',
      extractedResume: state.extractedResume,
      extractedJD: state.extractedJD,
      retrievalResult: state.retrievalResult,
      priorEmployment: state.priorEmployment,
      llmAnalysis,
    };

    const { error: updateError } = await supabase
      .from('reports')
      .update({ pipeline_state_json: analyzedState })
      .eq('id', reportId);

    if (updateError) {
      console.error('Failed to save pipeline state:', updateError);
      return NextResponse.json({ error: 'Failed to save pipeline state' }, { status: 500 });
    }

    return NextResponse.json({ data: { step: 'analyzed' } });
  } catch (error) {
    console.error('Pipeline LLM error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
