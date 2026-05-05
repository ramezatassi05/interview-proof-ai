import type { SkillDefinition } from '../types';

interface ModelPricingChangeInput {
  newCreditPriceUsd: number;
  expectedConversionLiftPct?: number;
  expectedConversionDropPct?: number;
}

export const modelPricingChangeSkill: SkillDefinition<ModelPricingChangeInput> = {
  id: 'model_pricing_change',
  agentKinds: ['director_finance'],
  kind: 'read',
  ui: {
    label: 'Model a pricing change',
    description: 'Quick what-if on revenue if we change the credit price.',
    icon: 'calculator',
  },
  tool: {
    name: 'model_pricing_change',
    description:
      "Run a back-of-the-envelope on a pricing change. Takes a new credit price and an optional lift/drop assumption on conversion. Returns projected monthly revenue and a delta vs today. Be clear with the CEO that this is rough — real elasticity needs an experiment.",
    input_schema: {
      type: 'object',
      additionalProperties: false,
      required: ['newCreditPriceUsd'],
      properties: {
        newCreditPriceUsd: { type: 'number', description: 'New price per credit in USD.' },
        expectedConversionLiftPct: {
          type: 'number',
          description: 'If you expect conversion to go UP (e.g. lower price), pass the % lift.',
        },
        expectedConversionDropPct: {
          type: 'number',
          description: 'If you expect conversion to go DOWN (e.g. higher price), pass the % drop.',
        },
      },
    },
  },
  async handler(input, ctx) {
    const m = ctx.metrics;
    const currentCreditPriceUsd = 15;
    const currentMonthlyRevenueUsd = m.estimatedRevenueCents / 100;
    const conversionMultiplier =
      1 +
      (input.expectedConversionLiftPct ?? 0) / 100 -
      (input.expectedConversionDropPct ?? 0) / 100;
    const priceMultiplier = input.newCreditPriceUsd / currentCreditPriceUsd;
    const projectedMonthlyRevenueUsd = currentMonthlyRevenueUsd * priceMultiplier * conversionMultiplier;
    const deltaUsd = projectedMonthlyRevenueUsd - currentMonthlyRevenueUsd;

    return {
      status: 'succeeded',
      output: {
        currentCreditPriceUsd,
        currentMonthlyRevenueUsd: Math.round(currentMonthlyRevenueUsd),
        newCreditPriceUsd: input.newCreditPriceUsd,
        conversionMultiplier,
        projectedMonthlyRevenueUsd: Math.round(projectedMonthlyRevenueUsd),
        deltaUsd: Math.round(deltaUsd),
        deltaPct: currentMonthlyRevenueUsd > 0
          ? Math.round((deltaUsd / currentMonthlyRevenueUsd) * 100)
          : null,
        caveat: "Real elasticity is impossible to predict from a model — this is a back-of-the-envelope only.",
      },
    };
  },
};
