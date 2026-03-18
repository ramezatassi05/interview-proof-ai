/**
 * GitHub-based scraper that replaces Skill Seekers CLI.
 * Fetches content from GitHub repos and produces LangChain JSON files
 * that the existing ingest-knowledge.ts pipeline consumes.
 *
 * Usage:
 *   npx tsx scripts/scrape-sources.ts --config scripts/source-configs/coding-interview-university.json
 *   npx tsx scripts/scrape-sources.ts --all
 */

import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LangChainDocument {
  page_content: string;
  metadata: Record<string, unknown>;
}

interface SourceEntry {
  type: string;
  url: string;
  paths: string[];
}

interface FullSourceConfig {
  skillSeekers: {
    sources: SourceEntry[];
    output_dir: string;
  };
  interviewProof: {
    sourceId: string;
    sourceName: string;
    defaultDomain: string;
    defaultRoundTypes: string[];
    companyName: string | null;
    qualityScore: number;
  };
}

interface GitHubContentEntry {
  name: string;
  path: string;
  type: 'file' | 'dir';
  download_url: string | null;
  size: number;
}

// ---------------------------------------------------------------------------
// GitHub helpers
// ---------------------------------------------------------------------------

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

function githubHeaders(): Record<string, string> {
  const h: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'interview-proof-scraper',
  };
  if (GITHUB_TOKEN) {
    h['Authorization'] = `token ${GITHUB_TOKEN}`;
  }
  return h;
}

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: githubHeaders() });
  if (!res.ok) {
    throw new Error(`GitHub API ${res.status}: ${url} — ${await res.text()}`);
  }
  return (await res.json()) as T;
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'interview-proof-scraper' },
  });
  if (!res.ok) {
    throw new Error(`Fetch ${res.status}: ${url}`);
  }
  return res.text();
}

/** Parse owner/repo from a GitHub URL. */
function parseGitHubUrl(url: string): { owner: string; repo: string } {
  const m = url.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!m) throw new Error(`Cannot parse GitHub URL: ${url}`);
  return { owner: m[1], repo: m[2].replace(/\.git$/, '') };
}

/** Detect the default branch for a repo. */
async function getDefaultBranch(owner: string, repo: string): Promise<string> {
  const data = await fetchJSON<{ default_branch: string }>(
    `https://api.github.com/repos/${owner}/${repo}`
  );
  return data.default_branch;
}

