/**
 * GET /api/cron/company-agent/[role]
 *
 * Autonomous trigger for a single company-agent role. Each director and the
 * executive assistant run on their own schedule (configured in vercel.json).
 * The route creates a fresh session with triggered_by='cron' and asks the
 * agent to review its domain and propose actions.
 *
 * Auth: Authorization: Bearer ${CRON_SECRET}.
 * Owner: COMPANY_AGENT_OWNER_USER_ID — the operator UUID under which all
 * cron-initiated sessions and proposed actions are filed.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { verifyCronSecret } from '@/lib/security';
import { runCompanyAgent } from '@/server/agents/company/company-agent-runner';
import { loadCompanyMetrics } from '@/server/agents/company/company-metrics';
import { loadDirectorContext } from '@/server/agents/company/director-context';
import { COMPANY_AGENT_KINDS, type CompanyAgentKind } from '@/server/agents/company/types';

export const maxDuration = 300;

const CRON_AGENT_KINDS = COMPANY_AGENT_KINDS.filter((k) => k !== 'ceo_orchestrator');

const SELF_PROMPTS: Record<Exclude<CompanyAgentKind, 'ceo_orchestrator'>, string> = {
  executive_assistant:
    'Daily morning brief. Review pending approvals, recent actions, and open tasks. Propose 1–3 follow-ups the operator should handle today.',
  director_marketing:
    'Weekly review. Inspect last 7 days of signups, reports, and unlock rate. Propose 1–3 highest-leverage growth actions, each with clear evidence.',
  director_engineering:
    'Weekly review. Inspect last 7 days of audit failures, recent migrations, and shipped engineering proposals. Propose 1–3 actions to reduce risk or accelerate shipping velocity.',
  director_finance:
    'End-of-week financial review. Inspect last 30 days of credit purchases, paying users, unlock rate, and runway. Propose 1–3 actions: pricing tweak, retention investment, or burn cut.',
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ role: string }> }) {
  const unauthorized = verifyCronSecret(request.headers.get('authorization'));
  if (unauthorized) return unauthorized;

  const { role } = await params;
  if (!(CRON_AGENT_KINDS as readonly string[]).includes(role)) {
    return NextResponse.json(
      {
        error: `Invalid role "${role}". Allowed: ${CRON_AGENT_KINDS.join(', ')}`,
      },
      { status: 400 }
    );
  }
  const agentKind = role as Exclude<CompanyAgentKind, 'ceo_orchestrator'>;

  const ownerUserId = process.env.COMPANY_AGENT_OWNER_USER_ID;
  if (!ownerUserId) {
    return NextResponse.json(
      { error: 'COMPANY_AGENT_OWNER_USER_ID is not configured' },
      { status: 500 }
    );
  }

  const supabase = await createServiceClient();

  const todayLabel = new Date().toISOString().slice(0, 10);
  const { data: sessionData, error: sessionError } = await supabase
    .from('company_agent_sessions')
    .insert({
      user_id: ownerUserId,
      agent_kind: agentKind,
      title: `Scheduled ${agentKind} check-in ${todayLabel}`,
      status: 'active',
      last_message_at: new Date().toISOString(),
      triggered_by: 'cron',
    })
    .select('id')
    .single();

  if (sessionError || !sessionData) {
    console.error('[cron company-agent] session create error:', sessionError);
    return NextResponse.json({ error: 'Failed to create cron session' }, { status: 500 });
  }
  const sessionId = (sessionData as { id: string }).id;

  try {
    const [metrics, directorContext] = await Promise.all([
      loadCompanyMetrics({ supabase, userId: ownerUserId }),
      loadDirectorContext({ supabase, userId: ownerUserId, kind: agentKind }),
    ]);

    const result = await runCompanyAgent({
      userId: ownerUserId,
      sessionId,
      agentKind,
      message: SELF_PROMPTS[agentKind],
      supabase,
      metrics,
      directorContext,
      triggeredBy: 'cron',
    });

    return NextResponse.json({
      data: {
        sessionId,
        agentKind,
        actionsProposed: result.actionIds.length,
        usage: { tokensIn: result.tokensIn, tokensOut: result.tokensOut },
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown cron error';
    console.error('[cron company-agent] run error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
