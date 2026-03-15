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
  // Claude Sonnet 4.6 for complex reasoning tasks (analysis)
  reasoning: 'claude-sonnet-4-6' as const,
} as const;
