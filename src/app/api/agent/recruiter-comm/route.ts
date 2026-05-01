/**
 * POST /api/agent/recruiter-comm
 *
 * M7.7 Recruiter Communication Agent. Drafts a candidate reply to a recruiter
 * message. Produces user-facing copy — the underlying action carries
 * requires_external_send=true and cannot transition past `approved`.
 *
 * Auth: requires Supabase user. opportunityId / reportId, when supplied, are
 * checked for ownership; cross-user resources return 404.
 * Rate limit: 30/hr per user.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { runRecruiterComm, RecruiterCommError } from '@/server/agents/recruiter-comm';
import { AgentContextNotFoundError } from '@/server/agents/context-loader';
import { rowToAgentSession } from '@/lib/agent/types';
import type { AgentSessionRow } from '@/lib/agent/types';
import { recordAuditEvent } from '@/lib/agent/audit';

const BodySchema = z.object({
  recruiterMessage: z.string().min(1).max(8000),
  userGoal: z.string().min(1).max(1000),
  opportunityId: z.string().uuid().optional(),
  reportId: z.string().uuid().optional(),
  recipientHint: z.string().max(200).optional(),
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

    const { recruiterMessage, userGoal, opportunityId, reportId, recipientHint } = parsed.data;

    if (reportId) {
      const { data: report } = await supabase
        .from('reports')
        .select('id')
        .eq('id', reportId)
        .eq('user_id', user.id)
        .single();
      if (!report) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 });
      }
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
      prefix: 'agent:recruiter-comm',
      identifier: user.id,
      maxRequests: 30,
      windowSeconds: 3600,
    });
    if (!allowed) {
      await recordAuditEvent({
        userId: user.id,
        eventType: 'rate_limited',
        agentKind: 'recruiter_comm',
        metadata: { prefix: 'agent:recruiter-comm', retry_after_seconds: 3600 },
      });
      return rateLimitResponse(3600);
    }

    const { data: newSession, error: createErr } = await supabase
      .from('agent_sessions')
      .insert({
        user_id: user.id,
        agent_kind: 'recruiter_comm',
        report_id: reportId ?? null,
      })
      .select()
      .single();
    if (createErr || !newSession) {
      console.error('[recruiter-comm] Failed to create session:', createErr);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }
    const sessionId = rowToAgentSession(newSession as AgentSessionRow).id;

    let result;
    try {
      result = await runRecruiterComm({
        userId: user.id,
        sessionId,
        supabase,
        recruiterMessage,
        userGoal,
        opportunityId,
        reportId,
        recipientHint,
      });
    } catch (err) {
      if (err instanceof AgentContextNotFoundError) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 });
      }
      if (err instanceof RecruiterCommError) {
        console.error('[recruiter-comm] Agent error:', err.message, err.cause);
        return NextResponse.json(
          { error: 'Agent failed to produce a valid response', code: 'recruiter_comm_error' },
          { status: 502 }
        );
      }
      throw err;
    }

    return NextResponse.json({
      data: {
        sessionId,
        actionId: result.actionId,
        primary: result.output.primary,
        alternatives: result.output.alternatives,
        rationale: result.output.rationale,
      },
    });
  } catch (err) {
    console.error('POST /api/agent/recruiter-comm error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
