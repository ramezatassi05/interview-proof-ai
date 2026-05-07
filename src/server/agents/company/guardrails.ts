import type { SupabaseClient } from '@supabase/supabase-js';
import type { CompanyActionType, CompanyActionPriority, CompanyAgentKind } from './types';

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
