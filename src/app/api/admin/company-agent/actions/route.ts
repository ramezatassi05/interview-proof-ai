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
    const requiresApprovalParam = request.nextUrl.searchParams.get('requiresApproval');
    const cursor = request.nextUrl.searchParams.get('cursor');
    const qRaw = request.nextUrl.searchParams.get('q');

    const PAGE_LIMIT = 40;
    const DEFAULT_LIMIT = 80;
    const limit = cursor ? PAGE_LIMIT : DEFAULT_LIMIT;

    let query = auth.supabase
      .from('company_agent_actions')
      .select()
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) query = query.eq('status', status);
    if (agentKindParam && (COMPANY_AGENT_KINDS as readonly string[]).includes(agentKindParam)) {
      query = query.eq('agent_kind', agentKindParam);
    }
    if (triggeredByParam && ['user', 'cron', 'agent'].includes(triggeredByParam)) {
      query = query.eq('triggered_by', triggeredByParam);
    }
    if (requiresApprovalParam === 'true' || requiresApprovalParam === 'false') {
      query = query.eq('requires_approval', requiresApprovalParam === 'true');
    }
    if (cursor && /^\d{4}-\d{2}-\d{2}T/.test(cursor)) {
      query = query.lt('created_at', cursor);
    }
    if (qRaw) {
      const q = qRaw.slice(0, 80).replace(/[%,()]/g, '');
      if (q.length > 0) {
        query = query.or(`title.ilike.%${q}%,rationale.ilike.%${q}%`);
      }
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: 'Failed to load actions' }, { status: 500 });
    }

    const rows = (data ?? []) as CompanyAgentActionRow[];
    const nextCursor = rows.length === limit ? rows[rows.length - 1]?.created_at ?? null : null;

    return NextResponse.json({
      data: rows.map((row) => publicCompanyAction(row)),
      nextCursor,
    });
  } catch (err) {
    console.error('GET /api/admin/company-agent/actions error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
