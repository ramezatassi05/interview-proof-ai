import type { LLMAnalysis, ExtractedJD, RoundType } from '@/types';

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
    if (analysis.personalizedCoaching.priorityActions.length < 1) {
      analysis.personalizedCoaching.priorityActions = originalActions;
      warnings.push('Priority actions filter would violate min(1), keeping originals');
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
