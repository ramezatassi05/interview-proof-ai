/**
 * GET /api/me/latest-report
 *
 * Returns { reportId } for the user's most recent report, or 404 if none.
 * Used by the global CopilotDock to find a report context when the user
 * is not on an /r/[id] route.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('reports')
      .select('id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('[me/latest-report] error:', error);
      return NextResponse.json({ error: 'Failed to query' }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ data: null }, { status: 200 });
    }

    return NextResponse.json({
      data: { reportId: data[0].id as string, createdAt: data[0].created_at as string },
    });
  } catch (err) {
    console.error('GET /api/me/latest-report error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
