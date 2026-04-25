// ============================================
// JSearch API Client (RapidAPI)
// Aggregates LinkedIn, Indeed, Glassdoor
// ============================================

import type { JobMarketContext, CareerStage, TargetDomain } from '@/types';
import { getCountryByCode } from './location-data';
import { getSeniorityModifier } from './seniority';

const RAPIDAPI_HOST = 'jsearch.p.rapidapi.com';
const TIMEOUT_MS = 5000;

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

interface JSearchJob {
  employer_name?: string;
  job_title?: string;
  job_city?: string;
  job_state?: string;
  job_country?: string;
  job_min_salary?: number;
  job_max_salary?: number;
  job_salary_currency?: string;
  job_employment_type?: string;
  job_posted_at_datetime_utc?: string;
}

interface JSearchResponse {
  status: string;
  data?: JSearchJob[];
  request_id?: string;
}

function buildQuery(
  targetRole: string,
  targetDomain: TargetDomain | null,
  careerStage: CareerStage | null,
  yearsExperience: number | null
): string {
  const base = targetRole.trim() || (targetDomain ? DOMAIN_KEYWORDS[targetDomain] : 'software');
  const modifier = getSeniorityModifier(careerStage, yearsExperience);

  if (!modifier) return base;
  // "intern" appended (e.g. "software engineer intern") for better API results
  if (modifier === 'intern') return `${base} intern`;
  // All others prepended (e.g. "junior software engineer", "senior data scientist")
  return `${modifier} ${base}`;
}

function buildLocationString(countries: string[], cities: string[]): string {
  if (cities.length > 0) return cities.slice(0, 3).join(', ');
  return countries
    .slice(0, 3)
    .map((code) => getCountryByCode(code)?.name ?? code)
    .join(', ');
}

export async function searchJobs(params: {
  countries: string[];
  cities: string[];
  targetRole: string;
  targetDomain: TargetDomain | null;
  careerStage: CareerStage | null;
  yearsExperience: number | null;
}): Promise<JobMarketContext | null> {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) return null;

  const query = buildQuery(
    params.targetRole,
    params.targetDomain,
    params.careerStage,
    params.yearsExperience
  );
  const location = buildLocationString(params.countries, params.cities);
  const isStudent = params.careerStage === 'student';

  const searchParams = new URLSearchParams({
    query: `${query} in ${location}`,
    page: '1',
    num_pages: '1',
    date_posted: 'today',
  });

  if (isStudent) {
    searchParams.set('employment_types', 'INTERN');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`https://${RAPIDAPI_HOST}/search?${searchParams.toString()}`, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': RAPIDAPI_HOST,
      },
      signal: controller.signal,
    });

    if (!res.ok) return null;

    const json = (await res.json()) as JSearchResponse;
    const jobs = json.data ?? [];

    // Extract top employers (deduplicated)
    const employerCounts = new Map<string, number>();
    for (const job of jobs) {
      if (job.employer_name) {
        employerCounts.set(job.employer_name, (employerCounts.get(job.employer_name) ?? 0) + 1);
      }
    }
    const topEmployers = [...employerCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);

    // Extract salary range
    const salaries = jobs
      .filter((j) => j.job_min_salary && j.job_max_salary)
      .map((j) => ({ min: j.job_min_salary!, max: j.job_max_salary! }));

    const salaryRange =
      salaries.length >= 3
        ? {
            min: Math.min(...salaries.map((s) => s.min)),
            max: Math.max(...salaries.map((s) => s.max)),
            currency: jobs.find((j) => j.job_salary_currency)?.job_salary_currency ?? 'USD',
          }
        : undefined;

    return {
      totalListings: jobs.length,
      locationSummary: location,
      roleSummary:
        params.targetRole || (params.targetDomain ? DOMAIN_KEYWORDS[params.targetDomain] : 'tech'),
      topEmployers,
      salaryRange,
      isInternshipOnly: isStudent,
      fetchedAt: new Date().toISOString(),
      source: 'jsearch',
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
