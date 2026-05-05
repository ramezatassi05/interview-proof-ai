import { redirect } from 'next/navigation';
import { isAdminUser } from '@/lib/admin';
import { createClient } from '@/lib/supabase/server';
import { loadCompanyMetrics } from '@/server/agents/company/company-metrics';
import { publicCompanyAction } from '@/server/agents/company/types';
import type { CompanyAgentActionRow } from '@/server/agents/company/types';
import { getHeartbeats } from '@/server/agents/company/heartbeats';
import { loadSpendLast30dCents } from '@/server/agents/company/spend';
import { CommandCenterClient } from './CommandCenterClient';

interface DecisionRow {
  id: string;
  title: string;
  decision_text: string;
  rationale: string | null;
  decided_at: string;
}

export default async function CommandCenterPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');
  if (!isAdminUser(user)) redirect('/dashboard');

  const [metrics, actionsRes, decisionsRes, spend30dCents] = await Promise.all([
    loadCompanyMetrics({ supabase, userId: user.id }),
    supabase
      .from('company_agent_actions')
      .select()
      .eq('user_id', user.id)
      .eq('status', 'awaiting_approval')
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('company_decisions')
      .select('id, title, decision_text, rationale, decided_at')
      .eq('user_id', user.id)
      .order('decided_at', { ascending: false })
      .limit(10),
    loadSpendLast30dCents({ supabase, userId: user.id }),
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

  return (
    <CommandCenterClient
      initialBrief={{
        summary:
          pendingActions.length > 0
            ? `You have ${pendingActions.length} internal company action${
                pendingActions.length === 1 ? '' : 's'
              } awaiting approval.`
            : 'No internal company actions are waiting on you.',
        metrics,
        pendingActions,
        decisions,
        heartbeats: getHeartbeats(),
        spend30dCents,
        nextBestQuestions: [
          'What should I focus on today?',
          'Give me a marketing plan for this week.',
          'Review revenue and conversion.',
          'Turn the next roadmap item into an engineering spec.',
        ],
      }}
    />
  );
}
