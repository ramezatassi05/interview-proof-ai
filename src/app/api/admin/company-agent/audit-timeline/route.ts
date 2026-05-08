import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/admin';
import { COMPANY_AGENT_KINDS } from '@/server/agents/company/types';
import type { CompanyAgentKind } from '@/server/agents/company/types';

export type AuditEventKind =
  | 'action_drafted'
  | 'action_approved'
  | 'action_rejected'
  | 'action_completed'
  | 'action_failed'
  | 'decision_recorded'
  | 'task_created';

export interface AuditEvent {
  id: string;
  occurredAt: string;
  agentKind: CompanyAgentKind | null;
  kind: AuditEventKind;
  title: string;
  summary: string | null;
  refType: 'action' | 'decision' | 'task';
  refId: string;
  meta: Record<string, unknown>;
}

interface ActionRow {
  id: string;
  agent_kind: string;
  action_type: string;
  title: string;
  rationale: string | null;
  status: string;
  priority: string;
  triggered_by: string | null;
  created_at: string;
  approved_at: string | null;
  completed_at: string | null;
  error: string | null;
}

interface DecisionRow {
  id: string;
  title: string;
  decision_text: string | null;
  decided_at: string;
  source_action_id: string | null;
}

interface TaskRow {
  id: string;
  title: string;
  owner_kind: string | null;
  status: string;
  created_at: string;
  source_action_id: string | null;
  requester_kind: string | null;
}

const PAGE_LIMIT = 50;

function parseDateParam(value: string | null): string | null {
  if (!value) return null;
  return /^\d{4}-\d{2}-\d{2}T/.test(value) ? value : null;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminUser();
    if (!auth.ok) return auth.response;

    const params = request.nextUrl.searchParams;
    const agentParam = params.get('agentKind');
    const kindParam = params.get('kind');
    const fromIso = parseDateParam(params.get('from'));
    const toIso = parseDateParam(params.get('to'));
    const limit = Math.min(
      Math.max(Number.parseInt(params.get('limit') ?? '', 10) || PAGE_LIMIT, 10),
      200
    );
    const cursor = parseDateParam(params.get('cursor'));

    const agentKindFilter =
      agentParam && (COMPANY_AGENT_KINDS as readonly string[]).includes(agentParam)
        ? (agentParam as CompanyAgentKind)
        : null;

    // Fetch a buffer larger than `limit` from each source so the merged stream
    // has enough rows to fill the page after cross-source ordering.
    const sourceLimit = limit * 2;

    const actionsQuery = auth.supabase
      .from('company_agent_actions')
      .select(
        'id, agent_kind, action_type, title, rationale, status, priority, triggered_by, created_at, approved_at, completed_at, error'
      )
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false })
      .limit(sourceLimit);

    const decisionsQuery = auth.supabase
      .from('company_decisions')
      .select('id, title, decision_text, decided_at, source_action_id')
      .eq('user_id', auth.user.id)
      .order('decided_at', { ascending: false })
      .limit(sourceLimit);

    const tasksQuery = auth.supabase
      .from('company_tasks')
      .select('id, title, owner_kind, status, created_at, source_action_id, requester_kind')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false })
      .limit(sourceLimit);

    const [actionsRes, decisionsRes, tasksRes] = await Promise.all([
      agentKindFilter ? actionsQuery.eq('agent_kind', agentKindFilter) : actionsQuery,
      decisionsQuery,
      agentKindFilter ? tasksQuery.eq('owner_kind', agentKindFilter) : tasksQuery,
    ]);

    if (actionsRes.error || decisionsRes.error || tasksRes.error) {
      console.error('audit-timeline query errors', {
        actions: actionsRes.error,
        decisions: decisionsRes.error,
        tasks: tasksRes.error,
      });
      return NextResponse.json({ error: 'Failed to load audit timeline' }, { status: 500 });
    }

    const events: AuditEvent[] = [];

    for (const row of (actionsRes.data ?? []) as ActionRow[]) {
      events.push({
        id: `action:${row.id}:drafted`,
        occurredAt: row.created_at,
        agentKind: row.agent_kind as CompanyAgentKind,
        kind: 'action_drafted',
        title: row.title,
        summary: row.rationale,
        refType: 'action',
        refId: row.id,
        meta: {
          actionType: row.action_type,
          priority: row.priority,
          triggeredBy: row.triggered_by,
        },
      });

      if (row.approved_at) {
        events.push({
          id: `action:${row.id}:${row.status === 'rejected' ? 'rejected' : 'approved'}`,
          occurredAt: row.approved_at,
          agentKind: row.agent_kind as CompanyAgentKind,
          kind: row.status === 'rejected' ? 'action_rejected' : 'action_approved',
          title: row.title,
          summary: null,
          refType: 'action',
          refId: row.id,
          meta: { actionType: row.action_type },
        });
      }

      if (row.completed_at) {
        events.push({
          id: `action:${row.id}:${row.status === 'failed' ? 'failed' : 'completed'}`,
          occurredAt: row.completed_at,
          agentKind: row.agent_kind as CompanyAgentKind,
          kind: row.status === 'failed' ? 'action_failed' : 'action_completed',
          title: row.title,
          summary: row.error,
          refType: 'action',
          refId: row.id,
          meta: { actionType: row.action_type, error: row.error },
        });
      }
    }

    for (const row of (decisionsRes.data ?? []) as DecisionRow[]) {
      events.push({
        id: `decision:${row.id}`,
        occurredAt: row.decided_at,
        agentKind: null,
        kind: 'decision_recorded',
        title: row.title,
        summary: row.decision_text,
        refType: 'decision',
        refId: row.id,
        meta: { sourceActionId: row.source_action_id },
      });
    }

    for (const row of (tasksRes.data ?? []) as TaskRow[]) {
      events.push({
        id: `task:${row.id}:created`,
        occurredAt: row.created_at,
        agentKind: (row.owner_kind as CompanyAgentKind | null) ?? null,
        kind: 'task_created',
        title: row.title,
        summary: null,
        refType: 'task',
        refId: row.id,
        meta: {
          status: row.status,
          sourceActionId: row.source_action_id,
          requesterKind: row.requester_kind,
        },
      });
    }

    let filtered = events;
    if (fromIso) filtered = filtered.filter((e) => e.occurredAt >= fromIso);
    if (toIso) filtered = filtered.filter((e) => e.occurredAt <= toIso);
    if (cursor) filtered = filtered.filter((e) => e.occurredAt < cursor);
    if (kindParam) filtered = filtered.filter((e) => e.kind === kindParam);

    filtered.sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1));
    const page = filtered.slice(0, limit);
    const nextCursor = page.length === limit ? page[page.length - 1]?.occurredAt ?? null : null;

    return NextResponse.json({ data: page, nextCursor });
  } catch (err) {
    console.error('GET /api/admin/company-agent/audit-timeline error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
