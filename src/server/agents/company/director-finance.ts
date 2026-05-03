import type { SupabaseClient } from '@supabase/supabase-js';
import { loadCompanyMetrics } from './company-metrics';
import { runCompanyAgent } from './company-agent-runner';

export async function runDirectorFinance(args: {
  userId: string;
  sessionId: string;
  message: string;
  supabase: SupabaseClient;
}) {
  const metrics = await loadCompanyMetrics(args);
  return runCompanyAgent({ ...args, agentKind: 'director_finance', metrics });
}
