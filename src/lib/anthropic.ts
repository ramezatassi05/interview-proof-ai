import Anthropic from '@anthropic-ai/sdk';

let anthropicClient: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
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
