/**
 * Chat Agent — free-form natural-language coach.
 *
 * Sibling of the structured prep-orchestrator. Where the orchestrator
 * returns JSON-shaped action proposals, this agent streams plain prose so
 * the UI can render token-by-token. It DOES NOT draft actions; if the user
 * wants action proposals they hit /api/agent/orchestrator instead.
 *
 * Responsibilities:
 *   1. Load typed context (delegated to context-loader).
 *   2. Open a streaming Anthropic call with the cached chat system prompt.
 *   3. Yield text deltas as they arrive.
 *   4. On stream completion, persist the user + agent messages and emit the
 *      `agent_call_completed` audit event.
 *
 * The route layer (`/api/agent/chat/stream`) handles auth, ownership, rate
 * limiting, and SSE framing.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { CLAUDE_MODELS, getAnthropicClient } from '@/lib/anthropic';
import { recordAuditEvent } from '@/lib/agent/audit';
import { loadAgentContext } from './context-loader';
import { buildChatUserPrompt, CHAT_SYSTEM_PROMPT } from './prompts/chat';

export const CHAT_AGENT_VERSION = 'v1.0.0';

const MAX_TOKENS = 1024;

export class ChatAgentError extends Error {
  readonly cause?: unknown;
  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = 'ChatAgentError';
    this.cause = options?.cause;
  }
}

export interface RunChatStreamArgs {
  userId: string;
  reportId: string;
  sessionId: string;
  supabase: SupabaseClient;
  userMessage: string;
}

export interface ChatStreamResult {
  /** Async generator yielding text deltas as they arrive. */
  deltas: AsyncGenerator<string, void, unknown>;
  /** Resolves once the stream closes; rejects if the LLM call fails. */
  done: Promise<{ fullText: string; tokensIn: number; tokensOut: number }>;
}

/**
 * Opens a streaming Claude call and returns:
 *   - `deltas`: an async generator the route can pipe to the SSE response
 *   - `done`:   a promise that resolves with totals after the last delta
 *
 * Persistence + audit are handled inside `done` so the route does not need
 * to know about the audit table or message rows.
 */
export async function runChatStream(args: RunChatStreamArgs): Promise<ChatStreamResult> {
  const { userId, reportId, sessionId, supabase, userMessage } = args;
  const trimmed = userMessage.trim();
  if (trimmed.length === 0) {
    throw new ChatAgentError('User message is empty');
  }

  const context = await loadAgentContext({ userId, reportId, supabase });
  const userPrompt = buildChatUserPrompt(context, trimmed);

  const client = getAnthropicClient();
  const startedAt = Date.now();

  await recordAuditEvent({
    userId,
    sessionId,
    eventType: 'agent_call_started',
    agentKind: 'chat',
    metadata: { agent_kind: 'chat', model: CLAUDE_MODELS.reasoning },
  });

  // Persist the user message up-front so it's visible in the transcript even
  // if the agent stream fails partway through.
  const { error: userMsgErr } = await supabase.from('agent_messages').insert({
    session_id: sessionId,
    role: 'user',
    content_json: { text: trimmed },
    tokens_in: null,
    tokens_out: null,
  });
  if (userMsgErr) {
    console.error('[chat] Failed to persist user message:', userMsgErr);
  }

  const stream = client.messages.stream({
    model: CLAUDE_MODELS.reasoning,
    max_tokens: MAX_TOKENS,
    system: [
      {
        type: 'text',
        text: CHAT_SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: userPrompt }],
  });

  let resolveDone!: (v: { fullText: string; tokensIn: number; tokensOut: number }) => void;
  let rejectDone!: (e: unknown) => void;
  const done = new Promise<{ fullText: string; tokensIn: number; tokensOut: number }>(
    (resolve, reject) => {
      resolveDone = resolve;
      rejectDone = reject;
    }
  );

  async function* deltas(): AsyncGenerator<string, void, unknown> {
    const textParts: string[] = [];
    try {
      for await (const event of stream) {
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          textParts.push(event.delta.text);
          yield event.delta.text;
        }
      }
      const finalMessage = await stream.finalMessage();
      const fullText = textParts.join('');
      const tokensIn = finalMessage.usage?.input_tokens ?? 0;
      const tokensOut = finalMessage.usage?.output_tokens ?? 0;

      // Persist the agent message + bump session, best-effort.
      const { error: agentMsgErr } = await supabase.from('agent_messages').insert({
        session_id: sessionId,
        role: 'agent',
        content_json: { text: fullText, version: CHAT_AGENT_VERSION },
        tokens_in: tokensIn,
        tokens_out: tokensOut,
      });
      if (agentMsgErr) {
        console.error('[chat] Failed to persist agent message:', agentMsgErr);
      }
      await supabase
        .from('agent_sessions')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', sessionId)
        .eq('user_id', userId);

      await recordAuditEvent({
        userId,
        sessionId,
        eventType: 'agent_call_completed',
        agentKind: 'chat',
        metadata: {
          agent_kind: 'chat',
          model: CLAUDE_MODELS.reasoning,
          tokens_in: tokensIn,
          tokens_out: tokensOut,
          duration_ms: Date.now() - startedAt,
        },
      });

      resolveDone({ fullText, tokensIn, tokensOut });
    } catch (err) {
      const errorClass = err instanceof Error ? err.constructor.name : typeof err;
      const errorMessage =
        err instanceof Error ? err.message : typeof err === 'string' ? err : 'unknown error';
      await recordAuditEvent({
        userId,
        sessionId,
        eventType: 'agent_call_failed',
        agentKind: 'chat',
        metadata: {
          agent_kind: 'chat',
          model: CLAUDE_MODELS.reasoning,
          error_class: errorClass,
          error_message: errorMessage,
          duration_ms: Date.now() - startedAt,
        },
      });
      rejectDone(err);
      throw err;
    }
  }

  return { deltas: deltas(), done };
}
