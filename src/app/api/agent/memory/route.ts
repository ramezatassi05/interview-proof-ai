import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { USER_MEMORY_KINDS, rowToUserMemory } from '@/lib/agent/types';
import type { UserMemoryRow } from '@/lib/agent/types';

const UpsertSchema = z.object({
  kind: z.enum(USER_MEMORY_KINDS as unknown as [string, ...string[]]),
  key: z.string().min(1).max(200),
  valueJson: z.record(z.string(), z.unknown()),
  sourceActionId: z.string().uuid().optional(),
});

const ListQuerySchema = z.object({
  kind: z.enum(USER_MEMORY_KINDS as unknown as [string, ...string[]]).optional(),
});

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
      kind: url.searchParams.get('kind') ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    let query = supabase
      .from('user_memory')
      .select()
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    if (parsed.data.kind) query = query.eq('kind', parsed.data.kind);

    const { data, error } = await query;
    if (error) {
      console.error('user_memory list error:', error);
      return NextResponse.json({ error: 'Failed to list memory' }, { status: 500 });
    }

    const rows = (data ?? []) as UserMemoryRow[];
    return NextResponse.json({ data: rows.map(rowToUserMemory) });
  } catch (err) {
    console.error('GET /api/agent/memory error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
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

    const allowed = await checkRateLimit({
      prefix: 'agent_memory_write',
      identifier: `user:${user.id}`,
      maxRequests: 60,
      windowSeconds: 3600,
    });
    if (!allowed) return rateLimitResponse(3600);

    const body = await request.json();
    const parsed = UpsertSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    if (parsed.data.sourceActionId) {
      const { data: action } = await supabase
        .from('agent_actions')
        .select('id')
        .eq('id', parsed.data.sourceActionId)
        .eq('user_id', user.id)
        .single();
      if (!action) {
        return NextResponse.json({ error: 'Source action not found' }, { status: 404 });
      }
    }

    const { data: row, error } = await supabase
      .from('user_memory')
      .upsert(
        {
          user_id: user.id,
          kind: parsed.data.kind,
          key: parsed.data.key,
          value_json: parsed.data.valueJson,
          source_action_id: parsed.data.sourceActionId ?? null,
        },
        { onConflict: 'user_id,kind,key' }
      )
      .select()
      .single();

    if (error || !row) {
      console.error('user_memory upsert error:', error);
      return NextResponse.json({ error: 'Failed to upsert memory' }, { status: 500 });
    }

    return NextResponse.json({ data: rowToUserMemory(row as UserMemoryRow) });
  } catch (err) {
    console.error('POST /api/agent/memory error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
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
      prefix: 'agent_memory_write',
      identifier: `user:${user.id}`,
      maxRequests: 60,
      windowSeconds: 3600,
    });
    if (!allowed) return rateLimitResponse(3600);

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id || !z.string().uuid().safeParse(id).success) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    const { data: row, error } = await supabase
      .from('user_memory')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error || !row) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ data: rowToUserMemory(row as UserMemoryRow) });
  } catch (err) {
    console.error('DELETE /api/agent/memory error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
