import { CLAUDE_MODELS, type ClaudeModelId } from '@/lib/anthropic';

// Prices per million tokens (USD) — anthropic.com list prices, May 2026.
// Update this table whenever Anthropic adjusts pricing.
export const MODEL_PRICING: Record<ClaudeModelId, { inPerMTok: number; outPerMTok: number }> = {
  [CLAUDE_MODELS.reasoning]: { inPerMTok: 3, outPerMTok: 15 },
  [CLAUDE_MODELS.reasoningPlus]: { inPerMTok: 15, outPerMTok: 75 },
  [CLAUDE_MODELS.reasoningFast]: { inPerMTok: 1, outPerMTok: 5 },
};

export function computeMessageCostUsd(
  modelId: ClaudeModelId,
  tokensIn: number,
  tokensOut: number
): number {
  const price = MODEL_PRICING[modelId];
  if (!price) return 0;
  return (tokensIn * price.inPerMTok + tokensOut * price.outPerMTok) / 1_000_000;
}

export function isKnownModelId(value: string | null | undefined): value is ClaudeModelId {
  if (!value) return false;
  return Object.prototype.hasOwnProperty.call(MODEL_PRICING, value);
}
