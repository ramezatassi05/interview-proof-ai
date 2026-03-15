import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { pipelineComplete, type PipelineState } from '@/server/pipeline';
import { grantCredits, GRANT_AMOUNTS } from '@/lib/credits';
import type { RoundType } from '@/types';

export const maxDuration = 60;

const CompleteSchema = z.object({
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
    const validation = CompleteSchema.safeParse(body);

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

    if (!state || state.step !== 'analyzed') {
      return NextResponse.json(
        { error: 'Pipeline not in expected state. Run LLM step first.' },
        { status: 400 }
      );
    }

    const roundType = report.round_type as RoundType;
    const prepPreferences = report.prep_preferences_json || undefined;

    const pipelineResult = await pipelineComplete(
      state.extractedResume,
      state.extractedJD,
      state.retrievalResult.contextIds,
      state.llmAnalysis,
      roundType,
      state.priorEmployment,
      prepPreferences
    );

    // Store the run
    const { error: runError } = await supabase.from('runs').insert({
      report_id: reportId,
      run_index: 0,
      extracted_resume_json: pipelineResult.extractedResume,
      extracted_jd_json: pipelineResult.extractedJD,
      retrieved_context_ids: pipelineResult.retrievedContextIds,
      llm_analysis_json: pipelineResult.llmAnalysis,
      score_breakdown_json: pipelineResult.scoreBreakdown,
      readiness_score: pipelineResult.readinessScore,
      risk_band: pipelineResult.riskBand,
      ranked_risks_json: pipelineResult.llmAnalysis.rankedRisks,
      diagnostic_intelligence_json: pipelineResult.diagnosticIntelligence,
      personalized_study_plan_json: pipelineResult.personalizedStudyPlan || null,
    });

    if (runError) {
      console.error('Failed to store run:', runError);
      return NextResponse.json({ error: 'Failed to store analysis results' }, { status: 500 });
    }

    // Clear pipeline state
    await supabase
      .from('reports')
      .update({ pipeline_state_json: null })
      .eq('id', reportId);

    // Grant upload bonus (non-blocking, idempotent via reportId)
    try {
      const serviceClient = await createServiceClient();
      await grantCredits({
        supabase: serviceClient,
        userId: user.id,
        amount: GRANT_AMOUNTS.UPLOAD_BONUS,
        reason: 'upload',
        uniqueKey: reportId,
      });
    } catch (grantError) {
      console.error('Failed to grant upload bonus:', grantError);
    }

    // Return free tier results (same shape as original /api/report/analyze)
    const top3Risks = pipelineResult.llmAnalysis.rankedRisks.slice(0, 3);

    return NextResponse.json({
      data: {
        reportId,
        readinessScore: pipelineResult.readinessScore,
        riskBand: pipelineResult.riskBand,
        top3Risks,
        totalRisks: pipelineResult.llmAnalysis.rankedRisks.length,
        paywallState: report.paid_unlocked ? 'unlocked' : 'free',
        message: report.paid_unlocked
          ? 'Full diagnostic available'
          : 'Unlock full diagnostic for complete analysis',
      },
    });
  } catch (error) {
    console.error('Pipeline complete error:', error);
    return NextResponse.json(
      { error: 'Analysis failed. Please try again.' },
      { status: 500 }
    );
  }
}
