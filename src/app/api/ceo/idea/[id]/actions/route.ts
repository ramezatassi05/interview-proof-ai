import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/admin';
import { publicCompanyAction } from '@/server/agents/company/types';
import type { CompanyAgentActionRow } from '@/server/agents/company/types';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminUser();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;

  // Resolve idea -> session, then list actions on that session.
  const { data: idea } = await auth.supabase
    .from('ceo_ideas')
    .select('id,user_id,triage_session_id')
    .eq('id', id)
    .eq('user_id', auth.user.id)
    .single();

  if (!idea || !idea.triage_session_id) {
    return NextResponse.json({ actions: [] });
  }

  const { data: rows } = await auth.supabase
    .from('company_agent_actions')
    .select()
    .eq('session_id', idea.triage_session_id)
    .order('created_at', { ascending: true });

  const actions = ((rows as CompanyAgentActionRow[] | null) ?? []).map(publicCompanyAction);
  return NextResponse.json({ actions });
}
