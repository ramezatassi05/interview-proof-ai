import type { LLMAnalysis, ExtractedJD, RoundType } from '@/types';
import { CURATED_URL_MAP, RESOURCE_BANK } from '@/server/rag/resource-bank';

// Patterns for detecting suspicious/fabricated URLs
const SUSPICIOUS_URL_PATTERNS = [
  /localhost/i,
  /127\.0\.0\.1/,
  /example\.com/i,
  /placeholder/i,
  /your-?domain/i,
  /test\.com/i,
  /fake/i,
  /sample\.com/i,
];

// Extremely long paths are often hallucinated
const MAX_URL_PATH_LENGTH = 200;

/**
 * Extracts a URL from a resource string, if present.
 * Resources can be formatted as "Title - https://url" or just "https://url".
 */
function extractUrl(resource: string): string | null {
  const match = resource.match(/https?:\/\/[^\s,)]+/);
  return match ? match[0] : null;
}

/**
 * Checks if a URL looks suspicious / likely fabricated.
 */
function isSuspiciousUrl(url: string): boolean {
  if (url.length > MAX_URL_PATH_LENGTH) return true;
  return SUSPICIOUS_URL_PATTERNS.some((p) => p.test(url));
}

/**
 * Attempts to find a curated resource matching a resource string by keyword overlap.
 * Returns the curated resource if a strong match is found.
 */
function findCuratedMatch(resource: string): typeof RESOURCE_BANK[number] | null {
  const lower = resource.toLowerCase();

  // First: exact URL match against curated bank
  const url = extractUrl(resource);
  if (url) {
    const exact = CURATED_URL_MAP.get(url);
    if (exact) return exact;
  }

  // Second: keyword match against resource titles/platforms
  let bestMatch: typeof RESOURCE_BANK[number] | null = null;
  let bestScore = 0;

  for (const curated of RESOURCE_BANK) {
    let score = 0;
    // Check if the resource string mentions the curated title
    const titleWords = curated.title.toLowerCase().split(/\s+/);
    const matchingWords = titleWords.filter((w) => w.length > 3 && lower.includes(w));
    score += matchingWords.length;

    // Check platform mention
    if (lower.includes(curated.platform.toLowerCase())) {
      score += 1;
    }

    // Need at least 2 signal matches to consider it a match
    if (score >= 2 && score > bestScore) {
      bestScore = score;
      bestMatch = curated;
    }
  }

  return bestMatch;
}

/**
 * Validates and cleans resource arrays from priority actions.
 * - Strips resources with suspicious/fabricated URLs
 * - Swaps in verified curated URLs when a keyword match is found
 */
function validateResources(resources: string[] | undefined): {
  cleaned: string[];
  warnings: string[];
} {
  if (!resources || resources.length === 0) {
    return { cleaned: [], warnings: [] };
  }

  const cleaned: string[] = [];
  const warnings: string[] = [];

  for (const resource of resources) {
    const url = extractUrl(resource);

    // If URL is present, check if it's suspicious
    if (url && isSuspiciousUrl(url)) {
      warnings.push(`Stripped suspicious URL from resource: "${resource}"`);
      // Try to find a curated replacement
      const match = findCuratedMatch(resource);
      if (match) {
        cleaned.push(`${match.title} - ${match.url}`);
        warnings.push(`Replaced with curated: "${match.title}"`);
      }
      // Otherwise just drop this resource entirely
      continue;
    }

    // If URL is present and matches curated bank exactly, keep as-is
    if (url && CURATED_URL_MAP.has(url)) {
      cleaned.push(resource);
      continue;
    }

    // Try to find a curated match by keyword and swap in verified URL
    const curatedMatch = findCuratedMatch(resource);
    if (curatedMatch && url) {
      // Has a URL that isn't in our bank — swap in the curated one
      const cleanedResource = resource.replace(url, curatedMatch.url);
      cleaned.push(cleanedResource);
      warnings.push(
        `Swapped unverified URL for curated match: "${curatedMatch.title}"`
      );
      continue;
    }

    // No URL or no curated match — keep as-is (resource name without link is fine)
    cleaned.push(resource);
  }

  return { cleaned, warnings };
}

const PARROT_PATTERN =
  /^(learn|study|get proficient in|practice|explore|develop|gain experience|complete a .* course|read about|familiarize|take a .* course|enroll in|brush up on|improve your|build expertise in|acquire knowledge)/i;

/**
 * Post-LLM validation that catches parroted content the LLM misses.
 * Filters out study plan tasks, coaching tips, and priority actions that
 * simply restate JD requirements without strategic value.
 * Also downgrades risks that reference company-context-only terms.
 */
