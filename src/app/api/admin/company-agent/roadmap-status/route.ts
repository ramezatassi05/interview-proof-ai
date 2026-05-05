import { NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/admin';
import { loadRoadmapStatus } from '@/server/agents/company/roadmap/loader';

export async function GET() {
  try {
    const auth = await requireAdminUser();
    if (!auth.ok) return auth.response;

    const status = await loadRoadmapStatus();
    return NextResponse.json({ data: status });
  } catch (err) {
    console.error('GET /api/admin/company-agent/roadmap-status error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
