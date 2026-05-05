import { NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/admin';
import { loadCompanyMetrics } from '@/server/agents/company/company-metrics';
import { publicCompanyAction, publicCompanyTask } from '@/server/agents/company/types';
import type { CompanyAgentActionRow, CompanyTaskRow } from '@/server/agents/company/types';
import { getHeartbeats } from '@/server/agents/company/heartbeats';
import { loadSpendLast30dCents } from '@/server/agents/company/spend';

interface DecisionRow {
  id: string;
  title: string;
  decision_text: string;
  rationale: string | null;
  decided_at: string;
}

export async function GET() {
  try {
    const auth = await requireAdminUser();
    if (!auth.ok) return auth.response;

    const metrics = await loadCompanyMetrics({
      supabase: auth.supabase,
      userId: auth.user.id,
    });

    const [actionsRes, decisionsRes, spend30dCents, tasksRes] = await Promise.all([
      auth.supabase
        .from('company_agent_actions')
        .select()
        .eq('user_id', auth.user.id)
        .eq('status', 'awaiting_approval')
        .order('created_at', { ascending: false })
        .limit(8),
      auth.supabase
        .from('company_decisions')
        .select('id, title, decision_text, rationale, decided_at')
        .eq('user_id', auth.user.id)
        .order('decided_at', { ascending: false })
        .limit(10),
      loadSpendLast30dCents({ supabase: auth.supabase, userId: auth.user.id }),
      auth.supabase
        .from('company_tasks')
        .select()
        .eq('user_id', auth.user.id)
        .neq('status', 'canceled')
        .order('updated_at', { ascending: false })
        .limit(100),
    ]);

    const pendingActions = (actionsRes.data ?? []).map((row) =>
      publicCompanyAction(row as CompanyAgentActionRow)
    );

    const decisions = ((decisionsRes.data ?? []) as DecisionRow[]).map((d) => ({
      id: d.id,
      title: d.title,
      decisionText: d.decision_text,
      rationale: d.rationale,
      decidedAt: d.decided_at,
    }));

    const tasks = (tasksRes.data ?? []).map((row) => publicCompanyTask(row as CompanyTaskRow));

    const heartbeats = getHeartbeats();

    return NextResponse.json({
      data: {
        title: 'CEO Daily Brief',
        generatedAt: new Date().toISOString(),
        summary:
          pendingActions.length > 0
            ? `You have ${pendingActions.length} internal company action${
                pendingActions.length === 1 ? '' : 's'
              } awaiting approval. Start there before assigning new work.`
            : 'No internal company actions are waiting on you. This is a good moment to assign a focused department task.',
        metrics,
        pendingActions,
        decisions,
        tasks,
        heartbeats,
        spend30dCents,
        nextBestQuestions: [
          'What should I focus on today?',
          'Give me a marketing plan for this week.',
          'Review revenue and conversion.',
          'Turn the next roadmap item into an engineering spec.',
        ],
      },
    });
  } catch (err) {
    console.error('GET /api/admin/company-agent/brief error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
