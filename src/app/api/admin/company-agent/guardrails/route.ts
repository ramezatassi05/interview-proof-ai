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
import { checkSpendCeiling } from '@/server/agents/company/guardrails-spend';

function isValidKind(value: string | null | undefined): value is CompanyAgentKind {
  return !!value && (COMPANY_AGENT_KINDS as readonly string[]).includes(value);
}

function isValidTier(value: unknown): value is GuardrailTier {
  return typeof value === 'string' && (GUARDRAIL_TIERS as readonly string[]).includes(value);
}

function isValidCap(value: unknown): value is number | null {
  if (value === null) return true;
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100_000;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminUser();
    if (!auth.ok) return auth.response;

    const agentKind = request.nextUrl.searchParams.get('agentKind');
    if (!isValidKind(agentKind)) {
      return NextResponse.json({ error: 'Invalid agentKind' }, { status: 400 });
    }

    const [tier, rateLimit, spend] = await Promise.all([
      loadGuardrailTier(auth.supabase, auth.user.id, agentKind),
      checkAutoExecuteRateLimit(auth.supabase, auth.user.id, agentKind),
      checkSpendCeiling(auth.supabase, auth.user.id, agentKind),
    ]);

    return NextResponse.json({ data: { agentKind, tier, rateLimit, spend } });
  } catch (err) {
    console.error('GET /api/admin/company-agent/guardrails error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

interface PutBody {
  agentKind?: string;
  tier?: string;
  monthlySpendCapUsd?: number | null;
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdminUser();
    if (!auth.ok) return auth.response;

    const body = (await request.json().catch(() => null)) as PutBody | null;
    if (!body || !isValidKind(body.agentKind)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const update: Record<string, unknown> = {
      user_id: auth.user.id,
      agent_kind: body.agentKind,
    };

    if (body.tier !== undefined) {
      if (!isValidTier(body.tier)) {
        return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
      }
      update.tier = body.tier;
    }

    if (body.monthlySpendCapUsd !== undefined) {
      if (!isValidCap(body.monthlySpendCapUsd)) {
        return NextResponse.json({ error: 'Invalid monthlySpendCapUsd' }, { status: 400 });
      }
      update.monthly_spend_cap_usd = body.monthlySpendCapUsd;
      // Lifting (or removing) the cap clears any active pause so the agent
      // can resume on the next message instead of waiting for the monthly cron.
      update.spend_paused_until = null;
    }

    if (update.tier === undefined && update.monthly_spend_cap_usd === undefined) {
      return NextResponse.json({ error: 'No changes specified' }, { status: 400 });
    }

    const { error } = await auth.supabase
      .from('company_agent_guardrails')
      .upsert(update, { onConflict: 'user_id,agent_kind' });
    if (error) {
      console.error('upsert guardrails failed:', error);
      return NextResponse.json({ error: 'Failed to save guardrail' }, { status: 500 });
    }

    return NextResponse.json({ data: { agentKind: body.agentKind, tier: body.tier ?? null } });
  } catch (err) {
    console.error('PUT /api/admin/company-agent/guardrails error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
