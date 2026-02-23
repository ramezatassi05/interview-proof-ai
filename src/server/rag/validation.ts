import type { LLMAnalysis, ExtractedJD } from '@/types';

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
  jd: ExtractedJD
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
    // Restore if we'd violate the min(3)
    if (analysis.personalizedCoaching.archetypeTips.length < 3) {
      analysis.personalizedCoaching.archetypeTips = originalTips;
      warnings.push('Archetype tips filter would violate min(3), keeping originals');
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
    if (analysis.personalizedCoaching.priorityActions.length < 2) {
      analysis.personalizedCoaching.priorityActions = originalActions;
      warnings.push('Priority actions filter would violate min(2), keeping originals');
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

  if (warnings.length > 0) {
    console.warn(`[validation] ${warnings.length} quality issues caught:`, warnings);
  }

  return { analysis, warnings };
}
