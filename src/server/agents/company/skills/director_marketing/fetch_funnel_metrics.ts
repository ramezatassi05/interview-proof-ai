import type { SkillDefinition } from '../types';

export const fetchFunnelMetricsSkill: SkillDefinition = {
  id: 'fetch_funnel_metrics',
  agentKinds: ['director_marketing'],
  kind: 'read',
  ui: {
    label: 'Fetch funnel metrics',
    description: 'Pull the latest visitor → report → unlocked-report conversion snapshot.',
    icon: 'chart',
  },
  tool: {
    name: 'fetch_funnel_metrics',
    description:
      'Returns the current marketing funnel snapshot (total users, total reports, unlocked reports, unlock rate, estimated revenue). Always call this before drafting marketing copy or proposing campaigns so claims are grounded in real numbers.',
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
