import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/admin';
import type { CompanyAgentKind } from '@/server/agents/company/types';

interface MessageRow {
  id: string;
  session_id: string;
  role: 'user' | 'agent' | 'system' | 'tool';
  agent_kind: CompanyAgentKind | null;
  content_json: Record<string, unknown> | null;
  created_at: string;
}

interface ToolCallRow {
  id: string;
  message_id: string | null;
  agent_kind: CompanyAgentKind;
  skill_id: string;
  tool_use_id: string;
  input_json: Record<string, unknown> | null;
  output_json: Record<string, unknown> | null;
  status: 'running' | 'succeeded' | 'failed' | 'awaiting_approval';
  error: string | null;
  latency_ms: number | null;
  linked_action_id: string | null;
  created_at: string;
}

interface AttachmentRow {
  id: string;
  message_id: string | null;
  kind: 'pdf' | 'image' | 'text' | 'file';
  filename: string;
  mime_type: string;
  byte_size: number;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminUser();
  if (!auth.ok) return auth.response;

  const { id: sessionId } = await context.params;
  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session id' }, { status: 400 });
  }

  const { data: session } = await auth.supabase
    .from('company_agent_sessions')
    .select('id,user_id')
    .eq('id', sessionId)
    .eq('user_id', auth.user.id)
    .single();

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const { data: messageRows, error: msgErr } = await auth.supabase
    .from('company_agent_messages')
    .select('id,session_id,role,agent_kind,content_json,created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (msgErr) {
    console.error('[company-agent/sessions/messages] messages error:', msgErr);
    return NextResponse.json({ error: 'Failed to load messages' }, { status: 500 });
  }

  const { data: toolCallRows } = await auth.supabase
    .from('company_agent_tool_calls')
    .select(
      'id,message_id,agent_kind,skill_id,tool_use_id,input_json,output_json,status,error,latency_ms,linked_action_id,created_at'
    )
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  const { data: attachmentRows } = await auth.supabase
    .from('company_agent_attachments')
    .select('id,message_id,kind,filename,mime_type,byte_size')
    .eq('session_id', sessionId)
    .eq('user_id', auth.user.id);

  const toolByMessage = new Map<string, ToolCallRow[]>();
  for (const tc of (toolCallRows as ToolCallRow[] | null) ?? []) {
    if (!tc.message_id) continue;
    const list = toolByMessage.get(tc.message_id) ?? [];
    list.push(tc);
    toolByMessage.set(tc.message_id, list);
  }

  const attachByMessage = new Map<string, AttachmentRow[]>();
  for (const att of (attachmentRows as AttachmentRow[] | null) ?? []) {
    if (!att.message_id) continue;
    const list = attachByMessage.get(att.message_id) ?? [];
    list.push(att);
    attachByMessage.set(att.message_id, list);
  }

  const messages = ((messageRows as MessageRow[] | null) ?? [])
    .filter((m) => m.role === 'user' || m.role === 'agent')
    .map((m) => {
      const content = m.content_json ?? {};
      const text =
        typeof (content as { text?: unknown }).text === 'string'
          ? ((content as { text: string }).text as string)
          : typeof (content as { summary?: unknown }).summary === 'string'
            ? ((content as { summary: string }).summary as string)
            : '';
      const truncated = Boolean((content as { truncated?: unknown }).truncated);
      const toolCalls = (toolByMessage.get(m.id) ?? []).map((tc) => ({
        id: tc.tool_use_id,
        skillId: tc.skill_id,
        status: tc.status,
        input: tc.input_json ?? {},
        output: tc.output_json ?? {},
        error: tc.error ?? undefined,
        linkedActionId: tc.linked_action_id ?? null,
        latencyMs: tc.latency_ms ?? undefined,
      }));
      const attachments = (attachByMessage.get(m.id) ?? []).map((att) => ({
        id: att.id,
        filename: att.filename,
        kind: att.kind,
        byteSize: att.byte_size,
        mimeType: att.mime_type,
      }));
      return {
        id: m.id,
        role: m.role === 'agent' ? ('assistant' as const) : ('user' as const),
        text,
        toolCalls,
        attachments,
        createdAtIso: m.created_at,
        truncated,
      };
    });

  return NextResponse.json({ messages });
}
