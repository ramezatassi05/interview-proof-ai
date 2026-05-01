/**
 * POST /api/agent/answer-feedback
 *
 * M7.2 Answer Feedback Agent. Wraps the existing answer feedback pipeline
 * (`generateAnswerFeedback`) and adds an agent-level summary plus an optional
 * `recommend_drill` draft. Persists answer to practice_answers and the
 * conversation to agent_messages.
 *
 * Auth: requires Supabase user. Cross-user reports return 404.
 * Rate limit: 30/hr per user.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { runAnswerFeedback, AnswerFeedbackError } from '@/server/agents/answer-feedback';
import { AgentContextNotFoundError } from '@/server/agents/context-loader';
import { rowToAgentSession } from '@/lib/agent/types';
import type { AgentSessionRow } from '@/lib/agent/types';
import { recordAuditEvent } from '@/lib/agent/audit';

export const maxDuration = 30;

const BodySchema = z.object({
  reportId: z.string().uuid(),
  sessionId: z.string().uuid().optional(),
  questionText: z.string().min(1).max(4000),
  answerText: z.string().min(1).max(8000),
  questionIndex: z.number().int().optional(),
  mappedRiskId: z.string().min(1).optional(),
  attemptNumber: z.number().int().positive().optional(),
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

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      reportId,
      sessionId: providedSessionId,
      questionText,
      answerText,
      questionIndex,
      mappedRiskId,
      attemptNumber,
    } = parsed.data;

    const { data: report } = await supabase
      .from('reports')
      .select('id')
      .eq('id', reportId)
      .eq('user_id', user.id)
      .single();
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const allowed = await checkRateLimit({
      prefix: 'agent:answer-feedback',
      identifier: user.id,
      maxRequests: 60,
      windowSeconds: 3600,
    });
    if (!allowed) {
      await recordAuditEvent({
        userId: user.id,
        eventType: 'rate_limited',
        agentKind: 'answer_feedback',
        metadata: { prefix: 'agent:answer-feedback', retry_after_seconds: 3600 },
      });
      return rateLimitResponse(3600);
    }

    let sessionId: string;
    if (providedSessionId) {
      const { data: existingSession } = await supabase
        .from('agent_sessions')
        .select('id')
        .eq('id', providedSessionId)
        .eq('user_id', user.id)
        .single();
      if (!existingSession) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }
      sessionId = providedSessionId;
    } else {
      const { data: newSession, error: createErr } = await supabase
        .from('agent_sessions')
        .insert({
          user_id: user.id,
          agent_kind: 'answer_feedback',
          report_id: reportId,
        })
        .select()
        .single();
      if (createErr || !newSession) {
        console.error('[answer-feedback] Failed to create session:', createErr);
        return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
      }
      sessionId = rowToAgentSession(newSession as AgentSessionRow).id;
    }

    let result;
    try {
      result = await runAnswerFeedback({
        userId: user.id,
        reportId,
        sessionId,
        supabase,
        questionText,
        answerText,
        questionIndex,
        mappedRiskId,
        attemptNumber,
      });
    } catch (err) {
      if (err instanceof AgentContextNotFoundError) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 });
      }
      if (err instanceof AnswerFeedbackError) {
        console.error('[answer-feedback] Agent error:', err.message, err.cause);
        return NextResponse.json(
          { error: 'Agent failed to produce a valid response', code: 'answer_feedback_error' },
          { status: 502 }
        );
      }
      throw err;
    }

    return NextResponse.json({
      data: {
        sessionId,
        ...result.feedback,
        agentSummary: result.agentSummary,
        practiceAnswerId: result.practiceAnswerId,
        actionIds: result.actionIds,
      },
    });
  } catch (err) {
    console.error('POST /api/agent/answer-feedback error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
