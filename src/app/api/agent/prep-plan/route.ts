/**
 * POST /api/agent/prep-plan
 *
 * M7.4 Prep Plan Agent. Generates a day-by-day prep plan, persists to
 * prep_plans + prep_plan_tasks, and drafts an `update_prep_plan` action.
 *
 * Auth: requires Supabase user. Cross-user reports/opportunities return 404.
 * Rate limit: 10/hr per user (heavier call than other agents).
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { runPrepPlan, PrepPlanAgentError } from '@/server/agents/prep-plan';
import { AgentContextNotFoundError } from '@/server/agents/context-loader';
import { rowToAgentSession } from '@/lib/agent/types';
import type { AgentSessionRow } from '@/lib/agent/types';
import { recordAuditEvent } from '@/lib/agent/audit';

export const maxDuration = 60;

const BodySchema = z.object({
  reportId: z.string().uuid(),
  opportunityId: z.string().uuid().optional(),
  targetDate: z.string().datetime().optional(),
  daysAvailable: z.number().int().min(1).max(30).optional(),
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

    const { reportId, opportunityId, targetDate, daysAvailable } = parsed.data;

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
      prefix: 'agent:prep-plan',
      identifier: user.id,
      maxRequests: 10,
      windowSeconds: 3600,
    });
    if (!allowed) {
      await recordAuditEvent({
        userId: user.id,
        eventType: 'rate_limited',
        agentKind: 'prep_plan',
        metadata: { prefix: 'agent:prep-plan', retry_after_seconds: 3600 },
      });
      return rateLimitResponse(3600);
    }

    const { data: newSession, error: createErr } = await supabase
      .from('agent_sessions')
      .insert({
        user_id: user.id,
        agent_kind: 'prep_plan',
        report_id: reportId,
      })
      .select()
      .single();
    if (createErr || !newSession) {
      console.error('[prep-plan] Failed to create session:', createErr);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }
    const sessionId = rowToAgentSession(newSession as AgentSessionRow).id;

    let result;
    try {
      result = await runPrepPlan({
        userId: user.id,
        reportId,
        sessionId,
        supabase,
        opportunityId,
        targetDate,
        daysAvailable,
      });
    } catch (err) {
      if (err instanceof AgentContextNotFoundError) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 });
      }
      if (err instanceof PrepPlanAgentError) {
        console.error('[prep-plan] Agent error:', err.message, err.cause);
        return NextResponse.json(
          { error: 'Agent failed to produce a valid response', code: 'prep_plan_error' },
          { status: 502 }
        );
      }
      throw err;
    }

    return NextResponse.json({
      data: {
        sessionId,
        prepPlanId: result.prepPlanId,
        overview: result.output.overview,
        days: result.output.days,
        taskCount: result.taskCount,
        actionId: result.actionId,
      },
    });
  } catch (err) {
    console.error('POST /api/agent/prep-plan error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
