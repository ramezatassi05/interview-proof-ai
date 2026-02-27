import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { runAnalysisPipeline, computeDelta, type PipelineOutput } from '@/server/pipeline';
import type { RoundType, RiskBand } from '@/types';

export const maxDuration = 180;

const RerunReportSchema = z.object({
  reportId: z.string().uuid(),
  updatedResumeText: z.string().min(50).optional(),
  updatedJobDescriptionText: z.string().min(50).optional(),
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
    const validation = RerunReportSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { reportId, updatedResumeText, updatedJobDescriptionText } = validation.data;

    // Fetch the report
    const { data: report, error: fetchError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Check if report is paid (rerun requires paid unlock)
    if (!report.paid_unlocked) {
      return NextResponse.json(
        { error: 'Rerun requires paid unlock. Unlock the report first.' },
        { status: 403 }
      );
    }

    // Check existing runs
    const { data: existingRuns, error: runsError } = await supabase
      .from('runs')
      .select('*')
      .eq('report_id', reportId)
      .order('run_index', { ascending: true });

    if (runsError) {
      console.error('Failed to fetch runs:', runsError);
      return NextResponse.json({ error: 'Failed to check run history' }, { status: 500 });
    }

    // Check rerun limit (1 rerun allowed per paid report)
    const maxRunIndex = existingRuns?.length
      ? Math.max(...existingRuns.map((r) => r.run_index))
      : -1;

    if (maxRunIndex >= 1) {
      return NextResponse.json(
        { error: 'Rerun limit reached. Each paid report allows one rerun.' },
        { status: 403 }
      );
    }

    // Use updated text or original
    const resumeText = updatedResumeText || report.resume_text;
    const jobDescriptionText = updatedJobDescriptionText || report.job_description_text;

    // Run the analysis pipeline
    const pipelineResult = await runAnalysisPipeline({
      resumeText,
      jobDescriptionText,
      roundType: report.round_type as RoundType,
    });

    // Store the rerun
    const { error: runError } = await supabase.from('runs').insert({
      report_id: reportId,
      run_index: maxRunIndex + 1,
      extracted_resume_json: pipelineResult.extractedResume,
      extracted_jd_json: pipelineResult.extractedJD,
      retrieved_context_ids: pipelineResult.retrievedContextIds,
      llm_analysis_json: pipelineResult.llmAnalysis,
      score_breakdown_json: pipelineResult.scoreBreakdown,
      readiness_score: pipelineResult.readinessScore,
      risk_band: pipelineResult.riskBand,
      ranked_risks_json: pipelineResult.llmAnalysis.rankedRisks,
      diagnostic_intelligence_json: pipelineResult.diagnosticIntelligence,
    });

    if (runError) {
      console.error('Failed to store rerun:', runError);
      return NextResponse.json({ error: 'Failed to store rerun results' }, { status: 500 });
    }

    // Compute delta if there's a previous run
    let delta = null;
    if (existingRuns && existingRuns.length > 0) {
      const previousRun = existingRuns[existingRuns.length - 1];
      const previousPipelineOutput: PipelineOutput = {
        extractedResume: previousRun.extracted_resume_json,
        extractedJD: previousRun.extracted_jd_json,
        retrievedContextIds: previousRun.retrieved_context_ids,
        llmAnalysis: previousRun.llm_analysis_json,
        readinessScore: previousRun.readiness_score,
        riskBand: previousRun.risk_band as RiskBand,
        scoreBreakdown: previousRun.score_breakdown_json,
        diagnosticIntelligence: previousRun.diagnostic_intelligence_json,
      };

      delta = computeDelta(previousPipelineOutput, pipelineResult);
    }

    return NextResponse.json({
      data: {
        reportId,
        runIndex: maxRunIndex + 1,
        readinessScore: pipelineResult.readinessScore,
        riskBand: pipelineResult.riskBand,
        allRisks: pipelineResult.llmAnalysis.rankedRisks,
        interviewQuestions: pipelineResult.llmAnalysis.interviewQuestions,
        studyPlan: pipelineResult.llmAnalysis.studyPlan,
        delta,
        message: delta
          ? `Score changed by ${delta.scoreDelta > 0 ? '+' : ''}${delta.scoreDelta} points`
          : 'Analysis complete',
      },
    });
  } catch (error) {
    console.error('Rerun report error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
