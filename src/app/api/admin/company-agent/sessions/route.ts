import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/admin';
import { COMPANY_AGENT_KINDS, publicCompanySession } from '@/server/agents/company/types';
import type { CompanyAgentKind, CompanyAgentSessionRow } from '@/server/agents/company/types';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminUser();
    if (!auth.ok) return auth.response;

    const agentKindParam = request.nextUrl.searchParams.get('agentKind');
    const agentKind =
      agentKindParam && (COMPANY_AGENT_KINDS as readonly string[]).includes(agentKindParam)
        ? (agentKindParam as CompanyAgentKind)
        : null;

    let query = auth.supabase
      .from('company_agent_sessions')
      .select()
      .eq('user_id', auth.user.id)
      .is('archived_at', null)
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .limit(30);

    if (agentKind) query = query.eq('agent_kind', agentKind);

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: 'Failed to load sessions' }, { status: 500 });
    }

    return NextResponse.json({
      data: (data ?? []).map((row) => publicCompanySession(row as CompanyAgentSessionRow)),
    });
  } catch (err) {
    console.error('GET /api/admin/company-agent/sessions error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
