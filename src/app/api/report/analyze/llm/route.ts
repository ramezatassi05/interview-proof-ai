import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { pipelineLLM, type PipelineState } from '@/server/pipeline';
import type { RoundType } from '@/types';

export const maxDuration = 300; // Streaming responses get up to 5min on Vercel Hobby

const LLMSchema = z.object({
  reportId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  // --- Pre-stream validation (returns normal JSON on error) ---
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

  // --- Streaming response: heartbeat every 10s keeps Vercel alive ---
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(' '));
        } catch {
          clearInterval(heartbeat);
        }
      }, 10_000);

      try {
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
          controller.enqueue(
            encoder.encode(JSON.stringify({ error: 'Failed to save pipeline state' }))
          );
        } else {
          controller.enqueue(encoder.encode(JSON.stringify({ data: { step: 'analyzed' } })));
        }
      } catch (error) {
        console.error('Pipeline LLM error:', error);
        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              error: 'Analysis failed. Please try again.',
            })
          )
        );
      } finally {
        clearInterval(heartbeat);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  });
}
