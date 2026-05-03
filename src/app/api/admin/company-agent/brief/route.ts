import { NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/admin';
import { loadCompanyMetrics } from '@/server/agents/company/company-metrics';
import { publicCompanyAction } from '@/server/agents/company/types';
import type { CompanyAgentActionRow } from '@/server/agents/company/types';

export async function GET() {
  try {
    const auth = await requireAdminUser();
    if (!auth.ok) return auth.response;

    const metrics = await loadCompanyMetrics({
      supabase: auth.supabase,
      userId: auth.user.id,
    });

    const { data: actions } = await auth.supabase
      .from('company_agent_actions')
      .select()
      .eq('user_id', auth.user.id)
      .eq('status', 'awaiting_approval')
      .order('created_at', { ascending: false })
      .limit(8);

    const pendingActions = (actions ?? []).map((row) =>
      publicCompanyAction(row as CompanyAgentActionRow)
    );

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
