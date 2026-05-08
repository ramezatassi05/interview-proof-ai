import type { SupabaseClient } from '@supabase/supabase-js';
import type { CompanyActionType, CompanyActionPriority, CompanyAgentKind } from './types';
import { computeMessageCostUsd, isKnownModelId } from '@/lib/anthropic-pricing';
import { getModelForAgent } from './agent-models';

export const GUARDRAIL_TIERS = ['manual', 'guarded', 'autonomous'] as const;
export type GuardrailTier = (typeof GUARDRAIL_TIERS)[number];

export type ActionRiskLevel = 'low' | 'high';

export const ACTION_RISK: Record<CompanyActionType, ActionRiskLevel> = {
  draft_brief: 'low',
  draft_marketing_asset: 'low',
  draft_finance_memo: 'low',
  draft_engineering_spec: 'low',
  summarize_metrics: 'low',
  record_decision: 'low',
  create_task: 'high',
  request_approval: 'high',
  append_roadmap_row: 'high',
};

export const AUTO_EXECUTE_DAILY_LIMIT = 20;

export function shouldAutoExecute(
  tier: GuardrailTier,
  actionType: CompanyActionType,
  priority: CompanyActionPriority
): boolean {
  if (ACTION_RISK[actionType] === 'high') return false;
  if (tier === 'manual') return false;
  if (tier === 'autonomous') return true;
  return priority === 'low' || priority === 'medium';
}

export async function loadGuardrailTier(
  supabase: SupabaseClient,
  userId: string,
  agentKind: CompanyAgentKind
): Promise<GuardrailTier> {
  const { data } = await supabase
    .from('company_agent_guardrails')
    .select('tier')
    .eq('user_id', userId)
    .eq('agent_kind', agentKind)
    .maybeSingle();
  const tier = (data?.tier ?? 'manual') as GuardrailTier;
  return GUARDRAIL_TIERS.includes(tier) ? tier : 'manual';
}

export interface RateLimitState {
  allowed: boolean;
  used: number;
  max: number;
}

export async function checkAutoExecuteRateLimit(
  supabase: SupabaseClient,
  userId: string,
  agentKind: CompanyAgentKind,
  max: number = AUTO_EXECUTE_DAILY_LIMIT
): Promise<RateLimitState> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from('company_agent_actions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('agent_kind', agentKind)
    .eq('requires_approval', false)
    .gte('created_at', since);
  const used = count ?? 0;
  return { allowed: used < max, used, max };
}

// ---------------------------------------------------------------------------
// Monthly spend ceiling (Part 8 of CEO Command Center vision)
// ---------------------------------------------------------------------------

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
