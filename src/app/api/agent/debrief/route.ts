/**
 * POST /api/agent/debrief
 *
 * M7.9 Post-Interview Debrief Agent. Reflects on the candidate's free-form
 * interview-summary plus their recent practice signals; drafts a
 * `summarize_progress` action whose evidence_refs_json carries proposed
 * user_memory upserts. The upserts are applied only on action approval.
 *
 * Auth: requires Supabase user. Cross-user reports/opportunities return 404.
 * Rate limit: 30/hr per user.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { runDebrief, DebriefError } from '@/server/agents/debrief';
import { AgentContextNotFoundError } from '@/server/agents/context-loader';
import { rowToAgentSession } from '@/lib/agent/types';
import type { AgentSessionRow } from '@/lib/agent/types';
import { recordAuditEvent } from '@/lib/agent/audit';

const BodySchema = z.object({
  reportId: z.string().uuid(),
  interviewSummary: z.string().min(1).max(8000),
  windowDays: z.number().int().positive().max(365).optional(),
  opportunityId: z.string().uuid().optional(),
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

    const { reportId, interviewSummary, windowDays, opportunityId } = parsed.data;

    const { data: report } = await supabase
      .from('reports')
      .select('id')
      .eq('id', reportId)
      .eq('user_id', user.id)
      .single();
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    if (opportunityId) {
      const { data: opp } = await supabase
        .from('opportunities')
        .select('id')
        .eq('id', opportunityId)
        .eq('user_id', user.id)
        .single();
      if (!opp) {
        return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
      }
    }

    const allowed = await checkRateLimit({
      prefix: 'agent:debrief',
      identifier: user.id,
      maxRequests: 30,
      windowSeconds: 3600,
    });
    if (!allowed) {
      await recordAuditEvent({
        userId: user.id,
        eventType: 'rate_limited',
        agentKind: 'post_interview_debrief',
        metadata: { prefix: 'agent:debrief', retry_after_seconds: 3600 },
      });
      return rateLimitResponse(3600);
    }

    const { data: newSession, error: createErr } = await supabase
      .from('agent_sessions')
      .insert({
        user_id: user.id,
        agent_kind: 'post_interview_debrief',
        report_id: reportId,
      })
      .select()
      .single();
    if (createErr || !newSession) {
      console.error('[debrief] Failed to create session:', createErr);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }
    const sessionId = rowToAgentSession(newSession as AgentSessionRow).id;

    let result;
    try {
      result = await runDebrief({
        userId: user.id,
        sessionId,
        supabase,
        reportId,
        interviewSummary,
        windowDays,
        opportunityId,
      });
    } catch (err) {
      if (err instanceof AgentContextNotFoundError) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 });
      }
      if (err instanceof DebriefError) {
        console.error('[debrief] Agent error:', err.message, err.cause);
        return NextResponse.json(
          { error: 'Agent failed to produce a valid response', code: 'debrief_error' },
          { status: 502 }
        );
      }
      throw err;
    }

    return NextResponse.json({
      data: {
        sessionId,
        actionId: result.actionId,
        summary: result.output.summary,
        whatWentWell: result.output.whatWentWell,
        whatToImprove: result.output.whatToImprove,
        proposedMemory: result.output.proposedMemory,
        evidenceFromPractice: result.output.evidenceFromPractice,
      },
    });
  } catch (err) {
    console.error('POST /api/agent/debrief error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
