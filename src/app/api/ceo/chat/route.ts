import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdminUser } from '@/lib/admin';
import { getAnthropicClient, CLAUDE_MODELS } from '@/lib/anthropic';
import { loadCeoContext } from '@/server/agents/company/ceo-context';
import { COMPANY_AGENT_DISPLAY } from '@/server/agents/company/org';
import type { CompanyAgentKind } from '@/server/agents/company/types';

export const maxDuration = 60;

const ChatSchema = z.object({
  message: z.string().min(1).max(2000),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().max(4000),
      }),
    )
    .max(8)
    .optional(),
});

const NAVIGATE_PROTOCOL = `When your answer references a specific tab or item in the room, end your response with EXACTLY ONE line of the form:
<navigate>{"tab":"dashboard|inbox|ideas|audit","highlight":{"kind":"action|task","id":"<uuid>"}|null,"label":"<short button text, max 28 chars>"}</navigate>
If no jump applies, omit the tag entirely. Never emit more than one <navigate> tag.`;

function truncate(s: string | null | undefined, n: number): string {
  if (!s) return '';
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

interface OpenTaskRow {
  id: string;
  title: string;
  status: string;
  owner_kind: CompanyAgentKind;
  updated_at: string;
}

interface RecentActionRow {
  id: string;
  title: string | null;
  status: string;
  agent_kind: CompanyAgentKind;
  created_at: string;
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminUser();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = ChatSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { message, history = [] } = parsed.data;
  const { supabase, user } = auth;
  const userId = user.id;

  const last24hIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [ceoCtxRes, openTasksRes, recentActionsRes, pendingActionsRes] = await Promise.all([
    loadCeoContext({ supabase, userId }),
    supabase
      .from('company_tasks')
      .select('id,title,status,owner_kind,updated_at')
      .eq('user_id', userId)
      .neq('status', 'completed')
      .neq('status', 'canceled')
      .order('updated_at', { ascending: false })
      .limit(40),
    supabase
      .from('company_agent_actions')
      .select('id,title,status,agent_kind,created_at')
      .eq('user_id', userId)
      .gte('created_at', last24hIso)
      .order('created_at', { ascending: false })
      .limit(40),
    supabase
      .from('company_agent_actions')
      .select('id,title,agent_kind')
      .eq('user_id', userId)
      .eq('status', 'awaiting_approval')
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  const openTasks = (openTasksRes.data ?? []) as OpenTaskRow[];
  const recentActions = (recentActionsRes.data ?? []) as RecentActionRow[];
  const pendingActions = (pendingActionsRes.data ?? []) as Pick<
    RecentActionRow,
    'id' | 'title' | 'agent_kind'
  >[];

  const openTasksLines = openTasks.length
    ? openTasks
        .map(
          (t) =>
            `- [${COMPANY_AGENT_DISPLAY[t.owner_kind] ?? t.owner_kind}] (${t.status}) ${truncate(t.title, 80)} · id=${t.id} · updated=${t.updated_at}`,
        )
        .join('\n')
    : '(no open tasks)';

  const recentActionsLines = recentActions.length
    ? recentActions
        .map(
          (a) =>
            `- [${COMPANY_AGENT_DISPLAY[a.agent_kind] ?? a.agent_kind}] (${a.status}) ${truncate(a.title, 80)} · id=${a.id} · at=${a.created_at}`,
        )
        .join('\n')
    : '(no agent activity in the last 24h)';

  const pendingLines = pendingActions.length
    ? pendingActions
        .map(
          (a) =>
            `- [${COMPANY_AGENT_DISPLAY[a.agent_kind] ?? a.agent_kind}] ${truncate(a.title, 80)} · id=${a.id}`,
        )
        .join('\n')
    : '(nothing awaiting your approval)';

  const systemPrompt = [
    "You are the InterviewProof CEO Command Center concierge. The CEO (Ramez) is asking you a question from the dashboard hero. Your job is read-and-route: synthesize the data below and tell the CEO what's happening, then point them at the right place.",
    '',
    'Style:',
    '- Plain, direct, no preamble. 1–4 sentences for most answers.',
    '- Cite specific titles/owners when you can. Use the data — do not invent.',
    '- If the user asks about a task or topic and you cannot find it, say so plainly in one sentence.',
    "- For daily summaries, focus on what changed in the last 24h (drafts, approvals, failures), not 7-day rollups unless asked.",
    "- Never offer to take an action — you cannot create tasks, approve actions, or write anywhere. If the CEO asks for that, say 'use /idea or the Inbox tab.'",
    '',
    "Today: " + new Date().toUTCString(),
    '',
    '=== CEO context ===',
    ceoCtxRes.summary,
    '',
    '=== Open tasks (max 40, most recently updated first) ===',
    openTasksLines,
    '',
    '=== Agent activity (last 24h, max 40) ===',
    recentActionsLines,
    '',
    '=== Pending your approval ===',
    pendingLines,
    '',
    '=== Deep-link protocol ===',
    NAVIGATE_PROTOCOL,
  ].join('\n');

  const messages = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user' as const, content: message },
  ];

  const client = getAnthropicClient();
  const stream = client.messages.stream({
    model: CLAUDE_MODELS.reasoning,
    max_tokens: 1024,
    system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
    messages,
  });

  const encoder = new TextEncoder();
  const body$ = new ReadableStream<Uint8Array>({
    start(controller) {
      stream.on('text', (delta) => {
        controller.enqueue(encoder.encode(delta));
      });
      stream
        .finalMessage()
        .then(() => controller.close())
        .catch((err) => {
          console.error('[/api/ceo/chat] stream failed:', err);
          try {
            controller.enqueue(encoder.encode('\n\n[error: stream ended unexpectedly]'));
          } catch {
            /* controller already closed */
          }
          controller.close();
        });
    },
    cancel() {
      stream.controller?.abort();
    },
  });

  return new Response(body$, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Accel-Buffering': 'no',
    },
  });
}
