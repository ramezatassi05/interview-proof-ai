/**
 * POST /api/agent/resume-evidence
 *
 * M7.5 Resume Evidence Agent. Generates 3 alternative resume-bullet
 * rewrites aligned with a specific JD requirement. Drafts a
 * rewrite_resume_bullet action with requires_external_send=true (the bullet
 * ends up in user-facing copy and requires explicit user approval).
 *
 * Auth: requires Supabase user. Cross-user reports return 404.
 * Rate limit: 30/hr per user.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { runResumeEvidence, ResumeEvidenceError } from '@/server/agents/resume-evidence';
import { AgentContextNotFoundError } from '@/server/agents/context-loader';
import { rowToAgentSession } from '@/lib/agent/types';
import type { AgentSessionRow } from '@/lib/agent/types';

export const maxDuration = 60;

const BodySchema = z.object({
  reportId: z.string().uuid(),
  originalBullet: z.string().min(1).max(2000),
  targetRequirement: z.string().min(1).max(2000),
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

    const { reportId, originalBullet, targetRequirement } = parsed.data;

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
      prefix: 'agent:resume-evidence',
      identifier: user.id,
      maxRequests: 30,
      windowSeconds: 3600,
    });
    if (!allowed) return rateLimitResponse(3600);

    const { data: newSession, error: createErr } = await supabase
      .from('agent_sessions')
      .insert({
        user_id: user.id,
        agent_kind: 'resume_evidence',
        report_id: reportId,
      })
      .select()
      .single();
    if (createErr || !newSession) {
      console.error('[resume-evidence] Failed to create session:', createErr);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }
    const sessionId = rowToAgentSession(newSession as AgentSessionRow).id;

    let result;
    try {
      result = await runResumeEvidence({
        userId: user.id,
        reportId,
        sessionId,
        supabase,
        originalBullet,
        targetRequirement,
      });
    } catch (err) {
      if (err instanceof AgentContextNotFoundError) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 });
      }
      if (err instanceof ResumeEvidenceError) {
        console.error('[resume-evidence] Agent error:', err.message, err.cause);
        return NextResponse.json(
          { error: 'Agent failed to produce a valid response', code: 'resume_evidence_error' },
          { status: 502 }
        );
      }
      throw err;
    }

    return NextResponse.json({
      data: {
        sessionId,
        alternatives: result.output.alternatives,
        critique_of_original: result.output.critiqueOfOriginal,
        actionId: result.actionId,
      },
    });
  } catch (err) {
    console.error('POST /api/agent/resume-evidence error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
