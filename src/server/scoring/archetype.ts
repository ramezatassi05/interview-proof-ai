import type {
  LLMAnalysis,
  ExtractedResume,
  ExtractedJD,
  ArchetypeProfile,
  InterviewArchetypeType,
} from '@/types';

const ARCHETYPE_VERSION = 'v0.1';

// Archetype definitions with labels and descriptions
const ARCHETYPE_DEFINITIONS: Record<
  InterviewArchetypeType,
  { label: string; description: string; coachingTips: string[] }
> = {
  technical_potential_low_polish: {
    label: 'Technical Potential, Low Polish',
    description:
      'Strong technical foundation but communication and presentation need work. Your skills are there, but interviewers may not see them clearly.',
    coachingTips: [
      'Practice explaining complex concepts in simple terms',
      'Use the STAR method for behavioral questions',
      'Record yourself answering questions and review for clarity',
      'Focus on structuring answers with clear beginning, middle, and end',
    ],
  },
  strong_theoretical_weak_execution: {
    label: 'Strong Theory, Weak Execution',
    description:
      'Good conceptual understanding but lacking concrete examples and demonstrable experience. Interviewers will want to see more "show" than "tell".',
    coachingTips: [
      'Prepare 5-7 detailed project stories with specific metrics',
      'Practice live coding with someone watching',
      'Build side projects that demonstrate applied skills',
      'Quantify your impact wherever possible',
    ],
  },
  resume_strong_system_weak: {
    label: 'Resume Strong, System Weak',
    description:
      'Impressive resume but may struggle with system design and architectural thinking. Great at individual contributions but needs to demonstrate bigger-picture thinking.',
    coachingTips: [
      'Study system design fundamentals and common patterns',
      'Practice whiteboard design sessions',
      'Learn to think about scalability and trade-offs',
      'Prepare to discuss how your work fits into larger systems',
    ],
  },
  balanced_but_unproven: {
    label: 'Balanced But Unproven',
    description:
      'Solid across all dimensions but no standout strengths. May need to differentiate yourself more clearly to stand out from other candidates.',
    coachingTips: [
      'Identify and develop a signature strength area',
      'Prepare memorable stories that showcase unique contributions',
      'Find ways to demonstrate passion and initiative',
      'Consider what makes your perspective unique',
    ],
  },
  high_ceiling_low_volume_practice: {
    label: 'High Ceiling, Low Practice Volume',
    description:
      'Clear potential for excellence but needs more interview practice. Natural ability is evident but execution under pressure may be inconsistent.',
    coachingTips: [
      'Schedule at least 10 mock interviews before your target',
      'Practice under time pressure regularly',
      'Seek feedback on communication style and presence',
      'Build interview muscle memory through repetition',
    ],
  },
};

/**
 * Classifies candidate into an interview archetype based on score patterns.
 * Deterministic classification - same inputs always produce same outputs.
 *
 * @param analysis - The LLM analysis output
 * @param personalizedTips - Optional LLM-generated tips to override hardcoded defaults
 * @param resume - Optional extracted resume data for evidence-backed descriptions
 * @param jd - Optional extracted JD data for evidence-backed descriptions
 */
