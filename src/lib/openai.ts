import OpenAI from 'openai';

let openaiClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

export const MODELS = {
  // GPT-4o for complex reasoning tasks
  reasoning: 'gpt-4o',
  // GPT-4o-mini for simpler extraction tasks
  extraction: 'gpt-4o-mini',
  // Embeddings model
  embedding: 'text-embedding-3-small',
} as const;

export const EMBEDDING_DIMENSIONS = 1536;
