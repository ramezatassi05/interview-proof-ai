import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { requireAdminUser } from '@/lib/admin';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { runCeoOrchestrator } from '@/server/agents/company/ceo-orchestrator';
import { COMPANY_AGENT_KINDS, publicCompanyAction } from '@/server/agents/company/types';
import type { CompanyAgentActionRow, CompanyAgentSessionRow } from '@/server/agents/company/types';

const MessageSchema = z.object({
  message: z.string().min(1).max(4000),
  sessionId: z.string().uuid().optional(),
  agentKind: z.enum(COMPANY_AGENT_KINDS).optional(),
});

async function createSession(args: {
  supabase: SupabaseClient;
  userId: string;
  title: string;
  agentKind: CompanyAgentSessionRow['agent_kind'];
  triggeredBy: CompanyAgentSessionRow['triggered_by'];
}) {
  const { data, error } = await args.supabase
    .from('company_agent_sessions')
    .insert({
      user_id: args.userId,
      agent_kind: args.agentKind,
      title: args.title,
      status: 'active',
      last_message_at: new Date().toISOString(),
      triggered_by: args.triggeredBy,
    })
    .select()
    .single();

  if (error || !data) throw error ?? new Error('Failed to create session');
  return data as CompanyAgentSessionRow;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminUser();
    if (!auth.ok) return auth.response;

    const allowed = await checkRateLimit({
      prefix: 'company_agent_message',
      identifier: `user:${auth.user.id}`,
      maxRequests: 40,
      windowSeconds: 3600,
    });
    if (!allowed) return rateLimitResponse(3600);

    const body = await request.json();
    const parsed = MessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    let session: CompanyAgentSessionRow;
    if (parsed.data.sessionId) {
      const { data } = await auth.supabase
        .from('company_agent_sessions')
        .select()
        .eq('id', parsed.data.sessionId)
        .eq('user_id', auth.user.id)
        .single();

      if (!data) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      session = data as CompanyAgentSessionRow;
    } else {
      session = await createSession({
        supabase: auth.supabase,
        userId: auth.user.id,
        title: parsed.data.message.slice(0, 80),
        agentKind: parsed.data.agentKind ?? 'executive_assistant',
        triggeredBy: 'user',
      });
    }

    const result = await runCeoOrchestrator({
      userId: auth.user.id,
      sessionId: session.id,
      message: parsed.data.message,
      requestedAgentKind: parsed.data.agentKind,
      triggeredBy: 'user',
      supabase: auth.supabase,
    });

    const actions =
      result.actionIds.length > 0
        ? await auth.supabase.from('company_agent_actions').select().in('id', result.actionIds)
        : { data: [], error: null };

    if (actions.error) {
      return NextResponse.json({ error: 'Failed to load proposed actions' }, { status: 500 });
    }

    return NextResponse.json({
      data: {
        sessionId: session.id,
        output: result.output,
        actions: (actions.data ?? []).map((row) =>
          publicCompanyAction(row as CompanyAgentActionRow)
        ),
        usage: { tokensIn: result.tokensIn, tokensOut: result.tokensOut },
      },
    });
  } catch (err) {
    const cause =
      err && typeof err === 'object' && 'cause' in err ? (err as { cause: unknown }).cause : null;
    console.error(
      'POST /api/admin/company-agent/message error:',
      err,
      cause ? `\n  cause: ${JSON.stringify(cause, null, 2)}` : ''
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
