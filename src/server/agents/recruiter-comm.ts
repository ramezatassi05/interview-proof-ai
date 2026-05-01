/**
 * runRecruiterComm — M7.7 entrypoint.
 *
 * Drafts a candidate reply to a recruiter message. Produces a primary draft
 * (subject + body) plus up to 2 tonal alternatives. Persists messages, drafts
 * a `draft_recruiter_reply` action with requires_external_send=true. The full
 * alternative set is preserved in evidence_refs_json so the approval modal
 * can offer them as alternates if we extend the picker later.
 *
 * No external send happens here or elsewhere — drafts stop at status='approved'
 * until the user manually copies the body into their mail client.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { CLAUDE_MODELS, getAnthropicClient } from '@/lib/anthropic';
import { validateActionPayload } from '@/lib/agent/actions';
import { runAgentCall } from '@/lib/agent/audit';
import type { Opportunity, RecruiterCommOutput, RecruiterCommDraft } from '@/types';
import { loadAgentContext, type AgentContextBundle } from './context-loader';
import { buildUserPrompt, SYSTEM_PROMPT } from './prompts/recruiter-comm';

export const RECRUITER_COMM_VERSION = 'v1.0.0';

const DraftSchema = z.object({
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(4000),
  tone: z.string().min(1).max(80),
});

const RecruiterCommSchema = z.object({
  primary: DraftSchema,
  alternatives: z.array(DraftSchema).max(2).default([]),
  rationale: z.string().min(1).max(1500),
});

export class RecruiterCommError extends Error {
  readonly cause?: unknown;
  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = 'RecruiterCommError';
    this.cause = options?.cause;
  }
}

export interface RunRecruiterCommArgs {
  userId: string;
  sessionId: string;
  supabase: SupabaseClient;
  recruiterMessage: string;
  userGoal: string;
  opportunityId?: string;
  reportId?: string;
  recipientHint?: string;
}

export interface RunRecruiterCommResult {
  output: RecruiterCommOutput;
  actionId: string | null;
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

export async function runRecruiterComm(
  args: RunRecruiterCommArgs
): Promise<RunRecruiterCommResult> {
  const {
    userId,
    sessionId,
    supabase,
    recruiterMessage,
    userGoal,
    opportunityId,
    reportId,
    recipientHint,
  } = args;

  if (!recruiterMessage.trim()) {
    throw new RecruiterCommError('recruiterMessage is required');
  }
  if (!userGoal.trim()) {
    throw new RecruiterCommError('userGoal is required');
  }

  // Load opportunity (RLS will reject cross-user opps).
  let opportunity: Opportunity | null = null;
  if (opportunityId) {
    const { data: oppRow } = await supabase
      .from('opportunities')
      .select('*')
      .eq('id', opportunityId)
      .eq('user_id', userId)
      .maybeSingle();
    if (oppRow) {
      opportunity = {
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
    }
  }

  // Load report context for resume excerpt + role hints.
  let context: AgentContextBundle | null = null;
  if (reportId) {
    context = await loadAgentContext({ userId, reportId, supabase });
  }

  const { prompt: userPrompt } = buildUserPrompt(
    recruiterMessage,
    userGoal,
    opportunity,
    context,
    recipientHint ?? null
  );

  const client = getAnthropicClient();
  let response: Anthropic.Messages.Message;
  try {
    const wrapped = await runAgentCall(
      {
        userId,
        sessionId,
        agentKind: 'recruiter_comm',
        model: CLAUDE_MODELS.reasoning,
      },
      async () => {
        const value = await client.messages.create({
          model: CLAUDE_MODELS.reasoning,
          max_tokens: 2500,
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
    throw new RecruiterCommError('LLM call failed', { cause: err });
  }

  const rawText = extractAssistantText(response);
  if (!rawText) throw new RecruiterCommError('Empty LLM response');

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(stripJsonFence(rawText));
  } catch (err) {
    console.error('[recruiter-comm] JSON parse failure. Raw:', rawText);
    throw new RecruiterCommError('LLM returned non-JSON output', { cause: err });
  }

  const validated = RecruiterCommSchema.safeParse(parsedJson);
  if (!validated.success) {
    console.error('[recruiter-comm] Schema validation failure:', validated.error.flatten());
    throw new RecruiterCommError('LLM output failed schema validation', {
      cause: validated.error.flatten(),
    });
  }

  const primary: RecruiterCommDraft = validated.data.primary;
  const alternatives: RecruiterCommDraft[] = validated.data.alternatives;

  const output: RecruiterCommOutput = {
    primary,
    alternatives,
    rationale: validated.data.rationale,
  };

  const tokensIn = response.usage?.input_tokens ?? 0;
  const tokensOut = response.usage?.output_tokens ?? 0;

  // Persist user message (the recruiter input + goal) and agent message (drafts).
  await supabase.from('agent_messages').insert({
    session_id: sessionId,
    role: 'user',
    content_json: {
      recruiterMessage,
      userGoal,
      opportunityId: opportunityId ?? null,
      recipientHint: recipientHint ?? null,
    },
    tokens_in: null,
    tokens_out: null,
  });

  await supabase.from('agent_messages').insert({
    session_id: sessionId,
    role: 'agent',
    content_json: { ...output, version: RECRUITER_COMM_VERSION },
    tokens_in: tokensIn,
    tokens_out: tokensOut,
  });

  await supabase
    .from('agent_sessions')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', sessionId)
    .eq('user_id', userId);

  // Draft a draft_recruiter_reply action. Canonical payload only carries the
  // single primary subject/body; alternatives + rationale are preserved in
  // evidence_refs_json for the approval UI.
  const payload: { subject: string; body: string; recipientHint?: string } = {
    subject: primary.subject,
    body: primary.body,
  };
  if (recipientHint) payload.recipientHint = recipientHint;

  const v = validateActionPayload('draft_recruiter_reply', payload);
  if (!v.ok) {
    throw new RecruiterCommError(
      `draft_recruiter_reply payload invalid: ${JSON.stringify(v.error)}`
    );
  }

  const evidenceRefs = [
    {
      kind: 'recruiter_reply_alternatives',
      primary,
      alternatives,
      rationale: output.rationale,
      opportunityId: opportunityId ?? null,
    },
  ];

  const { data: insertedActions, error: actionsErr } = await supabase
    .from('agent_actions')
    .insert([
      {
        user_id: userId,
        session_id: sessionId,
        report_id: reportId ?? null,
        action_type: 'draft_recruiter_reply',
        payload_json: v.payload,
        status: 'drafted',
        // External-facing — the body becomes user-sent copy. State machine
        // blocks transition past `approved` until an explicit send endpoint
        // exists (still not implemented in this milestone).
        requires_external_send: true,
        evidence_refs_json: evidenceRefs,
      },
    ])
    .select('id');

  if (actionsErr || !insertedActions || insertedActions.length === 0) {
    console.error('[recruiter-comm] Failed to persist action:', actionsErr);
    throw new RecruiterCommError('Failed to persist drafted action', { cause: actionsErr });
  }
  const actionId = insertedActions[0].id as string;

  return { output, actionId, tokensIn, tokensOut };
}
