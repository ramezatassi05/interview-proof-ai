import { NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/admin';
import { loadCompanyMetrics } from '@/server/agents/company/company-metrics';

export async function GET() {
  try {
    const auth = await requireAdminUser();
    if (!auth.ok) return auth.response;

    const metrics = await loadCompanyMetrics({
      supabase: auth.supabase,
      userId: auth.user.id,
    });

    return NextResponse.json({ data: metrics });
  } catch (err) {
    console.error('GET /api/admin/company-agent/metrics error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
