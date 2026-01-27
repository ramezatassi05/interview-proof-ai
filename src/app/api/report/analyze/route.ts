import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { runAnalysisPipeline } from '@/server/pipeline';
import type { RoundType } from '@/types';

const AnalyzeReportSchema = z.object({
  reportId: z.string().uuid(),
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
    const validation = AnalyzeReportSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { reportId } = validation.data;

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

    // Run the analysis pipeline
    const pipelineResult = await runAnalysisPipeline({
      resumeText: report.resume_text,
      jobDescriptionText: report.job_description_text,
      roundType: report.round_type as RoundType,
      prepPreferences: report.prep_preferences_json || undefined,
    });

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

    // Return free tier results (score + top 3 risks)
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
    console.error('Analyze report error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
