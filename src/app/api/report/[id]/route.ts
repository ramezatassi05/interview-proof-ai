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

    // Fetch the report (include sharing columns)
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

    // Build share URL if token exists
    const origin = request.headers.get('origin') || request.headers.get('host') || '';
    const baseUrl = origin.startsWith('http') ? origin : `https://${origin}`;

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
      shareEnabled: report.share_enabled || false,
      shareUrl: report.share_token ? `${baseUrl}/s/${report.share_token}` : undefined,
    };

    // Helper to migrate old coaching data
    const migrateCoaching = () => {
      const coaching = latestRun.llm_analysis_json?.personalizedCoaching;
      if (!coaching) return undefined;
      if (coaching.priorityActions) {
        coaching.priorityActions = coaching.priorityActions.map(
          (pa: { resource?: string; resources?: string[]; [key: string]: unknown }) => {
            if (pa.resource && !pa.resources) {
              const { resource, ...rest } = pa;
              return { ...rest, resources: [resource] };
            }
            return pa;
          }
        );
      }
      return coaching;
    };

    const allRisks = Array.isArray(latestRun.ranked_risks_json)
      ? latestRun.ranked_risks_json
      : [];

    if (report.paid_unlocked) {
      // Full diagnostic for paid reports
      return NextResponse.json({
        data: {
          ...baseResponse,
          allRisks,
          interviewQuestions: latestRun.llm_analysis_json?.interviewQuestions,
          studyPlan: latestRun.llm_analysis_json?.studyPlan,
          scoreBreakdown: latestRun.score_breakdown_json,
          extractedResume: latestRun.extracted_resume_json,
          extractedJD: latestRun.extracted_jd_json,
          diagnosticIntelligence: latestRun.diagnostic_intelligence_json,
          prepPreferences: report.prep_preferences_json || undefined,
          personalizedStudyPlan: latestRun.personalized_study_plan_json || undefined,
          personalizedCoaching: migrateCoaching(),
        },
      });
    }

    // Free tier: limited preview data
    return NextResponse.json({
      data: {
        ...baseResponse,
        top3Risks: allRisks.slice(0, 3),
        totalRisks: allRisks.length,
        extractedJD: latestRun.extracted_jd_json,
        diagnosticIntelligence: latestRun.diagnostic_intelligence_json
          ? { competencyHeatmap: latestRun.diagnostic_intelligence_json.competencyHeatmap }
          : undefined,
        paywallMessage: `Unlock the full diagnostic to see all ${allRisks.length} risks, interview questions, and your personalized study plan.`,
      },
    });
  } catch (error) {
    console.error('Get report error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
