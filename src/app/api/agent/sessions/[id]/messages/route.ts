import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { AGENT_MESSAGE_ROLES, rowToAgentMessage } from '@/lib/agent/types';
import type { AgentMessageRow } from '@/lib/agent/types';

const PostSchema = z.object({
  role: z.enum(AGENT_MESSAGE_ROLES as unknown as [string, ...string[]]),
  contentJson: z.record(z.string(), z.unknown()),
  tokensIn: z.number().int().nonnegative().optional(),
  tokensOut: z.number().int().nonnegative().optional(),
});

const ListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  cursor: z.string().datetime().optional(),
  direction: z.enum(['asc', 'desc']).default('asc'),
});

async function ownsSession(
  supabase: Awaited<ReturnType<typeof createClient>>,
  sessionId: string,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('agent_sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .single();
  return Boolean(data);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: sessionId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allowed = await checkRateLimit({
      prefix: 'agent_message_write',
      identifier: `user:${user.id}`,
      maxRequests: 120,
      windowSeconds: 3600,
    });
    if (!allowed) return rateLimitResponse(3600);

    if (!(await ownsSession(supabase, sessionId, user.id))) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = PostSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { data: row, error } = await supabase
      .from('agent_messages')
      .insert({
        session_id: sessionId,
        role: parsed.data.role,
        content_json: parsed.data.contentJson,
        tokens_in: parsed.data.tokensIn ?? null,
        tokens_out: parsed.data.tokensOut ?? null,
      })
      .select()
      .single();

    if (error || !row) {
      console.error('agent_messages insert error:', error);
      return NextResponse.json({ error: 'Failed to append message' }, { status: 500 });
    }

    // Bump parent session.last_message_at; ignore failure (non-critical).
    await supabase
      .from('agent_sessions')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', sessionId)
      .eq('user_id', user.id);

    return NextResponse.json({ data: rowToAgentMessage(row as AgentMessageRow) }, { status: 201 });
  } catch (err) {
    console.error('POST /api/agent/sessions/[id]/messages error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: sessionId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allowed = await checkRateLimit({
      prefix: 'agent_read',
      identifier: `user:${user.id}`,
      maxRequests: 240,
      windowSeconds: 3600,
    });
    if (!allowed) return rateLimitResponse(60);

    if (!(await ownsSession(supabase, sessionId, user.id))) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const url = new URL(request.url);
    const parsed = ListQuerySchema.safeParse({
      limit: url.searchParams.get('limit') ?? undefined,
      cursor: url.searchParams.get('cursor') ?? undefined,
      direction: url.searchParams.get('direction') ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const ascending = parsed.data.direction === 'asc';
    let query = supabase
      .from('agent_messages')
      .select()
      .eq('session_id', sessionId)
      .order('created_at', { ascending })
      .limit(parsed.data.limit + 1);

    if (parsed.data.cursor) {
      query = ascending
        ? query.gt('created_at', parsed.data.cursor)
        : query.lt('created_at', parsed.data.cursor);
    }

    const { data, error } = await query;
    if (error) {
      console.error('agent_messages list error:', error);
      return NextResponse.json({ error: 'Failed to list messages' }, { status: 500 });
    }

    const rows = (data ?? []) as AgentMessageRow[];
    const hasMore = rows.length > parsed.data.limit;
    const page = hasMore ? rows.slice(0, parsed.data.limit) : rows;
    const nextCursor = hasMore ? page[page.length - 1].created_at : null;

    return NextResponse.json({
      data: page.map(rowToAgentMessage),
      nextCursor,
    });
  } catch (err) {
    console.error('GET /api/agent/sessions/[id]/messages error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
