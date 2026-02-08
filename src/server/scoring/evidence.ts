import type { LLMAnalysis, ExtractedResume, ExtractedJD, EvidenceContext } from '@/types';

const EVIDENCE_VERSION = 'v0.1';

/**
 * Normalizes a string for fuzzy matching: lowercase, trim, remove punctuation.
 */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

/**
 * Checks if a resume skill matches a JD requirement using substring containment.
 */
function skillMatches(skill: string, requirement: string): boolean {
  const ns = normalize(skill);
  const nr = normalize(requirement);
  return ns.includes(nr) || nr.includes(ns);
}

/**
 * Finds which JD requirements are matched by resume skills.
 */
function findMatches(
  skills: string[],
  requirements: string[]
): { matched: string[]; unmatched: string[] } {
  const matched: string[] = [];
  const unmatched: string[] = [];

  for (const req of requirements) {
    const found = skills.some((s) => skillMatches(s, req));
    if (found) {
      matched.push(req);
    } else {
      unmatched.push(req);
    }
  }

  return { matched, unmatched };
}

/**
 * Computes evidence context by cross-referencing extracted resume/JD data
 * with LLM analysis scores. Every category gets a human-readable evidence string.
 *
 * Deterministic — same inputs always produce same outputs.
 */
export function computeEvidenceContext(
  analysis: LLMAnalysis,
  resume: ExtractedResume,
  jd: ExtractedJD
): EvidenceContext {
  // Must-have matching
  const mustHaveResult = findMatches(resume.skills, jd.mustHave);

  // Nice-to-have matching
  const niceToHaveResult = findMatches([...resume.skills, ...resume.recencySignals], jd.niceToHave);

  // Strongest metrics (top 3 quantified achievements)
  const strongestMetrics = resume.metrics.slice(0, 3);

  // Count total achievements across all experiences
  const totalAchievements = resume.experiences.reduce(
    (sum, exp) => sum + exp.achievements.length,
    0
  );

  // Count risks with round-specific keywords
  const roundKeywords = [
    'interview',
    'round',
    'preparation',
    'mock',
    'practice',
    'whiteboard',
    'coding challenge',
  ];
  const roundRisks = analysis.rankedRisks.filter((r) =>
    roundKeywords.some(
      (kw) => r.title.toLowerCase().includes(kw) || r.rationale.toLowerCase().includes(kw)
    )
  );

  // Build category evidence strings
  const categoryEvidence = {
    hardMatch:
      mustHaveResult.matched.length > 0
        ? `Matched ${mustHaveResult.matched.length} of ${jd.mustHave.length} must-have requirements: ${mustHaveResult.matched.join(', ')}.${mustHaveResult.unmatched.length > 0 ? ` Missing: ${mustHaveResult.unmatched.join(', ')}.` : ''}`
        : jd.mustHave.length > 0
          ? `No direct skill matches found for ${jd.mustHave.length} must-have requirements: ${jd.mustHave.join(', ')}.`
          : 'No must-have requirements specified in job description.',

    evidenceDepth: `${resume.experiences.length} role${resume.experiences.length !== 1 ? 's' : ''} with ${totalAchievements} achievement${totalAchievements !== 1 ? 's' : ''}.${strongestMetrics.length > 0 ? ` Strongest metrics: ${strongestMetrics.join('; ')}.` : ' No quantified metrics found.'}`,

    roundReadiness:
      roundRisks.length > 0
        ? `${roundRisks.length} interview-specific risk${roundRisks.length !== 1 ? 's' : ''} identified. Areas flagged: ${roundRisks.map((r) => r.title).join('; ')}.`
        : 'No interview-specific risks flagged.',

    clarity: `Resume includes ${resume.recencySignals.length} recent technology signal${resume.recencySignals.length !== 1 ? 's' : ''} and ${resume.projectEvidence.length} project description${resume.projectEvidence.length !== 1 ? 's' : ''}.${resume.recencySignals.length > 0 ? ` Technologies: ${resume.recencySignals.slice(0, 5).join(', ')}.` : ''}`,

    companyProxy:
      niceToHaveResult.matched.length > 0
        ? `Aligned with ${niceToHaveResult.matched.length} of ${jd.niceToHave.length} nice-to-have requirements: ${niceToHaveResult.matched.join(', ')}.${jd.senioritySignals.length > 0 ? ` Seniority signals in JD: ${jd.senioritySignals.join(', ')}.` : ''}`
        : jd.niceToHave.length > 0
          ? `No matches found for ${jd.niceToHave.length} nice-to-have requirements.${jd.senioritySignals.length > 0 ? ` Seniority signals in JD: ${jd.senioritySignals.join(', ')}.` : ''}`
          : 'No nice-to-have requirements specified in job description.',
  };

  return {
    categoryEvidence,
    matchedMustHaves: mustHaveResult.matched,
    unmatchedMustHaves: mustHaveResult.unmatched,
    matchedNiceToHaves: niceToHaveResult.matched,
    strongestMetrics,
  };
}

export { EVIDENCE_VERSION };
