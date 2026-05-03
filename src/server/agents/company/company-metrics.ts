import type { SupabaseClient } from '@supabase/supabase-js';
import { createServiceClient } from '@/lib/supabase/server';
import type { CompanyMetricsSnapshot } from './types';

export async function loadCompanyMetrics(args: {
  supabase: SupabaseClient;
  userId: string;
}): Promise<CompanyMetricsSnapshot> {
  const { userId } = args;
  const supabase = await createServiceClient();

  const { count: totalUsersCount } = await supabase
    .from('user_profiles')
    .select('id', { count: 'exact', head: true });
  const { count: totalReportsCount } = await supabase
    .from('reports')
    .select('id', { count: 'exact', head: true });
  const { count: unlockedReportsCount } = await supabase
    .from('reports')
    .select('id', { count: 'exact', head: true })
    .eq('paid_unlocked', true);
  const { count: pendingCompanyActionsCount } = await supabase
    .from('company_agent_actions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'awaiting_approval');
  const { count: activeCompanySessionsCount } = await supabase
    .from('company_agent_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'active');

  const totalUsers = totalUsersCount ?? 0;
  const totalReports = totalReportsCount ?? 0;
  const unlockedReports = unlockedReportsCount ?? 0;
  const pendingCompanyActions = pendingCompanyActionsCount ?? 0;
  const activeCompanySessions = activeCompanySessionsCount ?? 0;

  const { data: creditsRows } = await supabase
    .from('credits_ledger')
    .select('amount')
    .eq('type', 'purchase');

  const totalCreditsPurchased = (creditsRows ?? []).reduce((sum, row) => {
    const amount = (row as { amount: number }).amount;
    return sum + Math.max(0, amount);
  }, 0);

  const metrics: CompanyMetricsSnapshot = {
    totalUsers,
    totalReports,
    unlockedReports,
    unlockRate: totalReports > 0 ? unlockedReports / totalReports : 0,
    totalCreditsPurchased,
    estimatedRevenueCents: totalCreditsPurchased * 1500,
    pendingCompanyActions,
    activeCompanySessions,
    capturedAt: new Date().toISOString(),
  };

  await supabase.from('company_metrics_snapshots').insert({
    user_id: userId,
    metrics_json: metrics,
    source: 'admin_api',
  });

  return metrics;
}
