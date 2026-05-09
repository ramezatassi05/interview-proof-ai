/**
 * PATCH /api/notifications/[id]
 * Body: { read?: boolean } — defaults to marking as read.
 *
 * RLS enforces ownership; the explicit user-id filter is defense in depth.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const PatchSchema = z.object({
  read: z.boolean().default(true),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: unknown = {};
    try {
      const text = await request.text();
      body = text ? JSON.parse(text) : {};
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('user_notifications')
      .update({ read_at: parsed.data.read ? new Date().toISOString() : null })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('[notifications] mark-read error:', error);
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }

    return NextResponse.json({ data: { ok: true } });
  } catch (err) {
    console.error('PATCH /api/notifications/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
