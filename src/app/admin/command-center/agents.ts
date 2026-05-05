import type { CompanyAgentKind } from '@/server/agents/company/types';

export interface AgentOption {
  value: CompanyAgentKind;
  label: string;
  discipline: string;
  placeholder: string;
}

export const AGENT_OPTIONS: AgentOption[] = [
  {
    value: 'ceo_orchestrator',
    label: 'CEO Orchestrator',
    discipline: "Helps you decide what matters and points you at the right person",
    placeholder: 'What should I focus on this week?',
  },
  {
    value: 'executive_assistant',
    label: 'Executive Assistant',
    discipline: 'Briefings, follow-ups, keeps your week tidy',
    placeholder: 'Walk me through where things stand right now.',
  },
  {
    value: 'director_marketing',
    label: 'Director of Marketing',
    discipline: 'Positioning, content, growth ideas, launches',
    placeholder: 'Give me a plan to lift the unlock rate this week.',
  },
  {
    value: 'director_finance',
    label: 'Director of Finance',
    discipline: 'Revenue, pricing, runway, unit economics',
    placeholder: "Walk me through last week's revenue.",
  },
  {
    value: 'director_engineering',
    label: 'Director of Engineering',
    discipline: 'Specs, tradeoffs, what we should build next',
    placeholder: 'Turn the next roadmap item into a spec the team can pick up.',
  },
];

export function agentMeta(kind: CompanyAgentKind): AgentOption {
  return AGENT_OPTIONS.find((a) => a.value === kind) ?? AGENT_OPTIONS[0];
}
