/**
 * Knowledge Base Ingestion Orchestrator
 *
 * Reads source configs, scrapes GitHub repos (via local scraper),
 * transforms content with GPT-4o-mini classification, deduplicates
 * via embedding similarity, and inserts into Supabase.
 *
 * Usage:
 *   npx tsx scripts/ingest-knowledge.ts --config scripts/source-configs/tech-interview-handbook.json
 *   npx tsx scripts/ingest-knowledge.ts --all
 *   npx tsx scripts/ingest-knowledge.ts --all --force   # re-ingest completed sources
 */

import { config } from 'dotenv';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import {
  transformAndInsert,
  type SourceConfig,
  type LangChainDocument,
} from './transform-scraped-data';
import { handleGitHubSource, handleGrind75Source } from './scrape-sources';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any, 'public', any>;

// Load environment variables
config({ path: '.env.local' });

interface FullSourceConfig {
  skillSeekers: {
    sources: Array<{
      type: string;
      url: string;
      paths: string[];
    }>;
    output_dir: string;
  };
  interviewProof: SourceConfig;
}

function validateEnv(): void {
  const required = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'OPENAI_API_KEY'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

function parseArgs(): { configPath?: string; all: boolean; force: boolean } {
  const args = process.argv.slice(2);
  const result: { configPath?: string; all: boolean; force: boolean } = { all: false, force: false };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--config' && args[i + 1]) {
      result.configPath = args[i + 1];
      i++;
    } else if (args[i] === '--all') {
      result.all = true;
    } else if (args[i] === '--force') {
      result.force = true;
    }
  }

  if (!result.configPath && !result.all) {
    console.error('Usage:');
    console.error('  npx tsx scripts/ingest-knowledge.ts --config <path-to-config.json>');
    console.error('  npx tsx scripts/ingest-knowledge.ts --all');
    console.error('  npx tsx scripts/ingest-knowledge.ts --all --force  (re-ingest completed sources)');
    process.exit(1);
  }

  return result;
}

