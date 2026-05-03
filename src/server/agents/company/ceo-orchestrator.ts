import type { SupabaseClient } from '@supabase/supabase-js';
import { loadCompanyMetrics } from './company-metrics';
import { loadDirectorContext } from './director-context';
import { runCompanyAgent } from './company-agent-runner';
import type { CompanyAgentKind, CompanyAgentTriggeredBy } from './types';

export interface RunCeoOrchestratorArgs {
  userId: string;
  sessionId: string;
  message: string;
  requestedAgentKind?: CompanyAgentKind;
  triggeredBy?: CompanyAgentTriggeredBy;
  supabase: SupabaseClient;
}

const DEPARTMENT_KEYWORDS: { agentKind: CompanyAgentKind; keywords: string[] }[] = [
  {
    agentKind: 'director_finance',
    keywords: [
      'finance',
      'revenue',
      'stripe',
      'pricing',
      'runway',
      'conversion',
      'credits',
      'sales',
    ],
  },
  {
    agentKind: 'director_engineering',
    keywords: [
      'engineering',
      'build',
      'code',
      'github',
      'bug',
      'api',
      'database',
      'release',
      'tech debt',
    ],
  },
  {
    agentKind: 'director_marketing',
    keywords: [
      'marketing',
      'seo',
      'content',
      'landing',
      'growth',
      'campaign',
      'copy',
      'positioning',
    ],
  },
  {
    agentKind: 'executive_assistant',
    keywords: [
      'brief',
      'schedule',
      'follow up',
      'follow-up',
      'priority',
      'meeting',
      'decision',
      'inbox',
    ],
  },
];

export function routeCompanyRequest(message: string): CompanyAgentKind {
  const normalized = message.toLowerCase();
  const match = DEPARTMENT_KEYWORDS.find(({ keywords }) =>
    keywords.some((keyword) => normalized.includes(keyword))
  );

  return match?.agentKind ?? 'executive_assistant';
}

export async function runCeoOrchestrator(args: RunCeoOrchestratorArgs) {
  let agentKind: CompanyAgentKind;
  if (args.requestedAgentKind && args.requestedAgentKind !== 'ceo_orchestrator') {
    agentKind = args.requestedAgentKind;
  } else if (args.requestedAgentKind === 'ceo_orchestrator') {
    agentKind = routeCompanyRequest(args.message);
  } else {
    agentKind = 'executive_assistant';
  }

  const [metrics, directorContext] = await Promise.all([
    loadCompanyMetrics({ supabase: args.supabase, userId: args.userId }),
    agentKind === 'ceo_orchestrator'
      ? Promise.resolve(undefined)
      : loadDirectorContext({ supabase: args.supabase, userId: args.userId, kind: agentKind }),
  ]);

  return runCompanyAgent({
    userId: args.userId,
    sessionId: args.sessionId,
    agentKind,
    message: args.message,
    supabase: args.supabase,
    metrics,
    directorContext,
    triggeredBy: args.triggeredBy ?? 'user',
  });
}
