import type { SkillCatalogEntry } from './types';

// Client-side mirror of the server skills' UI metadata. Keep in sync with
// src/server/agents/company/skills/. The shared `remember` skill is
// available to every agent.
export const SKILL_CATALOG: SkillCatalogEntry[] = [
  {
    id: 'remember',
    agentKinds: [
      'ceo_orchestrator',
      'executive_assistant',
      'director_marketing',
      'director_finance',
      'director_engineering',
    ],
    kind: 'write',
    label: 'Remember this',
    description: "Hold onto a fact the CEO wants you to keep in mind next time.",
    icon: 'brain',
  },

  // executive_assistant
  {
    id: 'search_emails',
    agentKinds: ['executive_assistant'],
    kind: 'read',
    label: 'Look through email',
    description: "Skim the CEO's inbox for threads matching what they're asking about.",
    icon: 'mail',
  },
  {
    id: 'schedule_followup',
    agentKinds: ['executive_assistant'],
    kind: 'write',
    label: 'Schedule a follow-up',
    description: 'Drop something on the CEO’s list with a due date so it doesn’t fall through.',
    icon: 'clock',
  },
  {
    id: 'summarize_threads',
    agentKinds: ['executive_assistant'],
    kind: 'read',
    label: 'Summarize threads',
    description: 'Pull together what’s happening across the CEO’s open conversations.',
    icon: 'list',
  },

  // director_marketing
  {
    id: 'fetch_funnel_metrics',
    agentKinds: ['director_marketing'],
    kind: 'read',
    label: 'Pull the funnel',
    description: 'Grab the latest funnel numbers — users, reports, unlock rate, rough revenue.',
    icon: 'chart',
  },
  {
    id: 'draft_landing_copy',
    agentKinds: ['director_marketing'],
    kind: 'write',
    label: 'Draft landing-page copy',
    description: 'Put together hero copy + a few supporting lines for a landing page.',
    icon: 'pen',
  },
  {
    id: 'draft_social_post',
    agentKinds: ['director_marketing'],
    kind: 'write',
    label: 'Draft a social post',
    description: 'Write a quick post for X / LinkedIn / Instagram / TikTok captions.',
    icon: 'megaphone',
  },
  {
    id: 'query_brand_guidelines',
    agentKinds: ['director_marketing'],
    kind: 'read',
    label: 'Check the brand voice',
    description: 'Refresh on how we talk so the copy lands right.',
    icon: 'book',
  },
  {
    id: 'search_competitor_landing_pages',
    agentKinds: ['director_marketing'],
    kind: 'read',
    label: 'Look at competitor pages',
    description: 'Skim how a competitor positions themselves on their landing page.',
    icon: 'eye',
  },

  // director_finance
  {
    id: 'fetch_revenue_snapshot',
    agentKinds: ['director_finance'],
    kind: 'read',
    label: 'Pull the revenue picture',
    description: 'Grab the current revenue picture — credits sold, gross revenue, unlock rate.',
    icon: 'dollar',
  },
  {
    id: 'fetch_runway',
    agentKinds: ['director_finance'],
    kind: 'read',
    label: 'Estimate runway',
    description: 'Rough runway from current revenue + whatever burn assumptions you give.',
    icon: 'clock',
  },
  {
    id: 'fetch_burn_breakdown',
    agentKinds: ['director_finance'],
    kind: 'read',
    label: 'Look at where money goes',
    description: 'Rough breakdown of spend categories — currently AI tokens.',
    icon: 'pie',
  },
  {
    id: 'model_pricing_change',
    agentKinds: ['director_finance'],
    kind: 'read',
    label: 'Model a pricing change',
    description: 'Quick what-if on revenue if we change the credit price.',
    icon: 'calculator',
  },
  {
    id: 'draft_finance_memo',
    agentKinds: ['director_finance'],
    kind: 'write',
    label: 'Draft a finance note',
    description: 'Short note for the CEO on a money question — pricing, runway, spend.',
    icon: 'note',
  },

  // director_engineering
  {
    id: 'fetch_open_incidents',
    agentKinds: ['director_engineering'],
    kind: 'read',
    label: 'Check open incidents',
    description: 'Anything currently broken or paging.',
    icon: 'alert',
  },
  {
    id: 'fetch_deploy_history',
    agentKinds: ['director_engineering'],
    kind: 'read',
    label: 'Look at recent deploys',
    description: 'Last few production deploys + outcomes.',
    icon: 'rocket',
  },
  {
    id: 'fetch_uptime',
    agentKinds: ['director_engineering'],
    kind: 'read',
    label: 'Check uptime',
    description: 'How well prod has been holding up.',
    icon: 'pulse',
  },
  {
    id: 'query_codebase_summary',
    agentKinds: ['director_engineering'],
    kind: 'read',
    label: 'Refresh on the codebase',
    description: 'Quick map of how the codebase is laid out.',
    icon: 'folder',
  },
  {
    id: 'draft_engineering_spec',
    agentKinds: ['director_engineering'],
    kind: 'write',
    label: 'Draft a spec',
    description: 'Short spec the team can pick up and start on.',
    icon: 'doc',
  },
];

export function skillsForAgent(
  agentKind: SkillCatalogEntry['agentKinds'][number]
): SkillCatalogEntry[] {
  return SKILL_CATALOG.filter((s) => s.agentKinds.includes(agentKind));
}

export function skillById(skillId: string): SkillCatalogEntry | undefined {
  return SKILL_CATALOG.find((s) => s.id === skillId);
}
