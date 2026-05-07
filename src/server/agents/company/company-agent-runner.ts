import type { SupabaseClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { getAnthropicClient } from '@/lib/anthropic';
import type { CompanyAgentKind, CompanyAgentTriggeredBy, CompanyMetricsSnapshot } from './types';
import type { DirectorContext } from './director-context';
import { buildCompanySystemPrompt, COMPANY_AGENT_VERSION } from './company-agent-prompts';
import { getModelForAgent } from './agent-models';
import { loadRoadmap } from './roadmap/loader';
import { loadGuardrailTier } from './guardrails';
import { getSkillsForAgent } from './skills';
import { executeSkill, type ExecuteSkillResult } from './skills/router';

const MAX_TOOL_ITERATIONS = 6;
const MAX_HISTORY_MESSAGES = 20;
const MAX_MEMORY_ROWS = 50;
const STREAM_MAX_TOKENS = 4096;
const TOOL_RESULT_OUTPUT_CHAR_CAP = 8000;

export class CompanyAgentError extends Error {
  readonly cause?: unknown;
  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = 'CompanyAgentError';
    this.cause = options?.cause;
  }
}

export interface StreamCompanyAgentArgs {
  userId: string;
  sessionId: string;
  agentKind: CompanyAgentKind;
  message: string;
  messageContent?: Anthropic.Messages.ContentBlockParam[];
  attachmentIds?: string[];
  supabase: SupabaseClient;
  metrics: CompanyMetricsSnapshot;
  directorContext?: DirectorContext;
  triggeredBy?: CompanyAgentTriggeredBy;
  abortSignal?: AbortSignal;
  // Set by `consult_director` when the CEO nests a director call. Inner
  // director runs see this and refuse to consult further (defense in depth —
  // consult_director is already CEO-only, but this hardens the boundary).
  parentTurnId?: string;
}

export interface StreamToolCallStartEvent {
  id: string;
  skillId: string;
  input: Record<string, unknown>;
}

export interface StreamToolCallCompleteEvent {
  id: string;
  skillId: string;
  status: ExecuteSkillResult['status'];
  output: Record<string, unknown>;
  linkedActionId: string | null;
  error?: string;
  latencyMs: number;
}

export interface StreamCompanyAgentResult {
  messageId: string;
  text: string;
  toolCallIds: string[];
  linkedActionIds: string[];
  tokensIn: number;
  tokensOut: number;
  truncated: boolean;
}

export interface StreamCompanyAgentCallbacks {
  onTextDelta?(delta: string): void;
  onToolCallStart?(event: StreamToolCallStartEvent): void;
  onToolCallComplete?(event: StreamToolCallCompleteEvent): void;
  onMemoryUpdated?(event: { key: string }): void;
  onUsage?(event: { tokensIn: number; tokensOut: number }): void;
  onComplete?(result: StreamCompanyAgentResult): void;
}

interface MemoryRow {
  key: string;
  value_json: unknown;
}

async function loadMemory(args: {
  supabase: SupabaseClient;
  userId: string;
  agentKind: CompanyAgentKind;
}): Promise<MemoryRow[]> {
  const { data } = await args.supabase
    .from('company_agent_memory')
    .select('key,value_json')
    .eq('user_id', args.userId)
    .eq('agent_kind', args.agentKind)
    .order('updated_at', { ascending: false })
    .limit(MAX_MEMORY_ROWS);
  return (data as MemoryRow[] | null) ?? [];
}

interface PriorMessageRow {
  role: 'user' | 'agent' | 'system' | 'tool';
  content_json: Record<string, unknown> | null;
}

async function loadConversationHistory(args: {
  supabase: SupabaseClient;
  sessionId: string;
}): Promise<Anthropic.Messages.MessageParam[]> {
  const { data } = await args.supabase
    .from('company_agent_messages')
    .select('role,content_json')
    .eq('session_id', args.sessionId)
    .order('created_at', { ascending: true })
    .limit(MAX_HISTORY_MESSAGES);

  const rows = (data as PriorMessageRow[] | null) ?? [];
  const messages: Anthropic.Messages.MessageParam[] = [];

  for (const row of rows) {
    const content = row.content_json ?? {};
    const text =
      typeof (content as { text?: unknown }).text === 'string'
        ? (content as { text: string }).text
        : typeof (content as { summary?: unknown }).summary === 'string'
          ? (content as { summary: string }).summary
          : '';
    if (!text.trim()) continue;
    if (row.role === 'user') {
      messages.push({ role: 'user', content: text });
    } else if (row.role === 'agent') {
      messages.push({ role: 'assistant', content: text });
    }
  }
  return messages;
}