function loadConfig(configPath: string): FullSourceConfig {
  const absolutePath = path.resolve(configPath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Config file not found: ${absolutePath}`);
  }
  const raw = fs.readFileSync(absolutePath, 'utf-8');
  return JSON.parse(raw) as FullSourceConfig;
}

function getAllConfigPaths(): string[] {
  const configDir = path.resolve('scripts/source-configs');
  if (!fs.existsSync(configDir)) {
    throw new Error(`Source configs directory not found: ${configDir}`);
  }
  return fs
    .readdirSync(configDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => path.join(configDir, f))
    .sort();
}

/**
 * Runs the local scraper for a source config.
 * Determines source type and calls the appropriate handler from scrape-sources.ts.
 * Returns the path to the LangChain JSON output, or null if the source type is unsupported.
 */
async function runScraper(sourceConfig: FullSourceConfig): Promise<string | null> {
  const source = sourceConfig.skillSeekers.sources[0];
  if (!source) {
    throw new Error('No source entry in config');
  }

  // Web sources can't be scraped programmatically
  if (source.type === 'web') {
    console.log(`   ⏭ Skipping web source (requires manual curation): ${source.url}`);
    return null;
  }

  // Check if ALL sources in the config are web-only
  const hasScrapableSources = sourceConfig.skillSeekers.sources.some(
    (s) => s.type === 'github' || s.type === 'github-json'
  );
  if (!hasScrapableSources) {
    console.log('   ⏭ All sources are web-based — skipping (requires manual curation)');
    return null;
  }

  const outputDir = path.resolve(sourceConfig.skillSeekers.output_dir);
  fs.mkdirSync(outputDir, { recursive: true });

  let docs: LangChainDocument[] = [];

  // Process only github/github-json sources (skip web entries in multi-source configs)
  for (const s of sourceConfig.skillSeekers.sources) {
    if (s.type === 'github-json') {
      docs.push(...(await handleGrind75Source(s)));
    } else if (s.type === 'github') {
      docs.push(...(await handleGitHubSource(s)));
    } else {
      console.log(`   ⏭ Skipping web source in multi-source config: ${s.url}`);
    }
  }

  // Filter out empty/tiny docs
  docs = docs.filter((d) => d.page_content.trim().length >= 50);

  const langchainPath = path.join(outputDir, 'langchain.json');
  fs.writeFileSync(langchainPath, JSON.stringify(docs, null, 2));
  console.log(`   ✅ Scraped ${docs.length} documents → ${langchainPath}`);

  return langchainPath;
}

/**
 * Reads LangChain JSON output file.
 */
function readLangChainOutput(filePath: string): LangChainDocument[] {
  if (!fs.existsSync(filePath)) {
    throw new Error(`LangChain output not found: ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as LangChainDocument[];
}

/**
 * Checks if a source has already been successfully ingested.
 */
async function isAlreadyIngested(
  supabase: AnySupabaseClient,
  sourceId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('knowledge_ingestion_jobs')
    .select('id')
    .eq('source_config_id', sourceId)
    .eq('status', 'complete')
    .limit(1);

  return !!(data && data.length > 0);
}

/**
 * Processes a single source config end-to-end.
 */
async function processSource(
  configPath: string,
  supabase: AnySupabaseClient,
  openai: OpenAI,
  force: boolean
): Promise<void> {
  const sourceConfig = loadConfig(configPath);
  const { interviewProof } = sourceConfig;

  console.log(`\n${'='.repeat(60)}`);
  console.log(`📦 Processing: ${interviewProof.sourceName}`);
  console.log(`   Source ID: ${interviewProof.sourceId}`);
  console.log(`   Domain: ${interviewProof.defaultDomain}`);
  console.log(`   Company: ${interviewProof.companyName || 'General'}`);
  console.log(`${'='.repeat(60)}`);

  // Check if already ingested (skip unless --force)
  if (!force) {
    const alreadyDone = await isAlreadyIngested(supabase, interviewProof.sourceId);
    if (alreadyDone) {
      console.log(`   ⏭ Already ingested — skipping (use --force to re-ingest)`);
      return;
    }
  }

  // Check if this is a web-only source (no scraper available)
  const hasScrapableSources = sourceConfig.skillSeekers.sources.some(
    (s) => s.type === 'github' || s.type === 'github-json'
  );
  if (!hasScrapableSources) {
    console.log('   ⏭ Web-only source — skipping (requires manual curation)');
    return;
  }

  // Create ingestion job
  const { data: job, error: jobError } = await supabase
    .from('knowledge_ingestion_jobs')
    .insert({
      source_config_id: interviewProof.sourceId,
      source_name: interviewProof.sourceName,
      source_url: sourceConfig.skillSeekers.sources[0]?.url,
      status: 'scraping',
      metadata: { configPath },
    })
    .select()
    .single();

  if (jobError || !job) {
    console.error(`   ❌ Failed to create ingestion job: ${jobError?.message}`);
    return;
  }

  const jobId = job.id;

  try {
    // Step 1: Check for existing output or run scraper
    console.log('\n🔍 Step 1: Scraping...');
    let langchainPath: string;

    // Check for existing LangChain output first (may have been generated separately)
    const existingPaths = [
      path.join(sourceConfig.skillSeekers.output_dir, 'langchain.json'),
      `${sourceConfig.skillSeekers.output_dir}-langchain.json`,
      path.join('output', `${interviewProof.sourceId}-langchain.json`),
    ];
    const existingOutput = existingPaths.find((p) => fs.existsSync(p));

    if (existingOutput) {
      console.log(`   ✅ Found existing output: ${existingOutput}`);
      langchainPath = existingOutput;
    } else {
      const scraped = await runScraper(sourceConfig);
      if (!scraped) {
        throw new Error('Scraping produced no output and no existing output found');
      }
      langchainPath = scraped;
    }

    // Step 2: Read output
    console.log('\n📄 Step 2: Reading LangChain output...');
    const documents = readLangChainOutput(langchainPath);
    console.log(`   Found ${documents.length} documents`);

    // Step 3: Transform and insert
    await supabase
      .from('knowledge_ingestion_jobs')
      .update({ status: 'transforming' })
      .eq('id', jobId);

    console.log('\n🔄 Step 3: Classifying and inserting...');
    const result = await transformAndInsert(
      documents,
      interviewProof,
      sourceConfig.skillSeekers.sources[0]?.url,
      openai,
      supabase
    );

    // Step 4: Update job as complete
    await supabase
      .from('knowledge_ingestion_jobs')
      .update({
        status: 'complete',
        total_chunks_created: result.chunksCreated,
        total_questions_created: result.questionsCreated,
        completed_at: new Date().toISOString(),
        metadata: {
          configPath,
          skipped: result.skipped,
          duplicates: result.duplicates,
          totalDocuments: documents.length,
        },
      })
      .eq('id', jobId);

    console.log(`\n✅ Complete: ${interviewProof.sourceName}`);
    console.log(`   Rubric chunks created: ${result.chunksCreated}`);
    console.log(`   Questions created: ${result.questionsCreated}`);
    console.log(`   Skipped: ${result.skipped}`);
    console.log(`   Duplicates: ${result.duplicates}`);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`\n❌ Failed: ${errorMessage}`);

    await supabase
      .from('knowledge_ingestion_jobs')
      .update({
        status: 'failed',
        error_message: errorMessage,
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId);
  }
}

async function main(): Promise<void> {
  console.log('🚀 InterviewProof Knowledge Base Ingestion\n');

  validateEnv();
  const args = parseArgs();

  const supabase: AnySupabaseClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const configPaths = args.all ? getAllConfigPaths() : [args.configPath!];

  console.log(`📋 Processing ${configPaths.length} source config(s):\n`);
  for (const cp of configPaths) {
    console.log(`   - ${path.basename(cp)}`);
  }
  if (args.force) {
    console.log('\n⚠ --force mode: will re-ingest already completed sources');
  }

  for (const configPath of configPaths) {
    await processSource(configPath, supabase, openai, args.force);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('✨ All ingestion jobs complete!');
  console.log(`${'='.repeat(60)}`);
}

main().catch((err) => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
