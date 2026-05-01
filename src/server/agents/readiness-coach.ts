/**
 * runReadinessCoach — M7.1 entrypoint.
 *
 * Explains a specific risk in plain language and drafts up to 3
 * `recommend_drill` actions (status='drafted') so the user can approve them.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { CLAUDE_MODELS, getAnthropicClient } from '@/lib/anthropic';
import { actionRequiresExternalSend } from '@/lib/agent/types';
import { validateActionPayload } from '@/lib/agent/actions';
import { runAgentCall } from '@/lib/agent/audit';
import type { ReadinessCoachOutput, RiskItem } from '@/types';
import { loadAgentContext } from './context-loader';
import { buildUserPrompt, SYSTEM_PROMPT } from './prompts/readiness-coach';

export const READINESS_COACH_VERSION = 'v1.0.0';

const DrillSchema = z.object({
  title: z.string().min(1).max(200),
  focus: z.string().min(1).max(500),
  why: z.string().min(1).max(500),
});

const EvidenceQuoteSchema = z.object({
  source: z.enum(['resume', 'jd', 'analysis']),
  quote: z.string().min(1).max(500),
});

const ReadinessCoachOutputSchema = z.object({
  summary: z.string().min(1).max(2000),
  why_it_matters: z.string().min(1).max(1500),
  recommended_drills: z.array(DrillSchema).max(3),
  evidence_quotes: z.array(EvidenceQuoteSchema).max(5),
});

export class ReadinessCoachError extends Error {
  readonly cause?: unknown;
  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = 'ReadinessCoachError';
    this.cause = options?.cause;
  }
}

export interface RunReadinessCoachArgs {
  userId: string;
  reportId: string;
  sessionId: string;
  supabase: SupabaseClient;
  riskId?: string;
  riskDescription?: string;
}

export interface RunReadinessCoachResult {
  output: ReadinessCoachOutput;
  actionIds: string[];
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

export async function runReadinessCoach(
  args: RunReadinessCoachArgs
): Promise<RunReadinessCoachResult> {
  const { userId, reportId, sessionId, supabase, riskId, riskDescription } = args;

  if (!riskId && !riskDescription) {
    throw new ReadinessCoachError('Either riskId or riskDescription is required');
  }

  const context = await loadAgentContext({ userId, reportId, supabase });

  let matchedRisk: RiskItem | null = null;
  if (riskId) {
    const risks = context.llmAnalysis?.rankedRisks ?? [];
    matchedRisk = risks.find((r) => r.id === riskId) ?? null;
    if (!matchedRisk && !riskDescription) {
      throw new ReadinessCoachError(`Risk ${riskId} not found in latest analysis`);
    }
  }

  const { prompt: userPrompt } = buildUserPrompt(context, matchedRisk, riskDescription);

  const client = getAnthropicClient();
  let response: Anthropic.Messages.Message;
  try {
    const wrapped = await runAgentCall(
      {
        userId,
        sessionId,
        agentKind: 'readiness_coach',
        model: CLAUDE_MODELS.reasoning,
      },
      async () => {
        const value = await client.messages.create({
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
        return {
          value,
          tokensIn: value.usage?.input_tokens ?? 0,
          tokensOut: value.usage?.output_tokens ?? 0,
        };
      }
    );
    response = wrapped.result;
  } catch (err) {
    throw new ReadinessCoachError('LLM call failed', { cause: err });
  }

  const rawText = extractAssistantText(response);
  if (!rawText) throw new ReadinessCoachError('Empty LLM response');

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(stripJsonFence(rawText));
  } catch (err) {
    console.error('[readiness-coach] JSON parse failure. Raw:', rawText);
    throw new ReadinessCoachError('LLM returned non-JSON output', { cause: err });
  }

  const validated = ReadinessCoachOutputSchema.safeParse(parsedJson);
  if (!validated.success) {
    console.error('[readiness-coach] Schema validation failure:', validated.error.flatten());
    throw new ReadinessCoachError('LLM output failed schema validation', {
      cause: validated.error.flatten(),
    });
  }

  const output: ReadinessCoachOutput = {
    summary: validated.data.summary,
    whyItMatters: validated.data.why_it_matters,
    recommendedDrills: validated.data.recommended_drills,
    evidenceQuotes: validated.data.evidence_quotes,
  };

  const tokensIn = response.usage?.input_tokens ?? 0;
  const tokensOut = response.usage?.output_tokens ?? 0;

  // Persist agent message
  const { error: agentMsgErr } = await supabase.from('agent_messages').insert({
    session_id: sessionId,
    role: 'agent',
    content_json: {
      summary: output.summary,
      whyItMatters: output.whyItMatters,
      recommendedDrills: output.recommendedDrills,
      evidenceQuotes: output.evidenceQuotes,
      riskId: matchedRisk?.id ?? null,
      version: READINESS_COACH_VERSION,
    },
    tokens_in: tokensIn,
    tokens_out: tokensOut,
  });
  if (agentMsgErr) {
    console.error('[readiness-coach] Failed to persist agent message:', agentMsgErr);
  }

  await supabase
    .from('agent_sessions')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', sessionId)
    .eq('user_id', userId);

  // Draft a recommend_drill action per drill
  const actionIds: string[] = [];
  if (output.recommendedDrills.length > 0) {
    const draftRiskId = matchedRisk?.id ?? riskId ?? 'custom';
    const rows = output.recommendedDrills.map((drill) => {
      const payload = {
        riskId: draftRiskId,
        reason: `${drill.title} — ${drill.why}`.slice(0, 1000),
      };
      const v = validateActionPayload('recommend_drill', payload);
      if (!v.ok) {
        throw new ReadinessCoachError(
          `recommend_drill payload invalid: ${JSON.stringify(v.error)}`
        );
      }
      return {
        user_id: userId,
        session_id: sessionId,
        report_id: reportId,
        action_type: 'recommend_drill' as const,
        payload_json: v.payload,
        status: 'drafted' as const,
        requires_external_send: actionRequiresExternalSend('recommend_drill'),
      };
    });

    const { data: insertedActions, error: actionsErr } = await supabase
      .from('agent_actions')
      .insert(rows)
      .select('id');

    if (actionsErr || !insertedActions) {
      console.error('[readiness-coach] Failed to persist actions:', actionsErr);
      throw new ReadinessCoachError('Failed to persist drafted actions', {
        cause: actionsErr,
      });
    }

    for (const row of insertedActions) actionIds.push(row.id as string);
  }

  return { output, actionIds, tokensIn, tokensOut };
}
