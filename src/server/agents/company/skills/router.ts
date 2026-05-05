import type { SupabaseClient } from '@supabase/supabase-js';
import type { CompanyAgentKind } from '../types';
import { getSkillById, isSkillAllowedForAgent } from './index';
import type { ActionDraft, SkillContext, SkillResult } from './types';

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
  args: { userId: string; sessionId: string; agentKind: CompanyAgentKind }
): SkillContext['persistAction'] {
  return async (draft: ActionDraft) => {
    const { data, error } = await supabase
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
        requires_approval: true,
      })
      .select('id')
      .single();

    if (error || !data) {
      throw new Error(`persistAction failed: ${error?.message ?? 'unknown'}`);
    }
    return { actionId: data.id as string };
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
    }),
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
