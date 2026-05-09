import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyBearerToken } from '@/lib/security';
import { createServiceClient } from '@/lib/supabase/server';
import { runIdeaTriage } from '@/server/agents/company/ceo-idea-triage';

export const maxDuration = 300;

const IdeaSchema = z.object({
  text: z.string().min(1).max(8000),
  source: z.enum(['cli', 'chat']).default('cli'),
  context: z
    .object({
      cwd: z.string().max(500).optional(),
      branch: z.string().max(200).optional(),
      lastCommitSubject: z.string().max(500).optional(),
      lastCommitSha: z.string().max(64).optional(),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  const secret = process.env.CEO_BRIDGE_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: 'CEO bridge not configured (CEO_BRIDGE_SECRET missing)' },
      { status: 503 }
    );
  }

  const auth = request.headers.get('authorization');
  if (!verifyBearerToken(auth, secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ceoUserId = process.env.CEO_USER_ID;
  if (!ceoUserId) {
    return NextResponse.json(
      { error: 'CEO bridge not configured (CEO_USER_ID missing)' },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = IdeaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { text, source, context } = parsed.data;
  const service = await createServiceClient();

  // 1. Open a triage session (orchestrator agent, tagged ceo_cli).
  const sessionTitle = text.slice(0, 80);
  const { data: session, error: sessionError } = await service
    .from('company_agent_sessions')
    .insert({
      user_id: ceoUserId,
      agent_kind: 'ceo_orchestrator',
      title: sessionTitle,
      status: 'active',
      last_message_at: new Date().toISOString(),
      triggered_by: source === 'cli' ? 'ceo_cli' : 'ceo_chat',
    })
    .select('id')
    .single();

  if (sessionError || !session) {
    console.error('[/api/ceo/idea] session insert failed:', sessionError);
    return NextResponse.json({ error: 'Failed to open triage session' }, { status: 500 });
  }

  // 2. Persist the raw idea row so we keep an unfiltered audit trail
  //    independent of the agent's interpretation.
  const { data: idea, error: ideaError } = await service
    .from('ceo_ideas')
    .insert({
      user_id: ceoUserId,
      source,
      raw_text: text,
      context_json: context ?? null,
      status: 'triaging',
      triage_session_id: session.id,
    })
    .select('id')
    .single();

  if (ideaError || !idea) {
    console.error('[/api/ceo/idea] idea insert failed:', ideaError);
    return NextResponse.json({ error: 'Failed to record idea' }, { status: 500 });
  }

  // 3. Fire-and-forget triage. The orchestrator persists messages & actions
  //    to the DB itself; the browser hydrates the session via existing routes.
  //    We do NOT await — CLI gets a snappy response and the browser polls.
  void runIdeaTriage({
    supabase: service,
    serviceClient: service,
    userId: ceoUserId,
    ideaId: idea.id,
    sessionId: session.id,
    rawText: text,
    context: context ?? null,
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return NextResponse.json({
    ideaId: idea.id,
    sessionId: session.id,
    viewUrl: `${baseUrl}/admin/command-center/ideas/${idea.id}`,
  });
}
