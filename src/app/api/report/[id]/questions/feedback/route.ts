import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { generateAnswerFeedback } from '@/server/questions';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

export const maxDuration = 30;

const RequestSchema = z.object({
  questionIndex: z.number(),
  questionText: z.string().min(1),
  userAnswer: z.string().min(1),
});

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
      prefix: 'feedback',
      identifier: `user:${user.id}`,
      maxRequests: 30,
      windowSeconds: 3600,
    });
    if (!allowed) return rateLimitResponse(3600);

    const body = await request.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Fetch report + latest run for context
    const { data: report } = await supabase
      .from('reports')
      .select('id, round_type, user_id, paid_unlocked')
      .eq('id', reportId)
      .eq('user_id', user.id)
      .single();

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const { data: runs } = await supabase
      .from('runs')
      .select('extracted_resume_json, extracted_jd_json')
      .eq('report_id', reportId)
      .order('run_index', { ascending: false })
      .limit(1);

    const latestRun = runs?.[0];
    if (!latestRun) {
      return NextResponse.json({ error: 'No analysis found' }, { status: 404 });
    }

    const feedback = await generateAnswerFeedback(
      parsed.data.questionText,
      parsed.data.userAnswer,
      latestRun.extracted_resume_json,
      latestRun.extracted_jd_json,
      report.round_type
    );

    // M4: dual-write — persist this answer + feedback to practice_answers so
    // it survives localStorage clears and is visible across browsers. Wrapped
    // in try/catch and never blocks the feedback response shape.
    try {
      // Find latest open session for this user/report; lazily create one in drill mode.
      let practiceSessionId: string | null = null;
      const { data: openSessions } = await supabase
        .from('practice_sessions')
        .select('id')
        .eq('user_id', user.id)
        .eq('report_id', reportId)
        .is('ended_at', null)
        .order('created_at', { ascending: false })
        .limit(1);

      if (openSessions && openSessions.length > 0) {
        practiceSessionId = openSessions[0].id as string;
      } else {
        const { data: createdSession, error: sessionErr } = await supabase
          .from('practice_sessions')
          .insert({ user_id: user.id, report_id: reportId, mode: 'drill' })
          .select('id')
          .single();
        if (sessionErr || !createdSession) {
          throw sessionErr ?? new Error('lazy session create returned no row');
        }
        practiceSessionId = createdSession.id as string;
      }

      // attempt_number = max(prior attempts for user/report/questionIndex) + 1
      const { data: priorAttempts } = await supabase
        .from('practice_answers')
        .select('attempt_number')
        .eq('user_id', user.id)
        .eq('report_id', reportId)
        .eq('question_index', parsed.data.questionIndex)
        .order('attempt_number', { ascending: false })
        .limit(1);

      const attemptNumber =
        priorAttempts && priorAttempts.length > 0
          ? (priorAttempts[0].attempt_number as number) + 1
          : 1;

      const score =
        typeof feedback.score === 'number' && feedback.score >= 0 && feedback.score <= 100
          ? Math.round(feedback.score)
          : null;

      const { error: insertErr } = await supabase.from('practice_answers').insert({
        practice_session_id: practiceSessionId,
        report_id: reportId,
        user_id: user.id,
        question_index: parsed.data.questionIndex,
        question_text: parsed.data.questionText,
        mapped_risk_id: null,
        answer_text: parsed.data.userAnswer,
        feedback_json: feedback as unknown as Record<string, unknown>,
        score,
        attempt_number: attemptNumber,
      });

      if (insertErr) {
        console.error('practice_answers dual-write insert error:', insertErr);
      }
    } catch (persistErr) {
      // Log + swallow — feedback delivery must never be blocked by persistence.
      console.error('practice_answers dual-write failed:', persistErr);
    }

    return NextResponse.json({ data: feedback });
  } catch (error) {
    console.error('Question feedback error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
