import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import {
  AGENT_ACTION_STATUSES,
  AGENT_ACTION_TYPES,
  actionRequiresExternalSend,
  rowToAgentAction,
} from '@/lib/agent/types';
import type { AgentActionRow, AgentActionType } from '@/lib/agent/types';
import { validateActionPayload } from '@/lib/agent/actions';
import { recordAuditEvent } from '@/lib/agent/audit';

const CreateSchema = z.object({
  actionType: z.enum(AGENT_ACTION_TYPES as unknown as [string, ...string[]]),
  payload: z.record(z.string(), z.unknown()),
  sessionId: z.string().uuid().optional(),
  reportId: z.string().uuid().optional(),
  evidenceRefs: z.array(z.unknown()).optional(),
});

const ListQuerySchema = z.object({
  sessionId: z.string().uuid().optional(),
  status: z.enum(AGENT_ACTION_STATUSES as unknown as [string, ...string[]]).optional(),
  actionType: z.enum(AGENT_ACTION_TYPES as unknown as [string, ...string[]]).optional(),
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
      prefix: 'agent_action_write',
      identifier: `user:${user.id}`,
      maxRequests: 60,
      windowSeconds: 3600,
    });
    if (!allowed) {
      await recordAuditEvent({
        userId: user.id,
        eventType: 'rate_limited',
        metadata: { prefix: 'agent_action_write', retry_after_seconds: 3600 },
      });
      return rateLimitResponse(3600);
    }

    const body = await request.json();
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const actionType = parsed.data.actionType as AgentActionType;
    const payloadResult = validateActionPayload(actionType, parsed.data.payload);
    if (!payloadResult.ok) {
      return NextResponse.json(
        { error: 'Invalid action payload', details: payloadResult.error },
        { status: 400 }
      );
    }

    if (parsed.data.sessionId) {
      const { data: session } = await supabase
        .from('agent_sessions')
        .select('id')
        .eq('id', parsed.data.sessionId)
        .eq('user_id', user.id)
        .single();
      if (!session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }
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
      .from('agent_actions')
      .insert({
        user_id: user.id,
        session_id: parsed.data.sessionId ?? null,
        report_id: parsed.data.reportId ?? null,
        action_type: actionType,
        payload_json: payloadResult.payload,
        status: 'drafted',
        requires_external_send: actionRequiresExternalSend(actionType),
        evidence_refs_json: parsed.data.evidenceRefs ?? null,
      })
      .select()
      .single();

    if (error || !row) {
      console.error('agent_actions insert error:', error);
      return NextResponse.json({ error: 'Failed to create action' }, { status: 500 });
    }

    await recordAuditEvent({
      userId: user.id,
      actionId: (row as AgentActionRow).id,
      sessionId: parsed.data.sessionId ?? null,
      eventType: 'action_drafted',
      metadata: { action_type: actionType },
    });

    return NextResponse.json({ data: rowToAgentAction(row as AgentActionRow) }, { status: 201 });
  } catch (err) {
    console.error('POST /api/agent/actions error:', err);
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
      sessionId: url.searchParams.get('sessionId') ?? undefined,
      status: url.searchParams.get('status') ?? undefined,
      actionType: url.searchParams.get('actionType') ?? undefined,
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
      .from('agent_actions')
      .select()
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(parsed.data.limit + 1);

    if (parsed.data.sessionId) query = query.eq('session_id', parsed.data.sessionId);
    if (parsed.data.status) query = query.eq('status', parsed.data.status);
    if (parsed.data.actionType) query = query.eq('action_type', parsed.data.actionType);
    if (parsed.data.cursor) query = query.lt('created_at', parsed.data.cursor);

    const { data, error } = await query;
    if (error) {
      console.error('agent_actions list error:', error);
      return NextResponse.json({ error: 'Failed to list actions' }, { status: 500 });
    }

    const rows = (data ?? []) as AgentActionRow[];
    const hasMore = rows.length > parsed.data.limit;
    const page = hasMore ? rows.slice(0, parsed.data.limit) : rows;
    const nextCursor = hasMore ? page[page.length - 1].created_at : null;

    return NextResponse.json({
      data: page.map(rowToAgentAction),
      nextCursor,
    });
  } catch (err) {
    console.error('GET /api/agent/actions error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
