import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/admin';

interface CeoIdeaRow {
  id: string;
  raw_text: string;
  source: 'cli' | 'chat';
  status: 'triaging' | 'routed' | 'completed' | 'failed';
  triage_session_id: string | null;
  spawned_action_ids: string[] | null;
  error: string | null;
  created_at: string;
}

export async function GET(_request: NextRequest) {
  const auth = await requireAdminUser();
  if (!auth.ok) return auth.response;

  const { data, error } = await auth.supabase
    .from('ceo_ideas')
    .select('id,raw_text,source,status,triage_session_id,spawned_action_ids,error,created_at')
    .order('created_at', { ascending: false })
    .limit(80);

  if (error) {
    console.error('[/api/ceo/ideas] load failed:', error);
    return NextResponse.json({ error: 'Failed to load ideas' }, { status: 500 });
  }

  const rows = (data ?? []) as CeoIdeaRow[];
  return NextResponse.json({
    ideas: rows.map((r) => ({
      id: r.id,
      rawText: r.raw_text,
      source: r.source,
      status: r.status,
      triageSessionId: r.triage_session_id,
      spawnedActionCount: (r.spawned_action_ids ?? []).length,
      error: r.error,
      createdAt: r.created_at,
    })),
  });
}
