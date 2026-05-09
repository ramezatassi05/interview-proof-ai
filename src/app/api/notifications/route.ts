/**
 * GET /api/notifications
 *
 * Lists the current user's notifications, newest first.
 * Query params:
 *   - limit:    1–50, default 20
 *   - unread:   '1' to filter to unread only
 *
 * Returns: { data: Notification[], unreadCount: number }
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import type { UserNotification, UserNotificationKind } from '@/types';

const QuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  unread: z.enum(['0', '1']).optional(),
});

interface NotificationRow {
  id: string;
  user_id: string;
  kind: UserNotificationKind;
  title: string;
  body: string | null;
  action_id: string | null;
  href: string | null;
  read_at: string | null;
  created_at: string;
}

function rowToNotification(row: NotificationRow): UserNotification {
  return {
    id: row.id,
    userId: row.user_id,
    kind: row.kind,
    title: row.title,
    body: row.body,
    actionId: row.action_id,
    href: row.href,
    readAt: row.read_at,
    createdAt: row.created_at,
  };
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

    const url = new URL(request.url);
    const parsed = QuerySchema.safeParse({
      limit: url.searchParams.get('limit') ?? undefined,
      unread: url.searchParams.get('unread') ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    let query = supabase
      .from('user_notifications')
      .select()
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(parsed.data.limit);

    if (parsed.data.unread === '1') {
      query = query.is('read_at', null);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[notifications] list error:', error);
      return NextResponse.json({ error: 'Failed to list' }, { status: 500 });
    }

    const { count: unreadCount } = await supabase
      .from('user_notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('read_at', null);

    return NextResponse.json({
      data: ((data ?? []) as NotificationRow[]).map(rowToNotification),
      unreadCount: unreadCount ?? 0,
    });
  } catch (err) {
    console.error('GET /api/notifications error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
