import type { SkillDefinition } from '../types';

interface FetchRunwayInput {
  monthlyBurnUsd?: number;
  cashOnHandUsd?: number;
}

export const fetchRunwaySkill: SkillDefinition<FetchRunwayInput> = {
  id: 'fetch_runway',
  agentKinds: ['director_finance'],
  kind: 'read',
  ui: {
    label: 'Estimate runway',
    description: 'Rough runway from current revenue + whatever burn assumptions you give.',
    icon: 'clock',
  },
  tool: {
    name: 'fetch_runway',
    description:
      "Estimate how many months of runway we have. Pulls current monthly revenue from the live numbers and divides by the burn assumption you pass in. If the CEO doesn't give a burn number, ask first.",
    input_schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        monthlyBurnUsd: {
          type: 'number',
          description: "Assumed monthly burn in USD (e.g. 8000 for an indie founder). Required to compute runway.",
        },
        cashOnHandUsd: {
          type: 'number',
          description: "Cash on hand in USD. If omitted, runway is reported as months from current revenue alone.",
        },
      },
    },
  },
  async handler(input, ctx) {
    const m = ctx.metrics;
    const monthlyRevenueUsd = m.estimatedRevenueCents / 100;
    const burnUsd = input.monthlyBurnUsd ?? null;
    const cashUsd = input.cashOnHandUsd ?? null;
    const netMonthlyUsd = burnUsd !== null ? monthlyRevenueUsd - burnUsd : null;

    let runwayMonths: number | null = null;
    if (cashUsd !== null && burnUsd !== null) {
      runwayMonths = netMonthlyUsd! >= 0 ? Infinity : Math.floor(cashUsd / Math.abs(netMonthlyUsd!));
    }

    return {
      status: 'succeeded',
      output: {
        monthlyRevenueUsd,
        assumedMonthlyBurnUsd: burnUsd,
        cashOnHandUsd: cashUsd,
        netMonthlyUsd,
        runwayMonths: runwayMonths === Infinity ? 'profitable — runway is unbounded' : runwayMonths,
        capturedAt: m.capturedAt,
        note:
          burnUsd === null
            ? "No burn assumption was given — ask the CEO for one before reporting a number."
            : null,
      },
    };
  },
};
