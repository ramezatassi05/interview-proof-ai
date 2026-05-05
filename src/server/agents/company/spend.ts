import type { SupabaseClient } from '@supabase/supabase-js';

const SONNET_INPUT_PER_MTOK_CENTS = 300;
const SONNET_OUTPUT_PER_MTOK_CENTS = 1500;

export async function loadSpendLast30dCents(args: {
  supabase: SupabaseClient;
  userId: string;
}): Promise<number> {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: sessions } = await args.supabase
    .from('company_agent_sessions')
    .select('id')
    .eq('user_id', args.userId);

  const sessionIds = (sessions ?? []).map((s) => (s as { id: string }).id);
  if (sessionIds.length === 0) return 0;

  const { data: messages } = await args.supabase
    .from('company_agent_messages')
    .select('tokens_in, tokens_out')
    .in('session_id', sessionIds)
    .gte('created_at', cutoff);

  let totalCents = 0;
  for (const row of messages ?? []) {
    const tIn = (row as { tokens_in: number | null }).tokens_in ?? 0;
    const tOut = (row as { tokens_out: number | null }).tokens_out ?? 0;
    totalCents += (tIn * SONNET_INPUT_PER_MTOK_CENTS) / 1_000_000;
    totalCents += (tOut * SONNET_OUTPUT_PER_MTOK_CENTS) / 1_000_000;
  }
  return Math.round(totalCents);
}
