import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { computeUserPracticeProgress } from '@/server/agents/practice-progress';

/**
 * GET /api/report/[id]/practice-progress — thin wrapper over
 * `computeUserPracticeProgress` so the Coach tab can read longitudinal
 * practice signal without recomputing client-side.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: reportId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allowed = await checkRateLimit({
      prefix: 'practice_read',
      identifier: `user:${user.id}`,
      maxRequests: 240,
      windowSeconds: 3600,
    });
    if (!allowed) return rateLimitResponse(60);

    const { data: report } = await supabase
      .from('reports')
      .select('id')
      .eq('id', reportId)
      .eq('user_id', user.id)
      .single();
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const progress = await computeUserPracticeProgress(user.id, reportId, supabase);
    return NextResponse.json({ data: progress });
  } catch (err) {
    console.error('GET /api/report/[id]/practice-progress error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
