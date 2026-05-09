/**
 * POST /api/agent/chat/stream
 *
 * Streaming counterpart to the structured /api/agent/orchestrator endpoint.
 * Accepts a user message + reportId (+ optional sessionId), and returns an
 * SSE stream of `data: <text-chunk>\n\n` events terminated by `event: done`.
 *
 * The chat agent only produces natural-language replies. It DOES NOT draft
 * agent_actions. Clients that want approval-ready actions hit the orchestrator.
 *
 * Auth: requires Supabase user. Cross-user reports return 404.
 * Rate limit: 60/hr per user (chat is lighter than orchestrator).
 * Failure modes:
 *   - 400 invalid body
 *   - 404 unknown report or session
 *   - 429 rate limited
 *   - 502 LLM-side failure (mid-stream errors are emitted as `event: error`)
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { runChatStream, ChatAgentError } from '@/server/agents/chat';
import { AgentContextNotFoundError } from '@/server/agents/context-loader';
import { rowToAgentSession } from '@/lib/agent/types';
import type { AgentSessionRow } from '@/lib/agent/types';
import { recordAuditEvent } from '@/lib/agent/audit';

export const maxDuration = 60;

const BodySchema = z.object({
  reportId: z.string().uuid(),
  sessionId: z.string().uuid().optional(),
  userMessage: z.string().min(1).max(4000),
});

function sseEncode(event: string | null, data: string): string {
  const payload = data.replace(/\r?\n/g, '\\n');
  if (event) {
    return `event: ${event}\ndata: ${payload}\n\n`;
  }
  return `data: ${payload}\n\n`;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { reportId, sessionId: providedSessionId, userMessage } = parsed.data;

    const { data: report } = await supabase
      .from('reports')
      .select('id')
      .eq('id', reportId)
      .eq('user_id', user.id)
      .single();
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const allowed = await checkRateLimit({
      prefix: 'agent:chat',
      identifier: user.id,
      maxRequests: 60,
      windowSeconds: 3600,
    });
    if (!allowed) {
      await recordAuditEvent({
        userId: user.id,
        eventType: 'rate_limited',
        agentKind: 'chat',
        metadata: { prefix: 'agent:chat', retry_after_seconds: 3600 },
      });
      return rateLimitResponse(3600);
    }

    let sessionId: string;
    if (providedSessionId) {
      const { data: existingSession } = await supabase
        .from('agent_sessions')
        .select('id')
        .eq('id', providedSessionId)
        .eq('user_id', user.id)
        .single();
      if (!existingSession) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }
      sessionId = providedSessionId;
    } else {
      // Reuse the orchestrator session kind — chat + orchestrator share the
      // same conversation thread (same report, same context). The agent_kind
      // CHECK constraint does not yet include 'chat'; that is intentional for
      // A1. If we later split chat into its own kind we'll add a migration.
      const { data: newSession, error: createErr } = await supabase
        .from('agent_sessions')
        .insert({
          user_id: user.id,
          agent_kind: 'orchestrator',
          report_id: reportId,
        })
        .select()
        .single();
      if (createErr || !newSession) {
        console.error('[chat-stream] Failed to create session:', createErr);
        return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
      }
      sessionId = rowToAgentSession(newSession as AgentSessionRow).id;
    }

    let chat;
    try {
      chat = await runChatStream({
        userId: user.id,
        reportId,
        sessionId,
        supabase,
        userMessage,
      });
    } catch (err) {
      if (err instanceof AgentContextNotFoundError) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 });
      }
      if (err instanceof ChatAgentError) {
        return NextResponse.json({ error: err.message, code: 'chat_error' }, { status: 502 });
      }
      throw err;
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        controller.enqueue(encoder.encode(sseEncode(null, JSON.stringify({ sessionId }))));
        try {
          for await (const delta of chat.deltas) {
            controller.enqueue(encoder.encode(sseEncode(null, delta)));
          }
          const result = await chat.done;
          controller.enqueue(
            encoder.encode(
              sseEncode(
                'done',
                JSON.stringify({
                  tokensIn: result.tokensIn,
                  tokensOut: result.tokensOut,
                })
              )
            )
          );
        } catch (err) {
          const message =
            err instanceof Error ? err.message : typeof err === 'string' ? err : 'stream error';
          controller.enqueue(encoder.encode(sseEncode('error', message)));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (err) {
    console.error('POST /api/agent/chat/stream error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
