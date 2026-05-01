/**
 * runDebrief — M7.9 entrypoint.
 *
 * Post-interview reflection. Reads the user's free-form interview summary,
 * loads their recent practice_answers + report context, and drafts a
 * `summarize_progress` action whose evidence_refs_json carries the proposed
 * user_memory upserts. The memory upserts are applied ONLY when the user
 * approves the action (handled in PATCH /api/agent/actions/[id]).
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { CLAUDE_MODELS, getAnthropicClient } from '@/lib/anthropic';
import { actionRequiresExternalSend } from '@/lib/agent/types';
import { validateActionPayload } from '@/lib/agent/actions';
import { runAgentCall } from '@/lib/agent/audit';
import type { DebriefOutput, DebriefProposedMemory } from '@/types';
import { loadAgentContext } from './context-loader';
import { buildUserPrompt, SYSTEM_PROMPT } from './prompts/debrief';

export const DEBRIEF_VERSION = 'v1.0.0';
const DEFAULT_WINDOW_DAYS = 30;
const PRACTICE_ANSWER_LIMIT = 12;

const MEMORY_KIND_VALUES = ['weakness', 'preference', 'goal'] as const;

const ProposedMemorySchema = z.object({
  kind: z.enum(MEMORY_KIND_VALUES),
  key: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9_]+$/, 'key must be snake_case (a-z, 0-9, _)'),
  value: z.string().min(1).max(800),
});

const EvidenceFromPracticeSchema = z.object({
  practiceAnswerId: z.string().uuid(),
  observation: z.string().min(1).max(800),
});

const DebriefSchema = z.object({
  summary: z.string().min(1).max(2000),
  whatWentWell: z.array(z.string().max(500)).max(8).default([]),
  whatToImprove: z.array(z.string().max(500)).max(8).default([]),
  proposedMemory: z.array(ProposedMemorySchema).max(5).default([]),
  evidenceFromPractice: z.array(EvidenceFromPracticeSchema).max(10).default([]),
});

export class DebriefError extends Error {
  readonly cause?: unknown;
  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = 'DebriefError';
    this.cause = options?.cause;
  }
}

export interface RunDebriefArgs {
  userId: string;
  sessionId: string;
  supabase: SupabaseClient;
  reportId: string;
  interviewSummary: string;
  windowDays?: number;
  opportunityId?: string;
}

export interface RunDebriefResult {
  output: DebriefOutput;
  actionId: string | null;
  tokensIn: number;
  tokensOut: number;
}

interface PracticeAnswerRow {
  id: string;
  question_text: string;
  answer_text: string;
  score: number | null;
  mapped_risk_id: string | null;
  attempt_number: number;
  created_at: string;
}

interface OpportunityRowSlim {
  id: string;
  user_id: string;
  company_name: string;
  role_title: string;
  stage: string;
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

export async function runDebrief(args: RunDebriefArgs): Promise<RunDebriefResult> {
  const {
    userId,
    sessionId,
    supabase,
    reportId,
    interviewSummary,
    windowDays = DEFAULT_WINDOW_DAYS,
    opportunityId,
  } = args;

  if (!interviewSummary.trim()) {
    throw new DebriefError('interviewSummary is required');
  }

  const context = await loadAgentContext({ userId, reportId, supabase });

  // Pull recent practice answers within the window. Use practice_answers
  // directly (RLS-scoped) — limit to 12 most recent so the prompt stays tight.
  const sinceIso = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();
  const { data: paRows } = await supabase
    .from('practice_answers')
    .select('id, question_text, answer_text, score, mapped_risk_id, attempt_number, created_at')
    .eq('user_id', userId)
    .eq('report_id', reportId)
    .gte('created_at', sinceIso)
    .order('created_at', { ascending: false })
    .limit(PRACTICE_ANSWER_LIMIT);

  const practiceAnswers = ((paRows ?? []) as PracticeAnswerRow[]).map((r) => ({
    id: r.id,
    questionText: r.question_text,
    answerExcerpt: r.answer_text.slice(0, 600),
    score: r.score,
    mappedRiskId: r.mapped_risk_id,
    attemptNumber: r.attempt_number,
    createdAt: r.created_at,
  }));

  let opportunityHint: {
    id: string;
    companyName: string;
    roleTitle: string;
    stage: string;
  } | null = null;
  if (opportunityId) {
    const { data: oppRow } = await supabase
      .from('opportunities')
      .select('id, user_id, company_name, role_title, stage')
      .eq('id', opportunityId)
      .eq('user_id', userId)
      .maybeSingle();
    if (oppRow) {
      const o = oppRow as OpportunityRowSlim;
      opportunityHint = {
        id: o.id,
        companyName: o.company_name,
        roleTitle: o.role_title,
        stage: o.stage,
      };
    }
  }

  const { prompt: userPrompt } = buildUserPrompt({
    reportId,
    windowDays,
    interviewSummary,
    context,
    practiceAnswers,
    opportunityHint,
  });

  const client = getAnthropicClient();
  let response: Anthropic.Messages.Message;
  try {
    const wrapped = await runAgentCall(
      {
        userId,
        sessionId,
        agentKind: 'post_interview_debrief',
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
    throw new DebriefError('LLM call failed', { cause: err });
  }

  const rawText = extractAssistantText(response);
  if (!rawText) throw new DebriefError('Empty LLM response');

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(stripJsonFence(rawText));
  } catch (err) {
    console.error('[debrief] JSON parse failure. Raw:', rawText);
    throw new DebriefError('LLM returned non-JSON output', { cause: err });
  }

  const validated = DebriefSchema.safeParse(parsedJson);
  if (!validated.success) {
    console.error('[debrief] Schema validation failure:', validated.error.flatten());
    throw new DebriefError('LLM output failed schema validation', {
      cause: validated.error.flatten(),
    });
  }

  // Filter evidenceFromPractice down to ids that actually appear in the
  // candidate's practiceAnswers list. Belt-and-suspenders against fabrication.
  const validIdSet = new Set(practiceAnswers.map((p) => p.id));
  const evidenceFromPractice = validated.data.evidenceFromPractice.filter((e) =>
    validIdSet.has(e.practiceAnswerId)
  );

  const proposedMemory: DebriefProposedMemory[] = validated.data.proposedMemory;

  const output: DebriefOutput = {
    summary: validated.data.summary,
    whatWentWell: validated.data.whatWentWell,
    whatToImprove: validated.data.whatToImprove,
    proposedMemory,
    evidenceFromPractice,
  };

  const tokensIn = response.usage?.input_tokens ?? 0;
  const tokensOut = response.usage?.output_tokens ?? 0;

  // Persist user + agent message
  await supabase.from('agent_messages').insert({
    session_id: sessionId,
    role: 'user',
    content_json: {
      interviewSummary,
      windowDays,
      opportunityId: opportunityId ?? null,
    },
    tokens_in: null,
    tokens_out: null,
  });

  await supabase.from('agent_messages').insert({
    session_id: sessionId,
    role: 'agent',
    content_json: { ...output, version: DEBRIEF_VERSION },
    tokens_in: tokensIn,
    tokens_out: tokensOut,
  });

  await supabase
    .from('agent_sessions')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', sessionId)
    .eq('user_id', userId);

  // Draft summarize_progress action. Canonical payload is just the report
  // window; the proposed memory upserts ride along in evidence_refs_json so
  // the approval handler can apply them on `approved`.
  const payload = { reportId, windowDays };
  const v = validateActionPayload('summarize_progress', payload);
  if (!v.ok) {
    throw new DebriefError(`summarize_progress payload invalid: ${JSON.stringify(v.error)}`);
  }

  const evidenceRefs = [
    {
      kind: 'proposed_memory_upserts' as const,
      entries: proposedMemory,
    },
    {
      kind: 'practice_answer_evidence' as const,
      observations: evidenceFromPractice,
    },
    {
      kind: 'debrief_summary' as const,
      summary: output.summary,
      whatWentWell: output.whatWentWell,
      whatToImprove: output.whatToImprove,
      opportunityId: opportunityId ?? null,
    },
  ];

  const { data: insertedActions, error: actionsErr } = await supabase
    .from('agent_actions')
    .insert([
      {
        user_id: userId,
        session_id: sessionId,
        report_id: reportId,
        action_type: 'summarize_progress',
        payload_json: v.payload,
        status: 'drafted',
        requires_external_send: actionRequiresExternalSend('summarize_progress'),
        evidence_refs_json: evidenceRefs,
      },
    ])
    .select('id');

  if (actionsErr || !insertedActions || insertedActions.length === 0) {
    console.error('[debrief] Failed to persist action:', actionsErr);
    throw new DebriefError('Failed to persist drafted action', { cause: actionsErr });
  }
  const actionId = insertedActions[0].id as string;

  return { output, actionId, tokensIn, tokensOut };
}
