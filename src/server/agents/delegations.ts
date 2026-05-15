/**
 * Phase B+1 — shared helper for specialists that wish to propose follow-up
 * delegations to OTHER specialists.
 *
 * The orchestrator already drafts `delegate_to_specialist` natively. To extend
 * that pattern to upstream specialists without rebuilding the action-drafting
 * machinery in each agent, every specialist run() can produce an optional
 * `suggestedDelegations` array and call persistSuggestedDelegations() — the
 * helper validates each entry, filters out self-delegations, and inserts one
 * drafted agent_actions row per surviving suggestion.
 *
 * Delegations remain executor-owned (see EXTERNAL_SEND_ACTIONS) — the
 * approved→completed flip is gated to /api/cron/execute-approved-actions which
 * primes the target session.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import {
  actionRequiresExternalSend,
  type AgentKind,
} from '@/lib/agent/types';
import { validateActionPayload } from '@/lib/agent/actions';
import type { AgentDelegateTargetKind } from '@/types';

export const DELEGATE_TARGET_KINDS: readonly AgentDelegateTargetKind[] = [
  'readiness_coach',
  'mock_interview',
  'prep_plan',
  'resume_evidence',
  'company_research',
  'recruiter_comm',
  'opportunity_tracker',
  'application_materials',
  'post_interview_debrief',
] as const;

export const SuggestedDelegationSchema = z.object({
  targetAgentKind: z.enum([
    'readiness_coach',
    'mock_interview',
    'prep_plan',
    'resume_evidence',
    'company_research',
    'recruiter_comm',
    'opportunity_tracker',
    'application_materials',
    'post_interview_debrief',
  ]),
  brief: z.string().min(1).max(2000),
  reportId: z.string().uuid().optional(),
  opportunityId: z.string().uuid().optional(),
});

export type SuggestedDelegation = z.infer<typeof SuggestedDelegationSchema>;

export interface PersistSuggestedDelegationsArgs {
  supabase: SupabaseClient;
  userId: string;
  sessionId: string;
  reportId: string | null;
  proposingAgentKind: AgentKind;
  delegations: SuggestedDelegation[];
}

/**
 * Map a proposing agent kind to its delegate-target form. Some specialists
 * (e.g. `post_interview_debrief`) share the same name across both; the
 * orchestrator has no delegate-target form. We use this to drop self-delegations.
 */
function selfDelegateTarget(kind: AgentKind): AgentDelegateTargetKind | null {
  switch (kind) {
    case 'readiness_coach':
    case 'mock_interview':
    case 'prep_plan':
    case 'resume_evidence':
    case 'company_research':
    case 'recruiter_comm':
    case 'opportunity_tracker':
    case 'application_materials':
    case 'post_interview_debrief':
      return kind;
    case 'answer_feedback':
    case 'orchestrator':
      return null;
  }
}

export async function persistSuggestedDelegations(
  args: PersistSuggestedDelegationsArgs
): Promise<string[]> {
  const { supabase, userId, sessionId, reportId, proposingAgentKind, delegations } = args;

  if (delegations.length === 0) return [];

  const selfTarget = selfDelegateTarget(proposingAgentKind);

  const rows: Array<Record<string, unknown>> = [];
  for (const raw of delegations) {
    if (selfTarget && raw.targetAgentKind === selfTarget) {
      // Skip self-delegations silently — they would just loop.
      continue;
    }
    const payload: Record<string, unknown> = {
      targetAgentKind: raw.targetAgentKind,
      brief: raw.brief.slice(0, 2000),
    };
    if (raw.reportId) payload.reportId = raw.reportId;
    else if (reportId) payload.reportId = reportId;
    if (raw.opportunityId) payload.opportunityId = raw.opportunityId;

    const v = validateActionPayload('delegate_to_specialist', payload);
    if (!v.ok) {
      console.warn(
        '[delegations] dropping invalid delegate_to_specialist payload from',
        proposingAgentKind,
        v.error
      );
      continue;
    }
    rows.push({
      user_id: userId,
      session_id: sessionId,
      report_id: reportId,
      action_type: 'delegate_to_specialist',
      payload_json: v.payload,
      status: 'drafted',
      requires_external_send: actionRequiresExternalSend('delegate_to_specialist'),
    });
  }

  if (rows.length === 0) return [];

  const { data, error } = await supabase.from('agent_actions').insert(rows).select('id');
  if (error) {
    console.error(
      '[delegations] failed to persist suggested delegations for',
      proposingAgentKind,
      error
    );
    return [];
  }
  return (data ?? []).map((r) => r.id as string);
}
