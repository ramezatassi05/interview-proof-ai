import type { SupabaseClient } from '@supabase/supabase-js';
import type { CompanyAgentActionRow, CompanyAgentKind, GuardrailTier } from '../types';
import { getSkillById, isSkillAllowedForAgent } from './index';
import type { ActionDraft, SkillContext, SkillResult } from './types';
import { shouldAutoExecute, checkAutoExecuteRateLimit } from '../guardrails';
import { executeAction } from '../action-executors';

const HANDLER_TIMEOUT_MS = 30_000;

export interface ExecuteSkillArgs {
  skillId: string;
  toolUseId: string;
  input: Record<string, unknown>;
  ctx: Omit<SkillContext, 'persistAction'> & { messageId?: string | null };
}

export interface ExecuteSkillResult {
  toolUseId: string;
  toolCallRowId: string;
  skillId: string;
  status: 'succeeded' | 'failed' | 'awaiting_approval';
  output: Record<string, unknown>;
  error?: string;
  linkedActionId?: string | null;
  latencyMs: number;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Skill handler exceeded ${ms}ms timeout`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

async function insertToolCallRow(
  supabase: SupabaseClient,
  args: {
    userId: string;
    sessionId: string;
    messageId?: string | null;
    agentKind: CompanyAgentKind;
    skillId: string;
    toolUseId: string;
    input: Record<string, unknown>;
  }
): Promise<string> {
  const { data, error } = await supabase
    .from('company_agent_tool_calls')
    .insert({
      user_id: args.userId,
      session_id: args.sessionId,
      message_id: args.messageId ?? null,
      agent_kind: args.agentKind,
      skill_id: args.skillId,
      tool_use_id: args.toolUseId,
      input_json: args.input,
      status: 'running',
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(`Failed to insert tool_call row: ${error?.message ?? 'unknown'}`);
  }
  return data.id as string;
}

async function updateToolCallRow(
  supabase: SupabaseClient,
  rowId: string,
  patch: {
    status: 'succeeded' | 'failed' | 'awaiting_approval';
    output_json?: Record<string, unknown>;
    error?: string;
    latency_ms: number;
    linked_action_id?: string | null;
  }
) {
  await supabase
    .from('company_agent_tool_calls')
    .update({
      status: patch.status,
      output_json: patch.output_json ?? null,
      error: patch.error ?? null,
      latency_ms: patch.latency_ms,
      linked_action_id: patch.linked_action_id ?? null,
      completed_at: new Date().toISOString(),
    })
    .eq('id', rowId);
}

function makePersistAction(
  supabase: SupabaseClient,
  args: {
    userId: string;
    sessionId: string;
    agentKind: CompanyAgentKind;
    guardrailTier: GuardrailTier;
  }
): SkillContext['persistAction'] {
  return async (draft: ActionDraft) => {
    const tier = args.guardrailTier;
    const eligibleForAuto = shouldAutoExecute(tier, draft.actionType, draft.priority);
    let willAutoExec = eligibleForAuto;
    let rateLimitedReason: string | null = null;
    if (eligibleForAuto) {
      const rl = await checkAutoExecuteRateLimit(supabase, args.userId, args.agentKind);
      if (!rl.allowed) {
        willAutoExec = false;
        rateLimitedReason = `Auto-execute rate limit hit (${rl.used}/${rl.max}); waiting for approval.`;
      }
    }

    const { data: row, error } = await supabase
      .from('company_agent_actions')
      .insert({
        user_id: args.userId,
        session_id: args.sessionId,
        agent_kind: args.agentKind,
        action_type: draft.actionType,
        title: draft.title,
        rationale: draft.rationale,
        priority: draft.priority,
        payload_json: draft.payload,
        status: 'awaiting_approval',
        evidence_refs_json: draft.evidenceRefs ?? [],
        requires_approval: !willAutoExec,
        error: rateLimitedReason,
      })
      .select()
      .single();

    if (error || !row) {
      throw new Error(`persistAction failed: ${error?.message ?? 'unknown'}`);
    }

    const actionId = (row as CompanyAgentActionRow).id;

    if (willAutoExec) {
      const result = await executeAction(row as CompanyAgentActionRow, supabase);
      const followUp: Record<string, unknown> = {
        status: result.status,
        completed_at: new Date().toISOString(),
      };
      if (result.resultJson !== undefined) followUp.result_json = result.resultJson;
      if (result.error !== undefined) followUp.error = result.error;
      await supabase
        .from('company_agent_actions')
        .update(followUp)
        .eq('id', actionId)
        .eq('user_id', args.userId);
    }

    return { actionId };
  };
}

export async function executeSkill(args: ExecuteSkillArgs): Promise<ExecuteSkillResult> {
  const { skillId, toolUseId, input, ctx } = args;
  const startedAt = Date.now();

  if (!isSkillAllowedForAgent(skillId, ctx.agentKind)) {
    const rowId = await insertToolCallRow(ctx.supabase, {
      userId: ctx.userId,
      sessionId: ctx.sessionId,
      messageId: ctx.messageId,
      agentKind: ctx.agentKind,
      skillId,
      toolUseId,
      input,
    });
    const latencyMs = Date.now() - startedAt;
    const errMsg = `Skill "${skillId}" is not available for agent "${ctx.agentKind}".`;
    await updateToolCallRow(ctx.supabase, rowId, {
      status: 'failed',
      error: errMsg,
      latency_ms: latencyMs,
    });
    return {
      toolUseId,
      toolCallRowId: rowId,
      skillId,
      status: 'failed',
      output: { error: errMsg },
      error: errMsg,
      latencyMs,
    };
  }

  const skill = getSkillById(skillId);
  if (!skill) {
    const rowId = await insertToolCallRow(ctx.supabase, {
      userId: ctx.userId,
      sessionId: ctx.sessionId,
      messageId: ctx.messageId,
      agentKind: ctx.agentKind,
      skillId,
      toolUseId,
      input,
    });
    const latencyMs = Date.now() - startedAt;
    const errMsg = `Unknown skill "${skillId}".`;
    await updateToolCallRow(ctx.supabase, rowId, {
      status: 'failed',
      error: errMsg,
      latency_ms: latencyMs,
    });
    return {
      toolUseId,
      toolCallRowId: rowId,
      skillId,
      status: 'failed',
      output: { error: errMsg },
      error: errMsg,
      latencyMs,
    };
  }

  const rowId = await insertToolCallRow(ctx.supabase, {
    userId: ctx.userId,
    sessionId: ctx.sessionId,
    messageId: ctx.messageId,
    agentKind: ctx.agentKind,
    skillId,
    toolUseId,
    input,
  });

  const fullCtx: SkillContext = {
    supabase: ctx.supabase,
    userId: ctx.userId,
    sessionId: ctx.sessionId,
    agentKind: ctx.agentKind,
    metrics: ctx.metrics,
    persistAction: makePersistAction(ctx.supabase, {
      userId: ctx.userId,
      sessionId: ctx.sessionId,
      agentKind: ctx.agentKind,
      guardrailTier: ctx.guardrailTier ?? 'manual',
    }),
    consultBudget: ctx.consultBudget,
    guardrailTier: ctx.guardrailTier,
  };

  let result: SkillResult;
  try {
    result = await withTimeout(skill.handler(input as never, fullCtx), HANDLER_TIMEOUT_MS);
  } catch (err) {
    const latencyMs = Date.now() - startedAt;
    const errMsg = err instanceof Error ? err.message : String(err);
    await updateToolCallRow(ctx.supabase, rowId, {
      status: 'failed',
      error: errMsg,
      latency_ms: latencyMs,
    });
    return {
      toolUseId,
      toolCallRowId: rowId,
      skillId,
      status: 'failed',
      output: { error: errMsg },
      error: errMsg,
      latencyMs,
    };
  }

  const latencyMs = Date.now() - startedAt;
  await updateToolCallRow(ctx.supabase, rowId, {
    status: result.status,
    output_json: result.output,
    latency_ms: latencyMs,
    linked_action_id: result.linkedActionId ?? null,
  });

  return {
    toolUseId,
    toolCallRowId: rowId,
    skillId,
    status: result.status,
    output: result.output,
    linkedActionId: result.linkedActionId ?? null,
    latencyMs,
  };
}
