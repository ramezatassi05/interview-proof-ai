/**
 * GET /api/cron/opportunity-ingest
 *
 * Phase D — Adzuna-driven daily job ingestion. For each user with a
 * profile that has target_role + target_country, queries Adzuna for
 * matching openings and drafts up to MAX_PER_USER propose_opportunity_create
 * actions. The user approves them in the bell; the executor creates the row.
 *
 * Auth: Authorization: Bearer ${CRON_SECRET}.
 *
 * Service role: required to read profiles + draft actions across users.
 * Approved use site documented in src/lib/agent/audit.ts file header.
 *
 * Wiring: vercel.json — daily at 11:00 UTC. Adzuna free tier is 250
 * calls/day so MAX_USERS_PER_RUN is conservatively capped.
 */
// Approved use of createServiceClient — see file header.
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { verifyCronSecret } from '@/lib/security';
import { actionRequiresExternalSend } from '@/lib/agent/types';

export const maxDuration = 300;

const MAX_USERS_PER_RUN = 25;
const MAX_PER_USER = 5;

const ADZUNA_SUPPORTED_COUNTRIES = new Set([
  'at', 'au', 'be', 'br', 'ca', 'de', 'fr', 'gb', 'in', 'it', 'nl', 'nz', 'pl', 'sg', 'us', 'za',
]);

interface AdzunaJob {
  id?: string;
  company?: { display_name?: string };
  title?: string;
  location?: { display_name?: string };
  salary_min?: number;
  salary_max?: number;
  redirect_url?: string;
  description?: string;
  created?: string;
}

interface UserProfileRow {
  user_id: string;
  target_roles: string[] | null;
  target_countries: string[] | null;
  target_cities: string[] | null;
}

interface SweepStats {
  considered: number;
  drafted: number;
  apiErrors: number;
  skipped: number;
}

async function fetchAdzunaJobs(params: {
  country: string;
  query: string;
  city: string | null;
  limit: number;
}): Promise<AdzunaJob[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) return [];

  const search = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    what: params.query,
    results_per_page: String(params.limit),
    max_days_old: '7',
  });
  if (params.city) search.set('where', params.city);

  const url = `https://api.adzuna.com/v1/api/jobs/${params.country}/search/1?${search.toString()}`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 5000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) return [];
    const json = (await res.json()) as { results?: AdzunaJob[] };
    return json.results ?? [];
  } catch {
    return [];
  } finally {
    clearTimeout(t);
  }
}

export async function GET(request: NextRequest) {
  const unauthorized = verifyCronSecret(request.headers.get('authorization'));
  if (unauthorized) return unauthorized;

  const supabase = await createServiceClient();
  const stats: SweepStats = { considered: 0, drafted: 0, apiErrors: 0, skipped: 0 };

  // Pull profiles with at least a target_role configured; cap to LIMIT.
  const { data: profiles, error: profilesErr } = await supabase
    .from('user_profiles')
    .select('user_id, target_roles, target_countries, target_cities')
    .eq('onboarding_completed', true)
    .order('updated_at', { ascending: false })
    .limit(MAX_USERS_PER_RUN);

  if (profilesErr) {
    console.error('[opportunity-ingest] profiles error:', profilesErr);
    return NextResponse.json({ error: 'Failed to load profiles' }, { status: 500 });
  }

  for (const row of (profiles ?? []) as UserProfileRow[]) {
    const targetRole = (row.target_roles ?? [])[0];
    const country = (row.target_countries ?? [])
      .map((c) => c.toLowerCase())
      .find((c) => ADZUNA_SUPPORTED_COUNTRIES.has(c));
    if (!targetRole || !country) {
      stats.skipped += 1;
      continue;
    }
    stats.considered += 1;

    const city = (row.target_cities ?? [])[0]?.split(',')[0]?.trim() ?? null;

    let jobs: AdzunaJob[];
    try {
      jobs = await fetchAdzunaJobs({
        country,
        query: targetRole,
        city,
        limit: MAX_PER_USER,
      });
    } catch (err) {
      console.error('[opportunity-ingest] adzuna error for user', row.user_id, err);
      stats.apiErrors += 1;
      continue;
    }

    if (jobs.length === 0) continue;

    // Skip jobs the user already has an opportunity row for (case-insensitive
    // match on company+role). One DB read per user is cheap enough.
    const { data: existing } = await supabase
      .from('opportunities')
      .select('company_name, role_title')
      .eq('user_id', row.user_id);
    const existingKeys = new Set(
      ((existing ?? []) as Array<{ company_name: string; role_title: string }>).map((e) =>
        `${e.company_name}::${e.role_title}`.toLowerCase()
      )
    );

    const candidates = jobs.filter((j) => {
      const company = j.company?.display_name ?? '';
      const title = j.title ?? '';
      if (!company || !title) return false;
      return !existingKeys.has(`${company}::${title}`.toLowerCase());
    });

    if (candidates.length === 0) continue;

    const inserts = candidates.slice(0, MAX_PER_USER).map((j) => {
      const company = (j.company?.display_name ?? '').trim();
      const title = (j.title ?? '').trim();
      const description = (j.description ?? '').trim();
      const salary =
        j.salary_min && j.salary_max
          ? `Salary: ${Math.round(j.salary_min).toLocaleString()}–${Math.round(j.salary_max).toLocaleString()}\n\n`
          : '';
      const noteLines = [
        salary,
        description ? `${description.slice(0, 800)}${description.length > 800 ? '…' : ''}` : '',
      ]
        .filter(Boolean)
        .join('');
      return {
        user_id: row.user_id,
        action_type: 'propose_opportunity_create' as const,
        payload_json: {
          companyName: company,
          roleTitle: title,
          stage: 'applied',
          notes: noteLines || undefined,
          sourceUrl: j.redirect_url || undefined,
        },
        status: 'drafted' as const,
        requires_external_send: actionRequiresExternalSend('propose_opportunity_create'),
      };
    });

    const { error: insertErr } = await supabase.from('agent_actions').insert(inserts);
    if (insertErr) {
      console.error('[opportunity-ingest] insert error for user', row.user_id, insertErr);
      stats.skipped += 1;
      continue;
    }
    stats.drafted += inserts.length;
  }

  return NextResponse.json({ data: stats });
}
