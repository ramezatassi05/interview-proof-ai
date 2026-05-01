/**
 * POST /api/agent/application-materials
 *
 * M7.10 Application Materials Agent. Two modes:
 *  - 'bullet'        → drafts a `rewrite_resume_bullet` action.
 *  - 'cover_letter'  → drafts a `draft_recruiter_reply` action.
 *
 * Both produce user-facing copy and are external-send.
 *
 * Auth: requires Supabase user. Cross-user reports return 404.
 * Rate limit: 30/hr per user.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import {
  runApplicationMaterials,
  ApplicationMaterialsError,
} from '@/server/agents/application-materials';
import { AgentContextNotFoundError } from '@/server/agents/context-loader';
import { rowToAgentSession } from '@/lib/agent/types';
import type { AgentSessionRow } from '@/lib/agent/types';
import { recordAuditEvent } from '@/lib/agent/audit';

const BodySchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('bullet'),
    reportId: z.string().uuid(),
    originalBullet: z.string().min(1).max(2000),
    targetRequirement: z.string().max(800).optional(),
  }),
  z.object({
    mode: z.literal('cover_letter'),
    reportId: z.string().uuid(),
    applicationPrompt: z.string().max(2000).optional(),
    paragraphsTarget: z.number().int().min(1).max(5).optional(),
  }),
]);

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

    const { reportId } = parsed.data;

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
      prefix: 'agent:application-materials',
      identifier: user.id,
      maxRequests: 30,
      windowSeconds: 3600,
    });
    if (!allowed) {
      await recordAuditEvent({
        userId: user.id,
        eventType: 'rate_limited',
        agentKind: 'application_materials',
        metadata: {
          prefix: 'agent:application-materials',
          retry_after_seconds: 3600,
        },
      });
      return rateLimitResponse(3600);
    }

    const { data: newSession, error: createErr } = await supabase
      .from('agent_sessions')
      .insert({
        user_id: user.id,
        agent_kind: 'application_materials',
        report_id: reportId,
      })
      .select()
      .single();
    if (createErr || !newSession) {
      console.error('[application-materials] Failed to create session:', createErr);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }
    const sessionId = rowToAgentSession(newSession as AgentSessionRow).id;

    let result;
    try {
      if (parsed.data.mode === 'bullet') {
        result = await runApplicationMaterials({
          mode: 'bullet',
          userId: user.id,
          sessionId,
          reportId,
          supabase,
          originalBullet: parsed.data.originalBullet,
          targetRequirement: parsed.data.targetRequirement,
        });
      } else {
        result = await runApplicationMaterials({
          mode: 'cover_letter',
          userId: user.id,
          sessionId,
          reportId,
          supabase,
          applicationPrompt: parsed.data.applicationPrompt,
          paragraphsTarget: parsed.data.paragraphsTarget,
        });
      }
    } catch (err) {
      if (err instanceof AgentContextNotFoundError) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 });
      }
      if (err instanceof ApplicationMaterialsError) {
        console.error('[application-materials] Agent error:', err.message, err.cause);
        return NextResponse.json(
          {
            error: 'Agent failed to produce a valid response',
            code: 'application_materials_error',
          },
          { status: 502 }
        );
      }
      throw err;
    }

    return NextResponse.json({
      data: {
        sessionId,
        actionId: result.actionId,
        mode: result.mode,
        output: result.output,
      },
    });
  } catch (err) {
    console.error('POST /api/agent/application-materials error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
