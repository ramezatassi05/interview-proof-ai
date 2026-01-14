import { getOpenAIClient, MODELS, EMBEDDING_DIMENSIONS } from '@/lib/openai';
import { createServiceClient } from '@/lib/supabase/server';
import type { RoundType } from '@/types';

export interface RubricChunk {
  id: string;
  chunkText: string;
  domain: string;
  roundType: string;
  metadata: Record<string, unknown>;
  similarity?: number;
}

export interface QuestionArchetype {
  id: string;
  questionTemplate: string;
  domain: string;
  roundType: string;
  tags: string[];
  similarity?: number;
}

export interface RetrievalResult {
  rubricChunks: RubricChunk[];
  questionArchetypes: QuestionArchetype[];
  contextIds: string[];
}

/**
 * Creates an embedding vector for the given text using OpenAI embeddings API.
 */
export async function createEmbedding(text: string): Promise<number[]> {
  const openai = getOpenAIClient();

  const response = await openai.embeddings.create({
    model: MODELS.embedding,
    input: text,
    dimensions: EMBEDDING_DIMENSIONS,
  });

  return response.data[0].embedding;
}

/**
 * Builds a query string from resume summary, JD summary, and round type.
 */
function buildRetrievalQuery(
  resumeSummary: string,
  jdSummary: string,
  roundType: RoundType
): string {
  return `Interview round: ${roundType}

Job Requirements:
${jdSummary}

Candidate Background:
${resumeSummary}`;
}

/**
 * Retrieves relevant rubric chunks using vector similarity search.
 */
async function retrieveRubricChunks(
  embedding: number[],
  roundType: RoundType,
  topK: number
): Promise<RubricChunk[]> {
  const supabase = await createServiceClient();

  // Use pgvector cosine similarity search
  // Note: Supabase RPC function would be more efficient for production
  const { data, error } = await supabase.rpc('match_rubric_chunks', {
    query_embedding: embedding,
    match_threshold: 0.5,
    match_count: topK,
    filter_round_type: roundType,
  });

  if (error) {
    console.error('Rubric retrieval error:', error);
    // Fallback: get rubrics by round type without vector search
    const { data: fallbackData } = await supabase
      .from('rubric_chunks')
      .select('id, chunk_text, domain, round_type, metadata')
      .eq('round_type', roundType)
      .limit(topK);

    return (fallbackData || []).map((row) => ({
      id: row.id,
      chunkText: row.chunk_text,
      domain: row.domain,
      roundType: row.round_type,
      metadata: row.metadata as Record<string, unknown>,
    }));
  }

  return (data || []).map(
    (row: {
      id: string;
      chunk_text: string;
      domain: string;
      round_type: string;
      metadata: Record<string, unknown>;
      similarity: number;
    }) => ({
      id: row.id,
      chunkText: row.chunk_text,
      domain: row.domain,
      roundType: row.round_type,
      metadata: row.metadata,
      similarity: row.similarity,
    })
  );
}

/**
 * Retrieves relevant question archetypes using vector similarity search.
 */
async function retrieveQuestionArchetypes(
  embedding: number[],
  roundType: RoundType,
  topK: number
): Promise<QuestionArchetype[]> {
  const supabase = await createServiceClient();

  const { data, error } = await supabase.rpc('match_question_archetypes', {
    query_embedding: embedding,
    match_threshold: 0.5,
    match_count: topK,
    filter_round_type: roundType,
  });

  if (error) {
    console.error('Question retrieval error:', error);
    // Fallback: get questions by round type without vector search
    const { data: fallbackData } = await supabase
      .from('question_archetypes')
      .select('id, question_template, domain, round_type, tags')
      .eq('round_type', roundType)
      .limit(topK);

    return (fallbackData || []).map((row) => ({
      id: row.id,
      questionTemplate: row.question_template,
      domain: row.domain,
      roundType: row.round_type,
      tags: row.tags as string[],
    }));
  }

  return (data || []).map(
    (row: {
      id: string;
      question_template: string;
      domain: string;
      round_type: string;
      tags: string[];
      similarity: number;
    }) => ({
      id: row.id,
      questionTemplate: row.question_template,
      domain: row.domain,
      roundType: row.round_type,
      tags: row.tags,
      similarity: row.similarity,
    })
  );
}

/**
 * Retrieves relevant rubric chunks and question archetypes based on:
 * - Resume evidence summary
 * - JD requirements summary
 * - Interview round type
 *
 * Uses pgvector for semantic similarity search.
 */
export async function retrieveContext(
  resumeSummary: string,
  jdSummary: string,
  roundType: RoundType,
  topK: number = 8
): Promise<RetrievalResult> {
  // Build combined query for embedding
  const query = buildRetrievalQuery(resumeSummary, jdSummary, roundType);

  // Create embedding for the query
  const embedding = await createEmbedding(query);

  // Retrieve in parallel
  const [rubricChunks, questionArchetypes] = await Promise.all([
    retrieveRubricChunks(embedding, roundType, topK),
    retrieveQuestionArchetypes(embedding, roundType, topK),
  ]);

  // Collect all context IDs for auditability
  const contextIds = [...rubricChunks.map((c) => c.id), ...questionArchetypes.map((q) => q.id)];

  return {
    rubricChunks,
    questionArchetypes,
    contextIds,
  };
}

/**
 * Creates a summary string from extracted resume data for embedding.
 */
export function summarizeResumeForRetrieval(
  skills: string[],
  experiences: { role: string; company: string }[],
  metrics: string[]
): string {
  const skillsStr = skills.slice(0, 15).join(', ');
  const expStr = experiences
    .slice(0, 3)
    .map((e) => `${e.role} at ${e.company}`)
    .join('; ');
  const metricsStr = metrics.slice(0, 5).join('; ');

  return `Skills: ${skillsStr}
Experience: ${expStr}
Key metrics: ${metricsStr}`;
}

/**
 * Creates a summary string from extracted JD data for embedding.
 */
export function summarizeJDForRetrieval(mustHave: string[], keywords: string[]): string {
  const reqStr = mustHave.slice(0, 10).join(', ');
  const keyStr = keywords.slice(0, 10).join(', ');

  return `Requirements: ${reqStr}
Keywords: ${keyStr}`;
}
