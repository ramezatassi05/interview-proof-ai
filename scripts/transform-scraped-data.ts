/**
 * Transform scraped data from Skill Seekers LangChain JSON output.
 * Uses GPT-4o-mini to classify each chunk as rubric, question, or skip.
 * Includes deduplication via embedding cosine similarity.
 *
 * Usage: Called by ingest-knowledge.ts, not directly.
 */

import OpenAI from 'openai';
import { type SupabaseClient } from '@supabase/supabase-js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any, 'public', any>;

const CLASSIFICATION_MODEL = 'gpt-4o-mini';
const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;
const DEDUP_SIMILARITY_THRESHOLD = 0.95;

export interface SourceConfig {
  sourceId: string;
  sourceName: string;
  defaultDomain: string;
  defaultRoundTypes: string[];
  companyName: string | null;
  qualityScore: number;
}

export interface LangChainDocument {
  page_content: string;
  metadata: Record<string, unknown>;
}

export interface ClassifiedChunk {
  type: 'rubric' | 'question' | 'skip';
  content: string;
  domain: string;
  roundType: string;
  tags: string[];
}

interface ClassificationResult {
  type: 'rubric' | 'question' | 'skip';
  domain: string;
  roundType: string;
  tags: string[];
  extractedContent: string;
}

/**
 * Classifies a single document chunk using GPT-4o-mini.
 */
async function classifyChunk(
  openai: OpenAI,
  doc: LangChainDocument,
  config: SourceConfig
): Promise<ClassificationResult> {
  const response = await openai.chat.completions.create({
    model: CLASSIFICATION_MODEL,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are an interview content classifier. Analyze the given text and classify it as one of:
- "rubric": Evaluation criteria, scoring guidelines, what interviewers look for, technical concepts with assessment criteria
- "question": Interview question templates, practice problems, behavioral prompts
- "skip": Not relevant to interview evaluation (navigation, license text, contributor info, etc.)

Return JSON: { "type": "rubric"|"question"|"skip", "domain": "swe"|"ds"|"finance"|"general", "roundType": "technical"|"behavioral"|"case"|"finance", "tags": ["tag1", "tag2"], "extractedContent": "cleaned content text" }

Default domain: ${config.defaultDomain}
Default round types: ${config.defaultRoundTypes.join(', ')}`,
      },
      {
        role: 'user',
        content: doc.page_content.slice(0, 3000),
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    return {
      type: 'skip',
      domain: config.defaultDomain,
      roundType: config.defaultRoundTypes[0],
      tags: [],
      extractedContent: '',
    };
  }

  try {
    return JSON.parse(content) as ClassificationResult;
  } catch {
    return {
      type: 'skip',
      domain: config.defaultDomain,
      roundType: config.defaultRoundTypes[0],
      tags: [],
      extractedContent: '',
    };
  }
}

/**
 * Creates an embedding vector for deduplication checking.
 */
async function createEmbedding(openai: OpenAI, text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
    dimensions: EMBEDDING_DIMENSIONS,
  });
  return response.data[0].embedding;
}

/**
 * Checks if content is a near-duplicate of existing rows by embedding similarity.
 */
async function isDuplicate(
  supabase: AnySupabaseClient,
  embedding: number[],
  table: 'rubric_chunks' | 'question_archetypes'
): Promise<boolean> {
  const rpcName = table === 'rubric_chunks' ? 'match_rubric_chunks' : 'match_question_archetypes';

  const { data } = await supabase.rpc(rpcName, {
    query_embedding: embedding,
    match_threshold: DEDUP_SIMILARITY_THRESHOLD,
    match_count: 1,
  });

  return data && data.length > 0;
}

/**
 * Transforms and inserts a batch of LangChain documents into the database.
 * Returns counts of chunks and questions created.
 */
export async function transformAndInsert(
  documents: LangChainDocument[],
  config: SourceConfig,
  sourceUrl: string | undefined,
  openai: OpenAI,
  supabase: SupabaseClient
): Promise<{
  chunksCreated: number;
  questionsCreated: number;
  skipped: number;
  duplicates: number;
}> {
  let chunksCreated = 0;
  let questionsCreated = 0;
  let skipped = 0;
  let duplicates = 0;

  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i];
    const progress = `[${i + 1}/${documents.length}]`;

    // Skip very short content
    if (doc.page_content.trim().length < 50) {
      skipped++;
      continue;
    }

    // Classify the chunk
    const classification = await classifyChunk(openai, doc, config);

    if (classification.type === 'skip') {
      skipped++;
      continue;
    }

    const content = classification.extractedContent || doc.page_content;

    // Create embedding for deduplication
    const embedding = await createEmbedding(openai, content);

    if (classification.type === 'rubric') {
      // Check for duplicates
      const dup = await isDuplicate(supabase, embedding, 'rubric_chunks');
      if (dup) {
        duplicates++;
        process.stdout.write(`   ${progress} Duplicate rubric, skipping\r`);
        continue;
      }

      const { error } = await supabase.from('rubric_chunks').insert({
        domain: classification.domain,
        round_type: classification.roundType,
        chunk_text: content,
        source_name: config.sourceName,
        source_url: sourceUrl,
        source_type: 'scraped',
        company_name: config.companyName,
        quality_score: config.qualityScore,
        scraped_at: new Date().toISOString(),
        embedding,
        metadata: {
          tags: classification.tags,
          originalMetadata: doc.metadata,
        },
      });

      if (error) {
        console.error(`\n   ❌ Insert rubric error: ${error.message}`);
      } else {
        chunksCreated++;
        process.stdout.write(`   ${progress} ✓ Rubric inserted\r`);
      }
    } else if (classification.type === 'question') {
      // Check for duplicates
      const dup = await isDuplicate(supabase, embedding, 'question_archetypes');
      if (dup) {
        duplicates++;
        process.stdout.write(`   ${progress} Duplicate question, skipping\r`);
        continue;
      }

      const { error } = await supabase.from('question_archetypes').insert({
        domain: classification.domain,
        round_type: classification.roundType,
        question_template: content,
        tags: classification.tags,
        source_url: sourceUrl,
        source_type: 'scraped',
        company_name: config.companyName,
        quality_score: config.qualityScore,
        scraped_at: new Date().toISOString(),
        embedding,
      });

      if (error) {
        console.error(`\n   ❌ Insert question error: ${error.message}`);
      } else {
        questionsCreated++;
        process.stdout.write(`   ${progress} ✓ Question inserted\r`);
      }
    }

    // Rate limit: 100ms between API calls
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log(''); // Newline after progress
  return { chunksCreated, questionsCreated, skipped, duplicates };
}
