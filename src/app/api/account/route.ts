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
          run_index
        )
      `
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (reportsError) {
      console.error('Failed to get reports:', reportsError);
    }

    // Transform reports data
    const formattedReports = (reports || []).map((report) => {
      const latestRun = Array.isArray(report.runs)
        ? report.runs.sort((a, b) => b.run_index - a.run_index)[0]
        : null;

      return {
        id: report.id,
        roundType: report.round_type,
        createdAt: report.created_at,
        paidUnlocked: report.paid_unlocked,
        readinessScore: latestRun?.readiness_score ?? null,
        riskBand: latestRun?.risk_band ?? null,
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
