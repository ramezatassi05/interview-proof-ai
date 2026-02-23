import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const serviceClient = await createServiceClient();

    // Look up report by share_token + share_enabled
    const { data: report, error: fetchError } = await serviceClient
      .from('reports')
      .select('id, round_type, created_at')
      .eq('share_token', token)
      .eq('share_enabled', true)
      .single();

    if (fetchError || !report) {
      return NextResponse.json({ error: 'Shared report not found' }, { status: 404 });
    }

    // Fetch latest run for this report
    const { data: runs, error: runsError } = await serviceClient
      .from('runs')
      .select('*')
      .eq('report_id', report.id)
      .order('run_index', { ascending: true });

    if (runsError || !runs || runs.length === 0) {
      return NextResponse.json({ error: 'Report data not available' }, { status: 404 });
    }

    const latestRun = runs[runs.length - 1];

    // Return sanitized data — no user_id, resume_text, resume_file_path, job_description_text
    return NextResponse.json({
      data: {
        reportId: report.id,
        roundType: report.round_type,
        createdAt: report.created_at,
        readinessScore: latestRun.readiness_score,
        riskBand: latestRun.risk_band,
        allRisks: latestRun.ranked_risks_json,
        interviewQuestions: latestRun.llm_analysis_json?.interviewQuestions,
        studyPlan: latestRun.llm_analysis_json?.studyPlan,
        scoreBreakdown: latestRun.score_breakdown_json,
        diagnosticIntelligence: latestRun.diagnostic_intelligence_json,
        personalizedStudyPlan: latestRun.personalized_study_plan_json || undefined,
        personalizedCoaching: latestRun.llm_analysis_json?.personalizedCoaching || undefined,
        // Only expose companyName from extractedJD, not the full JD
        extractedJD: latestRun.extracted_jd_json?.companyName
          ? { companyName: latestRun.extracted_jd_json.companyName }
          : undefined,
        isShared: true,
      },
    });
  } catch (error) {
    console.error('Shared report error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
