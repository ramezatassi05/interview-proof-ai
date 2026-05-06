import type { SupabaseClient } from '@supabase/supabase-js';
import type { DirectorContext } from './director-context';
import { getDirectReports, COMPANY_AGENT_DISPLAY } from './org';
import type { CompanyAgentKind } from './types';

interface LoadCeoContextArgs {
  supabase: SupabaseClient;
  userId: string;
}

interface EscalatedTaskRow {
  id: string;
  title: string;
  owner_kind: CompanyAgentKind;
  escalated_at: string;
  escalation_reason: string | null;
  status: string;
}

interface DirectorActivityRow {
  agent_kind: CompanyAgentKind;
  status: string;
  created_at: string;
}

// CEO context = manager dashboard. Shows escalations across direct reports
// plus a small per-director activity sketch so the CEO can prioritise without
// asking. Designed to be cheap (small queries, capped row counts).
export async function loadCeoContext(args: LoadCeoContextArgs): Promise<DirectorContext> {
  const { supabase, userId } = args;

  const [escalatedRes, recentActionsRes] = await Promise.all([
    supabase
      .from('company_tasks')
      .select('id, title, owner_kind, escalated_at, escalation_reason, status')
      .eq('user_id', userId)
      .not('escalated_at', 'is', null)
      .order('escalated_at', { ascending: false })
      .limit(10),
    supabase
      .from('company_agent_actions')
      .select('agent_kind, status, created_at')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(200),
  ]);

  const escalated = (escalatedRes.data ?? []) as EscalatedTaskRow[];
  const recentActions = (recentActionsRes.data ?? []) as DirectorActivityRow[];

  const directs = getDirectReports('ceo_orchestrator');
  const activityByDirector: Record<string, { drafted: number; awaiting: number; failed: number }> =
    {};
  for (const kind of directs) {
    activityByDirector[kind] = { drafted: 0, awaiting: 0, failed: 0 };
  }
  for (const a of recentActions) {
    const bucket = activityByDirector[a.agent_kind];
    if (!bucket) continue;
    if (a.status === 'awaiting_approval') bucket.awaiting += 1;
    else if (a.status === 'failed') bucket.failed += 1;
    else if (a.status === 'drafted') bucket.drafted += 1;
  }

  const structured = {
    escalatedTasks: escalated.map((t) => ({
      id: t.id,
      title: t.title,
      ownerKind: t.owner_kind,
      escalatedAt: t.escalated_at,
      reason: t.escalation_reason,
      status: t.status,
    })),
    directorActivityLast7d: activityByDirector,
  };

  const escalationLines =
    escalated.length === 0
      ? '(no escalations)'
      : escalated
          .map(
            (t) =>
              `- [${COMPANY_AGENT_DISPLAY[t.owner_kind]}] ${t.title} — ${
                t.escalation_reason ? t.escalation_reason.slice(0, 200) : 'no reason given'
              } (taskId: ${t.id})`
          )
          .join('\n');

  const activityLines = directs
    .map((kind) => {
      const a = activityByDirector[kind];
      return `- ${COMPANY_AGENT_DISPLAY[kind]}: drafted ${a.drafted}, awaiting ${a.awaiting}, failed ${a.failed} (last 7d)`;
    })
    .join('\n');

  const summary = [
    'Escalations from your team:',
    escalationLines,
    '',
    'Direct-report activity (last 7d):',
    activityLines,
  ].join('\n');

  return { summary, structured };
}
