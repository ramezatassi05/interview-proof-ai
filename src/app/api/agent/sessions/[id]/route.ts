import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { AGENT_SESSION_STATUSES, rowToAgentMessage, rowToAgentSession } from '@/lib/agent/types';
import type { AgentMessageRow, AgentSessionRow } from '@/lib/agent/types';
import { recordAuditEvent } from '@/lib/agent/audit';

const PatchSchema = z.object({
  status: z.enum(AGENT_SESSION_STATUSES as unknown as [string, ...string[]]),
});

const RECENT_MESSAGES_LIMIT = 50;

async function authenticate() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return { supabase, user: null as null };
  return { supabase, user };
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { supabase, user } = await authenticate();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const allowed = await checkRateLimit({
      prefix: 'agent_read',
      identifier: `user:${user.id}`,
      maxRequests: 240,
      windowSeconds: 3600,
    });
    if (!allowed) {
      await recordAuditEvent({
        userId: user.id,
        eventType: 'rate_limited',
        metadata: { prefix: 'agent_read', retry_after_seconds: 60 },
      });
      return rateLimitResponse(60);
    }

    const { data: sessionRow } = await supabase
      .from('agent_sessions')
      .select()
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!sessionRow) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const { data: messageRows } = await supabase
      .from('agent_messages')
      .select()
      .eq('session_id', id)
      .order('created_at', { ascending: false })
      .limit(RECENT_MESSAGES_LIMIT);

    const messages = (messageRows ?? []) as AgentMessageRow[];
    return NextResponse.json({
      data: {
        session: rowToAgentSession(sessionRow as AgentSessionRow),
        recentMessages: messages.map(rowToAgentMessage).reverse(),
      },
    });
  } catch (err) {
    console.error('GET /api/agent/sessions/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { supabase, user } = await authenticate();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const allowed = await checkRateLimit({
      prefix: 'agent_session_write',
      identifier: `user:${user.id}`,
      maxRequests: 60,
      windowSeconds: 3600,
    });
    if (!allowed) {
      await recordAuditEvent({
        userId: user.id,
        sessionId: id,
        eventType: 'rate_limited',
        metadata: { prefix: 'agent_session_write', retry_after_seconds: 3600 },
      });
      return rateLimitResponse(3600);
    }

    const body = await request.json();
    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { data: row, error } = await supabase
      .from('agent_sessions')
      .update({ status: parsed.data.status })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error || !row) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ data: rowToAgentSession(row as AgentSessionRow) });
  } catch (err) {
    console.error('PATCH /api/agent/sessions/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { supabase, user } = await authenticate();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const allowed = await checkRateLimit({
      prefix: 'agent_session_write',
      identifier: `user:${user.id}`,
      maxRequests: 60,
      windowSeconds: 3600,
    });
    if (!allowed) {
      await recordAuditEvent({
        userId: user.id,
        sessionId: id,
        eventType: 'rate_limited',
        metadata: { prefix: 'agent_session_write', retry_after_seconds: 3600 },
      });
      return rateLimitResponse(3600);
    }

    // M9: soft-delete. Mark archived_at + flip status to 'archived' so the
    // session disappears from the default list view but messages, actions,
    // and the audit trail remain queryable for restoration / review.
    const { data: row, error } = await supabase
      .from('agent_sessions')
      .update({ status: 'archived', archived_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error || !row) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const sessionRow = row as AgentSessionRow;
    await recordAuditEvent({
      userId: user.id,
      sessionId: sessionRow.id,
      eventType: 'session_archived',
      agentKind: sessionRow.agent_kind,
      metadata: { agent_kind: sessionRow.agent_kind },
    });

    return NextResponse.json({ data: rowToAgentSession(sessionRow) });
  } catch (err) {
    console.error('DELETE /api/agent/sessions/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
