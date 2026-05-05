import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { requireAdminUser } from '@/lib/admin';
import { createServiceClient } from '@/lib/supabase/server';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { runCeoOrchestratorStream } from '@/server/agents/company/ceo-orchestrator';
import { COMPANY_AGENT_KINDS } from '@/server/agents/company/types';
import type { CompanyAgentSessionRow } from '@/server/agents/company/types';

interface AttachmentRow {
  id: string;
  user_id: string;
  session_id: string | null;
  kind: 'pdf' | 'image' | 'text' | 'file';
  filename: string;
  mime_type: string;
  storage_path: string;
  extracted_text: string | null;
}

const IMAGE_MEDIA_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

async function buildAttachmentBlocks(args: {
  attachmentIds: string[];
  userId: string;
  sessionId: string;
}): Promise<Anthropic.Messages.ContentBlockParam[]> {
  if (args.attachmentIds.length === 0) return [];

  const service = await createServiceClient();

  const { data: rows, error } = await service
    .from('company_agent_attachments')
    .select('id,user_id,session_id,kind,filename,mime_type,storage_path,extracted_text')
    .in('id', args.attachmentIds)
    .eq('user_id', args.userId);

  if (error || !rows) {
    console.error('[company-agent/message] attachment lookup failed:', error);
    return [];
  }

  const attachments = rows as AttachmentRow[];

  // Promote any pending rows to this session so history queries can find them.
  const pendingIds = attachments
    .filter((a) => a.session_id === null || a.session_id !== args.sessionId)
    .map((a) => a.id);
  if (pendingIds.length > 0) {
    await service
      .from('company_agent_attachments')
      .update({ session_id: args.sessionId })
      .in('id', pendingIds)
      .eq('user_id', args.userId);
  }

  const blocks: Anthropic.Messages.ContentBlockParam[] = [];
  for (const att of attachments) {
    if (att.kind === 'image') {
      const mediaType = IMAGE_MEDIA_TYPES.has(att.mime_type) ? att.mime_type : 'image/png';
      const { data: blob, error: dlError } = await service.storage
        .from('agent-attachments')
        .download(att.storage_path);
      if (dlError || !blob) {
        console.error('[company-agent/message] image download failed:', dlError);
        continue;
      }
      const buf = Buffer.from(await blob.arrayBuffer());
      blocks.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: mediaType as 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif',
          data: buf.toString('base64'),
        },
      });
    } else if (att.extracted_text && att.extracted_text.trim().length > 0) {
      blocks.push({
        type: 'text',
        text: `Attached file "${att.filename}":\n\n${att.extracted_text}`,
      });
    }
  }
  return blocks;
}

export const maxDuration = 300;

const MessageSchema = z.object({
  message: z.string().min(1).max(8000),
  sessionId: z.string().uuid().optional(),
  agentKind: z.enum(COMPANY_AGENT_KINDS).optional(),
  attachmentIds: z.array(z.string().uuid()).max(5).optional(),
});

async function createSession(args: {
  supabase: SupabaseClient;
  userId: string;
  title: string;
  agentKind: CompanyAgentSessionRow['agent_kind'];
  triggeredBy: CompanyAgentSessionRow['triggered_by'];
}) {
  const { data, error } = await args.supabase
    .from('company_agent_sessions')
    .insert({
      user_id: args.userId,
      agent_kind: args.agentKind,
      title: args.title,
      status: 'active',
      last_message_at: new Date().toISOString(),
      triggered_by: args.triggeredBy,
    })
    .select()
    .single();

  if (error || !data) throw error ?? new Error('Failed to create session');
  return data as CompanyAgentSessionRow;
}

function sseEvent(name: string, payload: unknown): string {
  return `event: ${name}\ndata: ${JSON.stringify(payload)}\n\n`;
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminUser();
  if (!auth.ok) return auth.response;

  const allowed = await checkRateLimit({
    prefix: 'company_agent_message',
    identifier: `user:${auth.user.id}`,
    maxRequests: 40,
    windowSeconds: 3600,
  });
  if (!allowed) return rateLimitResponse(3600);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = MessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  let session: CompanyAgentSessionRow;
  try {
    if (parsed.data.sessionId) {
      const { data } = await auth.supabase
        .from('company_agent_sessions')
        .select()
        .eq('id', parsed.data.sessionId)
        .eq('user_id', auth.user.id)
        .single();
      if (!data) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      session = data as CompanyAgentSessionRow;
    } else {
      session = await createSession({
        supabase: auth.supabase,
        userId: auth.user.id,
        title: parsed.data.message.slice(0, 80),
        agentKind: parsed.data.agentKind ?? 'executive_assistant',
        triggeredBy: 'user',
      });
    }
  } catch (err) {
    console.error('[company-agent/message] session error:', err);
    return NextResponse.json({ error: 'Failed to load or create session' }, { status: 500 });
  }

  const sessionId = session.id;
  const agentKind = parsed.data.agentKind ?? session.agent_kind;
  const userMessage = parsed.data.message;
  const attachmentIds = parsed.data.attachmentIds ?? [];

  const abortController = new AbortController();
  request.signal.addEventListener('abort', () => abortController.abort(), { once: true });

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (name: string, payload: unknown) => {
        try {
          controller.enqueue(encoder.encode(sseEvent(name, payload)));
        } catch {
          // controller closed (client disconnected) — swallow
        }
      };

      send('session', { sessionId, agentKind });

      try {
        const attachmentBlocks = await buildAttachmentBlocks({
          attachmentIds,
          userId: auth.user.id,
          sessionId,
        });
        const messageContent: Anthropic.Messages.ContentBlockParam[] | undefined =
          attachmentBlocks.length > 0
            ? [...attachmentBlocks, { type: 'text', text: userMessage }]
            : undefined;

        const result = await runCeoOrchestratorStream(
          {
            userId: auth.user.id,
            sessionId,
            message: userMessage,
            messageContent,
            attachmentIds,
            requestedAgentKind: agentKind,
            triggeredBy: 'user',
            supabase: auth.supabase,
            abortSignal: abortController.signal,
          },
          {
            onTextDelta: (delta) => send('text_delta', { delta }),
            onToolCallStart: (event) => send('tool_call_start', event),
            onToolCallComplete: (event) => send('tool_call_complete', event),
            onMemoryUpdated: (event) => send('memory_updated', event),
            onUsage: (event) => send('usage', event),
          }
        );

        send('done', {
          messageId: result.messageId,
          actionIds: result.linkedActionIds,
          truncated: result.truncated,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown agent error';
        const cause =
          err && typeof err === 'object' && 'cause' in err
            ? (err as { cause: unknown }).cause
            : null;
        console.error('[company-agent/message] stream error:', err, cause);
        send('error', { message });
      } finally {
        try {
          controller.close();
        } catch {
          // already closed
        }
      }
    },
    cancel() {
      abortController.abort();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
