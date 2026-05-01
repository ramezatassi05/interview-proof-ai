import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { AGENT_KINDS, AGENT_SESSION_STATUSES, rowToAgentSession } from '@/lib/agent/types';
import type { AgentSessionRow } from '@/lib/agent/types';

const CreateSchema = z.object({
  agentKind: z.enum(AGENT_KINDS as unknown as [string, ...string[]]),
  reportId: z.string().uuid().optional(),
});

const ListQuerySchema = z.object({
  status: z.enum(AGENT_SESSION_STATUSES as unknown as [string, ...string[]]).optional(),
  agentKind: z.enum(AGENT_KINDS as unknown as [string, ...string[]]).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  cursor: z.string().datetime().optional(),
});

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

    const allowed = await checkRateLimit({
      prefix: 'agent_session_create',
      identifier: `user:${user.id}`,
      maxRequests: 30,
      windowSeconds: 3600,
    });
    if (!allowed) return rateLimitResponse(3600);

    const body = await request.json();
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    if (parsed.data.reportId) {
      const { data: report } = await supabase
        .from('reports')
        .select('id')
        .eq('id', parsed.data.reportId)
        .eq('user_id', user.id)
        .single();
      if (!report) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 });
      }
    }

    const { data: row, error } = await supabase
      .from('agent_sessions')
      .insert({
        user_id: user.id,
        agent_kind: parsed.data.agentKind,
        report_id: parsed.data.reportId ?? null,
      })
      .select()
      .single();

    if (error || !row) {
      console.error('agent_sessions insert error:', error);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    return NextResponse.json({ data: rowToAgentSession(row as AgentSessionRow) }, { status: 201 });
  } catch (err) {
    console.error('POST /api/agent/sessions error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
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

    const url = new URL(request.url);
    const parsed = ListQuerySchema.safeParse({
      status: url.searchParams.get('status') ?? undefined,
      agentKind: url.searchParams.get('agentKind') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
      cursor: url.searchParams.get('cursor') ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    let query = supabase
      .from('agent_sessions')
      .select()
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(parsed.data.limit + 1);

    if (parsed.data.status) query = query.eq('status', parsed.data.status);
    if (parsed.data.agentKind) query = query.eq('agent_kind', parsed.data.agentKind);
    if (parsed.data.cursor) query = query.lt('created_at', parsed.data.cursor);

    const { data, error } = await query;
    if (error) {
      console.error('agent_sessions list error:', error);
      return NextResponse.json({ error: 'Failed to list sessions' }, { status: 500 });
    }

    const rows = (data ?? []) as AgentSessionRow[];
    const hasMore = rows.length > parsed.data.limit;
    const page = hasMore ? rows.slice(0, parsed.data.limit) : rows;
    const nextCursor = hasMore ? page[page.length - 1].created_at : null;

    return NextResponse.json({
      data: page.map(rowToAgentSession),
      nextCursor,
    });
  } catch (err) {
    console.error('GET /api/agent/sessions error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
