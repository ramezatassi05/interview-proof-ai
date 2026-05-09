import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/admin';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminUser();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const { data, error } = await auth.supabase
    .from('ceo_ideas')
    .select('id,status,error,spawned_action_ids,triage_session_id,updated_at')
    .eq('id', id)
    .eq('user_id', auth.user.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({
    id: data.id,
    status: data.status,
    error: data.error,
    spawnedActionIds: data.spawned_action_ids ?? [],
    triageSessionId: data.triage_session_id,
    updatedAt: data.updated_at,
  });
}
