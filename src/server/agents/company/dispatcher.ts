/**
 * Shared dispatch logic for autonomous company-agent runs.
 *
 * Used by:
 *   - /api/cron/company-agent/[role]  (when an agent is opted into vercel.json crons)
 *   - on-visit checker                (default: fires when the operator opens the
 *     command center and a director / EA hasn't run within its cadence window)
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { runCompanyAgent } from './company-agent-runner';
import { loadCompanyMetrics } from './company-metrics';
import { loadDirectorContext } from './director-context';
import {
  COMPANY_AGENT_KINDS,
  type CompanyAgentKind,
  type CompanyAgentTriggeredBy,
} from './types';

export type ScheduledAgentKind = Exclude<CompanyAgentKind, 'ceo_orchestrator'>;

export const SCHEDULED_AGENT_KINDS = COMPANY_AGENT_KINDS.filter(
  (k): k is ScheduledAgentKind => k !== 'ceo_orchestrator',
);

const ROADMAP_GROUNDING =
  ' Anchor every proposal to an active row in your roadmap and to the north star. If nothing in your roadmap is actionable right now, propose nothing — say so explicitly. Do not propose work that violates the north star\'s "What NOT to do right now" list.';

export const SCHEDULED_AGENT_PROMPTS: Record<ScheduledAgentKind, string> = {
  executive_assistant:
    'Daily morning brief. Review pending approvals, recent actions, and open tasks. Propose 1–3 follow-ups the operator should handle today. When a proposal concerns a specific open task, the task title must appear verbatim in both the proposal `title` and `rationale` — never refer to it generically as "an open task" or "1 task". If no open task is actionable, do not propose a review item for it.' +
    ROADMAP_GROUNDING,
  director_marketing:
    'Weekly review. Walk through your active roadmap rows in roadmap/marketing.csv and the north star. For each active row where you can take a meaningful next step, propose it. Skip rows that are not actionable yet.' +
    ROADMAP_GROUNDING,
  director_engineering:
    'Weekly review. Walk through your active roadmap rows in roadmap/product.csv and the north star. For each active row where you can take a meaningful next step (spec, plan, decision, unblocker), propose it. Skip rows not yet actionable.' +
    ROADMAP_GROUNDING,
  director_finance:
    "End-of-week financial review. Walk through roadmap/finance.csv and the north star's constraints (burn target, runway). Propose 1–3 actions tied to active line items or the north star's priorities — pricing, vendor cuts, or runway moves." +
    ROADMAP_GROUNDING,
};

export interface DispatchScheduledAgentParams {
  supabase: SupabaseClient;
  ownerUserId: string;
  agentKind: ScheduledAgentKind;
  triggeredBy: CompanyAgentTriggeredBy;
  /** Override the session title prefix (defaults to "Scheduled"). */
  sessionTitlePrefix?: string;
}

export interface DispatchScheduledAgentResult {
  sessionId: string;
  actionsProposed: number;
  tokensIn: number;
  tokensOut: number;
}

export async function dispatchScheduledAgent(
  params: DispatchScheduledAgentParams,
): Promise<DispatchScheduledAgentResult> {
  const { supabase, ownerUserId, agentKind, triggeredBy } = params;
  const titlePrefix = params.sessionTitlePrefix ?? 'Scheduled';
  const todayLabel = new Date().toISOString().slice(0, 10);

  const { data: sessionData, error: sessionError } = await supabase
    .from('company_agent_sessions')
    .insert({
      user_id: ownerUserId,
      agent_kind: agentKind,
      title: `${titlePrefix} ${agentKind} check-in ${todayLabel}`,
      status: 'active',
      last_message_at: new Date().toISOString(),
      triggered_by: triggeredBy,
    })
    .select('id')
    .single();

  if (sessionError || !sessionData) {
    throw new Error(
      `[dispatcher] failed to create session for ${agentKind}: ${sessionError?.message ?? 'no row returned'}`,
    );
  }
  const sessionId = (sessionData as { id: string }).id;

  const [metrics, directorContext] = await Promise.all([
    loadCompanyMetrics({ supabase, userId: ownerUserId }),
    loadDirectorContext({ supabase, userId: ownerUserId, kind: agentKind }),
  ]);

  const result = await runCompanyAgent({
    userId: ownerUserId,
    sessionId,
    agentKind,
    message: SCHEDULED_AGENT_PROMPTS[agentKind],
    supabase,
    metrics,
    directorContext,
    triggeredBy,
  });

  return {
    sessionId,
    actionsProposed: result.actionIds.length,
    tokensIn: result.tokensIn,
    tokensOut: result.tokensOut,
  };
}
