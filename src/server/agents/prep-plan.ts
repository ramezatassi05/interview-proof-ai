/**
 * runPrepPlan — M7.4 entrypoint.
 *
 * Generates a day-by-day prep plan, persists it to prep_plans +
 * prep_plan_tasks, and drafts an `update_prep_plan` action so the user sees
 * it surface on the Coach tab.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { CLAUDE_MODELS, getAnthropicClient } from '@/lib/anthropic';
import { actionRequiresExternalSend } from '@/lib/agent/types';
import { validateActionPayload } from '@/lib/agent/actions';
import type { PrepPlanAgentDay, PrepPlanAgentOutput, PrepPlanTaskCategory } from '@/types';
import { loadAgentContext } from './context-loader';
import { buildUserPrompt, SYSTEM_PROMPT } from './prompts/prep-plan';

export const PREP_PLAN_AGENT_VERSION = 'v1.0.0';

const MAX_TOTAL_TASKS = 50;

const CATEGORY_VALUES = [
  'practice',
  'study',
  'behavioral',
  'technical',
  'company_research',
  'review',
  'rest',
] as const;

const TaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  category: z.enum(CATEGORY_VALUES),
  estimated_minutes: z.number().int().min(0).max(240),
});

const DaySchema = z.object({
  day_offset: z.number().int().min(0).max(60),
  focus: z.string().min(1).max(500),
  tasks: z.array(TaskSchema).max(10),
});

const PrepPlanOutputSchema = z.object({
  overview: z.string().min(1).max(2000),
  days: z.array(DaySchema).min(1).max(30),
});

export class PrepPlanAgentError extends Error {
  readonly cause?: unknown;
  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = 'PrepPlanAgentError';
    this.cause = options?.cause;
  }
}

export interface RunPrepPlanArgs {
  userId: string;
  reportId: string;
  sessionId: string;
  supabase: SupabaseClient;
  opportunityId?: string;
  targetDate?: string; // ISO date
  daysAvailable?: number;
}

export interface RunPrepPlanResult {
  prepPlanId: string;
  output: PrepPlanAgentOutput;
  taskCount: number;
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

function computeDaysFromTargetDate(targetDate: string): number {
  const target = new Date(targetDate);
  if (Number.isNaN(target.getTime())) return 7;
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  return Math.max(1, Math.min(diffDays, 30));
}

export async function runPrepPlan(args: RunPrepPlanArgs): Promise<RunPrepPlanResult> {
  const { userId, reportId, sessionId, supabase, opportunityId, targetDate } = args;

  // Resolve effective days available. targetDate wins if both supplied.
  let daysAvailable: number;
  if (targetDate) {
    daysAvailable = computeDaysFromTargetDate(targetDate);
  } else if (typeof args.daysAvailable === 'number') {
    daysAvailable = Math.max(1, Math.min(args.daysAvailable, 30));
  } else {
    daysAvailable = 7;
  }

  const context = await loadAgentContext({ userId, reportId, supabase });

  const { prompt: userPrompt } = buildUserPrompt(context, {
    daysAvailable,
    targetDate: targetDate ?? null,
  });

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
    throw new PrepPlanAgentError('LLM call failed', { cause: err });
  }

  const rawText = extractAssistantText(response);
  if (!rawText) throw new PrepPlanAgentError('Empty LLM response');

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(stripJsonFence(rawText));
  } catch (err) {
    console.error('[prep-plan] JSON parse failure. Raw:', rawText);
    throw new PrepPlanAgentError('LLM returned non-JSON output', { cause: err });
  }

  const validated = PrepPlanOutputSchema.safeParse(parsedJson);
  if (!validated.success) {
    console.error('[prep-plan] Schema validation failure:', validated.error.flatten());
    throw new PrepPlanAgentError('LLM output failed schema validation', {
      cause: validated.error.flatten(),
    });
  }

  // Bounds check: 0 ≤ day_offset ≤ daysAvailable, total tasks ≤ 50.
  const days = validated.data.days;
  let totalTasks = 0;
  for (const day of days) {
    if (day.day_offset < 0 || day.day_offset > daysAvailable) {
      throw new PrepPlanAgentError(
        `Invalid day_offset ${day.day_offset} (allowed 0..${daysAvailable})`
      );
    }
    totalTasks += day.tasks.length;
  }
  if (totalTasks > MAX_TOTAL_TASKS) {
    throw new PrepPlanAgentError(
      `Generated plan has ${totalTasks} tasks, exceeds limit of ${MAX_TOTAL_TASKS}`
    );
  }

  const output: PrepPlanAgentOutput = {
    overview: validated.data.overview,
    days: days.map<PrepPlanAgentDay>((d) => ({
      dayOffset: d.day_offset,
      focus: d.focus,
      tasks: d.tasks.map((t) => ({
        title: t.title,
        description: t.description,
        category: t.category as PrepPlanTaskCategory,
        estimatedMinutes: t.estimated_minutes,
      })),
    })),
  };

  const tokensIn = response.usage?.input_tokens ?? 0;
  const tokensOut = response.usage?.output_tokens ?? 0;

  // Persist prep_plan
  const planRow = {
    user_id: userId,
    report_id: reportId,
    opportunity_id: opportunityId ?? null,
    target_date: targetDate ?? null,
    status: 'active' as const,
    plan_json: {
      overview: output.overview,
      days: output.days,
      generatedBy: 'prep_plan_agent',
      version: PREP_PLAN_AGENT_VERSION,
    },
  };

  const { data: insertedPlan, error: planErr } = await supabase
    .from('prep_plans')
    .insert(planRow)
    .select('id')
    .single();

  if (planErr || !insertedPlan) {
    console.error('[prep-plan] Failed to insert prep_plan:', planErr);
    throw new PrepPlanAgentError('Failed to persist prep plan', { cause: planErr });
  }
  const prepPlanId = insertedPlan.id as string;

  // Persist prep_plan_tasks
  const taskRows: Record<string, unknown>[] = [];
  for (const day of output.days) {
    for (const task of day.tasks) {
      taskRows.push({
        prep_plan_id: prepPlanId,
        day_offset: day.dayOffset,
        title: task.title,
        description: task.description,
        category: task.category,
        estimated_minutes: task.estimatedMinutes,
        status: 'pending',
      });
    }
  }

  if (taskRows.length > 0) {
    const { error: taskErr } = await supabase.from('prep_plan_tasks').insert(taskRows);
    if (taskErr) {
      console.error('[prep-plan] Failed to insert prep_plan_tasks:', taskErr);
      throw new PrepPlanAgentError('Failed to persist prep plan tasks', { cause: taskErr });
    }
  }

  // Persist agent message
  await supabase.from('agent_messages').insert({
    session_id: sessionId,
    role: 'agent',
    content_json: {
      prepPlanId,
      overview: output.overview,
      days: output.days,
      taskCount: taskRows.length,
      version: PREP_PLAN_AGENT_VERSION,
    },
    tokens_in: tokensIn,
    tokens_out: tokensOut,
  });

  await supabase
    .from('agent_sessions')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', sessionId)
    .eq('user_id', userId);

  // Draft update_prep_plan action so the user sees it on Coach
  const payload = { prepPlanId, patch: {} };
  const v = validateActionPayload('update_prep_plan', payload);
  let actionId: string | null = null;
  if (!v.ok) {
    console.error('[prep-plan] update_prep_plan payload invalid:', v.error);
  } else {
    const { data: insertedActions, error: actionsErr } = await supabase
      .from('agent_actions')
      .insert([
        {
          user_id: userId,
          session_id: sessionId,
          report_id: reportId,
          action_type: 'update_prep_plan',
          payload_json: v.payload,
          status: 'drafted',
          requires_external_send: actionRequiresExternalSend('update_prep_plan'),
        },
      ])
      .select('id');
    if (actionsErr || !insertedActions || insertedActions.length === 0) {
      console.error('[prep-plan] Failed to persist update_prep_plan action:', actionsErr);
    } else {
      actionId = insertedActions[0].id as string;
    }
  }

  return {
    prepPlanId,
    output,
    taskCount: taskRows.length,
    actionId,
    tokensIn,
    tokensOut,
  };
}
