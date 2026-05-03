import { redirect } from 'next/navigation';
import { isAdminUser } from '@/lib/admin';
import { createClient } from '@/lib/supabase/server';
import { loadCompanyMetrics } from '@/server/agents/company/company-metrics';
import { publicCompanyAction } from '@/server/agents/company/types';
import type { CompanyAgentActionRow } from '@/server/agents/company/types';
import { CommandCenterClient } from './CommandCenterClient';

export default async function CommandCenterPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');
  if (!isAdminUser(user)) redirect('/dashboard');

  const metrics = await loadCompanyMetrics({ supabase, userId: user.id });
  const { data: actions } = await supabase
    .from('company_agent_actions')
    .select()
    .eq('user_id', user.id)
    .eq('status', 'awaiting_approval')
    .order('created_at', { ascending: false })
    .limit(8);

  const pendingActions = (actions ?? []).map((row) =>
    publicCompanyAction(row as CompanyAgentActionRow)
  );

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
