import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: reportId } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    // Fetch all runs for this report
    const { data: runs, error: runsError } = await supabase
      .from('runs')
      .select('*')
      .eq('report_id', reportId)
      .order('run_index', { ascending: true });

    if (runsError) {
      console.error('Failed to fetch runs:', runsError);
      return NextResponse.json({ error: 'Failed to fetch analysis data' }, { status: 500 });
    }

    const latestRun = runs && runs.length > 0 ? runs[runs.length - 1] : null;

    if (!latestRun) {
      return NextResponse.json({
        data: {
          reportId: report.id,
          roundType: report.round_type,
          createdAt: report.created_at,
          paidUnlocked: report.paid_unlocked,
          analyzed: false,
          message: 'Report not yet analyzed. Call /api/report/analyze.',
        },
      });
    }

    // Build response based on paid status
    const baseResponse = {
      reportId: report.id,
      roundType: report.round_type,
      createdAt: report.created_at,
      paidUnlocked: report.paid_unlocked,
      analyzed: true,
      readinessScore: latestRun.readiness_score,
      riskBand: latestRun.risk_band,
      runCount: runs.length,
    };

    // TEMP: Bypass paywall - always return full diagnostic
    return NextResponse.json({
      data: {
        ...baseResponse,
        paidUnlocked: true, // Override to unlock UI
        allRisks: latestRun.ranked_risks_json,
        interviewQuestions: latestRun.llm_analysis_json.interviewQuestions,
        studyPlan: latestRun.llm_analysis_json.studyPlan,
        scoreBreakdown: latestRun.score_breakdown_json,
        extractedResume: latestRun.extracted_resume_json,
        extractedJD: latestRun.extracted_jd_json,
        diagnosticIntelligence: latestRun.diagnostic_intelligence_json,
        prepPreferences: report.prep_preferences_json || undefined,
        personalizedStudyPlan: latestRun.personalized_study_plan_json || undefined,
        personalizedCoaching: latestRun.llm_analysis_json?.personalizedCoaching || undefined,
      },
    });
  } catch (error) {
    console.error('Get report error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
