import type { SkillDefinition } from '../types';

export const fetchFunnelMetricsSkill: SkillDefinition = {
  id: 'fetch_funnel_metrics',
  agentKinds: ['director_marketing'],
  kind: 'read',
  ui: {
    label: 'Pull the funnel',
    description: 'Grab the latest funnel numbers — users, reports, unlock rate, rough revenue.',
    icon: 'chart',
  },
  tool: {
    name: 'fetch_funnel_metrics',
    description:
      "Pull the latest funnel numbers — total users, total reports, how many got unlocked, the unlock rate, and a rough revenue estimate. Use this before you draft any marketing copy or pitch a campaign — that way you're talking about real numbers, not guessing.",
    input_schema: {
      type: 'object',
      additionalProperties: false,
      properties: {},
    },
  },
  async handler(_input, ctx) {
    const m = ctx.metrics;
    return {
      status: 'succeeded',
      output: {
        totalUsers: m.totalUsers,
        totalReports: m.totalReports,
        unlockedReports: m.unlockedReports,
        unlockRate: Number(m.unlockRate.toFixed(4)),
        estimatedRevenueCents: m.estimatedRevenueCents,
        estimatedRevenueDollars: Math.round(m.estimatedRevenueCents / 100),
        capturedAt: m.capturedAt,
      },
    };
  },
};
