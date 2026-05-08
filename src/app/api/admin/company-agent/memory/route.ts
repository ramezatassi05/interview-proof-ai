import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminUser } from '@/lib/admin';
import { COMPANY_AGENT_KINDS } from '@/server/agents/company/types';

const AgentKindSchema = z.enum(COMPANY_AGENT_KINDS);

interface MemoryRow {
  id: string;
  topic: string | null;
  key: string;
  summary: string | null;
  body: string | null;
  value_json: unknown;
  source: string;
  created_at: string;
  updated_at: string;
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminUser();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const agentKindRaw = searchParams.get('agentKind');
  const parsed = AgentKindSchema.safeParse(agentKindRaw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Missing or invalid agentKind' }, { status: 400 });
  }

  const { data, error } = await auth.supabase
    .from('company_agent_memory')
    .select('id,topic,key,summary,body,value_json,source,created_at,updated_at')
    .eq('user_id', auth.user.id)
    .eq('agent_kind', parsed.data)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('[company-agent/memory GET] error:', error);
    return NextResponse.json({ error: 'Failed to load memory' }, { status: 500 });
  }

  return NextResponse.json({ data: (data as MemoryRow[] | null) ?? [] });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdminUser();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const agentKindRaw = searchParams.get('agentKind');
  const key = searchParams.get('key');
  const parsed = AgentKindSchema.safeParse(agentKindRaw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Missing or invalid agentKind' }, { status: 400 });
  }
  if (!key) {
    return NextResponse.json({ error: 'Missing key' }, { status: 400 });
  }

  const { error } = await auth.supabase
    .from('company_agent_memory')
    .delete()
    .eq('user_id', auth.user.id)
    .eq('agent_kind', parsed.data)
    .eq('key', key);

  if (error) {
    console.error('[company-agent/memory DELETE] error:', error);
    return NextResponse.json({ error: 'Failed to delete memory' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