/** List contents of a directory via GitHub Contents API. */
async function listDirectory(
  owner: string,
  repo: string,
  dirPath: string
): Promise<GitHubContentEntry[]> {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${dirPath}`;
  return fetchJSON<GitHubContentEntry[]>(url);
}

/** Fetch raw file content from raw.githubusercontent.com (no 1MB API limit). */
function rawUrl(owner: string, repo: string, branch: string, filePath: string): string {
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
}

// ---------------------------------------------------------------------------
// Chunkers
// ---------------------------------------------------------------------------

/**
 * Splits markdown content by ## headings.
 * Sub-splits sections > 3000 chars by ### headings.
 * Includes heading path in metadata.
 */
function chunkMarkdown(content: string, filePath: string): LangChainDocument[] {
  const docs: LangChainDocument[] = [];
  // Split by ## headings (keep heading with section)
  const sections = content.split(/^(?=## )/m);

  for (const section of sections) {
    const trimmed = section.trim();
    if (trimmed.length < 50) continue;

    // Extract heading
    const headingMatch = trimmed.match(/^##\s+(.+)/m);
    const heading = headingMatch ? headingMatch[1].trim() : '';

    if (trimmed.length > 3000) {
      // Sub-split by ### headings
      const subSections = trimmed.split(/^(?=### )/m);
      for (const sub of subSections) {
        const subTrimmed = sub.trim();
        if (subTrimmed.length < 50) continue;
        const subHeadingMatch = subTrimmed.match(/^###\s+(.+)/m);
        const subHeading = subHeadingMatch ? subHeadingMatch[1].trim() : '';
        docs.push({
          page_content: subTrimmed,
          metadata: {
            source: filePath,
            heading: heading ? `${heading} > ${subHeading}` : subHeading,
          },
        });
      }
    } else {
      docs.push({
        page_content: trimmed,
        metadata: { source: filePath, heading },
      });
    }
  }

  // If no ## headings found, treat the whole file as one doc (if long enough)
  if (docs.length === 0 && content.trim().length >= 50) {
    docs.push({
      page_content: content.trim(),
      metadata: { source: filePath, heading: '' },
    });
  }

  return docs;
}

/**
 * Parses a Jupyter notebook (.ipynb) and extracts markdown + code cells.
 * Each notebook becomes 1 document.
 */
function chunkNotebook(content: string, filePath: string): LangChainDocument[] {
  try {
    const notebook = JSON.parse(content) as {
      cells: Array<{
        cell_type: string;
        source: string[];
      }>;
    };

    const parts: string[] = [];
    for (const cell of notebook.cells) {
      const source = cell.source.join('');
      if (!source.trim()) continue;

      if (cell.cell_type === 'markdown') {
        parts.push(source);
      } else if (cell.cell_type === 'code') {
        parts.push('```python\n' + source + '\n```');
      }
    }

    const combined = parts.join('\n\n');
    if (combined.trim().length < 50) return [];

    return [
      {
        page_content: combined,
        metadata: { source: filePath, type: 'notebook' },
      },
    ];
  } catch {
    console.warn(`   ⚠ Failed to parse notebook: ${filePath}`);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Source-specific handlers
// ---------------------------------------------------------------------------

/**
 * Recursively fetches files from a GitHub directory tree.
 * Returns array of { path, content } for supported file types.
 */
async function fetchDirectoryRecursive(
  owner: string,
  repo: string,
  branch: string,
  dirPath: string,
  extensions: string[]
): Promise<Array<{ path: string; content: string }>> {
  const results: Array<{ path: string; content: string }> = [];

  let entries: GitHubContentEntry[];
  try {
    entries = await listDirectory(owner, repo, dirPath);
  } catch (err) {
    // If path doesn't exist (404), skip silently
    if (err instanceof Error && err.message.includes('404')) {
      console.warn(`   ⚠ Path not found, skipping: ${dirPath}`);
      return [];
    }
    throw err;
  }

  // Handle case where the API returns a single file object (not an array)
  if (!Array.isArray(entries)) {
    const entry = entries as unknown as GitHubContentEntry;
    if (entry.type === 'file') {
      const ext = path.extname(entry.name).toLowerCase();
      if (extensions.includes(ext) || extensions.length === 0) {
        const url = rawUrl(owner, repo, branch, entry.path);
        const content = await fetchText(url);
        results.push({ path: entry.path, content });
      }
    }
    return results;
  }

  for (const entry of entries) {
    if (entry.type === 'dir') {
      const subResults = await fetchDirectoryRecursive(owner, repo, branch, entry.path, extensions);
      results.push(...subResults);
    } else if (entry.type === 'file') {
      const ext = path.extname(entry.name).toLowerCase();
      if (extensions.includes(ext) || extensions.length === 0) {
        const url = rawUrl(owner, repo, branch, entry.path);
        try {
          const content = await fetchText(url);
          results.push({ path: entry.path, content });
        } catch (err) {
          console.warn(
            `   ⚠ Failed to fetch ${entry.path}: ${err instanceof Error ? err.message : 'unknown'}`
          );
        }
      }
    }
    // Small delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 50));
  }

  return results;
}

/**
 * Handle standard GitHub source (markdown, mdx, py files).
 */
async function handleGitHubSource(source: SourceEntry): Promise<LangChainDocument[]> {
  const { owner, repo } = parseGitHubUrl(source.url);
  const branch = await getDefaultBranch(owner, repo);
  console.log(`   Repo: ${owner}/${repo} (branch: ${branch})`);

  const docs: LangChainDocument[] = [];
  const extensions = ['.md', '.mdx', '.py', '.ipynb'];

  for (const dirPath of source.paths) {
    console.log(`   Fetching: ${dirPath}`);

    // Check if it's a single file path (has extension)
    const hasExt = path.extname(dirPath).length > 0;

    if (hasExt) {
      // Single file
      const url = rawUrl(owner, repo, branch, dirPath);
      try {
        const content = await fetchText(url);
        const ext = path.extname(dirPath).toLowerCase();

        if (ext === '.ipynb') {
          docs.push(...chunkNotebook(content, dirPath));
        } else {
          docs.push(...chunkMarkdown(content, dirPath));
        }
        console.log(`   ✓ ${dirPath} → ${docs.length} chunks so far`);
      } catch (err) {
        console.warn(
          `   ⚠ Failed to fetch ${dirPath}: ${err instanceof Error ? err.message : 'unknown'}`
        );
      }
    } else {
      // Directory — recursively fetch all supported files
      const files = await fetchDirectoryRecursive(owner, repo, branch, dirPath, extensions);
      console.log(`   Found ${files.length} files in ${dirPath}`);

      for (const file of files) {
        const ext = path.extname(file.path).toLowerCase();
        if (ext === '.ipynb') {
          docs.push(...chunkNotebook(file.content, file.path));
        } else {
          docs.push(...chunkMarkdown(file.content, file.path));
        }
      }
      console.log(`   ✓ ${dirPath} → ${docs.length} chunks so far`);
    }
  }

  return docs;
}

/**
 * Handle Grind 75 — structured JSON from tech-interview-handbook repo.
 * Each question becomes a separate document.
 */
async function handleGrind75Source(source: SourceEntry): Promise<LangChainDocument[]> {
  const { owner, repo } = parseGitHubUrl(source.url);
  const branch = await getDefaultBranch(owner, repo);
  console.log(`   Repo: ${owner}/${repo} (branch: ${branch})`);

  const jsonPath = source.paths[0];
  const url = rawUrl(owner, repo, branch, jsonPath);
  console.log(`   Fetching: ${jsonPath}`);

  const raw = await fetchText(url);
  // Shape: { "Week 1": [...], "Week 2": [...], ... }
  const data = JSON.parse(raw) as Record<
    string,
    Array<{
      title: string;
      slug: string;
      url: string;
      difficulty: string;
      topic: string;
      duration: number;
      routines: string[];
    }>
  >;

  const docs: LangChainDocument[] = [];

  for (const [week, questions] of Object.entries(data)) {
    for (const q of questions) {
      const parts = [
        `# ${q.title}`,
        `**Week:** ${week}`,
        `**Topic:** ${q.topic}`,
        `**Difficulty:** ${q.difficulty}`,
        `**Duration:** ${q.duration} minutes`,
      ];
      if (q.routines.length) parts.push(`**Routines:** ${q.routines.join(', ')}`);
      parts.push(`**LeetCode:** ${q.url}`);

      docs.push({
        page_content: parts.join('\n'),
        metadata: {
          source: 'grind-75',
          week,
          topic: q.topic,
          difficulty: q.difficulty,
          duration: q.duration,
          routines: q.routines,
        },
      });
    }
  }

  console.log(`   ✓ Parsed ${docs.length} questions from Grind 75 JSON`);
  return docs;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseArgs(): { configPath?: string; all: boolean } {
  const args = process.argv.slice(2);
  const result: { configPath?: string; all: boolean } = { all: false };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--config' && args[i + 1]) {
      result.configPath = args[i + 1];
      i++;
    } else if (args[i] === '--all') {
      result.all = true;
    }
  }

  if (!result.configPath && !result.all) {
    console.error('Usage:');
    console.error('  npx tsx scripts/scrape-sources.ts --config <path-to-config.json>');
    console.error('  npx tsx scripts/scrape-sources.ts --all');
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

async function processSource(configPath: string): Promise<void> {
  const config = loadConfig(configPath);
  const { interviewProof, skillSeekers } = config;
  const source = skillSeekers.sources[0];

  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔍 Scraping: ${interviewProof.sourceName}`);
  console.log(`   Source ID: ${interviewProof.sourceId}`);
  console.log(`   Type: ${source.type}`);
  console.log(`   URL: ${source.url}`);
  console.log(`${'='.repeat(60)}`);

  let docs: LangChainDocument[];

  if (source.type === 'github-json') {
    docs = await handleGrind75Source(source);
  } else {
    docs = await handleGitHubSource(source);
  }

  // Filter out empty/tiny docs
  docs = docs.filter((d) => d.page_content.trim().length >= 50);

  // Write output
  const outputDir = path.resolve(skillSeekers.output_dir);
  fs.mkdirSync(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, 'langchain.json');
  fs.writeFileSync(outputPath, JSON.stringify(docs, null, 2));

  console.log(`\n✅ Done: ${interviewProof.sourceName}`);
  console.log(`   Documents: ${docs.length}`);
  console.log(`   Output: ${outputPath}`);
}

async function main(): Promise<void> {
  console.log('🚀 InterviewProof GitHub Scraper\n');

  if (GITHUB_TOKEN) {
    console.log('✓ GITHUB_TOKEN detected — using authenticated requests');
  } else {
    console.log('⚠ No GITHUB_TOKEN — rate limited to 60 req/hr. Set GITHUB_TOKEN for 5000 req/hr.');
  }

  const args = parseArgs();
  const configPaths = args.all ? getAllConfigPaths() : [args.configPath!];

  console.log(`\n📋 Scraping ${configPaths.length} source(s):\n`);
  for (const cp of configPaths) {
    console.log(`   - ${path.basename(cp)}`);
  }

  for (const configPath of configPaths) {
    await processSource(configPath);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('✨ All scraping complete!');
  console.log(`${'='.repeat(60)}`);
}

main().catch((err) => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
