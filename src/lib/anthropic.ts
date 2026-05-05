import Anthropic from '@anthropic-ai/sdk';

let anthropicClient: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error(
        'ANTHROPIC_API_KEY is not set. Add it to .env.local and restart the dev server.'
      );
    }
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      timeout: 240_000, // 4 min per request (analysis can take 2-3 min for large prompts)
      maxRetries: 0, // App-level retry loop handles retries — don't let SDK retry
    });
  }
  return anthropicClient;
}

export const CLAUDE_MODELS = {
  // Claude Sonnet 4.6 — the default working model (analysis, specialists, directors).
  reasoning: 'claude-sonnet-4-6' as const,
  // Claude Opus 4.7 — strongest model, used for cross-cutting orchestration where
  // the agent has to reason over every other domain at once.
  reasoningPlus: 'claude-opus-4-7' as const,
  // Claude Haiku 4.5 — cheap + fast, for narrow utility paths where Sonnet is overkill.
  reasoningFast: 'claude-haiku-4-5-20251001' as const,
} as const;

export type ClaudeModelId = (typeof CLAUDE_MODELS)[keyof typeof CLAUDE_MODELS];
