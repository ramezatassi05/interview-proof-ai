#!/usr/bin/env -S npx tsx
/**
 * CEO -> Command Center bridge.
 *
 * Posts a free-form idea (typed in this Claude Code CLI) to the InterviewProof
 * /api/ceo/idea endpoint. The CEO orchestrator triages it and routes it to the
 * right specialist; the result lands in the Command Center inbox.
 *
 * Usage:
 *   npx tsx tools/cli/idea.ts "<text>"
 *   /idea  <text>     # via the .claude/commands/idea slash command
 *
 * Env (in .env.local):
 *   CEO_BRIDGE_SECRET   — shared secret with the server
 *   INTERVIEWPROOF_BASE_URL — defaults to http://localhost:3000
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnvLocal(): Record<string, string> {
  const out: Record<string, string> = {};
  const path = resolve(process.cwd(), '.env.local');
  if (!existsSync(path)) return out;
  for (const raw of readFileSync(path, 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 0) continue;
    const k = line.slice(0, eq).trim();
    let v = line.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!(k in process.env)) out[k] = v;
  }
  return out;
}

function git(...gitArgs: string[]): string | undefined {
  try {
    return execFileSync('git', gitArgs, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return undefined;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const text = args.join(' ').trim();
  if (!text) {
    console.error('Usage: npx tsx tools/cli/idea.ts "<your idea>"');
    process.exit(2);
  }

  const localEnv = loadEnvLocal();
  const baseUrl =
    process.env.INTERVIEWPROOF_BASE_URL ||
    localEnv.INTERVIEWPROOF_BASE_URL ||
    'http://localhost:3000';
  const secret = process.env.CEO_BRIDGE_SECRET || localEnv.CEO_BRIDGE_SECRET;

  if (!secret) {
    console.error(
      '✗ CEO_BRIDGE_SECRET is not set. Add it to .env.local (and Vercel env for prod).'
    );
    process.exit(2);
  }

  const context = {
    cwd: process.cwd(),
    branch: git('rev-parse', '--abbrev-ref', 'HEAD'),
    lastCommitSubject: git('log', '-1', '--pretty=%s'),
    lastCommitSha: git('rev-parse', 'HEAD'),
  };

  const url = `${baseUrl.replace(/\/$/, '')}/api/ceo/idea`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify({ text, source: 'cli', context }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '<no body>');
    console.error(`✗ ${res.status} ${res.statusText}\n${body}`);
    process.exit(1);
  }

  const json = (await res.json()) as { ideaId: string; sessionId: string; viewUrl: string };
  console.log('✓ Idea relayed to CEO Command Center');
  console.log(`  watch: ${json.viewUrl}`);
}

main().catch((err) => {
  console.error('✗ Unexpected error:', err);
  process.exit(1);
});