export function classifyArchetype(
  analysis: LLMAnalysis,
  personalizedTips?: string[],
  resume?: ExtractedResume,
  jd?: ExtractedJD
): ArchetypeProfile {
  const { categoryScores } = analysis;
  const { hardMatch, evidenceDepth, roundReadiness, clarity, companyProxy } = categoryScores;

  // Check for practice-related signals in risks
  const hasPracticeRisks = analysis.rankedRisks.some(
    (r) =>
      r.title.toLowerCase().includes('practice') ||
      r.title.toLowerCase().includes('preparation') ||
      r.rationale.toLowerCase().includes('practice')
  );

  // Classification rules (in priority order)
  let archetype: InterviewArchetypeType;
  let confidence: number;

  // Rule 1: Technical Potential, Low Polish
  // High hard skills match but low communication clarity
  if (hardMatch >= 0.7 && clarity < 0.5) {
    archetype = 'technical_potential_low_polish';
    confidence = Math.min(1, (hardMatch - clarity) * 1.5);
  }
  // Rule 2: Strong Theoretical, Weak Execution
  // Low evidence depth and round readiness (can't demonstrate skills)
  else if (evidenceDepth < 0.5 && roundReadiness < 0.5) {
    archetype = 'strong_theoretical_weak_execution';
    confidence = Math.min(1, (1 - evidenceDepth) * 0.5 + (1 - roundReadiness) * 0.5);
  }
  // Rule 3: Resume Strong, System Weak
  // High clarity but low round readiness (good resume but not interview-ready)
  else if (clarity >= 0.7 && roundReadiness < 0.5) {
    archetype = 'resume_strong_system_weak';
    confidence = Math.min(1, (clarity - roundReadiness) * 1.2);
  }
  // Rule 4: High Ceiling, Low Practice Volume
  // High hard match with practice-related risks
  else if (hardMatch >= 0.75 && hasPracticeRisks) {
    archetype = 'high_ceiling_low_volume_practice';
    confidence = hardMatch * 0.8;
  }
  // Rule 5: Balanced But Unproven
  // All scores in the middle range (0.4-0.6)
  else if (
    hardMatch >= 0.4 &&
    hardMatch <= 0.7 &&
    evidenceDepth >= 0.4 &&
    evidenceDepth <= 0.7 &&
    roundReadiness >= 0.4 &&
    roundReadiness <= 0.7 &&
    clarity >= 0.4 &&
    clarity <= 0.7 &&
    companyProxy >= 0.4 &&
    companyProxy <= 0.7
  ) {
    archetype = 'balanced_but_unproven';
    // Lower confidence as this is a fallback pattern
    const spread =
      Math.max(hardMatch, evidenceDepth, roundReadiness, clarity, companyProxy) -
      Math.min(hardMatch, evidenceDepth, roundReadiness, clarity, companyProxy);
    confidence = Math.max(0.4, 0.8 - spread);
  }
  // Default fallback: use the most prominent pattern
  else {
    // Find the weakest area to determine archetype
    const scores = { hardMatch, evidenceDepth, roundReadiness, clarity, companyProxy };
    const minScore = Math.min(...Object.values(scores));

    if (minScore === clarity) {
      archetype = 'technical_potential_low_polish';
    } else if (minScore === evidenceDepth || minScore === roundReadiness) {
      archetype = 'strong_theoretical_weak_execution';
    } else {
      archetype = 'balanced_but_unproven';
    }
    confidence = 0.5; // Lower confidence for fallback
  }

  const definition = ARCHETYPE_DEFINITIONS[archetype];

  // Use personalized tips if provided, otherwise fall back to hardcoded defaults
  const tips =
    personalizedTips && personalizedTips.length >= 3 ? personalizedTips : definition.coachingTips;

  // Build evidence-backed description when extracted data is available
  let description = definition.description;
  if (resume && jd) {
    const topSkills = resume.skills.slice(0, 3).join(', ');
    const clarityPct = Math.round(clarity * 100);
    const evidencePct = Math.round(evidenceDepth * 100);

    const evidenceParts: string[] = [];
    if (topSkills) {
      evidenceParts.push(`Your skills in ${topSkills} are noted`);
    }
    if (archetype === 'technical_potential_low_polish' && clarityPct < 50) {
      evidenceParts.push(
        `but your resume clarity score (${clarityPct}%) suggests presentation gaps`
      );
    } else if (archetype === 'strong_theoretical_weak_execution' && evidencePct < 50) {
      evidenceParts.push(
        `but evidence depth (${evidencePct}%) suggests limited concrete demonstrations`
      );
    } else if (archetype === 'resume_strong_system_weak') {
      evidenceParts.push(
        `with strong clarity (${clarityPct}%) but round readiness at ${Math.round(roundReadiness * 100)}%`
      );
    } else if (archetype === 'balanced_but_unproven') {
      evidenceParts.push(
        `across ${resume.experiences.length} role${resume.experiences.length !== 1 ? 's' : ''} with no standout dimension`
      );
    } else if (archetype === 'high_ceiling_low_volume_practice') {
      evidenceParts.push(
        `matching ${jd.mustHave.length > 0 ? `JD requirements well (${Math.round(hardMatch * 100)}%)` : 'the role'} but practice gaps remain`
      );
    }

    if (evidenceParts.length > 0) {
      description = `${definition.description} ${evidenceParts.join(', ')}.`;
    }
  }

  return {
    archetype,
    confidence: Math.round(confidence * 100) / 100, // Round to 2 decimal places
    label: definition.label,
    description,
    coachingTips: tips,
    version: ARCHETYPE_VERSION,
  };
}
