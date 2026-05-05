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
    label: 'Remember',
    description: 'Save a durable fact so future conversations can recall it.',
    icon: 'brain',
  },
  {
    id: 'fetch_funnel_metrics',
    agentKinds: ['director_marketing'],
    kind: 'read',
    label: 'Fetch funnel metrics',
    description: 'Pull the latest visitor → report → unlocked-report conversion snapshot.',
    icon: 'chart',
  },
  {
    id: 'fetch_revenue_snapshot',
    agentKinds: ['director_finance'],
    kind: 'read',
    label: 'Fetch revenue snapshot',
    description: 'Pull current credit purchases, estimated revenue, and unlock economics.',
    icon: 'dollar',
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
