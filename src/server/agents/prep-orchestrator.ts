/**
 * runPrepOrchestrator — the M6 entrypoint for the Prep Orchestrator Agent.
 *
 * Responsibilities:
 *   1. Load typed context (delegated to context-loader).
 *   2. Call Claude Sonnet 4.6 with a CACHED system prompt + compact user prompt.
 *   3. Validate the LLM JSON output via Zod — never trust raw model JSON.
 *   4. Persist the user (if any) and agent messages to `agent_messages`.
 *   5. Create `agent_actions` rows for nextAction + supportingActions, all in
 *      `status='drafted'`. NO auto-execution. The user approves separately.
 *
 * The route layer (`/api/agent/orchestrator`) handles auth, ownership, and
 * rate limiting. This module is pure server-side orchestration.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { CLAUDE_MODELS, getAnthropicClient } from '@/lib/anthropic';
import { actionRequiresExternalSend, AGENT_ACTION_TYPES } from '@/lib/agent/types';
import { validateActionPayload } from '@/lib/agent/actions';
import type { AgentActionType } from '@/lib/agent/types';
import type { OrchestratorEvidenceRef, OrchestratorNextAction, OrchestratorOutput } from '@/types';
import { loadAgentContext } from './context-loader';
import { buildUserPrompt, SYSTEM_PROMPT } from './prompts/prep-orchestrator';

export const PREP_ORCHESTRATOR_VERSION = 'v1.0.0';

// --- Output validation ---

const NextActionSchema = z.object({
  title: z.string().min(1).max(200),
  rationale: z.string().min(1).max(1000),
  actionType: z.enum(AGENT_ACTION_TYPES as unknown as [string, ...string[]]),
  payload: z.record(z.string(), z.unknown()),
});

const EvidenceRefSchema = z.object({
  kind: z.enum(['risk', 'practiceAnswer', 'jdRequirement', 'resumeBullet', 'memoryEntry']),
  id: z.string().min(1),
});

const OrchestratorOutputSchema = z.object({
  summary: z.string().min(1).max(1000),
  nextAction: NextActionSchema,
  supportingActions: z.array(NextActionSchema).max(5),
  evidenceRefs: z.array(EvidenceRefSchema).max(20),
});

export class OrchestratorError extends Error {
  readonly cause?: unknown;
  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = 'OrchestratorError';
    this.cause = options?.cause;
  }
}

export interface RunPrepOrchestratorArgs {
  userId: string;
  reportId: string;
  sessionId: string;
  supabase: SupabaseClient;
  userMessage?: string;
}

export interface RunPrepOrchestratorResult {
  output: OrchestratorOutput;
  actionIds: { nextActionId: string; supportingActionIds: string[] };
  tokensIn: number;
  tokensOut: number;
}

/**
 * Strips a possible markdown code fence around a JSON blob. We instruct the
 * model to skip fences but defend in depth.
 */
function stripJsonFence(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith('```')) {
    const withoutOpening = trimmed.replace(/^```(?:json)?\n?/, '');
    const withoutClosing = withoutOpening.replace(/\n?```$/, '');
    return withoutClosing.trim();
  }
  return trimmed;
}

function extractAssistantText(message: Anthropic.Messages.Message): string {
  const blocks = message.content;
  const parts: string[] = [];
  for (const block of blocks) {
    if (block.type === 'text') parts.push(block.text);
  }
  return parts.join('\n');
}

/**
 * Validates one action's payload against its action-type schema. We do this
 * up-front so a downstream insert into agent_actions cannot fail at write time.
 */
function validatePerActionPayload(action: OrchestratorNextAction):
  | {
      ok: true;
      payload: Record<string, unknown>;
    }
  | { ok: false; reason: string } {
  const result = validateActionPayload(action.actionType, action.payload);
  if (!result.ok) {
    return {
      ok: false,
      reason: `Action "${action.actionType}" payload invalid: ${JSON.stringify(result.error)}`,
    };
  }
  return { ok: true, payload: result.payload };
}

