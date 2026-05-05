import type { SkillDefinition } from '../types';

export const fetchRevenueSnapshotSkill: SkillDefinition = {
  id: 'fetch_revenue_snapshot',
  agentKinds: ['director_finance'],
  kind: 'read',
  ui: {
    label: 'Fetch revenue snapshot',
    description: 'Pull current credit purchases, estimated revenue, and unlock economics.',
    icon: 'dollar',
  },
  tool: {
    name: 'fetch_revenue_snapshot',
    description:
      'Returns the current revenue snapshot derived from credits_ledger and reports tables: total credits purchased, estimated gross revenue, unlock rate. Always call this before drafting finance memos or pricing analysis.',
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
