import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/admin';
import { COMPANY_AGENT_KINDS, publicCompanyAction } from '@/server/agents/company/types';
import type { CompanyAgentActionRow } from '@/server/agents/company/types';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminUser();
    if (!auth.ok) return auth.response;

    const status = request.nextUrl.searchParams.get('status');
    const agentKindParam = request.nextUrl.searchParams.get('agentKind');
    const triggeredByParam = request.nextUrl.searchParams.get('triggeredBy');

    let query = auth.supabase
      .from('company_agent_actions')
      .select()
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false })
      .limit(80);

    if (status) query = query.eq('status', status);
    if (agentKindParam && (COMPANY_AGENT_KINDS as readonly string[]).includes(agentKindParam)) {
      query = query.eq('agent_kind', agentKindParam);
    }
    if (triggeredByParam && ['user', 'cron', 'agent'].includes(triggeredByParam)) {
      query = query.eq('triggered_by', triggeredByParam);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: 'Failed to load actions' }, { status: 500 });
    }

    return NextResponse.json({
      data: (data ?? []).map((row) => publicCompanyAction(row as CompanyAgentActionRow)),
    });
  } catch (err) {
    console.error('GET /api/admin/company-agent/actions error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
