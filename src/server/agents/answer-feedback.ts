/**
 * runAnswerFeedback — M7.2 entrypoint.
 *
 * Wraps the existing generateAnswerFeedback() helper with a lightweight
 * Claude Sonnet 4.6 agent-level summary, persists practice_answers + agent
 * messages, and optionally drafts a recommend_drill action when a follow-up
 * drill is suggested.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { CLAUDE_MODELS, getAnthropicClient } from '@/lib/anthropic';
import { actionRequiresExternalSend } from '@/lib/agent/types';
import { validateActionPayload } from '@/lib/agent/actions';
import { runAgentCall } from '@/lib/agent/audit';
import type {
  AnswerFeedbackAgentSummary,
  ExtractedJD,
  ExtractedResume,
  QuestionFeedbackResponse,
  RoundType,
} from '@/types';
import { generateAnswerFeedback } from '@/server/questions';
import { loadAgentContext } from './context-loader';
import { buildUserPrompt, SYSTEM_PROMPT } from './prompts/answer-feedback';

export const ANSWER_FEEDBACK_VERSION = 'v1.0.0';

const AgentSummarySchema = z.object({
  encouragement: z.string().min(1).max(800),
  top_strengths: z.array(z.string().min(1).max(400)).max(3),
  top_improvements: z.array(z.string().min(1).max(400)).max(3),
  suggested_followup_drill: z
    .object({
      title: z.string().min(1).max(200),
      focus: z.string().min(1).max(500),
    })
    .nullable(),
});

export class AnswerFeedbackError extends Error {
  readonly cause?: unknown;
  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = 'AnswerFeedbackError';
    this.cause = options?.cause;
  }
}

export interface RunAnswerFeedbackArgs {
  userId: string;
  reportId: string;
  sessionId: string;
  supabase: SupabaseClient;
  questionText: string;
  answerText: string;
  questionIndex?: number;
  mappedRiskId?: string;
  attemptNumber?: number;
}

export interface RunAnswerFeedbackResult {
  feedback: QuestionFeedbackResponse;
  agentSummary: AnswerFeedbackAgentSummary;
  actionIds: string[];
  practiceAnswerId: string | null;
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

export async function runAnswerFeedback(
  args: RunAnswerFeedbackArgs
): Promise<RunAnswerFeedbackResult> {
  const {
    userId,
    reportId,
    sessionId,
    supabase,
    questionText,
    answerText,
    questionIndex,
    mappedRiskId,
    attemptNumber: attemptNumberOverride,
  } = args;

  // 1) Load context (also gives us extracted resume/JD via the latest run).
  const context = await loadAgentContext({ userId, reportId, supabase });

  // We need extracted_resume_json, extracted_jd_json, and round_type for the
  // existing feedback helper. Fetch those directly (context-loader doesn't
  // expose extractedResume).
  const { data: runs } = await supabase
    .from('runs')
    .select('extracted_resume_json, extracted_jd_json')
    .eq('report_id', reportId)
    .order('run_index', { ascending: false })
    .limit(1);
  const latestRun = runs?.[0] as
    | { extracted_resume_json: ExtractedResume; extracted_jd_json: ExtractedJD }
    | undefined;
  if (!latestRun) {
    throw new AnswerFeedbackError('No analysis run found for report');
  }

  const { data: reportRow } = await supabase
    .from('reports')
    .select('round_type')
    .eq('id', reportId)
    .eq('user_id', userId)
    .single();
  const roundType = (reportRow?.round_type ?? 'mixed') as RoundType;

  // 2) Run the existing feedback generator (OpenAI scoring).
  let feedback: QuestionFeedbackResponse;
  try {
    feedback = await generateAnswerFeedback(
      questionText,
      answerText,
      latestRun.extracted_resume_json,
      latestRun.extracted_jd_json,
      roundType
    );
  } catch (err) {
    throw new AnswerFeedbackError('Underlying feedback generation failed', { cause: err });
  }

  // 3) Persist to practice_answers (mirrors the existing route's logic).
  let practiceAnswerId: string | null = null;
  try {
    let practiceSessionId: string | null = null;
    const { data: openSessions } = await supabase
      .from('practice_sessions')
      .select('id')
      .eq('user_id', userId)
      .eq('report_id', reportId)
      .is('ended_at', null)
      .order('created_at', { ascending: false })
      .limit(1);

    if (openSessions && openSessions.length > 0) {
      practiceSessionId = openSessions[0].id as string;
    } else {
      const { data: createdSession, error: sessionErr } = await supabase
        .from('practice_sessions')
        .insert({ user_id: userId, report_id: reportId, mode: 'drill' })
        .select('id')
        .single();
      if (sessionErr || !createdSession) {
        throw sessionErr ?? new Error('lazy session create returned no row');
      }
      practiceSessionId = createdSession.id as string;
    }

    const qIndex = typeof questionIndex === 'number' ? questionIndex : -1;
    let attemptNumber = attemptNumberOverride;
    if (typeof attemptNumber !== 'number') {
      const { data: priorAttempts } = await supabase
        .from('practice_answers')
        .select('attempt_number')
        .eq('user_id', userId)
        .eq('report_id', reportId)
        .eq('question_index', qIndex)
        .order('attempt_number', { ascending: false })
        .limit(1);
      attemptNumber =
        priorAttempts && priorAttempts.length > 0
          ? (priorAttempts[0].attempt_number as number) + 1
          : 1;
    }

    const score =
      typeof feedback.score === 'number' && feedback.score >= 0 && feedback.score <= 100
        ? Math.round(feedback.score)
        : null;

    const { data: insertedAnswer, error: insertErr } = await supabase
      .from('practice_answers')
      .insert({
        practice_session_id: practiceSessionId,
        report_id: reportId,
        user_id: userId,
        question_index: qIndex,
        question_text: questionText,
        mapped_risk_id: mappedRiskId ?? null,
        answer_text: answerText,
        feedback_json: feedback as unknown as Record<string, unknown>,
        score,
        attempt_number: attemptNumber,
      })
      .select('id')
      .single();

    if (insertErr) {
      console.error('[answer-feedback] practice_answers insert error:', insertErr);
    } else if (insertedAnswer) {
      practiceAnswerId = insertedAnswer.id as string;
    }
  } catch (persistErr) {
    console.error('[answer-feedback] practice_answers persistence failed:', persistErr);
  }

  // 4) Agent-level summary (lightweight Claude call).
  const { prompt: userPrompt } = buildUserPrompt(context, questionText, answerText, feedback);

  const client = getAnthropicClient();
  let response: Anthropic.Messages.Message;
  try {
    const wrapped = await runAgentCall(
      {
        userId,
        sessionId,
        agentKind: 'answer_feedback',
        model: CLAUDE_MODELS.reasoning,
      },
      async () => {
        const value = await client.messages.create({
          model: CLAUDE_MODELS.reasoning,
          max_tokens: 1024,
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
    throw new AnswerFeedbackError('Agent summary LLM call failed', { cause: err });
  }

  const rawText = extractAssistantText(response);
  if (!rawText) throw new AnswerFeedbackError('Empty LLM response');

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(stripJsonFence(rawText));
  } catch (err) {
    console.error('[answer-feedback] JSON parse failure. Raw:', rawText);
    throw new AnswerFeedbackError('LLM returned non-JSON output', { cause: err });
  }

  const validated = AgentSummarySchema.safeParse(parsedJson);
  if (!validated.success) {
    console.error('[answer-feedback] Schema validation failure:', validated.error.flatten());
    throw new AnswerFeedbackError('LLM output failed schema validation', {
      cause: validated.error.flatten(),
    });
  }

  const agentSummary: AnswerFeedbackAgentSummary = {
    encouragement: validated.data.encouragement,
    topStrengths: validated.data.top_strengths,
    topImprovements: validated.data.top_improvements,
    suggestedFollowupDrill: validated.data.suggested_followup_drill,
  };

  const tokensIn = response.usage?.input_tokens ?? 0;
  const tokensOut = response.usage?.output_tokens ?? 0;

  // 5) Persist agent message
  await supabase.from('agent_messages').insert({
    session_id: sessionId,
    role: 'user',
    content_json: { question: questionText, answer: answerText },
    tokens_in: null,
    tokens_out: null,
  });

  await supabase.from('agent_messages').insert({
    session_id: sessionId,
    role: 'agent',
    content_json: {
      feedback,
      agentSummary,
      practiceAnswerId,
      version: ANSWER_FEEDBACK_VERSION,
    },
    tokens_in: tokensIn,
    tokens_out: tokensOut,
  });

  await supabase
    .from('agent_sessions')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', sessionId)
    .eq('user_id', userId);

  // 6) Optionally draft a recommend_drill action.
  const actionIds: string[] = [];
  if (agentSummary.suggestedFollowupDrill) {
    const drill = agentSummary.suggestedFollowupDrill;
    const payload = {
      riskId: mappedRiskId ?? 'general',
      reason: `${drill.title} — ${drill.focus}`.slice(0, 1000),
    };
    const v = validateActionPayload('recommend_drill', payload);
    if (!v.ok) {
      console.error('[answer-feedback] recommend_drill payload invalid:', v.error);
    } else {
      const { data: insertedActions, error: actionsErr } = await supabase
        .from('agent_actions')
        .insert([
          {
            user_id: userId,
            session_id: sessionId,
            report_id: reportId,
            action_type: 'recommend_drill',
            payload_json: v.payload,
            status: 'drafted',
            requires_external_send: actionRequiresExternalSend('recommend_drill'),
          },
        ])
        .select('id');
      if (actionsErr || !insertedActions) {
        console.error('[answer-feedback] Failed to persist action:', actionsErr);
      } else {
        for (const row of insertedActions) actionIds.push(row.id as string);
      }
    }
  }

  return {
    feedback,
    agentSummary,
    actionIds,
    practiceAnswerId,
    tokensIn,
    tokensOut,
  };
}