async function persistUserMessage(args: {
  supabase: SupabaseClient;
  sessionId: string;
  agentKind: CompanyAgentKind;
  text: string;
  attachmentIds: string[];
  triggeredBy: CompanyAgentTriggeredBy;
}): Promise<string> {
  const { data, error } = await args.supabase
    .from('company_agent_messages')
    .insert({
      session_id: args.sessionId,
      role: 'user',
      agent_kind: args.agentKind,
      content_json: {
        kind: 'user',
        text: args.text,
        attachmentIds: args.attachmentIds,
        triggeredBy: args.triggeredBy,
      },
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new CompanyAgentError('Failed to persist user message', { cause: error });
  }
  return data.id as string;
}

async function persistAssistantMessage(args: {
  supabase: SupabaseClient;
  sessionId: string;
  agentKind: CompanyAgentKind;
  text: string;
  toolCallIds: string[];
  stopReason: string | null;
  truncated: boolean;
  tokensIn: number;
  tokensOut: number;
}): Promise<string> {
  const { data, error } = await args.supabase
    .from('company_agent_messages')
    .insert({
      session_id: args.sessionId,
      role: 'agent',
      agent_kind: args.agentKind,
      content_json: {
        kind: 'assistant',
        text: args.text,
        toolCallIds: args.toolCallIds,
        stopReason: args.stopReason,
        truncated: args.truncated,
        version: COMPANY_AGENT_VERSION,
      },
      tokens_in: args.tokensIn,
      tokens_out: args.tokensOut,
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new CompanyAgentError('Failed to persist assistant message', { cause: error });
  }
  return data.id as string;
}

async function attachToolCallsToMessage(
  supabase: SupabaseClient,
  messageId: string,
  toolCallRowIds: string[]
) {
  if (toolCallRowIds.length === 0) return;
  await supabase
    .from('company_agent_tool_calls')
    .update({ message_id: messageId })
    .in('id', toolCallRowIds);
}

async function attachAttachmentsToSession(args: {
  supabase: SupabaseClient;
  attachmentIds: string[];
  userId: string;
  sessionId: string;
  messageId: string;
}) {
  if (args.attachmentIds.length === 0) return;
  await args.supabase
    .from('company_agent_attachments')
    .update({ session_id: args.sessionId, message_id: args.messageId })
    .in('id', args.attachmentIds)
    .eq('user_id', args.userId);
}

export async function streamCompanyAgent(
  args: StreamCompanyAgentArgs,
  callbacks: StreamCompanyAgentCallbacks = {}
): Promise<StreamCompanyAgentResult> {
  const triggeredBy: CompanyAgentTriggeredBy = args.triggeredBy ?? 'user';
  const client = getAnthropicClient();

  const [memory, history, roadmap, guardrailTier] = await Promise.all([
    loadMemory({ supabase: args.supabase, userId: args.userId, agentKind: args.agentKind }),
    loadConversationHistory({ supabase: args.supabase, sessionId: args.sessionId }),
    loadRoadmap({ agentKind: args.agentKind }),
    loadGuardrailTier(args.supabase, args.userId, args.agentKind),
  ]);

  const userMessageId = await persistUserMessage({
    supabase: args.supabase,
    sessionId: args.sessionId,
    agentKind: args.agentKind,
    text: args.message,
    attachmentIds: args.attachmentIds ?? [],
    triggeredBy,
  });
  await attachAttachmentsToSession({
    supabase: args.supabase,
    attachmentIds: args.attachmentIds ?? [],
    userId: args.userId,
    sessionId: args.sessionId,
    messageId: userMessageId,
  });

  const systemPrompt = buildCompanySystemPrompt({
    agentKind: args.agentKind,
    memory: memory.map((m) => ({ key: m.key, value: m.value_json })),
    directorSummary: args.directorContext?.summary,
    roadmap,
  });

  const skills = getSkillsForAgent(args.agentKind);
  const tools = skills.map((s) => s.tool);

  // CEO gets a per-turn consult budget that consult_director decrements.
  // Inner director runs (parentTurnId set) get no budget — even if a director
  // somehow had consult_director registered, the ctx check would refuse it.
  const consultBudget =
    args.agentKind === 'ceo_orchestrator' && !args.parentTurnId ? { remaining: 2 } : undefined;

  const userContent: Anthropic.Messages.ContentBlockParam[] =
    args.messageContent && args.messageContent.length > 0
      ? args.messageContent
      : [{ type: 'text', text: args.message }];

  const messages: Anthropic.Messages.MessageParam[] = [
    ...history,
    { role: 'user', content: userContent },
  ];

  const toolCallRowIds: string[] = [];
  const toolUseIds: string[] = [];
  const linkedActionIds: string[] = [];
  let aggregatedText = '';
  let totalTokensIn = 0;
  let totalTokensOut = 0;
  let finalStopReason: string | null = null;
  let truncated = false;
  const seenMemoryKeys = new Set<string>();

  for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
    if (args.abortSignal?.aborted) {
      truncated = true;
      break;
    }

    const stream = client.messages.stream({
      model: getModelForAgent(args.agentKind),
      max_tokens: STREAM_MAX_TOKENS,
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' },
        },
      ],
      tools,
      messages,
    });

    if (callbacks.onTextDelta) {
      stream.on('text', (delta) => {
        aggregatedText += delta;
        callbacks.onTextDelta!(delta);
      });
    } else {
      stream.on('text', (delta) => {
        aggregatedText += delta;
      });
    }

    const announcedToolStarts = new Set<string>();
    stream.on('streamEvent', (event) => {
      if (event.type === 'content_block_start' && event.content_block.type === 'tool_use') {
        const block = event.content_block;
        if (announcedToolStarts.has(block.id)) return;
        announcedToolStarts.add(block.id);
        callbacks.onToolCallStart?.({
          id: block.id,
          skillId: block.name,
          input: {},
        });
      }
    });

    let finalMessage: Anthropic.Messages.Message;
    try {
      finalMessage = await stream.finalMessage();
    } catch (err) {
      if (args.abortSignal?.aborted) {
        truncated = true;
        break;
      }
      throw new CompanyAgentError('Anthropic streaming call failed', { cause: err });
    }

    totalTokensIn += finalMessage.usage?.input_tokens ?? 0;
    totalTokensOut += finalMessage.usage?.output_tokens ?? 0;
    callbacks.onUsage?.({
      tokensIn: totalTokensIn,
      tokensOut: totalTokensOut,
    });

    finalStopReason = finalMessage.stop_reason ?? null;

    if (finalMessage.stop_reason !== 'tool_use') {
      break;
    }

    const toolUseBlocks = finalMessage.content.filter(
      (block): block is Anthropic.Messages.ToolUseBlock => block.type === 'tool_use'
    );

    if (toolUseBlocks.length === 0) {
      break;
    }

    const skillResults = await Promise.all(
      toolUseBlocks.map((block) =>
        executeSkill({
          skillId: block.name,
          toolUseId: block.id,
          input: (block.input as Record<string, unknown>) ?? {},
          ctx: {
            supabase: args.supabase,
            userId: args.userId,
            sessionId: args.sessionId,
            agentKind: args.agentKind,
            metrics: args.metrics,
            consultBudget,
            guardrailTier,
          },
        })
      )
    );

    for (const result of skillResults) {
      toolUseIds.push(result.toolUseId);
      toolCallRowIds.push(result.toolCallRowId);
      callbacks.onToolCallComplete?.({
        id: result.toolUseId,
        skillId: result.skillId,
        status: result.status,
        output: result.output,
        linkedActionId: result.linkedActionId ?? null,
        error: result.error,
        latencyMs: result.latencyMs,
      });
      if (result.linkedActionId) linkedActionIds.push(result.linkedActionId);
      if (result.skillId === 'remember' && result.status === 'succeeded') {
        const key = (result.output as { key?: string } | undefined)?.key;
        if (key && !seenMemoryKeys.has(key)) {
          seenMemoryKeys.add(key);
          callbacks.onMemoryUpdated?.({ key });
        }
      }
    }

    const toolResultBlocks: Anthropic.Messages.ToolResultBlockParam[] = skillResults.map(
      (result) => ({
        type: 'tool_result',
        tool_use_id: result.toolUseId,
        content: JSON.stringify(result.output).slice(0, TOOL_RESULT_OUTPUT_CHAR_CAP),
        is_error: result.status === 'failed',
      })
    );

    messages.push(
      { role: 'assistant', content: finalMessage.content },
      { role: 'user', content: toolResultBlocks }
    );

    if (iteration === MAX_TOOL_ITERATIONS - 1) {
      truncated = true;
    }
  }

  const assistantMessageId = await persistAssistantMessage({
    supabase: args.supabase,
    sessionId: args.sessionId,
    agentKind: args.agentKind,
    text: aggregatedText,
    toolCallIds: toolUseIds,
    stopReason: finalStopReason,
    truncated,
    tokensIn: totalTokensIn,
    tokensOut: totalTokensOut,
  });

  await attachToolCallsToMessage(args.supabase, assistantMessageId, toolCallRowIds);

  await args.supabase
    .from('company_agent_sessions')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', args.sessionId)
    .eq('user_id', args.userId);

  const result: StreamCompanyAgentResult = {
    messageId: assistantMessageId,
    text: aggregatedText,
    toolCallIds: toolUseIds,
    linkedActionIds,
    tokensIn: totalTokensIn,
    tokensOut: totalTokensOut,
    truncated,
  };

  callbacks.onComplete?.(result);
  return result;
}

// ---------------------------------------------------------------------------
// Non-streaming wrapper retained for cron callers. Returns a simplified shape
// (no structured CompanyAgentOutput): cron only consumes counts + token usage.
// ---------------------------------------------------------------------------
export type RunCompanyAgentArgs = StreamCompanyAgentArgs;

export interface RunCompanyAgentResult {
  text: string;
  actionIds: string[];
  toolCallIds: string[];
  tokensIn: number;
  tokensOut: number;
}

export async function runCompanyAgent(args: RunCompanyAgentArgs): Promise<RunCompanyAgentResult> {
  const result = await streamCompanyAgent(args);
  return {
    text: result.text,
    actionIds: result.linkedActionIds,
    toolCallIds: result.toolCallIds,
    tokensIn: result.tokensIn,
    tokensOut: result.tokensOut,
  };
}
