import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import type { PracticeSession, PracticeSessionMode } from '@/types';

const PRACTICE_MODES: PracticeSessionMode[] = ['drill', 'mock', 'timed'];

const CreateSchema = z.object({
  mode: z
    .enum(PRACTICE_MODES as unknown as [PracticeSessionMode, ...PracticeSessionMode[]])
    .default('drill'),
});

interface PracticeSessionRow {
  id: string;
  user_id: string;
  report_id: string;
  mode: PracticeSessionMode;
  started_at: string;
  ended_at: string | null;
  summary_json: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

function rowToPracticeSession(row: PracticeSessionRow): PracticeSession {
  return {
    id: row.id,
    userId: row.user_id,
    reportId: row.report_id,
    mode: row.mode,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    summaryJson: row.summary_json,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function verifyReportOwnership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  reportId: string,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('reports')
    .select('id')
    .eq('id', reportId)
    .eq('user_id', userId)
    .single();
  return !!data;
}

/**
 * POST /api/report/[id]/practice-session — start a new practice session.
 *
 * Request body: `{ mode?: 'drill' | 'mock' | 'timed' }` (defaults to 'drill').
 * Returns 201 with the created PracticeSession.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
      prefix: 'practice_session_write',
      identifier: `user:${user.id}`,
      maxRequests: 30,
      windowSeconds: 3600,
    });
    if (!allowed) return rateLimitResponse(3600);

    const owns = await verifyReportOwnership(supabase, reportId, user.id);
    if (!owns) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    let body: unknown = {};
    try {
      body = await request.json();
    } catch {
      // empty body is fine — defaults apply
    }
    const parsed = CreateSchema.safeParse(body ?? {});
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { data: row, error } = await supabase
      .from('practice_sessions')
      .insert({
        user_id: user.id,
        report_id: reportId,
        mode: parsed.data.mode,
      })
      .select()
      .single();

    if (error || !row) {
      console.error('practice_sessions insert error:', error);
      return NextResponse.json({ error: 'Failed to create practice session' }, { status: 500 });
    }

    return NextResponse.json(
      { data: rowToPracticeSession(row as PracticeSessionRow) },
      { status: 201 }
    );
  } catch (err) {
    console.error('POST /api/report/[id]/practice-session error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const PatchSchema = z.object({
  sessionId: z.string().uuid(),
  summary: z.record(z.string(), z.unknown()).optional(),
});

/**
 * PATCH /api/report/[id]/practice-session — close an open practice session.
 *
 * Request body: `{ sessionId: uuid, summary?: object }`. Sets `ended_at = now()`
 * (and merges optional `summary` into `summary_json`) on the matching open
 * session for the authenticated user + this report. Idempotent: if the session
 * is already closed (or does not exist for this user) returns 404.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
      prefix: 'practice_session_end',
      identifier: `user:${user.id}`,
      maxRequests: 60,
      windowSeconds: 3600,
    });
    if (!allowed) return rateLimitResponse(3600);

    const owns = await verifyReportOwnership(supabase, reportId, user.id);
    if (!owns) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    let body: unknown;
    try {
      body = await request.json();
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

    const { sessionId, summary } = parsed.data;

    // Read current row to merge summary_json without overwriting prior keys.
    const { data: existing } = await supabase
      .from('practice_sessions')
      .select()
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .eq('report_id', reportId)
      .is('ended_at', null)
      .single();

    if (!existing) {
      // Either the session doesn't exist, doesn't belong to this user/report,
      // or is already closed. Surface as 404 to avoid leaking which.
      return NextResponse.json({ error: 'Open session not found' }, { status: 404 });
    }

    const existingRow = existing as PracticeSessionRow;
    const mergedSummary =
      summary !== undefined
        ? { ...(existingRow.summary_json ?? {}), ...summary }
        : existingRow.summary_json;

    const { data: updated, error: updateErr } = await supabase
      .from('practice_sessions')
      .update({
        ended_at: new Date().toISOString(),
        summary_json: mergedSummary,
      })
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .eq('report_id', reportId)
      .is('ended_at', null)
      .select()
      .single();

    if (updateErr || !updated) {
      console.error('practice_sessions PATCH error:', updateErr);
      return NextResponse.json({ error: 'Failed to close practice session' }, { status: 500 });
    }

    return NextResponse.json({
      data: rowToPracticeSession(updated as PracticeSessionRow),
    });
  } catch (err) {
    console.error('PATCH /api/report/[id]/practice-session error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/report/[id]/practice-session — return the latest open practice
 * session for the authenticated user + this report. If none exists, lazily
 * creates one in 'drill' mode and returns it.
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

    const owns = await verifyReportOwnership(supabase, reportId, user.id);
    if (!owns) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Find latest open (ended_at IS NULL) session for this user/report.
    const { data: existing, error: listErr } = await supabase
      .from('practice_sessions')
      .select()
      .eq('user_id', user.id)
      .eq('report_id', reportId)
      .is('ended_at', null)
      .order('created_at', { ascending: false })
      .limit(1);

    if (listErr) {
      console.error('practice_sessions list error:', listErr);
      return NextResponse.json({ error: 'Failed to read practice session' }, { status: 500 });
    }

    if (existing && existing.length > 0) {
      return NextResponse.json({
        data: rowToPracticeSession(existing[0] as PracticeSessionRow),
      });
    }

    // None — lazily create one in drill mode.
    const { data: created, error: createErr } = await supabase
      .from('practice_sessions')
      .insert({
        user_id: user.id,
        report_id: reportId,
        mode: 'drill',
      })
      .select()
      .single();

    if (createErr || !created) {
      console.error('practice_sessions lazy-create error:', createErr);
      return NextResponse.json({ error: 'Failed to create practice session' }, { status: 500 });
    }

    return NextResponse.json({
      data: rowToPracticeSession(created as PracticeSessionRow),
    });
  } catch (err) {
    console.error('GET /api/report/[id]/practice-session error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
