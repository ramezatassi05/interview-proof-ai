/**
 * POST /api/agent/readiness-coach
 *
 * M7.1 Readiness Coach Agent. Explains a single risk in plain language and
 * drafts up to 3 `recommend_drill` actions for user approval.
 *
 * Auth: requires Supabase user. Cross-user reports return 404.
 * Rate limit: 30/hr per user.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { runReadinessCoach, ReadinessCoachError } from '@/server/agents/readiness-coach';
import { AgentContextNotFoundError } from '@/server/agents/context-loader';
import { rowToAgentSession } from '@/lib/agent/types';
import type { AgentSessionRow } from '@/lib/agent/types';
import { recordAuditEvent } from '@/lib/agent/audit';

const BodySchema = z
  .object({
    reportId: z.string().uuid(),
    riskId: z.string().min(1).optional(),
    riskDescription: z.string().min(1).max(2000).optional(),
  })
  .refine((d) => Boolean(d.riskId) || Boolean(d.riskDescription), {
    message: 'Either riskId or riskDescription is required',
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

    const { reportId, riskId, riskDescription } = parsed.data;

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
      prefix: 'agent:readiness-coach',
      identifier: user.id,
      maxRequests: 30,
      windowSeconds: 3600,
    });
    if (!allowed) {
      await recordAuditEvent({
        userId: user.id,
        eventType: 'rate_limited',
        agentKind: 'readiness_coach',
        metadata: { prefix: 'agent:readiness-coach', retry_after_seconds: 3600 },
      });
      return rateLimitResponse(3600);
    }

    // Always create a fresh session per readiness-coach invocation — these are
    // single-shot explanations, not multi-turn conversations.
    const { data: newSession, error: createErr } = await supabase
      .from('agent_sessions')
      .insert({
        user_id: user.id,
        agent_kind: 'readiness_coach',
        report_id: reportId,
      })
      .select()
      .single();
    if (createErr || !newSession) {
      console.error('[readiness-coach] Failed to create session:', createErr);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }
    const sessionId = rowToAgentSession(newSession as AgentSessionRow).id;

    let result;
    try {
      result = await runReadinessCoach({
        userId: user.id,
        reportId,
        sessionId,
        supabase,
        riskId,
        riskDescription,
      });
    } catch (err) {
      if (err instanceof AgentContextNotFoundError) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 });
      }
      if (err instanceof ReadinessCoachError) {
        console.error('[readiness-coach] Agent error:', err.message, err.cause);
        return NextResponse.json(
          { error: 'Agent failed to produce a valid response', code: 'readiness_coach_error' },
          { status: 502 }
        );
      }
      throw err;
    }

    return NextResponse.json({
      data: {
        sessionId,
        summary: result.output.summary,
        why_it_matters: result.output.whyItMatters,
        recommended_drills: result.output.recommendedDrills,
        evidence_quotes: result.output.evidenceQuotes,
        actionIds: result.actionIds,
      },
    });
  } catch (err) {
    console.error('POST /api/agent/readiness-coach error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
