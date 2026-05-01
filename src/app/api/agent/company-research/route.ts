/**
 * POST /api/agent/company-research
 *
 * M7.6 Company Research Agent. Produces a structured, interview-ready brief
 * about a target company. Cache-first via `company_research_cache`.
 *
 * Auth: requires Supabase user. If reportId is provided, cross-user reports return 404.
 * Rate limit: 30/hr per user.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { runCompanyResearch, CompanyResearchError } from '@/server/agents/company-research';
import { AgentContextNotFoundError } from '@/server/agents/context-loader';
import { rowToAgentSession } from '@/lib/agent/types';
import type { AgentSessionRow } from '@/lib/agent/types';
import { recordAuditEvent } from '@/lib/agent/audit';

const BodySchema = z.object({
  companyName: z.string().min(1).max(200),
  roleTitle: z.string().max(200).optional(),
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

    const { companyName, roleTitle, reportId } = parsed.data;

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
      prefix: 'agent:company-research',
      identifier: user.id,
      maxRequests: 30,
      windowSeconds: 3600,
    });
    if (!allowed) {
      await recordAuditEvent({
        userId: user.id,
        eventType: 'rate_limited',
        agentKind: 'company_research',
        metadata: { prefix: 'agent:company-research', retry_after_seconds: 3600 },
      });
      return rateLimitResponse(3600);
    }

    const { data: newSession, error: createErr } = await supabase
      .from('agent_sessions')
      .insert({
        user_id: user.id,
        agent_kind: 'company_research',
        report_id: reportId ?? null,
      })
      .select()
      .single();
    if (createErr || !newSession) {
      console.error('[company-research] Failed to create session:', createErr);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }
    const sessionId = rowToAgentSession(newSession as AgentSessionRow).id;

    let result;
    try {
      result = await runCompanyResearch({
        userId: user.id,
        sessionId,
        supabase,
        companyName,
        roleTitle,
        reportId,
      });
    } catch (err) {
      if (err instanceof AgentContextNotFoundError) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 });
      }
      if (err instanceof CompanyResearchError) {
        console.error('[company-research] Agent error:', err.message, err.cause);
        return NextResponse.json(
          { error: 'Agent failed to produce a valid response', code: 'company_research_error' },
          { status: 502 }
        );
      }
      throw err;
    }

    return NextResponse.json({
      data: {
        sessionId,
        actionId: result.actionId,
        cacheHit: result.cacheHit,
        research: result.output,
      },
    });
  } catch (err) {
    console.error('POST /api/agent/company-research error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
