/**
 * Company research cache.
 *
 * Reads/writes the shared, non-user-scoped `company_research_cache` table
 * (migration 032). Reads use the user-scoped supabase client (RLS allows
 * authenticated SELECT). Writes use createServiceClient because the table has
 * no INSERT/UPDATE/DELETE policies — it is intentionally populated only from
 * server-side agent code.
 *
 * This file is one of the approved sites for createServiceClient (alongside
 * src/lib/rate-limit.ts, src/lib/agent/audit.ts, src/app/api/webhook/**, and
 * src/app/api/cron/cleanup-stale-actions/route.ts).
 */
import type { SupabaseClient } from '@supabase/supabase-js';
// Approved use of createServiceClient — see file header.
import { createServiceClient } from '@/lib/supabase/server';

export interface CompanyResearchSource {
  title: string;
  url?: string;
  snippet?: string;
}

export interface CompanyResearchPayload {
  summary: string;
  mission: string;
  recentNews: string[];
  productAreas: string[];
  hiringSignals: string[];
  cultureSignals: string[];
  interviewerHints: string[];
  sources: CompanyResearchSource[];
}

export interface CompanyCacheReadResult {
  research: CompanyResearchPayload;
  sources: CompanyResearchSource[] | null;
  expiresAt: string;
  createdAt: string;
}

const DEFAULT_TTL_DAYS = 30;
const COMPANY_SUFFIXES =
  /\b(inc|incorporated|corp|corporation|llc|ltd|limited|co|gmbh|sa|plc|holdings)\b/g;

export function normalizeCompanyName(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[.,]/g, '')
    .replace(COMPANY_SUFFIXES, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function readCompanyCache(
  supabase: SupabaseClient,
  companyName: string
): Promise<CompanyCacheReadResult | null> {
  const normalized = normalizeCompanyName(companyName);
  if (!normalized) return null;

  const { data, error } = await supabase
    .from('company_research_cache')
    .select('research_json, sources_json, expires_at, created_at')
    .eq('company_name_normalized', normalized)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (error) {
    console.error('[company-cache] read error:', error);
    return null;
  }
  if (!data) return null;

  return {
    research: data.research_json as CompanyResearchPayload,
    sources: (data.sources_json ?? null) as CompanyResearchSource[] | null,
    expiresAt: data.expires_at as string,
    createdAt: data.created_at as string,
  };
}

export async function writeCompanyCache(
  companyName: string,
  research: CompanyResearchPayload,
  sources: CompanyResearchSource[],
  ttlDays: number = DEFAULT_TTL_DAYS
): Promise<void> {
  const normalized = normalizeCompanyName(companyName);
  if (!normalized) return;

  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000).toISOString();

  try {
    const supabase = await createServiceClient();
    const { error } = await supabase.from('company_research_cache').upsert(
      {
        company_name_normalized: normalized,
        research_json: research,
        sources_json: sources,
        expires_at: expiresAt,
      },
      { onConflict: 'company_name_normalized' }
    );
    if (error) {
      console.error('[company-cache] write error:', error);
    }
  } catch (err) {
    console.error('[company-cache] write threw:', err);
  }
}
