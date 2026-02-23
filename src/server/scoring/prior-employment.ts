import type {
  ExtractedResume,
  ExtractedJD,
  PriorEmploymentSignal,
  PriorEmploymentStint,
} from '@/types';
import { normalizeCompanyName } from './company-difficulty';

const PRIOR_EMPLOYMENT_VERSION = 'v0.1';

const CURRENT_YEAR = new Date().getFullYear();

// Base boost points
const BASE_BOOSTS = {
  readiness: 8,
  conversion: 12,
  technicalFit: 5,
} as const;

/**
 * Parses a date range string into start/end years and current status.
 * Handles: "Jan 2020 - Dec 2022", "2020 - 2022", "March 2021 - Present"
 */
export function parseDateRange(dates: string): {
  startYear: number;
  endYear: number;
  isCurrent: boolean;
} | null {
  if (!dates) return null;

  const normalized = dates.trim().toLowerCase();
  const isCurrent = /present|current|now|ongoing/i.test(normalized);

  // Match patterns like "Jan 2020 - Dec 2022" or "2020 - 2022" or "March 2021 - Present"
  const yearPattern = /(\d{4})/g;
  const years = [...normalized.matchAll(yearPattern)].map((m) => parseInt(m[1], 10));

  if (years.length === 0) return null;

  const startYear = years[0];
  const endYear = isCurrent ? CURRENT_YEAR : (years[1] ?? startYear);

  return { startYear, endYear, isCurrent };
}

/**
 * Computes the recency multiplier based on years since leaving.
 */
function getRecencyMultiplier(yearsAgo: number, isCurrent: boolean): number {
  if (isCurrent) return 1.15;
  if (yearsAgo < 1) return 1.0;
  if (yearsAgo <= 3) return 0.75;
  if (yearsAgo <= 5) return 0.5;
  return 0.3;
}

/**
 * Computes the duration multiplier based on total years at company.
 */
function getDurationMultiplier(totalYears: number): number {
  if (totalYears >= 2) return 1.0;
  if (totalYears >= 1) return 0.8;
  if (totalYears >= 0.5) return 0.6;
  return 0.35;
}

/**
 * Checks if a resume company name matches the JD company name.
 * Uses normalized exact match + substring containment.
 */
function isCompanyMatch(resumeCompany: string, jdCompanyNormalized: string): boolean {
  const resumeNormalized = normalizeCompanyName(resumeCompany);

  // Exact match after normalization
  if (resumeNormalized === jdCompanyNormalized) return true;

  // Substring containment (e.g., "Ericsson Canada" contains "ericsson")
  if (resumeNormalized.includes(jdCompanyNormalized)) return true;
  if (jdCompanyNormalized.includes(resumeNormalized)) return true;

  return false;
}

/**
 * Detects prior employment at the target company and computes score boosts.
 * Deterministic computation — same inputs always produce same outputs.
 */
export function detectPriorEmployment(
  extractedResume: ExtractedResume,
  extractedJD: ExtractedJD
): PriorEmploymentSignal {
  const noMatch: PriorEmploymentSignal = {
    detected: false,
    companyName: extractedJD.companyName ?? '',
    stints: [],
    totalYearsAtCompany: 0,
    mostRecentDepartureYearsAgo: 0,
    isInternalTransfer: false,
    boosts: { readinessBoost: 0, conversionBoost: 0, technicalFitBoost: 0 },
    version: PRIOR_EMPLOYMENT_VERSION,
  };

  if (!extractedJD.companyName) return noMatch;

  const jdCompanyNormalized = normalizeCompanyName(extractedJD.companyName);
  if (!jdCompanyNormalized) return noMatch;

  // Find matching stints in resume
  const stints: PriorEmploymentStint[] = [];

  for (const exp of extractedResume.experiences) {
    if (!isCompanyMatch(exp.company, jdCompanyNormalized)) continue;

    const parsed = parseDateRange(exp.dates);
    if (!parsed) {
      // If dates can't be parsed, still count the stint with conservative defaults
      stints.push({
        role: exp.role,
        durationYears: 1,
        yearsAgo: 3,
        isCurrent: false,
      });
      continue;
    }

    const durationYears = Math.max(0, parsed.endYear - parsed.startYear) || 0.5; // minimum 6 months
    const yearsAgo = parsed.isCurrent ? 0 : Math.max(0, CURRENT_YEAR - parsed.endYear);

    stints.push({
      role: exp.role,
      durationYears: Math.round(durationYears * 10) / 10,
      yearsAgo,
      isCurrent: parsed.isCurrent,
    });
  }

  if (stints.length === 0) return noMatch;

  // Aggregate
  const totalYearsAtCompany = Math.round(
    stints.reduce((sum, s) => sum + s.durationYears, 0) * 10
  ) / 10;

  const mostRecentStint = stints.reduce((best, s) =>
    s.yearsAgo < best.yearsAgo ? s : best
  );
  const mostRecentDepartureYearsAgo = mostRecentStint.yearsAgo;
  const isInternalTransfer = mostRecentStint.isCurrent;

  // Compute boosts
  const recencyMultiplier = getRecencyMultiplier(mostRecentDepartureYearsAgo, isInternalTransfer);
  const durationMultiplier = getDurationMultiplier(totalYearsAtCompany);

  const readinessBoost = Math.round(BASE_BOOSTS.readiness * recencyMultiplier * durationMultiplier);
  const conversionBoost = Math.round(BASE_BOOSTS.conversion * recencyMultiplier * durationMultiplier);
  const technicalFitBoost = Math.round(BASE_BOOSTS.technicalFit * recencyMultiplier * durationMultiplier);

  return {
    detected: true,
    companyName: extractedJD.companyName,
    stints,
    totalYearsAtCompany,
    mostRecentDepartureYearsAgo,
    isInternalTransfer,
    boosts: { readinessBoost, conversionBoost, technicalFitBoost },
    version: PRIOR_EMPLOYMENT_VERSION,
  };
}
