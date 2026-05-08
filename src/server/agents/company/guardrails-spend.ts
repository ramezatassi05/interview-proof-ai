import type { SupabaseClient } from '@supabase/supabase-js';
import type { CompanyAgentKind } from './types';
import { computeMessageCostUsd, isKnownModelId } from '@/lib/anthropic-pricing';
import { getModelForAgent } from './agent-models';

export interface SpendState {
  allowed: boolean;
  monthSpendUsd: number;
  capUsd: number | null;
  monthStart: string;
  resetsAt: string;
}

interface MessageCostRow {
  tokens_in: number | null;
  tokens_out: number | null;
  model_id: string | null;
}

function getUtcMonthBoundaries(now: Date = new Date()): { start: Date; nextStart: Date } {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const nextStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { start, nextStart };
}

export async function computeMonthlySpend(
  supabase: SupabaseClient,
  userId: string,
  agentKind: CompanyAgentKind
): Promise<number> {
  const { start } = getUtcMonthBoundaries();
  const { data } = await supabase
    .from('company_agent_messages')
    .select('tokens_in,tokens_out,model_id,session_id,company_agent_sessions!inner(user_id)')
    .eq('agent_kind', agentKind)
    .eq('role', 'agent')
    .eq('company_agent_sessions.user_id', userId)
    .gte('created_at', start.toISOString());

  const fallbackModel = getModelForAgent(agentKind);
  const rows = (data as (MessageCostRow & { session_id: string })[] | null) ?? [];

  let totalUsd = 0;
  for (const row of rows) {
    const modelId = isKnownModelId(row.model_id) ? row.model_id : fallbackModel;
    totalUsd += computeMessageCostUsd(modelId, row.tokens_in ?? 0, row.tokens_out ?? 0);
  }
  return totalUsd;
}

interface SpendConfigRow {
  monthly_spend_cap_usd: number | string | null;
  spend_paused_until: string | null;
}

export async function checkSpendCeiling(
  supabase: SupabaseClient,
  userId: string,
  agentKind: CompanyAgentKind
): Promise<SpendState> {
  const { data } = await supabase
    .from('company_agent_guardrails')
    .select('monthly_spend_cap_usd,spend_paused_until')
    .eq('user_id', userId)
    .eq('agent_kind', agentKind)
    .maybeSingle<SpendConfigRow>();

  const capRaw = data?.monthly_spend_cap_usd;
  const capUsd = capRaw == null ? null : typeof capRaw === 'string' ? parseFloat(capRaw) : capRaw;

  const { start, nextStart } = getUtcMonthBoundaries();
  const monthSpendUsd = await computeMonthlySpend(supabase, userId, agentKind);

  const allowed = capUsd == null ? true : monthSpendUsd < capUsd;

  if (!allowed && data) {
    const pausedUntil = data.spend_paused_until ? new Date(data.spend_paused_until) : null;
    if (!pausedUntil || pausedUntil < nextStart) {
      await supabase
        .from('company_agent_guardrails')
        .update({ spend_paused_until: nextStart.toISOString() })
        .eq('user_id', userId)
        .eq('agent_kind', agentKind);
    }
  }

  return {
    allowed,
    monthSpendUsd,
    capUsd,
    monthStart: start.toISOString(),
    resetsAt: nextStart.toISOString(),
  };
}

export class SpendCapExceededError extends Error {
  readonly state: SpendState;
  constructor(state: SpendState) {
    super(
      `Monthly spend cap of $${state.capUsd?.toFixed(2) ?? '0'} reached ($${state.monthSpendUsd.toFixed(
        2
      )} used). Cap resets at ${state.resetsAt}.`
    );
    this.name = 'SpendCapExceededError';
    this.state = state;
  }
}
