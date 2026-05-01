/**
 * POST /api/agent/orchestrator
 *
 * M6 entrypoint for the Prep Orchestrator Agent. Accepts an optional user
 * message + reportId, optionally creates a new orchestrator session if one
 * was not provided, runs the orchestrator, and returns the structured
 * response plus the IDs of the drafted actions the user can later approve.
 *
 * Auth: requires Supabase user. Cross-user reports return 404.
 * Rate limit: 30/hr per user (LLM calls are expensive).
 * Failure modes:
 *   - 400 invalid body
 *   - 404 unknown report
 *   - 429 rate limited
 *   - 502 LLM-side failure (parse / schema / network)
 *   - 500 unexpected server error
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { runPrepOrchestrator, OrchestratorError } from '@/server/agents/prep-orchestrator';
import { AgentContextNotFoundError } from '@/server/agents/context-loader';
import { rowToAgentSession } from '@/lib/agent/types';
import type { AgentSessionRow } from '@/lib/agent/types';
import { recordAuditEvent } from '@/lib/agent/audit';

const BodySchema = z.object({
  reportId: z.string().uuid(),
  sessionId: z.string().uuid().optional(),
  userMessage: z.string().max(4000).optional(),
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

    const { reportId, sessionId: providedSessionId, userMessage } = parsed.data;

    // Verify report ownership before doing any expensive work
    const { data: report } = await supabase
      .from('reports')
      .select('id')
      .eq('id', reportId)
      .eq('user_id', user.id)
      .single();
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Rate limit AFTER cheap auth/ownership checks
    const allowed = await checkRateLimit({
      prefix: 'agent:orchestrator',
      identifier: user.id,
      maxRequests: 30,
      windowSeconds: 3600,
    });
    if (!allowed) {
      await recordAuditEvent({
        userId: user.id,
        eventType: 'rate_limited',
        agentKind: 'orchestrator',
        metadata: { prefix: 'agent:orchestrator', retry_after_seconds: 3600 },
      });
      return rateLimitResponse(3600);
    }

    // Verify or create session
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
          agent_kind: 'orchestrator',
          report_id: reportId,
        })
        .select()
        .single();
      if (createErr || !newSession) {
        console.error('[orchestrator] Failed to create session:', createErr);
        return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
      }
      sessionId = rowToAgentSession(newSession as AgentSessionRow).id;
    }

    // Run the orchestrator
    let result;
    try {
      result = await runPrepOrchestrator({
        userId: user.id,
        reportId,
        sessionId,
        supabase,
        userMessage,
      });
    } catch (err) {
      if (err instanceof AgentContextNotFoundError) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 });
      }
      if (err instanceof OrchestratorError) {
        console.error('[orchestrator] Orchestrator error:', err.message, err.cause);
        return NextResponse.json(
          { error: 'Agent failed to produce a valid response', code: 'orchestrator_error' },
          { status: 502 }
        );
      }
      throw err;
    }

    return NextResponse.json({
      data: {
        sessionId,
        summary: result.output.summary,
        nextAction: result.output.nextAction,
        supportingActions: result.output.supportingActions,
        evidenceRefs: result.output.evidenceRefs,
        actionIds: result.actionIds,
      },
    });
  } catch (err) {
    console.error('POST /api/agent/orchestrator error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
