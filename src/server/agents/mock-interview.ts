/**
 * runMockInterview — M7.3 entrypoint.
 *
 * Stateful multi-turn agent. State lives in the agent_sessions row (kind =
 * 'mock_interview') plus a system message that holds the question queue and
 * progress index.
 *
 * Commands:
 *  - 'start' — generate 5 questions, persist them, return the first.
 *  - 'answer' (default when userMessage is present) — evaluate the answer,
 *    decide to drill deeper or move on, return the next question.
 *  - 'end' — produce the final report, mark session 'completed', draft
 *    recommend_drill actions for next_steps.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { CLAUDE_MODELS, getAnthropicClient } from '@/lib/anthropic';
import { actionRequiresExternalSend } from '@/lib/agent/types';
import { validateActionPayload } from '@/lib/agent/actions';
import { runAgentCall } from '@/lib/agent/audit';
import type {
  MockInterviewFinalReport,
  MockInterviewQuestion,
  MockInterviewTurnEvaluation,
} from '@/types';
import { loadAgentContext } from './context-loader';
import {
  buildFinalReportUserPrompt,
  buildQuestionSetUserPrompt,
  buildTurnEvalUserPrompt,
  FINAL_REPORT_SYSTEM_PROMPT,
  QUESTION_SET_SYSTEM_PROMPT,
  TURN_EVAL_SYSTEM_PROMPT,
} from './prompts/mock-interview';

export const MOCK_INTERVIEW_VERSION = 'v1.0.0';

const QuestionSetSchema = z.object({
  questions: z
    .array(
      z.object({
        id: z.string().min(1).max(50),
        prompt: z.string().min(1).max(2000),
        mappedRiskId: z.string().nullable(),
        rationale: z.string().min(1).max(1000),
      })
    )
    .length(5),
});

const TurnEvalSchema = z.object({
  feedback_short: z.string().min(1).max(800),
  follow_up_question: z.string().min(1).max(2000).nullable(),
  advance_to_next: z.boolean(),
  current_score: z.number().min(0).max(100),
});

const FinalReportSchema = z.object({
  overall_score: z.number().min(0).max(100),
  per_question_scores: z.array(z.number().min(0).max(100)).max(20),
  summary: z.string().min(1).max(2000),
  top_strengths: z.array(z.string().min(1).max(400)).max(5),
  top_improvements: z.array(z.string().min(1).max(400)).max(5),
  next_steps: z
    .array(
      z.object({
        title: z.string().min(1).max(200),
        rationale: z.string().min(1).max(1000),
      })
    )
    .max(4),
});

export class MockInterviewError extends Error {
  readonly cause?: unknown;
  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = 'MockInterviewError';
    this.cause = options?.cause;
  }
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

export type MockInterviewCommand = 'start' | 'next' | 'end';

export interface RunMockInterviewArgs {
  userId: string;
  reportId: string;
  sessionId: string;
  supabase: SupabaseClient;
  command?: MockInterviewCommand;
  userMessage?: string;
}

export interface RunMockInterviewResult {
  status: 'in_progress' | 'completed';
  currentQuestion: MockInterviewQuestion | null;
  feedbackShort?: string;
  advanceToNext?: boolean;
  currentScore?: number;
  finalReport?: MockInterviewFinalReport;
  actionIds?: string[];
  questionsRemaining?: number;
}

interface MockInterviewState {
  questions: MockInterviewQuestion[];
  currentIndex: number; // 0-based pointer into questions[]
  perQuestionScores: number[]; // index aligned with questions[] (sparse if pending)
}

interface SystemStateMessageRow {
  id: string;
  content_json: {
    type: 'mock_interview_state';
    state: MockInterviewState;
  };
}

async function loadState(
  supabase: SupabaseClient,
  sessionId: string
): Promise<{ rowId: string; state: MockInterviewState } | null> {
  const { data: rows } = await supabase
    .from('agent_messages')
    .select('id, content_json')
    .eq('session_id', sessionId)
    .eq('role', 'system')
    .order('created_at', { ascending: false });

  if (!rows) return null;
  for (const row of rows) {
    const content = row.content_json as Record<string, unknown> | null;
    if (content && content.type === 'mock_interview_state') {
      const stateRow = row as unknown as SystemStateMessageRow;
      return { rowId: stateRow.id, state: stateRow.content_json.state };
    }
  }
  return null;
}

async function saveState(
  supabase: SupabaseClient,
  sessionId: string,
  rowId: string | null,
  state: MockInterviewState
): Promise<void> {
  if (rowId) {
    await supabase
      .from('agent_messages')
      .update({
        content_json: { type: 'mock_interview_state', state },
      })
      .eq('id', rowId);
  } else {
    await supabase.from('agent_messages').insert({
      session_id: sessionId,
      role: 'system',
      content_json: { type: 'mock_interview_state', state },
    });
  }
}

async function loadTranscript(
  supabase: SupabaseClient,
  sessionId: string
): Promise<{ role: string; content: string }[]> {
  const { data: rows } = await supabase
    .from('agent_messages')
    .select('role, content_json')
    .eq('session_id', sessionId)
    .neq('role', 'system')
    .order('created_at', { ascending: true });

  if (!rows) return [];
  return rows.map((r) => {
    const content = r.content_json as Record<string, unknown>;
    let text = '';
    if (typeof content.text === 'string') text = content.text;
    else if (typeof content.prompt === 'string') text = content.prompt;
    else if (typeof content.feedback_short === 'string') text = content.feedback_short;
    else text = JSON.stringify(content);
    return { role: r.role as string, content: text };
  });
}

export async function runMockInterview(
  args: RunMockInterviewArgs
): Promise<RunMockInterviewResult> {
  const { userId, reportId, sessionId, supabase, command, userMessage } = args;
  const client = getAnthropicClient();

  // Determine effective command. If userMessage is present and no explicit
  // command, treat as an answer ("next").
  let effectiveCommand: MockInterviewCommand;
  if (command) {
    effectiveCommand = command;
  } else if (userMessage && userMessage.trim().length > 0) {
    effectiveCommand = 'next';
  } else {
    effectiveCommand = 'start';
  }

  // Load context and any existing state
  const context = await loadAgentContext({ userId, reportId, supabase });
  const existing = await loadState(supabase, sessionId);

  // ============================================================
  // START: generate questions and return the first
  // ============================================================
  if (effectiveCommand === 'start' || !existing) {
    if (existing) {
      // Already started — just return current question. Treat as idempotent.
      const currentQuestion = existing.state.questions[existing.state.currentIndex] ?? null;
      return {
        status: 'in_progress',
        currentQuestion,
        questionsRemaining: existing.state.questions.length - existing.state.currentIndex,
      };
    }

    const { prompt: userPrompt } = buildQuestionSetUserPrompt(context);

    let response: Anthropic.Messages.Message;
    try {
      const wrapped = await runAgentCall(
        {
          userId,
          sessionId,
          agentKind: 'mock_interview',
          model: CLAUDE_MODELS.reasoning,
        },
        async () => {
          const value = await client.messages.create({
            model: CLAUDE_MODELS.reasoning,
            max_tokens: 2048,
            system: [
              {
                type: 'text',
                text: QUESTION_SET_SYSTEM_PROMPT,
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
      throw new MockInterviewError('Question-set LLM call failed', { cause: err });
    }

    const rawText = extractAssistantText(response);
    if (!rawText) throw new MockInterviewError('Empty LLM response');

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(stripJsonFence(rawText));
    } catch (err) {
      throw new MockInterviewError('Question-set non-JSON output', { cause: err });
    }

    const validated = QuestionSetSchema.safeParse(parsedJson);
    if (!validated.success) {
      console.error('[mock-interview] Question-set schema failure:', validated.error.flatten());
      throw new MockInterviewError('Question-set failed schema validation', {
        cause: validated.error.flatten(),
      });
    }

    const questions: MockInterviewQuestion[] = validated.data.questions;

    const state: MockInterviewState = {
      questions,
      currentIndex: 0,
      perQuestionScores: [],
    };
    await saveState(supabase, sessionId, null, state);

    // Persist the agent's first question as a normal agent message so the
    // transcript contains it.
    await supabase.from('agent_messages').insert({
      session_id: sessionId,
      role: 'agent',
      content_json: {
        kind: 'question',
        questionIndex: 0,
        prompt: questions[0].prompt,
        questionId: questions[0].id,
      },
      tokens_in: response.usage?.input_tokens ?? 0,
      tokens_out: response.usage?.output_tokens ?? 0,
    });

    await supabase
      .from('agent_sessions')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', sessionId)
      .eq('user_id', userId);

    return {
      status: 'in_progress',
      currentQuestion: questions[0],
      questionsRemaining: questions.length,
    };
  }

  // ============================================================
  // END: produce final report
  // ============================================================
  if (effectiveCommand === 'end') {
    if (!existing) {
      throw new MockInterviewError('Cannot end: no active mock interview state');
    }
    const transcript = await loadTranscript(supabase, sessionId);

    const finalUserPrompt = buildFinalReportUserPrompt({
      questions: existing.state.questions.map((q) => ({ id: q.id, prompt: q.prompt })),
      transcript,
      roundType: context.report.roundType,
    });

    let response: Anthropic.Messages.Message;
    try {
      const wrapped = await runAgentCall(
        {
          userId,
          sessionId,
          agentKind: 'mock_interview',
          model: CLAUDE_MODELS.reasoning,
        },
        async () => {
          const value = await client.messages.create({
            model: CLAUDE_MODELS.reasoning,
            max_tokens: 3072,
            system: [
              {
                type: 'text',
                text: FINAL_REPORT_SYSTEM_PROMPT,
                cache_control: { type: 'ephemeral' },
              },
            ],
            messages: [{ role: 'user', content: finalUserPrompt }],
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
      throw new MockInterviewError('Final-report LLM call failed', { cause: err });
    }

    const rawText = extractAssistantText(response);
    if (!rawText) throw new MockInterviewError('Empty LLM response');

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(stripJsonFence(rawText));
    } catch (err) {
      throw new MockInterviewError('Final-report non-JSON output', { cause: err });
    }

    const validated = FinalReportSchema.safeParse(parsedJson);
    if (!validated.success) {
      console.error('[mock-interview] Final-report schema failure:', validated.error.flatten());
      throw new MockInterviewError('Final-report failed schema validation', {
        cause: validated.error.flatten(),
      });
    }

    const finalReport: MockInterviewFinalReport = {
      overallScore: validated.data.overall_score,
      perQuestionScores: validated.data.per_question_scores,
      summary: validated.data.summary,
      topStrengths: validated.data.top_strengths,
      topImprovements: validated.data.top_improvements,
      nextSteps: validated.data.next_steps,
    };

    const tokensIn = response.usage?.input_tokens ?? 0;
    const tokensOut = response.usage?.output_tokens ?? 0;

    await supabase.from('agent_messages').insert({
      session_id: sessionId,
      role: 'agent',
      content_json: {
        kind: 'final_report',
        finalReport,
        version: MOCK_INTERVIEW_VERSION,
      },
      tokens_in: tokensIn,
      tokens_out: tokensOut,
    });

    await supabase
      .from('agent_sessions')
      .update({
        status: 'completed',
        last_message_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .eq('user_id', userId);

    // Draft recommend_drill actions per next_steps
    const actionIds: string[] = [];
    if (finalReport.nextSteps.length > 0) {
      const rows: Record<string, unknown>[] = [];
      for (const step of finalReport.nextSteps) {
        // Anchor riskId where possible — pick the lowest-scored question's mappedRiskId
        const lowestIdx = finalReport.perQuestionScores.reduce(
          (minIdx, score, i, arr) => (score < arr[minIdx] ? i : minIdx),
          0
        );
        const candidateRiskId = existing.state.questions[lowestIdx]?.mappedRiskId ?? 'general';
        const payload = {
          riskId: candidateRiskId,
          reason: `${step.title} — ${step.rationale}`.slice(0, 1000),
        };
        const v = validateActionPayload('recommend_drill', payload);
        if (!v.ok) {
          console.error('[mock-interview] recommend_drill payload invalid:', v.error);
          continue;
        }
        rows.push({
          user_id: userId,
          session_id: sessionId,
          report_id: reportId,
          action_type: 'recommend_drill',
          payload_json: v.payload,
          status: 'drafted',
          requires_external_send: actionRequiresExternalSend('recommend_drill'),
        });
      }
      if (rows.length > 0) {
        const { data: insertedActions, error: actionsErr } = await supabase
          .from('agent_actions')
          .insert(rows)
          .select('id');
        if (actionsErr || !insertedActions) {
          console.error('[mock-interview] Failed to persist actions:', actionsErr);
        } else {
          for (const row of insertedActions) actionIds.push(row.id as string);
        }
      }
    }

    return {
      status: 'completed',
      currentQuestion: null,
      finalReport,
      actionIds,
    };
  }

  // ============================================================
  // NEXT (answer): evaluate the user's answer
  // ============================================================
  if (!existing) {
    throw new MockInterviewError('Cannot continue: no active mock interview state');
  }
  if (!userMessage || userMessage.trim().length === 0) {
    throw new MockInterviewError('userMessage is required to advance the interview');
  }

  const state = existing.state;
  if (state.currentIndex >= state.questions.length) {
    throw new MockInterviewError(
      'Mock interview already exhausted all questions; call command="end"'
    );
  }
  const currentQuestion = state.questions[state.currentIndex];

  // Persist the user's answer message
  await supabase.from('agent_messages').insert({
    session_id: sessionId,
    role: 'user',
    content_json: {
      questionIndex: state.currentIndex,
      questionId: currentQuestion.id,
      text: userMessage.trim(),
    },
    tokens_in: null,
    tokens_out: null,
  });

  const remainingAfterThis = state.questions.length - state.currentIndex - 1;

  const turnPrompt = buildTurnEvalUserPrompt({
    currentQuestion: currentQuestion.prompt,
    userAnswer: userMessage.trim(),
    remainingQuestions: remainingAfterThis,
    roundType: context.report.roundType,
  });

  let response: Anthropic.Messages.Message;
  try {
    const wrapped = await runAgentCall(
      {
        userId,
        sessionId,
        agentKind: 'mock_interview',
        model: CLAUDE_MODELS.reasoning,
      },
      async () => {
        const value = await client.messages.create({
          model: CLAUDE_MODELS.reasoning,
          max_tokens: 2048,
          system: [
            {
              type: 'text',
              text: TURN_EVAL_SYSTEM_PROMPT,
              cache_control: { type: 'ephemeral' },
            },
          ],
          messages: [{ role: 'user', content: turnPrompt }],
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
    throw new MockInterviewError('Turn-eval LLM call failed', { cause: err });
  }

  const rawText = extractAssistantText(response);
  if (!rawText) throw new MockInterviewError('Empty LLM response');

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(stripJsonFence(rawText));
  } catch (err) {
    throw new MockInterviewError('Turn-eval non-JSON output', { cause: err });
  }

  const validated = TurnEvalSchema.safeParse(parsedJson);
  if (!validated.success) {
    console.error('[mock-interview] Turn-eval schema failure:', validated.error.flatten());
    throw new MockInterviewError('Turn-eval failed schema validation', {
      cause: validated.error.flatten(),
    });
  }

  const evaluation: MockInterviewTurnEvaluation = {
    feedbackShort: validated.data.feedback_short,
    followUpQuestion: validated.data.follow_up_question,
    advanceToNext: validated.data.advance_to_next,
    currentScore: validated.data.current_score,
  };

  // Update state
  state.perQuestionScores[state.currentIndex] = Math.round(evaluation.currentScore);

  let nextQuestion: MockInterviewQuestion | null = currentQuestion;
  if (evaluation.advanceToNext) {
    state.currentIndex += 1;
    nextQuestion = state.questions[state.currentIndex] ?? null;
  }

  await saveState(supabase, sessionId, existing.rowId, state);

  // Persist agent turn message
  await supabase.from('agent_messages').insert({
    session_id: sessionId,
    role: 'agent',
    content_json: {
      kind: 'turn',
      questionIndex: state.currentIndex,
      feedback_short: evaluation.feedbackShort,
      follow_up_question: evaluation.followUpQuestion,
      advance_to_next: evaluation.advanceToNext,
      current_score: evaluation.currentScore,
      nextQuestion:
        evaluation.advanceToNext && nextQuestion
          ? { id: nextQuestion.id, prompt: nextQuestion.prompt }
          : null,
      version: MOCK_INTERVIEW_VERSION,
    },
    tokens_in: response.usage?.input_tokens ?? 0,
    tokens_out: response.usage?.output_tokens ?? 0,
  });

  await supabase
    .from('agent_sessions')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', sessionId)
    .eq('user_id', userId);

  // If we advanced past the last question, do NOT auto-call end — caller
  // decides. Just signal that there are no more questions.
  return {
    status: 'in_progress',
    currentQuestion: nextQuestion,
    feedbackShort: evaluation.feedbackShort,
    advanceToNext: evaluation.advanceToNext,
    currentScore: evaluation.currentScore,
    questionsRemaining: Math.max(state.questions.length - state.currentIndex, 0),
  };
}
