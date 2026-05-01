/**
 * POST /api/agent/opportunity-tracker
 *
 * M7.8 Opportunity Tracker Agent. Reviews a single opportunity and proposes
 * concrete updates plus (optionally) a prep-plan patch.
 *
 * Auth: requires Supabase user. Cross-user opportunities/reports return 404.
 * Rate limit: 30/hr per user.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import {
  runOpportunityTracker,
  OpportunityTrackerError,
} from '@/server/agents/opportunity-tracker';
import { AgentContextNotFoundError } from '@/server/agents/context-loader';
import { rowToAgentSession } from '@/lib/agent/types';
import type { AgentSessionRow } from '@/lib/agent/types';
import { recordAuditEvent } from '@/lib/agent/audit';

const BodySchema = z.object({
  opportunityId: z.string().uuid(),
  reportId: z.string().uuid().optional(),
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

    const { opportunityId, reportId } = parsed.data;

    // Ownership: opportunity must belong to caller.
    const { data: opp } = await supabase
      .from('opportunities')
      .select('id')
      .eq('id', opportunityId)
      .eq('user_id', user.id)
      .single();
    if (!opp) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }

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

    const allowed = await checkRateLimit({
      prefix: 'agent:opportunity-tracker',
      identifier: user.id,
      maxRequests: 30,
      windowSeconds: 3600,
    });
    if (!allowed) {
      await recordAuditEvent({
        userId: user.id,
        eventType: 'rate_limited',
        agentKind: 'opportunity_tracker',
        metadata: { prefix: 'agent:opportunity-tracker', retry_after_seconds: 3600 },
      });
      return rateLimitResponse(3600);
    }

    const { data: newSession, error: createErr } = await supabase
      .from('agent_sessions')
      .insert({
        user_id: user.id,
        agent_kind: 'opportunity_tracker',
        report_id: reportId ?? null,
      })
      .select()
      .single();
    if (createErr || !newSession) {
      console.error('[opportunity-tracker] Failed to create session:', createErr);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }
    const sessionId = rowToAgentSession(newSession as AgentSessionRow).id;

    let result;
    try {
      result = await runOpportunityTracker({
        userId: user.id,
        sessionId,
        supabase,
        opportunityId,
        reportId,
      });
    } catch (err) {
      if (err instanceof AgentContextNotFoundError) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 });
      }
      if (err instanceof OpportunityTrackerError) {
        // "not found for user" surfaces as 404 to avoid leaking opportunity ids
        if (err.message.includes('not found for user')) {
          return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
        }
        console.error('[opportunity-tracker] Agent error:', err.message, err.cause);
        return NextResponse.json(
          { error: 'Agent failed to produce a valid response', code: 'opportunity_tracker_error' },
          { status: 502 }
        );
      }
      throw err;
    }

    return NextResponse.json({
      data: {
        sessionId,
        opportunityActionId: result.opportunityActionId,
        prepPlanActionId: result.prepPlanActionId,
        summary: result.output.summary,
        proposedChanges: result.output.proposedChanges,
        prepRecommendation: result.output.prepRecommendation,
        evidenceSignals: result.output.evidenceSignals,
      },
    });
  } catch (err) {
    console.error('POST /api/agent/opportunity-tracker error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
