/**
 * POST /api/agent/mock-interview
 *
 * M7.3 Mock Interview Agent. Stateful multi-turn agent. State persists in
 * agent_messages (system messages of type=mock_interview_state) inside an
 * agent_sessions row of kind='mock_interview'.
 *
 * Commands:
 *  - 'start'  — generate 5 questions and return the first
 *  - 'next'   — evaluate user's answer (default when userMessage present)
 *  - 'end'    — generate the final report and mark the session completed
 *
 * Auth: requires Supabase user. Cross-user reports/sessions return 404.
 * Rate limit: 30/hr per user.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { runMockInterview, MockInterviewError } from '@/server/agents/mock-interview';
import { AgentContextNotFoundError } from '@/server/agents/context-loader';
import { rowToAgentSession } from '@/lib/agent/types';
import type { AgentSessionRow } from '@/lib/agent/types';

export const maxDuration = 60;

const BodySchema = z.object({
  reportId: z.string().uuid(),
  sessionId: z.string().uuid().optional(),
  userMessage: z.string().min(1).max(8000).optional(),
  command: z.enum(['start', 'next', 'end']).optional(),
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

    const { reportId, sessionId: providedSessionId, userMessage, command } = parsed.data;

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
      prefix: 'agent:mock-interview',
      identifier: user.id,
      maxRequests: 30,
      windowSeconds: 3600,
    });
    if (!allowed) return rateLimitResponse(3600);

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
          agent_kind: 'mock_interview',
          report_id: reportId,
        })
        .select()
        .single();
      if (createErr || !newSession) {
        console.error('[mock-interview] Failed to create session:', createErr);
        return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
      }
      sessionId = rowToAgentSession(newSession as AgentSessionRow).id;
    }

    let result;
    try {
      result = await runMockInterview({
        userId: user.id,
        reportId,
        sessionId,
        supabase,
        command,
        userMessage,
      });
    } catch (err) {
      if (err instanceof AgentContextNotFoundError) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 });
      }
      if (err instanceof MockInterviewError) {
        console.error('[mock-interview] Agent error:', err.message, err.cause);
        return NextResponse.json(
          { error: 'Agent failed to produce a valid response', code: 'mock_interview_error' },
          { status: 502 }
        );
      }
      throw err;
    }

    return NextResponse.json({
      data: {
        sessionId,
        status: result.status,
        currentQuestion: result.currentQuestion,
        feedbackShort: result.feedbackShort,
        advanceToNext: result.advanceToNext,
        currentScore: result.currentScore,
        finalReport: result.finalReport,
        actionIds: result.actionIds,
        questionsRemaining: result.questionsRemaining,
      },
    });
  } catch (err) {
    console.error('POST /api/agent/mock-interview error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
