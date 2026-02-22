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
      "Pick your strongest project and rehearse a 2-minute explanation using: Context → Challenge → Your Approach → Result → What You'd Do Differently",
      'Record yourself answering your top 3 likely interview questions, then watch back at 1.5x speed — note every filler word and vague phrase, and redo each one',
      'For each technical skill on your resume, prepare one concrete "proof story" with a specific metric or outcome you can cite in 30 seconds',
      'Structure every answer as: one-sentence thesis → supporting detail → so-what impact — practice until this framework feels natural',
    ],
  },
  strong_theoretical_weak_execution: {
    label: 'Strong Theory, Weak Execution',
    description:
      'Good conceptual understanding but lacking concrete examples and demonstrable experience. Interviewers will want to see more "show" than "tell".',
    coachingTips: [
      "Take your best theoretical knowledge area and write a concrete walkthrough of how you'd apply it to a real problem from your past work — this becomes your go-to interview story",
      'For each resume bullet that says "worked on" or "contributed to", rewrite it as "I specifically did X which resulted in Y" — then rehearse those versions aloud',
      'Pick one small project you can build in a weekend that demonstrates your strongest skill with measurable output (e.g., a load test, a deployed API, a data pipeline)',
      'Quantify every achievement: if you don\'t have exact numbers, estimate conservatively and say "approximately" — vague impact is worse than approximate impact',
    ],
  },
  resume_strong_system_weak: {
    label: 'Resume Strong, System Weak',
    description:
      'Impressive resume but may struggle with system design and architectural thinking. Great at individual contributions but needs to demonstrate bigger-picture thinking.',
    coachingTips: [
      "Pick the largest system you've worked on, diagram its architecture from memory, then identify 3 scaling bottlenecks and how you'd address them — this is your system design anchor story",
      'For each project on your resume, prepare a 1-minute answer to "how would you scale this 10x?" covering data, compute, and network layers',
      'Practice drawing system diagrams while talking — start with boxes for major components, then add data flow arrows and label the trade-offs at each boundary',
      'Prepare to discuss one real trade-off you made (e.g., consistency vs. availability, monolith vs. microservice) with the reasoning behind your choice',
    ],
  },
  balanced_but_unproven: {
    label: 'Balanced But Unproven',
    description:
      'Solid across all dimensions but no standout strengths. May need to differentiate yourself more clearly to stand out from other candidates.',
    coachingTips: [
      'Review your resume and pick the one project where you had the most ownership — prepare a deep 5-minute narrative around the decisions you made and trade-offs you navigated',
      'Identify one skill where you can credibly claim top-10% expertise and prepare a "signature story" that proves it with specifics no other candidate would have',
      'For your top 3 experiences, prepare answers to "what would you do differently?" — this shows self-awareness that balanced candidates often lack',
      'Create a 30-second "unique value pitch" that answers: what can you do that most candidates at your level cannot? Lead with this in your intro',
    ],
  },
  high_ceiling_low_volume_practice: {
    label: 'High Ceiling, Low Practice Volume',
    description:
      'Clear potential for excellence but needs more interview practice. Natural ability is evident but execution under pressure may be inconsistent.',
    coachingTips: [
      'Record yourself answering 3 questions from your weakest area, review them same-day, and redo each one — self-correction builds faster than volume alone',
      'Do 3 timed practice sessions this week: set a phone timer for the actual interview length and practice answering without pausing or restarting',
      'After each practice answer, write down the one thing you\'d change — accumulate these into a personal "anti-pattern" list to review before the real interview',
      'Practice your opening 90 seconds (self-intro + why this role) until you can deliver it smoothly without thinking — first impressions are disproportionately weighted',
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
