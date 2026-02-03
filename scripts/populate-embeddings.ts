/**
 * Script to populate embeddings for rubric_chunks and question_archetypes tables.
 * Run with: npm run populate-embeddings
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Load environment variables from .env.local
config({ path: '.env.local' });

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;
const RATE_LIMIT_DELAY_MS = 100;

// Validate required environment variables
function validateEnv(): void {
  const required = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'OPENAI_API_KEY'];

  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// Create embedding for text using OpenAI
async function createEmbedding(openai: OpenAI, text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
    dimensions: EMBEDDING_DIMENSIONS,
  });

  return response.data[0].embedding;
}

// Sleep utility for rate limiting
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  console.log('🚀 Starting embedding population...\n');

  // Validate environment
  validateEnv();

  // Initialize clients
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Process rubric_chunks
  console.log('📚 Processing rubric_chunks...');

  const { data: rubricChunks, error: rubricError } = await supabase
    .from('rubric_chunks')
    .select('id, chunk_text')
    .is('embedding', null);

  if (rubricError) {
    throw new Error(`Failed to fetch rubric_chunks: ${rubricError.message}`);
  }

  console.log(`   Found ${rubricChunks?.length || 0} chunks with NULL embeddings`);

  let rubricProcessed = 0;
  for (const chunk of rubricChunks || []) {
    try {
      const embedding = await createEmbedding(openai, chunk.chunk_text);

      const { error: updateError } = await supabase
        .from('rubric_chunks')
        .update({ embedding })
        .eq('id', chunk.id);

      if (updateError) {
        console.error(`   ❌ Failed to update chunk ${chunk.id}: ${updateError.message}`);
      } else {
        rubricProcessed++;
        process.stdout.write(`   ✓ Processed ${rubricProcessed}/${rubricChunks!.length} chunks\r`);
      }

      await sleep(RATE_LIMIT_DELAY_MS);
    } catch (err) {
      console.error(`   ❌ Error processing chunk ${chunk.id}:`, err);
    }
  }
  console.log(`\n   ✅ Completed: ${rubricProcessed}/${rubricChunks?.length || 0} rubric chunks\n`);

  // Process question_archetypes
  console.log('❓ Processing question_archetypes...');

  const { data: archetypes, error: archetypeError } = await supabase
    .from('question_archetypes')
    .select('id, question_template')
    .is('embedding', null);

  if (archetypeError) {
    throw new Error(`Failed to fetch question_archetypes: ${archetypeError.message}`);
  }

  console.log(`   Found ${archetypes?.length || 0} archetypes with NULL embeddings`);

  let archetypeProcessed = 0;
  for (const archetype of archetypes || []) {
    try {
      const embedding = await createEmbedding(openai, archetype.question_template);

      const { error: updateError } = await supabase
        .from('question_archetypes')
        .update({ embedding })
        .eq('id', archetype.id);

      if (updateError) {
        console.error(`   ❌ Failed to update archetype ${archetype.id}: ${updateError.message}`);
      } else {
        archetypeProcessed++;
        process.stdout.write(
          `   ✓ Processed ${archetypeProcessed}/${archetypes!.length} archetypes\r`
        );
      }

      await sleep(RATE_LIMIT_DELAY_MS);
    } catch (err) {
      console.error(`   ❌ Error processing archetype ${archetype.id}:`, err);
    }
  }
  console.log(
    `\n   ✅ Completed: ${archetypeProcessed}/${archetypes?.length || 0} question archetypes\n`
  );

  // Summary
  console.log('📊 Summary:');
  console.log(`   Rubric chunks processed: ${rubricProcessed}`);
  console.log(`   Question archetypes processed: ${archetypeProcessed}`);
  console.log(`   Total API calls: ${rubricProcessed + archetypeProcessed}`);
  console.log('\n✨ Done!');
}

main().catch((err) => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
