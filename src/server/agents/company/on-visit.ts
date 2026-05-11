/**
 * On-visit dispatcher.
 *
 * Replaces the old time-based crons for the EA + directors. When the operator
 * opens the command center, we check whether each autonomous agent has run
 * inside its cadence window; any that are due get dispatched in the
 * background (via `after()`), so the page render is never blocked.
 *
 * Cadence windows match the previous cron schedule:
 *   - executive_assistant: at most once per ~20h
 *   - director_*         : at most once per ~6 days
 *
 * The CADENCE check looks at autonomous sessions (triggered_by IN
 * ('cron','agent')) so manual chats don't satisfy the cadence and a paranoid
 * 60-second debounce prevents double-fires on rapid refresh.
 */
import { createServiceClient } from '@/lib/supabase/server';
import {
  dispatchScheduledAgent,
  SCHEDULED_AGENT_KINDS,
  type ScheduledAgentKind,
} from './dispatcher';

const CADENCE_HOURS: Record<ScheduledAgentKind, number> = {
  executive_assistant: 20,
  director_marketing: 24 * 6,
  director_engineering: 24 * 6,
  director_finance: 24 * 6,
};

const DEBOUNCE_SECONDS = 60;

interface MaybeRunResult {
  dispatched: ScheduledAgentKind[];
  skipped: Array<{ agentKind: ScheduledAgentKind; reason: string }>;
}

export async function maybeRunDueAgents(): Promise<MaybeRunResult> {
  const ownerUserId = process.env.COMPANY_AGENT_OWNER_USER_ID;
  if (!ownerUserId) {
    return {
      dispatched: [],
      skipped: SCHEDULED_AGENT_KINDS.map((k) => ({
        agentKind: k,
        reason: 'COMPANY_AGENT_OWNER_USER_ID not configured',
      })),
    };
  }

  const supabase = await createServiceClient();
  const now = Date.now();
  const dispatched: ScheduledAgentKind[] = [];
  const skipped: Array<{ agentKind: ScheduledAgentKind; reason: string }> = [];

  for (const agentKind of SCHEDULED_AGENT_KINDS) {
    const cadenceMs = CADENCE_HOURS[agentKind] * 60 * 60 * 1000;

    const { data: lastAutonomous } = await supabase
      .from('company_agent_sessions')
      .select('created_at')
      .eq('user_id', ownerUserId)
      .eq('agent_kind', agentKind)
      .in('triggered_by', ['cron', 'agent'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastAutonomous?.created_at) {
      const ageMs = now - new Date(lastAutonomous.created_at as string).getTime();
      if (ageMs < cadenceMs) {
        skipped.push({
          agentKind,
          reason: `last autonomous run ${Math.round(ageMs / 60000)}m ago, cadence ${CADENCE_HOURS[agentKind]}h`,
        });
        continue;
      }
      if (ageMs < DEBOUNCE_SECONDS * 1000) {
        skipped.push({ agentKind, reason: 'debounce' });
        continue;
      }
    }

    try {
      const result = await dispatchScheduledAgent({
        supabase,
        ownerUserId,
        agentKind,
        triggeredBy: 'cron',
        sessionTitlePrefix: 'On-visit',
      });
      dispatched.push(agentKind);
      console.log(
        `[on-visit] dispatched ${agentKind}: session=${result.sessionId} actions=${result.actionsProposed}`,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unknown error';
      console.error(`[on-visit] ${agentKind} dispatch failed:`, message);
      skipped.push({ agentKind, reason: `error: ${message}` });
    }
  }

  return { dispatched, skipped };
}
