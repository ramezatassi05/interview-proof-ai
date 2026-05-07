import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/admin';
import { COMPANY_AGENT_KINDS } from '@/server/agents/company/types';
import {
  GUARDRAIL_TIERS,
  type GuardrailTier,
  type CompanyAgentKind,
} from '@/server/agents/company/types';
import {
  loadGuardrailTier,
  checkAutoExecuteRateLimit,
} from '@/server/agents/company/guardrails';

function isValidKind(value: string | null | undefined): value is CompanyAgentKind {
  return !!value && (COMPANY_AGENT_KINDS as readonly string[]).includes(value);
}

function isValidTier(value: unknown): value is GuardrailTier {
  return typeof value === 'string' && (GUARDRAIL_TIERS as readonly string[]).includes(value);
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminUser();
    if (!auth.ok) return auth.response;

    const agentKind = request.nextUrl.searchParams.get('agentKind');
    if (!isValidKind(agentKind)) {
      return NextResponse.json({ error: 'Invalid agentKind' }, { status: 400 });
    }

    const [tier, rateLimit] = await Promise.all([
      loadGuardrailTier(auth.supabase, auth.user.id, agentKind),
      checkAutoExecuteRateLimit(auth.supabase, auth.user.id, agentKind),
    ]);

    return NextResponse.json({ data: { agentKind, tier, rateLimit } });
  } catch (err) {
    console.error('GET /api/admin/company-agent/guardrails error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdminUser();
    if (!auth.ok) return auth.response;

    const body = (await request.json().catch(() => null)) as
      | { agentKind?: string; tier?: string }
      | null;
    if (!body || !isValidKind(body.agentKind) || !isValidTier(body.tier)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { error } = await auth.supabase
      .from('company_agent_guardrails')
      .upsert(
        {
          user_id: auth.user.id,
          agent_kind: body.agentKind,
          tier: body.tier,
        },
        { onConflict: 'user_id,agent_kind' }
      );
    if (error) {
      console.error('upsert guardrails failed:', error);
      return NextResponse.json({ error: 'Failed to save guardrail' }, { status: 500 });
    }

    return NextResponse.json({ data: { agentKind: body.agentKind, tier: body.tier } });
  } catch (err) {
    console.error('PUT /api/admin/company-agent/guardrails error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
