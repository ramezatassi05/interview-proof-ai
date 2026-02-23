import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    // Check authentication
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get credit balance
    const { data: balance, error: balanceError } = await supabase.rpc('get_user_credit_balance', {
      p_user_id: user.id,
    });

    if (balanceError) {
      console.error('Failed to get balance:', balanceError);
    }

    // Get reports
    const { data: reports, error: reportsError } = await supabase
      .from('reports')
      .select(
        `
        id,
        round_type,
        created_at,
        paid_unlocked,
        runs (
          readiness_score,
          risk_band,
          run_index,
          extracted_jd_json,
          ranked_risks_json,
          llm_analysis_json
        )
      `
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (reportsError) {
      console.error('Failed to get reports:', reportsError);
    }

    // Transform reports data
    const formattedReports = (reports || []).map((report) => {
      const latestRun = Array.isArray(report.runs)
        ? report.runs.sort((a, b) => b.run_index - a.run_index)[0]
        : null;

      const extractedJD = latestRun?.extracted_jd_json as Record<string, unknown> | null;

      const rankedRisks = Array.isArray(latestRun?.ranked_risks_json)
        ? (latestRun.ranked_risks_json as { title: string; severity: string }[])
        : [];
      const llmAnalysis = latestRun?.llm_analysis_json as Record<string, unknown> | null;
      const studyPlan = Array.isArray(llmAnalysis?.studyPlan)
        ? (llmAnalysis.studyPlan as { task: string; timeEstimateMinutes: number }[])
        : [];

      return {
        id: report.id,
        roundType: report.round_type,
        createdAt: report.created_at,
        paidUnlocked: report.paid_unlocked,
        readinessScore: latestRun?.readiness_score ?? null,
        riskBand: latestRun?.risk_band ?? null,
        companyName: (extractedJD?.companyName as string) ?? null,
        top3Risks: rankedRisks.slice(0, 3).map((r) => ({ title: r.title, severity: r.severity })),
        top3StudyPlan: studyPlan
          .slice(0, 3)
          .map((s) => ({ task: s.task, timeEstimateMinutes: s.timeEstimateMinutes })),
      };
    });

    return NextResponse.json({
      data: {
        email: user.email,
        creditBalance: balance ?? 0,
        reports: formattedReports,
      },
    });
  } catch (error) {
    console.error('Account fetch failed:', error);
    return NextResponse.json({ error: 'Failed to fetch account data' }, { status: 500 });
  }
}
