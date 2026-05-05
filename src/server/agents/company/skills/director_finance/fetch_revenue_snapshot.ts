import type { SkillDefinition } from '../types';

export const fetchRevenueSnapshotSkill: SkillDefinition = {
  id: 'fetch_revenue_snapshot',
  agentKinds: ['director_finance'],
  kind: 'read',
  ui: {
    label: 'Pull the revenue picture',
    description: 'Grab the current revenue picture — credits sold, gross revenue, unlock rate.',
    icon: 'dollar',
  },
  tool: {
    name: 'fetch_revenue_snapshot',
    description:
      "Pull the current revenue picture — credits purchased, rough gross revenue, unlock rate. Use this before any finance write-up or pricing call so you're working from real numbers.",
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
        totalCreditsPurchased: m.totalCreditsPurchased,
        estimatedRevenueCents: m.estimatedRevenueCents,
        estimatedRevenueDollars: Math.round(m.estimatedRevenueCents / 100),
        totalReports: m.totalReports,
        unlockedReports: m.unlockedReports,
        unlockRate: Number(m.unlockRate.toFixed(4)),
        capturedAt: m.capturedAt,
      },
    };
  },
};
