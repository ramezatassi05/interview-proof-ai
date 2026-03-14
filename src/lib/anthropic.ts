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
    });
  }
  return anthropicClient;
}

export const CLAUDE_MODELS = {
  // Claude Sonnet 4.6 for complex reasoning tasks (analysis)
  reasoning: 'claude-sonnet-4-6' as const,
} as const;
