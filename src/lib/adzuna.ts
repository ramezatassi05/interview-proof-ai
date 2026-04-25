// ============================================
// Adzuna API Client (Fallback)
// 16 countries, free tier (250 calls/day)
// ============================================

import type { JobMarketContext, CareerStage, TargetDomain } from '@/types';
import { getCountryByCode } from './location-data';
import { getSeniorityModifier } from './seniority';

const TIMEOUT_MS = 5000;

// Adzuna uses lowercase 2-letter country codes in the URL
const ADZUNA_SUPPORTED_COUNTRIES = new Set([
  'at',
  'au',
  'be',
  'br',
  'ca',
  'de',
  'fr',
  'gb',
  'in',
  'it',
  'nl',
  'nz',
  'pl',
  'sg',
  'us',
  'za',
]);

const DOMAIN_KEYWORDS: Record<TargetDomain, string> = {
  swe: 'software engineer',
  ds: 'data scientist',
  design: 'product designer',
  pm: 'product manager',
  security: 'cybersecurity engineer',
  cloud: 'cloud engineer',
  marketing: 'marketing manager',
  business: 'business analyst',
  general: 'tech',
};

interface AdzunaJob {
  company?: { display_name?: string };
  title?: string;
  location?: { display_name?: string };
  salary_min?: number;
  salary_max?: number;
  created?: string;
}

interface AdzunaResponse {
  results?: AdzunaJob[];
  count?: number;
}

export async function searchJobsAdzuna(params: {
  countries: string[];
  cities: string[];
  targetRole: string;
  targetDomain: TargetDomain | null;
  careerStage: CareerStage | null;
  yearsExperience: number | null;
}): Promise<JobMarketContext | null> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) return null;

  // Find the first supported country
  const supportedCountry = params.countries
    .map((c) => c.toLowerCase())
    .find((c) => ADZUNA_SUPPORTED_COUNTRIES.has(c));

  if (!supportedCountry) return null;

  const roleQuery =
    params.targetRole.trim() ||
    (params.targetDomain ? DOMAIN_KEYWORDS[params.targetDomain] : 'software');
  const modifier = getSeniorityModifier(params.careerStage, params.yearsExperience);
  const isStudent = params.careerStage === 'student';
  let query = roleQuery;
  if (modifier === 'intern') {
    query = `${roleQuery} intern`;
  } else if (modifier) {
    query = `${modifier} ${roleQuery}`;
  }

  const locationQuery =
    params.cities.length > 0
      ? params.cities[0].split(',')[0].trim() // Use first city name
      : '';

  const searchParams = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    what: query,
    results_per_page: '20',
    max_days_old: '1', // Only today's listings for freshness
  });

  if (locationQuery) {
    searchParams.set('where', locationQuery);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(
      `https://api.adzuna.com/v1/api/jobs/${supportedCountry}/search/1?${searchParams.toString()}`,
      { signal: controller.signal }
    );

    if (!res.ok) return null;

    const json = (await res.json()) as AdzunaResponse;
    const jobs = json.results ?? [];
    const totalCount = json.count ?? jobs.length;

    // Extract top employers
    const employerCounts = new Map<string, number>();
    for (const job of jobs) {
      const name = job.company?.display_name;
      if (name) {
        employerCounts.set(name, (employerCounts.get(name) ?? 0) + 1);
      }
    }
    const topEmployers = [...employerCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);

    // Salary range
    const salaries = jobs
      .filter((j) => j.salary_min && j.salary_max)
      .map((j) => ({ min: j.salary_min!, max: j.salary_max! }));

    const salaryRange =
      salaries.length >= 3
        ? {
            min: Math.min(...salaries.map((s) => s.min)),
            max: Math.max(...salaries.map((s) => s.max)),
            currency: supportedCountry === 'us' ? 'USD' : supportedCountry === 'gb' ? 'GBP' : 'EUR',
          }
        : undefined;

    const countryName =
      getCountryByCode(supportedCountry.toUpperCase())?.name ?? supportedCountry.toUpperCase();
    const locationSummary = locationQuery || countryName;

    return {
      totalListings: totalCount,
      locationSummary,
      roleSummary:
        params.targetRole || (params.targetDomain ? DOMAIN_KEYWORDS[params.targetDomain] : 'tech'),
      topEmployers,
      salaryRange,
      isInternshipOnly: isStudent,
      fetchedAt: new Date().toISOString(),
      source: 'adzuna',
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
