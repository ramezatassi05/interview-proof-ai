import { promises as fs } from 'node:fs';
import path from 'node:path';
import { parse as parseCsv } from 'csv-parse/sync';
import type { CompanyAgentKind } from '../types';
import type {
  RoadmapContext,
  RoadmapDomain,
  RoadmapDomainKey,
  RoadmapRow,
  RoadmapStatus,
} from './types';

const ROADMAP_DIR = path.join(process.cwd(), 'roadmap');
const NORTH_STAR_PATH = path.join(ROADMAP_DIR, 'north-star.md');
const DOMAIN_FILES: Record<RoadmapDomainKey, string> = {
  product: path.join(ROADMAP_DIR, 'product.csv'),
  marketing: path.join(ROADMAP_DIR, 'marketing.csv'),
  finance: path.join(ROADMAP_DIR, 'finance.csv'),
};

const DOMAINS_FOR_AGENT: Record<CompanyAgentKind, RoadmapDomainKey[]> = {
  ceo_orchestrator: ['product', 'marketing', 'finance'],
  executive_assistant: ['product', 'marketing', 'finance'],
  director_engineering: ['product'],
  director_marketing: ['marketing'],
  director_finance: ['finance'],
};

const ACTIVE_STATUS_REGEX = /^(?!.*(done|complete|completed|cancel|cancelled|canceled|shipped))/i;
const NOTES_BUDGET = 2000;

async function readFileOrNull(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') return null;
    throw err;
  }
}

function findHeaderRowIndex(rows: string[][]): number {
  for (let i = 0; i < rows.length; i++) {
    const first = rows[i]?.[0]?.trim().toLowerCase();
    if (first === 'id') return i;
  }
  return -1;
}

function isBlankRow(row: string[] | undefined): boolean {
  if (!row) return true;
  return row.every((cell) => !cell || cell.trim().length === 0);
}

function pickColumn(rec: Record<string, string>, candidates: string[]): string {
  for (const candidate of candidates) {
    const lc = candidate.toLowerCase();
    for (const [key, value] of Object.entries(rec)) {
      if (key.toLowerCase().trim() === lc) {
        const v = (value ?? '').trim();
        if (v.length > 0) return v;
      }
    }
  }
  return '';
}

function parseDomainCsv(raw: string): RoadmapDomain {
  const rows: string[][] = parseCsv(raw, {
    relax_column_count: true,
    skip_empty_lines: false,
    trim: false,
  });

  const headerIdx = findHeaderRowIndex(rows);
  if (headerIdx === -1) {
    return { rows: [], notes: raw.slice(0, NOTES_BUDGET).trim() };
  }

  const header = rows[headerIdx].map((c) => (c ?? '').trim());
  const dataRows: RoadmapRow[] = [];
  let cursor = headerIdx + 1;

  while (cursor < rows.length) {
    const row = rows[cursor];
    if (isBlankRow(row)) break;
    const rec: Record<string, string> = {};
    for (let i = 0; i < header.length; i++) {
      rec[header[i]] = (row[i] ?? '').trim();
    }
    const id = pickColumn(rec, ['ID']);
    if (!id) {
      cursor++;
      continue;
    }
    dataRows.push({
      id,
      title: pickColumn(rec, ['Feature Name', 'Initiative', 'Line Item']),
      priority: pickColumn(rec, ['Priority']),
      status: pickColumn(rec, ['Status']),
      phase: pickColumn(rec, ['Phase', 'Category']),
      description: pickColumn(rec, ['Epic Description', 'Description', 'Notes']),
      inspiration: pickColumn(rec, [
        'Inspiration / References',
        'Inspiration/References',
        'Inspiration',
      ]),
      raw: rec,
    });
    cursor++;
  }

  const notesLines: string[] = [];
  let charsUsed = 0;
  for (let i = cursor; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;
    const line = row
      .map((c) => (c ?? '').trim())
      .filter((c) => c.length > 0)
      .join(' | ');
    if (!line) continue;
    if (charsUsed + line.length > NOTES_BUDGET) {
      notesLines.push('… [truncated]');
      break;
    }
    notesLines.push(line);
    charsUsed += line.length + 1;
  }

  return { rows: dataRows, notes: notesLines.join('\n') };
}

async function loadDomain(domain: RoadmapDomainKey): Promise<RoadmapDomain | null> {
  const raw = await readFileOrNull(DOMAIN_FILES[domain]);
  if (!raw) return null;
  return parseDomainCsv(raw);
}

export async function loadRoadmap(opts: { agentKind: CompanyAgentKind }): Promise<RoadmapContext> {
  const allowed = new Set(DOMAINS_FOR_AGENT[opts.agentKind] ?? []);

  const [northStar, product, marketing, finance] = await Promise.all([
    readFileOrNull(NORTH_STAR_PATH),
    allowed.has('product') ? loadDomain('product') : Promise.resolve(null),
    allowed.has('marketing') ? loadDomain('marketing') : Promise.resolve(null),
    allowed.has('finance') ? loadDomain('finance') : Promise.resolve(null),
  ]);

  return {
    northStar: northStar ? northStar.trim() : null,
    product,
    marketing,
    finance,
  };
}

export function isActiveRow(row: RoadmapRow): boolean {
  return ACTIVE_STATUS_REGEX.test(row.status);
}

export async function loadRoadmapStatus(): Promise<RoadmapStatus> {
  const [northStar, product, marketing, finance] = await Promise.all([
    readFileOrNull(NORTH_STAR_PATH),
    loadDomain('product'),
    loadDomain('marketing'),
    loadDomain('finance'),
  ]);

  const summarize = (
    domain: RoadmapDomain | null
  ): { loaded: boolean; activeRows: number; totalRows: number } => {
    if (!domain) return { loaded: false, activeRows: 0, totalRows: 0 };
    return {
      loaded: true,
      totalRows: domain.rows.length,
      activeRows: domain.rows.filter(isActiveRow).length,
    };
  };

  return {
    northStarLoaded: northStar !== null && northStar.trim().length > 0,
    product: summarize(product),
    marketing: summarize(marketing),
    finance: summarize(finance),
  };
}
