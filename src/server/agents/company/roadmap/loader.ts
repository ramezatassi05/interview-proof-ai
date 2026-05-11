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

const DEFAULT_ID_PREFIX: Record<RoadmapDomainKey, string> = {
  product: 'F',
  marketing: 'M',
  finance: 'B',
};

export function domainForAgent(agentKind: CompanyAgentKind): RoadmapDomainKey | null {
  switch (agentKind) {
    case 'director_engineering':
      return 'product';
    case 'director_marketing':
      return 'marketing';
    case 'director_finance':
      return 'finance';
    default:
      return null;
  }
}

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
      title: pickColumn(rec, ['Feature Name', 'Initiative', 'Line Item', 'Marketing Idea']),
      priority: pickColumn(rec, ['Priority']),
      status: pickColumn(rec, ['Status']),
      phase: pickColumn(rec, ['Phase', 'Category', 'Channel']),
      description: pickColumn(rec, [
        'Epic Description',
        'Campaign Description',
        'Description',
        'Notes',
      ]),
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

export interface AppendRoadmapInput {
  title: string;
  priority?: string;
  status?: string;
  phase?: string;
  description?: string;
  inspiration?: string;
}

export type AppendRoadmapResult =
  | { ok: true; id: string; line: string; filePath: string }
  | { ok: false; reason: 'missing_file' | 'no_header' | 'read_only_fs' | 'write_failed'; error?: string };

function escapeCsvCell(value: string): string {
  if (value === '') return '';
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function buildCsvLine(values: string[]): string {
  return values.map(escapeCsvCell).join(',');
}

function nextRowId(existingIds: string[], fallbackPrefix: string): string {
  let prefix = fallbackPrefix;
  let maxN = 0;
  for (const raw of existingIds) {
    const match = raw.match(/^([A-Za-z]+)-(\d+)$/);
    if (!match) continue;
    prefix = match[1];
    const n = Number(match[2]);
    if (Number.isFinite(n) && n > maxN) maxN = n;
  }
  const next = maxN + 1;
  return `${prefix}-${String(next).padStart(3, '0')}`;
}

function valueForHeader(header: string, id: string, input: AppendRoadmapInput): string {
  const h = header.toLowerCase().trim();
  if (h === 'id') return id;
  if (
    h === 'feature name' ||
    h === 'initiative' ||
    h === 'line item' ||
    h === 'marketing idea'
  )
    return input.title;
  if (h === 'epic description' || h === 'campaign description' || h === 'description')
    return input.description ?? '';
  if (h === 'priority') return input.priority ?? '';
  if (h === 'status') return input.status ?? 'Backlog';
  if (h === 'phase' || h === 'category' || h === 'channel') return input.phase ?? '';
  if (
    h === 'inspiration / references' ||
    h === 'inspiration/references' ||
    h === 'inspiration' ||
    h === 'notes'
  )
    return input.inspiration ?? '';
  return '';
}

export async function appendRoadmapRow(
  domain: RoadmapDomainKey,
  input: AppendRoadmapInput
): Promise<AppendRoadmapResult> {
  const filePath = DOMAIN_FILES[domain];
  const raw = await readFileOrNull(filePath);
  if (raw === null) return { ok: false, reason: 'missing_file' };

  const parsedRows: string[][] = parseCsv(raw, {
    relax_column_count: true,
    skip_empty_lines: false,
    trim: false,
  });

  const headerIdx = findHeaderRowIndex(parsedRows);
  if (headerIdx === -1) return { ok: false, reason: 'no_header' };

  const header = parsedRows[headerIdx].map((c) => (c ?? '').trim());

  const existingIds: string[] = [];
  let cursor = headerIdx + 1;
  while (cursor < parsedRows.length) {
    const row = parsedRows[cursor];
    if (isBlankRow(row)) break;
    const idCell = (row[0] ?? '').trim();
    if (idCell) existingIds.push(idCell);
    cursor++;
  }
  // cursor now points to the first blank row after the data section
  // (or past the end of the file if there is no blank line yet).

  const id = nextRowId(existingIds, DEFAULT_ID_PREFIX[domain]);
  const values = header.map((h) => valueForHeader(h, id, input));
  const newLine = buildCsvLine(values);

  // Splice the new line into the raw text right before the blank row that
  // separates the table from the deep-notes section. We do this by counting
  // newlines rather than re-serialising the whole CSV, which keeps the
  // user's deep-notes formatting byte-identical.
  const lines = raw.split(/\r?\n/);
  const eol = raw.includes('\r\n') ? '\r\n' : '\n';
  // The parsed-row index aligns with the raw line index because we passed
  // skip_empty_lines: false. Insert at `cursor` (the blank row position).
  const insertAt = Math.min(cursor, lines.length);
  lines.splice(insertAt, 0, newLine);
  const newRaw = lines.join(eol);

  try {
    await fs.writeFile(filePath, newRaw, 'utf-8');
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === 'EROFS' || code === 'EACCES' || code === 'EPERM') {
      return { ok: false, reason: 'read_only_fs', error: code };
    }
    return {
      ok: false,
      reason: 'write_failed',
      error: err instanceof Error ? err.message : String(err),
    };
  }

  return { ok: true, id, line: newLine, filePath };
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