export async function runPrepOrchestrator(
  args: RunPrepOrchestratorArgs
): Promise<RunPrepOrchestratorResult> {
  const { userId, reportId, sessionId, supabase, userMessage } = args;

  // 1) Load typed context. Throws if report not owned by user.
  const context = await loadAgentContext({ userId, reportId, supabase });

  // 2) Build prompts
  const { prompt: userPrompt } = buildUserPrompt(context, userMessage);

  // 3) Call Claude with prompt caching on the system block
  const client = getAnthropicClient();
  let response: Anthropic.Messages.Message;
  try {
    response = await client.messages.create({
      model: CLAUDE_MODELS.reasoning,
      max_tokens: 2048,
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: userPrompt }],
    });
  } catch (err) {
    throw new OrchestratorError('LLM call failed', { cause: err });
  }

  const rawText = extractAssistantText(response);
  if (!rawText) {
    throw new OrchestratorError('Empty LLM response');
  }

  // 4) Parse + validate JSON
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(stripJsonFence(rawText));
  } catch (err) {
    console.error('[prep-orchestrator] JSON parse failure. Raw text:', rawText);
    throw new OrchestratorError('LLM returned non-JSON output', { cause: err });
  }

  const validated = OrchestratorOutputSchema.safeParse(parsedJson);
  if (!validated.success) {
    console.error('[prep-orchestrator] Schema validation failure:', validated.error.flatten());
    throw new OrchestratorError('LLM output failed schema validation', {
      cause: validated.error.flatten(),
    });
  }

  const output: OrchestratorOutput = {
    summary: validated.data.summary,
    nextAction: validated.data.nextAction as OrchestratorNextAction,
    supportingActions: validated.data.supportingActions as OrchestratorNextAction[],
    evidenceRefs: validated.data.evidenceRefs as OrchestratorEvidenceRef[],
  };

  // 4b) Per-action payload validation against the canonical schemas. If any
  // action fails, refuse to persist anything (LLM hallucination guard).
  const allProposed: OrchestratorNextAction[] = [output.nextAction, ...output.supportingActions];
  const validatedPayloads: { actionType: AgentActionType; payload: Record<string, unknown> }[] = [];
  for (const action of allProposed) {
    const v = validatePerActionPayload(action);
    if (!v.ok) {
      throw new OrchestratorError(v.reason);
    }
    validatedPayloads.push({
      actionType: action.actionType as AgentActionType,
      payload: v.payload,
    });
  }

  // 5) Persist messages. Best-effort writes — we surface inserts errors but do
  // not roll back, because the LLM call already cost the user a turn.
  const tokensIn = response.usage?.input_tokens ?? 0;
  const tokensOut = response.usage?.output_tokens ?? 0;

  if (userMessage && userMessage.trim().length > 0) {
    const { error: userMsgErr } = await supabase.from('agent_messages').insert({
      session_id: sessionId,
      role: 'user',
      content_json: { text: userMessage.trim() },
      tokens_in: null,
      tokens_out: null,
    });
    if (userMsgErr) {
      console.error('[prep-orchestrator] Failed to persist user message:', userMsgErr);
    }
  }

  const { error: agentMsgErr } = await supabase.from('agent_messages').insert({
    session_id: sessionId,
    role: 'agent',
    content_json: {
      summary: output.summary,
      nextAction: output.nextAction,
      supportingActions: output.supportingActions,
      evidenceRefs: output.evidenceRefs,
      version: PREP_ORCHESTRATOR_VERSION,
    },
    tokens_in: tokensIn,
    tokens_out: tokensOut,
  });
  if (agentMsgErr) {
    console.error('[prep-orchestrator] Failed to persist agent message:', agentMsgErr);
  }

  // Bump session.last_message_at
  await supabase
    .from('agent_sessions')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', sessionId)
    .eq('user_id', userId);

  // 6) Create drafted action rows for next + supporting actions
  const actionRows = validatedPayloads.map(({ actionType, payload }) => ({
    user_id: userId,
    session_id: sessionId,
    report_id: reportId,
    action_type: actionType,
    payload_json: payload,
    status: 'drafted' as const,
    requires_external_send: actionRequiresExternalSend(actionType),
    evidence_refs_json: output.evidenceRefs,
  }));

  const { data: insertedActions, error: actionsErr } = await supabase
    .from('agent_actions')
    .insert(actionRows)
    .select('id');

  if (actionsErr || !insertedActions) {
    console.error('[prep-orchestrator] Failed to persist actions:', actionsErr);
    throw new OrchestratorError('Failed to persist agent actions', { cause: actionsErr });
  }

  const ids = insertedActions.map((row) => row.id as string);
  const nextActionId = ids[0];
  const supportingActionIds = ids.slice(1);

  return {
    output,
    actionIds: { nextActionId, supportingActionIds },
    tokensIn,
    tokensOut,
  };
}
