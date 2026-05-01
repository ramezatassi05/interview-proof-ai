/**
 * runOpportunityTracker — M7.8 entrypoint.
 *
 * Reviews ONE opportunity and proposes:
 *   1. A `propose_opportunity_update` action with the changed fields
 *      (drafted only if there is at least one proposed change).
 *   2. An `update_prep_plan` action when the agent flags
 *      prepRecommendation.needsPrepPlan AND the user already has an active
 *      prep plan. If no active plan exists, the recommendation surfaces in
 *      the response payload so the UI can route the user to the prep-plan
 *      agent (M7.4) — we never auto-create plans here.
 *
 * Both actions are non-external — they update the candidate's own data.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { CLAUDE_MODELS, getAnthropicClient } from '@/lib/anthropic';
import { actionRequiresExternalSend } from '@/lib/agent/types';
import { validateActionPayload } from '@/lib/agent/actions';
import { runAgentCall } from '@/lib/agent/audit';
import type { Opportunity, OpportunityStage, OpportunityTrackerOutput } from '@/types';
import { loadAgentContext, type AgentContextBundle } from './context-loader';
import { buildUserPrompt, SYSTEM_PROMPT } from './prompts/opportunity-tracker';

export const OPPORTUNITY_TRACKER_VERSION = 'v1.0.0';

const STAGE_VALUES = [
  'applied',
  'recruiter_screen',
  'phone_screen',
  'onsite',
  'offer',
  'rejected',
  'withdrawn',
] as const satisfies readonly OpportunityStage[];

const ProposedChangesSchema = z.object({
  stage: z.enum(STAGE_VALUES).optional(),
  interviewDate: z.string().min(1).max(40).optional(),
  notes: z.string().min(1).max(4000).optional(),
});

const PrepRecommendationSchema = z.object({
  needsPrepPlan: z.boolean(),
  reason: z.string().max(800).default(''),
  suggestedFocus: z.array(z.string().max(200)).max(8).default([]),
});

const OpportunityTrackerSchema = z.object({
  summary: z.string().min(1).max(1500),
  proposedChanges: ProposedChangesSchema.default({}),
  prepRecommendation: PrepRecommendationSchema,
  evidenceSignals: z.array(z.string().max(500)).max(10).default([]),
});

export class OpportunityTrackerError extends Error {
  readonly cause?: unknown;
  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = 'OpportunityTrackerError';
    this.cause = options?.cause;
  }
}

export interface RunOpportunityTrackerArgs {
  userId: string;
  sessionId: string;
  supabase: SupabaseClient;
  opportunityId: string;
  reportId?: string;
}

export interface RunOpportunityTrackerResult {
  output: OpportunityTrackerOutput;
  opportunityActionId: string | null;
  prepPlanActionId: string | null;
  tokensIn: number;
  tokensOut: number;
}

function stripJsonFence(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith('```')) {
    return trimmed
      .replace(/^```(?:json)?\n?/, '')
      .replace(/\n?```$/, '')
      .trim();
  }
  return trimmed;
}

function extractAssistantText(message: Anthropic.Messages.Message): string {
  return message.content
    .filter((b): b is Anthropic.Messages.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n');
}

export async function runOpportunityTracker(
  args: RunOpportunityTrackerArgs
): Promise<RunOpportunityTrackerResult> {
  const { userId, sessionId, supabase, opportunityId, reportId } = args;

  // Load opportunity (RLS scoped to user; explicit eq is defense in depth).
  const { data: oppRow, error: oppErr } = await supabase
    .from('opportunities')
    .select('*')
    .eq('id', opportunityId)
    .eq('user_id', userId)
    .maybeSingle();

  if (oppErr || !oppRow) {
    throw new OpportunityTrackerError(`Opportunity ${opportunityId} not found for user ${userId}`, {
      cause: oppErr,
    });
  }

  const opportunity: Opportunity = {
    id: oppRow.id,
    userId: oppRow.user_id,
    companyName: oppRow.company_name,
    roleTitle: oppRow.role_title,
    stage: oppRow.stage,
    interviewDate: oppRow.interview_date,
    notes: oppRow.notes,
    archived: oppRow.archived,
    createdAt: oppRow.created_at,
    updatedAt: oppRow.updated_at,
  };

  // Optional report context (richer recommendations).
  let context: AgentContextBundle | null = null;
  if (reportId) {
    context = await loadAgentContext({ userId, reportId, supabase });
  }

  const { prompt: userPrompt } = buildUserPrompt(opportunity, context);

  const client = getAnthropicClient();
  let response: Anthropic.Messages.Message;
  try {
    const wrapped = await runAgentCall(
      {
        userId,
        sessionId,
        agentKind: 'opportunity_tracker',
        model: CLAUDE_MODELS.reasoning,
      },
      async () => {
        const value = await client.messages.create({
          model: CLAUDE_MODELS.reasoning,
          max_tokens: 1500,
          system: [
            {
              type: 'text',
              text: SYSTEM_PROMPT,
              cache_control: { type: 'ephemeral' },
            },
          ],
          messages: [{ role: 'user', content: userPrompt }],
        });
        return {
          value,
          tokensIn: value.usage?.input_tokens ?? 0,
          tokensOut: value.usage?.output_tokens ?? 0,
        };
      }
    );
    response = wrapped.result;
  } catch (err) {
    throw new OpportunityTrackerError('LLM call failed', { cause: err });
  }

  const rawText = extractAssistantText(response);
  if (!rawText) throw new OpportunityTrackerError('Empty LLM response');

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(stripJsonFence(rawText));
  } catch (err) {
    console.error('[opportunity-tracker] JSON parse failure. Raw:', rawText);
    throw new OpportunityTrackerError('LLM returned non-JSON output', { cause: err });
  }

  const validated = OpportunityTrackerSchema.safeParse(parsedJson);
  if (!validated.success) {
    console.error('[opportunity-tracker] Schema validation failure:', validated.error.flatten());
    throw new OpportunityTrackerError('LLM output failed schema validation', {
      cause: validated.error.flatten(),
    });
  }

  const output: OpportunityTrackerOutput = {
    summary: validated.data.summary,
    proposedChanges: validated.data.proposedChanges,
    prepRecommendation: validated.data.prepRecommendation,
    evidenceSignals: validated.data.evidenceSignals,
  };

  const tokensIn = response.usage?.input_tokens ?? 0;
  const tokensOut = response.usage?.output_tokens ?? 0;

  // Persist agent message
  await supabase.from('agent_messages').insert({
    session_id: sessionId,
    role: 'agent',
    content_json: { ...output, version: OPPORTUNITY_TRACKER_VERSION },
    tokens_in: tokensIn,
    tokens_out: tokensOut,
  });

  await supabase
    .from('agent_sessions')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', sessionId)
    .eq('user_id', userId);

  // Draft propose_opportunity_update action only when there is at least one
  // proposed change. An empty proposed-change set is a valid outcome.
  let opportunityActionId: string | null = null;
  const changes: Record<string, unknown> = {};
  if (output.proposedChanges.stage) changes.stage = output.proposedChanges.stage;
  if (output.proposedChanges.interviewDate) {
    changes.interviewDate = output.proposedChanges.interviewDate;
  }
  if (output.proposedChanges.notes) changes.notes = output.proposedChanges.notes;

  if (Object.keys(changes).length > 0) {
    const oppPayload = { opportunityId, changes };
    const v = validateActionPayload('propose_opportunity_update', oppPayload);
    if (!v.ok) {
      throw new OpportunityTrackerError(
        `propose_opportunity_update payload invalid: ${JSON.stringify(v.error)}`
      );
    }

    const { data: insertedActions, error: actionsErr } = await supabase
      .from('agent_actions')
      .insert([
        {
          user_id: userId,
          session_id: sessionId,
          report_id: reportId ?? null,
          action_type: 'propose_opportunity_update',
          payload_json: v.payload,
          status: 'drafted',
          requires_external_send: actionRequiresExternalSend('propose_opportunity_update'),
          evidence_refs_json: [{ kind: 'opportunity_signals', signals: output.evidenceSignals }],
        },
      ])
      .select('id');

    if (actionsErr || !insertedActions || insertedActions.length === 0) {
      console.error('[opportunity-tracker] Failed to persist opportunity action:', actionsErr);
      throw new OpportunityTrackerError('Failed to persist drafted action', { cause: actionsErr });
    }
    opportunityActionId = insertedActions[0].id as string;
  }

  // Draft update_prep_plan action only when the agent flagged a need AND the
  // user already has an active prep plan (we never auto-create plans here).
  let prepPlanActionId: string | null = null;
  const activePlanId = context?.activePrepPlan?.plan.id ?? null;
  if (output.prepRecommendation.needsPrepPlan && activePlanId) {
    const planPayload = {
      prepPlanId: activePlanId,
      patch: {
        focus: output.prepRecommendation.suggestedFocus,
        reason: output.prepRecommendation.reason,
        triggeredByOpportunityId: opportunityId,
      },
    };
    const v = validateActionPayload('update_prep_plan', planPayload);
    if (v.ok) {
      const { data: insertedPrep, error: prepErr } = await supabase
        .from('agent_actions')
        .insert([
          {
            user_id: userId,
            session_id: sessionId,
            report_id: reportId ?? null,
            action_type: 'update_prep_plan',
            payload_json: v.payload,
            status: 'drafted',
            requires_external_send: actionRequiresExternalSend('update_prep_plan'),
            evidence_refs_json: [
              {
                kind: 'opportunity_prep_recommendation',
                opportunityId,
                signals: output.evidenceSignals,
              },
            ],
          },
        ])
        .select('id');

      if (!prepErr && insertedPrep && insertedPrep.length > 0) {
        prepPlanActionId = insertedPrep[0].id as string;
      } else {
        console.error('[opportunity-tracker] Failed to persist prep-plan action:', prepErr);
      }
    } else {
      console.error('[opportunity-tracker] update_prep_plan payload invalid:', v.error);
    }
  }

  return { output, opportunityActionId, prepPlanActionId, tokensIn, tokensOut };
}
