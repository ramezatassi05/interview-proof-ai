import type { SkillDefinition } from '../types';

export const fetchBurnBreakdownSkill: SkillDefinition = {
  id: 'fetch_burn_breakdown',
  agentKinds: ['director_finance'],
  kind: 'read',
  ui: {
    label: 'Look at where money goes',
    description: 'Rough breakdown of spend categories — currently AI tokens.',
    icon: 'pie',
  },
  tool: {
    name: 'fetch_burn_breakdown',
    description:
      "Pull what we know about where the money goes. Today that's mostly AI token spend (Sonnet 4.6) — the rest of the burn (hosting, tools, the CEO's draw) isn't tracked here yet, so be upfront about that.",
    input_schema: {
      type: 'object',
      additionalProperties: false,
      properties: {},
    },
  },
  async handler(_input, ctx) {
    return {
      status: 'succeeded',
      output: {
        tracked: {
          aiTokensSonnet46: 'see Spend (30d) tile in the Command Center',
        },
        notTracked: [
          'hosting (Vercel, Supabase)',
          'CEO compensation / draw',
          'tools / SaaS subscriptions',
          'contractor payments',
        ],
        note: "Only AI token spend is tracked here. Tell the CEO they'd need to plug in a real ledger or guess for the rest.",
        capturedAt: ctx.metrics.capturedAt,
      },
    };
  },
};