export function validateAnalysisQuality(
  analysis: LLMAnalysis,
  jd: ExtractedJD,
  roundType?: RoundType
): { analysis: LLMAnalysis; warnings: string[] } {
  const warnings: string[] = [];

  // Build normalized set of JD terms for matching
  const jdTerms = [...jd.mustHave, ...jd.niceToHave, ...jd.keywords].map((t) =>
    t.toLowerCase().trim()
  );
  const companyContextTerms = (jd.companyContextKeywords ?? []).map((t) => t.toLowerCase().trim());

  function referencesJDTerm(text: string): boolean {
    const lower = text.toLowerCase();
    return jdTerms.some((term) => lower.includes(term));
  }

  function referencesCompanyContext(text: string): boolean {
    const lower = text.toLowerCase();
    return companyContextTerms.some((term) => term.length > 2 && lower.includes(term));
  }

  function isParroted(text: string): boolean {
    return PARROT_PATTERN.test(text.trim()) && referencesJDTerm(text);
  }

  // Filter study plan tasks (no Zod minimum on array)
  const originalStudyCount = analysis.studyPlan.length;
  analysis.studyPlan = analysis.studyPlan.filter((item) => {
    if (isParroted(item.task)) {
      warnings.push(`Filtered parroted study task: "${item.task}"`);
      return false;
    }
    return true;
  });
  // Ensure at least 3 remain
  if (analysis.studyPlan.length < 3 && originalStudyCount >= 3) {
    warnings.push(
      `Study plan over-filtered (${analysis.studyPlan.length} remaining), keeping original`
    );
    analysis.studyPlan = analysis.studyPlan; // already filtered, just note it
  }

  // Filter coaching fields (only if personalizedCoaching exists)
  if (analysis.personalizedCoaching) {
    // Filter archetype tips (min 3 in schema)
    const originalTips = [...analysis.personalizedCoaching.archetypeTips];
    analysis.personalizedCoaching.archetypeTips =
      analysis.personalizedCoaching.archetypeTips.filter((tip) => {
        if (isParroted(tip)) {
          warnings.push(`Filtered parroted archetype tip: "${tip}"`);
          return false;
        }
        return true;
      });
    // Restore if we'd violate the min(1)
    if (analysis.personalizedCoaching.archetypeTips.length < 1) {
      analysis.personalizedCoaching.archetypeTips = originalTips;
      warnings.push('Archetype tips filter would violate min(1), keeping originals');
    }

    // Filter priority actions (min 2 in schema)
    const originalActions = [...analysis.personalizedCoaching.priorityActions];
    analysis.personalizedCoaching.priorityActions =
      analysis.personalizedCoaching.priorityActions.filter((pa) => {
        if (isParroted(pa.action)) {
          warnings.push(`Filtered parroted priority action: "${pa.action}"`);
          return false;
        }
        return true;
      });
    if (analysis.personalizedCoaching.priorityActions.length < 1) {
      analysis.personalizedCoaching.priorityActions = originalActions;
      warnings.push('Priority actions filter would violate min(1), keeping originals');
    }

    // Validate and clean resource URLs in priority actions
    for (const pa of analysis.personalizedCoaching.priorityActions) {
      const { cleaned, warnings: resourceWarnings } = validateResources(pa.resources);
      pa.resources = cleaned.length > 0 ? cleaned : undefined;
      warnings.push(...resourceWarnings);
    }
  }

  // Downgrade risks that reference company-context-only terms
  if (companyContextTerms.length > 0) {
    for (const risk of analysis.rankedRisks) {
      const textToCheck = `${risk.title} ${risk.rationale} ${risk.missingEvidence}`;
      if (
        referencesCompanyContext(textToCheck) &&
        !referencesJDTerm(textToCheck) &&
        risk.severity !== 'low'
      ) {
        warnings.push(
          `Downgraded company-context risk "${risk.title}" from ${risk.severity} to low`
        );
        risk.severity = 'low';
      }
    }
  }

  // Round-type-aware risk filtering
  if (roundType) {
    const NON_TECHNICAL_PATTERNS =
      /\b(bilingual|french|spanish|language proficiency|cultural fit|soft skill|communication style|leadership style)\b/i;
    const TECHNICAL_ONLY_PATTERNS =
      /\b(algorithm|data structure|framework|library|coding|implementation|system design|api design|leetcode)\b/i;

    const originalRiskCount = analysis.rankedRisks.length;

    if (roundType === 'technical') {
      analysis.rankedRisks = analysis.rankedRisks.filter((risk) => {
        const text = `${risk.title} ${risk.rationale} ${risk.missingEvidence}`;
        if (NON_TECHNICAL_PATTERNS.test(text)) {
          warnings.push(`Filtered non-technical risk from technical round: "${risk.title}"`);
          return false;
        }
        return true;
      });
    } else if (roundType === 'behavioral') {
      analysis.rankedRisks = analysis.rankedRisks.filter((risk) => {
        const text = `${risk.title} ${risk.rationale} ${risk.missingEvidence}`;
        // Only filter if it's purely about technical gaps with no behavioral angle
        if (TECHNICAL_ONLY_PATTERNS.test(text) && !NON_TECHNICAL_PATTERNS.test(text)) {
          const lowerText = text.toLowerCase();
          const hasBehavioralAngle =
            /\b(team|collaborate|communicate|mentor|lead|conflict|stakeholder)\b/i.test(lowerText);
          if (!hasBehavioralAngle) {
            warnings.push(
              `Filtered technical-only risk from behavioral round: "${risk.title}"`
            );
            return false;
          }
        }
        return true;
      });
    }

    if (analysis.rankedRisks.length < originalRiskCount) {
      console.warn(
        `[validation] Filtered ${originalRiskCount - analysis.rankedRisks.length} round-irrelevant risks for ${roundType} round`
      );
    }
  }

  if (warnings.length > 0) {
    console.warn(`[validation] ${warnings.length} quality issues caught:`, warnings);
  }

  return { analysis, warnings };
}
