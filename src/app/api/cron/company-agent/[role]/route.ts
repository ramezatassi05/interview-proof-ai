/**
 * GET /api/cron/company-agent/[role]
 *
 * Autonomous trigger for a single company-agent role. By default the command
 * center runs on-visit (see `maybeRunDueAgents`) — this route exists so an
 * operator can opt a specific agent back into vercel.json crons when they
 * want autonomous, schedule-driven runs.
 *
 * Auth: Authorization: Bearer ${CRON_SECRET}.
 * Owner: COMPANY_AGENT_OWNER_USER_ID — the operator UUID under which all
 * cron-initiated sessions and proposed actions are filed.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { verifyCronSecret } from '@/lib/security';
import {
  dispatchScheduledAgent,
  SCHEDULED_AGENT_KINDS,
  type ScheduledAgentKind,
} from '@/server/agents/company/dispatcher';

export const maxDuration = 300;

export async function GET(request: NextRequest, { params }: { params: Promise<{ role: string }> }) {
  const unauthorized = verifyCronSecret(request.headers.get('authorization'));
  if (unauthorized) return unauthorized;

  const { role } = await params;
  if (!(SCHEDULED_AGENT_KINDS as readonly string[]).includes(role)) {
    return NextResponse.json(
      {
        error: `Invalid role "${role}". Allowed: ${SCHEDULED_AGENT_KINDS.join(', ')}`,
      },
      { status: 400 }
    );
  }
  const agentKind = role as ScheduledAgentKind;

  const ownerUserId = process.env.COMPANY_AGENT_OWNER_USER_ID;
  if (!ownerUserId) {
    return NextResponse.json(
      { error: 'COMPANY_AGENT_OWNER_USER_ID is not configured' },
      { status: 500 }
    );
  }

  const supabase = await createServiceClient();

  try {
    const result = await dispatchScheduledAgent({
      supabase,
      ownerUserId,
      agentKind,
      triggeredBy: 'cron',
    });

    return NextResponse.json({
      data: {
        sessionId: result.sessionId,
        agentKind,
        actionsProposed: result.actionsProposed,
        usage: { tokensIn: result.tokensIn, tokensOut: result.tokensOut },
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown cron error';
    console.error('[cron company-agent] run error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
