import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import type { PracticeAnswerRecord } from '@/types';

const FeedbackJsonSchema = z.record(z.string(), z.unknown()).optional().nullable();

const PostSchema = z.object({
  practiceSessionId: z.string().uuid().optional(),
  questionIndex: z.number().int().min(0),
  questionText: z.string().min(1),
  mappedRiskId: z.string().nullish(),
  answerText: z.string().min(1),
  feedbackJson: FeedbackJsonSchema,
  score: z.number().int().min(0).max(100).nullish(),
});

const GetQuerySchema = z.object({
  sessionId: z.string().uuid().optional(),
  practiceSessionId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(200),
});

interface PracticeAnswerRow {
  id: string;
  practice_session_id: string;
  report_id: string;
  user_id: string;
  question_index: number;
  question_text: string;
  mapped_risk_id: string | null;
  answer_text: string;
  feedback_json: Record<string, unknown> | null;
  score: number | null;
  attempt_number: number;
  created_at: string;
}

function rowToAnswerRecord(row: PracticeAnswerRow): PracticeAnswerRecord {
  return {
    id: row.id,
    practiceSessionId: row.practice_session_id,
    reportId: row.report_id,
    userId: row.user_id,
    questionIndex: row.question_index,
    questionText: row.question_text,
    mappedRiskId: row.mapped_risk_id,
    answerText: row.answer_text,
    feedbackJson: row.feedback_json,
    score: row.score,
    attemptNumber: row.attempt_number,
    createdAt: row.created_at,
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
 * Resolve the practice_session_id to use for an insert. If a session id was
 * passed, verify it belongs to this user+report. Otherwise reuse the latest
 * open session for this user+report, or create one (drill mode) if none.
 */
async function resolvePracticeSessionId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  reportId: string,
  requestedSessionId: string | undefined
): Promise<{ sessionId: string } | { error: string; status: number }> {
  if (requestedSessionId) {
    const { data: session } = await supabase
      .from('practice_sessions')
      .select('id')
      .eq('id', requestedSessionId)
      .eq('user_id', userId)
      .eq('report_id', reportId)
      .single();
    if (!session) {
      return { error: 'Practice session not found', status: 404 };
    }
    return { sessionId: session.id as string };
  }

  // Reuse latest open session
  const { data: existing, error: listErr } = await supabase
    .from('practice_sessions')
    .select('id')
    .eq('user_id', userId)
    .eq('report_id', reportId)
    .is('ended_at', null)
    .order('created_at', { ascending: false })
    .limit(1);

  if (listErr) {
    console.error('resolvePracticeSessionId list error:', listErr);
    return { error: 'Failed to resolve practice session', status: 500 };
  }

  if (existing && existing.length > 0) {
    return { sessionId: existing[0].id as string };
  }

  const { data: created, error: createErr } = await supabase
    .from('practice_sessions')
    .insert({ user_id: userId, report_id: reportId, mode: 'drill' })
    .select('id')
    .single();

  if (createErr || !created) {
    console.error('resolvePracticeSessionId create error:', createErr);
    return { error: 'Failed to create practice session', status: 500 };
  }

  return { sessionId: created.id as string };
}

/**
 * Compute the next attempt_number for (user, report, questionIndex). D2:
 * insert-only on retries — never UPDATE an existing row.
 */
async function computeNextAttemptNumber(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  reportId: string,
  questionIndex: number
): Promise<number> {
  const { data, error } = await supabase
    .from('practice_answers')
    .select('attempt_number')
    .eq('user_id', userId)
    .eq('report_id', reportId)
    .eq('question_index', questionIndex)
    .order('attempt_number', { ascending: false })
    .limit(1);

  if (error) {
    console.error('computeNextAttemptNumber error:', error);
    return 1; // safe default; row will still be insertable
  }

  const max = data && data.length > 0 ? (data[0].attempt_number as number) : 0;
  return max + 1;
}

/**
 * POST /api/report/[id]/practice-answers — append a practice answer row.
 * Insert-only; each retry gets a new row with `attempt_number = max+1`.
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
      prefix: 'practice_answer_write',
      identifier: `user:${user.id}`,
      maxRequests: 60,
      windowSeconds: 3600,
    });
    if (!allowed) return rateLimitResponse(3600);

    const owns = await verifyReportOwnership(supabase, reportId, user.id);
    if (!owns) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = PostSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const sessionResolution = await resolvePracticeSessionId(
      supabase,
      user.id,
      reportId,
      parsed.data.practiceSessionId
    );
    if ('error' in sessionResolution) {
      return NextResponse.json(
        { error: sessionResolution.error },
        { status: sessionResolution.status }
      );
    }

    const attemptNumber = await computeNextAttemptNumber(
      supabase,
      user.id,
      reportId,
      parsed.data.questionIndex
    );

    const { data: row, error } = await supabase
      .from('practice_answers')
      .insert({
        practice_session_id: sessionResolution.sessionId,
        report_id: reportId,
        user_id: user.id,
        question_index: parsed.data.questionIndex,
        question_text: parsed.data.questionText,
        mapped_risk_id: parsed.data.mappedRiskId ?? null,
        answer_text: parsed.data.answerText,
        feedback_json: parsed.data.feedbackJson ?? null,
        score: parsed.data.score ?? null,
        attempt_number: attemptNumber,
      })
      .select()
      .single();

    if (error || !row) {
      console.error('practice_answers insert error:', error);
      return NextResponse.json({ error: 'Failed to record answer' }, { status: 500 });
    }

    return NextResponse.json(
      { data: rowToAnswerRecord(row as PracticeAnswerRow) },
      { status: 201 }
    );
  } catch (err) {
    console.error('POST /api/report/[id]/practice-answers error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/report/[id]/practice-answers — list practice answers for this
 * user + report. Optional `?sessionId=...` or `?practiceSessionId=...` filters
 * to a single session. Ordered chronologically (oldest first) so the client
 * can replay the history. Each (questionIndex) may have multiple rows when
 * the user retried — the client should pick the latest attempt for hydration.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const url = new URL(request.url);
    const parsed = GetQuerySchema.safeParse({
      sessionId: url.searchParams.get('sessionId') ?? undefined,
      practiceSessionId: url.searchParams.get('practiceSessionId') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const sessionFilter = parsed.data.sessionId ?? parsed.data.practiceSessionId;

    let query = supabase
      .from('practice_answers')
      .select()
      .eq('user_id', user.id)
      .eq('report_id', reportId)
      .order('created_at', { ascending: true })
      .limit(parsed.data.limit);

    if (sessionFilter) {
      query = query.eq('practice_session_id', sessionFilter);
    }

    const { data, error } = await query;
    if (error) {
      console.error('practice_answers list error:', error);
      return NextResponse.json({ error: 'Failed to list answers' }, { status: 500 });
    }

    const rows = (data ?? []) as PracticeAnswerRow[];
    return NextResponse.json({
      data: rows.map(rowToAnswerRecord),
    });
  } catch (err) {
    console.error('GET /api/report/[id]/practice-answers error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
