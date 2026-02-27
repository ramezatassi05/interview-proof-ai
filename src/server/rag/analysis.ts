import { z } from 'zod';
import { getOpenAIClient, MODELS } from '@/lib/openai';
import type {
  ExtractedResume,
  ExtractedJD,
  RoundType,
  LLMAnalysis,
  PrepPreferences,
  CompanyDifficultyContext,
  PriorEmploymentSignal,
} from '@/types';
import type { RubricChunk, QuestionArchetype } from './retrieval';
import { computeCompanyDifficulty } from '@/server/scoring/company-difficulty';
import {
  getRelevantResources,
  getResourceSelectionRules,
  formatResourcesForPrompt,
} from '@/server/rag/resource-bank';

// Zod schema for recruiter internal notes
const RecruiterInternalNotesSchema = z.object({
  firstGlanceReaction: z.string(),
  starredItem: z.string(),
  internalConcerns: z.array(z.string()).min(1).max(4),
  phoneScreenQuestions: z.array(z.string()).min(1).max(5),
});

// Zod schema for recruiter debrief summary
const RecruiterDebriefSummarySchema = z.object({
  oneLinerVerdict: z.string(),
  advocateReasons: z.array(z.string()).min(1).max(3),
  pushbackReasons: z.array(z.string()).min(1).max(3),
  recommendationParagraph: z.string(),
  comparativeNote: z.string(),
});

// Zod schema for candidate positioning
const CandidatePositioningSchema = z.object({
  estimatedPoolPercentile: z.number().min(0).max(100),
  standoutDifferentiator: z.string(),
  biggestLiability: z.string(),
  advanceRationale: z.string(),
});

// Zod schema for recruiter signals (new in Phase 7b)
const RecruiterSignalsSchema = z.object({
  immediateRedFlags: z.array(z.string()),
  hiddenStrengths: z.array(z.string()),
  estimatedScreenTimeSeconds: z.number().min(5).max(300),
  firstImpression: z.enum(['proceed', 'maybe', 'reject']),
  internalNotes: RecruiterInternalNotesSchema.optional(),
  debriefSummary: RecruiterDebriefSummarySchema.optional(),
  candidatePositioning: CandidatePositioningSchema.optional(),
});

// Zod schema for personalized coaching (LLM-generated specific advice)
const PersonalizedCoachingSchema = z.object({
  archetypeTips: z.array(z.string()).min(1).max(5),
  roundFocus: z.string().min(30),
  priorityActions: z
    .array(
      z.object({
        action: z.string(),
        rationale: z.string(),
        resources: z.array(z.string()).max(5).optional(),
      })
    )
    .min(1)
    .max(5),
});

// Zod schema for round-specific coaching (Phase 8 — optional for backwards compat)
const RoundCoachingSchema = z.object({
  roundType: z.string(),
  coachingRecommendations: z.array(z.string()).min(1).max(6),
  waysToStandOut: z.array(z.string()).min(1).max(5),
  questionsToAskInterviewer: z
    .array(z.object({ question: z.string(), context: z.string() }))
    .min(1)
    .max(6),
  sampleResponses: z
    .array(
      z.object({
        scenario: z.string(),
        situation: z.string(),
        task: z.string(),
        action: z.string(),
        result: z.string(),
        whyItWorks: z.string(),
      })
    )
    .min(1)
    .max(4),
  passionSignals: z.array(z.string()).min(1).max(5),
});

// Zod schema for LLM analysis output validation
const LLMAnalysisSchema = z.object({
  categoryScores: z.object({
    hardMatch: z.number().min(0).max(1),
    evidenceDepth: z.number().min(0).max(1),
    roundReadiness: z.number().min(0).max(1),
    clarity: z.number().min(0).max(1),
    companyProxy: z.number().min(0).max(1),
  }),
  rankedRisks: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      severity: z.enum(['critical', 'high', 'medium', 'low']),
      rationale: z.string(),
      missingEvidence: z.string(),
      rubricRefs: z.array(z.string()),
      jdRefs: z.array(z.string()),
    })
  ),
  interviewQuestions: z.array(
    z.object({
      question: z.string(),
      mappedRiskId: z.string(),
      why: z.string(),
    })
  ).min(1),
  studyPlan: z.array(
    z.object({
      task: z.string(),
      timeEstimateMinutes: z.number(),
      mappedRiskId: z.string(),
      // Enhanced fields (optional for backwards compatibility)
      description: z.string().optional(),
      priority: z.enum(['critical', 'high', 'medium', 'low']).optional(),
      category: z.enum(['technical', 'behavioral', 'practice', 'review']).optional(),
    })
  ),
  recruiterSignals: RecruiterSignalsSchema,
  personalizedCoaching: PersonalizedCoachingSchema,
  roundCoaching: RoundCoachingSchema.optional(),
});

interface AnalysisContext {
  rubricChunks: RubricChunk[];
  questionArchetypes: QuestionArchetype[];
}

/**
 * Maps timeline to days for calculations.
 */
function getTimelineDays(timeline: PrepPreferences['timeline']): number {
  const mapping: Record<PrepPreferences['timeline'], number> = {
    '1day': 1,
    '3days': 3,
    '1week': 7,
    '2weeks': 14,
    '4weeks_plus': 28,
  };
  return mapping[timeline];
}

/**
 * Gets experience level label for display.
 */
function getExperienceLabel(level: PrepPreferences['experienceLevel']): string {
  const mapping: Record<PrepPreferences['experienceLevel'], string> = {
    intern: 'intern (student seeking internship)',
    entry: 'entry-level (0-2 years)',
    mid: 'mid-level (2-5 years)',
  };
  return mapping[level];
}

/**
 * Returns a study plan task count range scaled by timeline length.
 */
function getTaskCountRange(timeline: PrepPreferences['timeline']): string {
  const ranges: Record<PrepPreferences['timeline'], string> = {
    '1day': '5-8',
    '3days': '8-12',
    '1week': '15-20',
    '2weeks': '20-28',
    '4weeks_plus': '28-40',
  };
  return ranges[timeline];
}

/**
 * Gets focus area labels for display.
 */
function getFocusAreaLabels(areas: PrepPreferences['focusAreas']): string[] {
  const mapping: Record<string, string> = {
    technical_depth: 'Technical Depth',
    behavioral_stories: 'Behavioral Stories',
    system_design: 'System Design',
    communication: 'Communication',
    domain_knowledge: 'Domain Knowledge',
  };
  return areas.map((a) => mapping[a] || a);
}

/**
 * Builds the analysis prompt for the LLM.
 */
function buildAnalysisPrompt(
  resumeData: ExtractedResume,
  jdData: ExtractedJD,
  roundType: RoundType,
  context: AnalysisContext,
  prepPreferences?: PrepPreferences,
  companyDifficulty?: CompanyDifficultyContext,
  priorEmployment?: PriorEmploymentSignal
): string {
  const rubricText = context.rubricChunks.map((c) => `[${c.id}] ${c.chunkText}`).join('\n\n');

  const questionText = context.questionArchetypes
    .map((q) => `[${q.id}] ${q.questionTemplate}`)
    .join('\n');

  return `You are an expert interview analyst conducting a diagnostic assessment. Analyze the candidate's readiness for a ${roundType} interview based on the provided data.

## Candidate Resume Data
Skills: ${resumeData.skills.join(', ')}

Experience:
${resumeData.experiences.map((e) => `- ${e.role} at ${e.company} (${e.dates}): ${e.achievements.join('; ')}`).join('\n')}

Metrics & Impact: ${resumeData.metrics.join('; ')}

Recent Technologies: ${resumeData.recencySignals.join(', ')}

Project Evidence: ${resumeData.projectEvidence.join('; ')}

## Job Description Requirements
Target Company: ${jdData.companyName ?? 'Not specified'}

Must Have: ${jdData.mustHave.join(', ')}

Nice to Have: ${jdData.niceToHave.join(', ')}

Key Terms: ${jdData.keywords.join(', ')}

Seniority Signals: ${jdData.senioritySignals.join(', ')}

## Evaluation Rubric (Reference IDs in your response)
${rubricText}

## Question Bank (Reference IDs for likely questions)
${questionText}
${
  prepPreferences
    ? `
## User Prep Context
- Interview in: ${getTimelineDays(prepPreferences.timeline)} days
- Daily prep time: ${prepPreferences.dailyHours} hours
- Experience level: ${getExperienceLabel(prepPreferences.experienceLevel)}
- Focus areas: ${getFocusAreaLabels(prepPreferences.focusAreas).join(', ')}
${prepPreferences.additionalContext ? `- User notes: ${prepPreferences.additionalContext}` : ''}

When generating the study plan:
- Adjust task depth and complexity for ${getExperienceLabel(prepPreferences.experienceLevel)} candidates
- Prioritize tasks that address: ${getFocusAreaLabels(prepPreferences.focusAreas).join(', ')}
- Include description, category, and priority level for each task
- Total time should fit within ${Math.round(getTimelineDays(prepPreferences.timeline) * prepPreferences.dailyHours * 60)} minutes
`
    : ''
}
${
  companyDifficulty && companyDifficulty.tier !== 'STANDARD'
    ? `## Company Difficulty Context
- Company: ${companyDifficulty.companyName}
- Tier: ${companyDifficulty.tier} (Difficulty Score: ${companyDifficulty.difficultyScore}/150)
- Competition Level: ${companyDifficulty.competitionLevel}
- Acceptance Rate: ${companyDifficulty.acceptanceRateEstimate}
- Interview Bar: ${companyDifficulty.interviewBarDescription}
${companyDifficulty.isIntern ? '- INTERN CANDIDATE: Apply intern-level calibration — competition is fiercer for limited intern slots.\n' : ''}
CALIBRATION INSTRUCTIONS for ${companyDifficulty.tier} companies:
- Be MORE CRITICAL with all scores — a "good" candidate at a standard company may only be "average" at ${companyDifficulty.companyName}.
- categoryScores should reflect the HIGHER BAR of this company's interview process.
- rankedRisks should include at least one risk about company-specific expectations (e.g., leadership principles, culture fit, domain expertise).
- At least one priorityAction must focus on company-specific differentiation strategies.
- Reference ${companyDifficulty.companyName} by name in coaching tips and risk rationales.
`
    : ''
}
${
  priorEmployment?.detected
    ? `## Prior Employment at Target Company
The candidate has PREVIOUSLY WORKED at ${priorEmployment.companyName}:
${priorEmployment.stints.map((s) => `- ${s.role} (${s.durationYears} years${s.isCurrent ? ', currently employed' : `, left ${s.yearsAgo} years ago`})`).join('\n')}
Total time at company: ${priorEmployment.totalYearsAtCompany} years
${priorEmployment.isInternalTransfer ? 'STATUS: Currently employed — this is an INTERNAL TRANSFER candidate.\n' : ''}
CRITICAL IMPACT on your analysis:
- companyProxy score should be SIGNIFICANTLY HIGHER (0.75-0.95) — they already know the culture, tools, and processes
- recruiterSignals.hiddenStrengths MUST include their prior employment as a major advantage
- recruiterSignals.firstImpression should lean toward "proceed" — returning employees are highly valued
- personalizedCoaching should leverage their insider knowledge (suggest reaching out to former colleagues, referencing internal tools/processes they know)
- roundCoaching should reference their familiarity with the company's interview style
- Risks about "culture fit" or "company alignment" should be downgraded — they've already passed this test
`
    : ''
}## Your Task
When a company name is known, reference it by name in coaching tips, recruiter signals, and risk rationales (e.g., "for your Amazon interview" not "for this interview").

## Critical: Skill Inference from Seniority and Context
Before assessing gaps, apply the following skill inference rule:

When a candidate has senior-level roles (senior engineer, staff engineer, tech lead, principal, etc.) at established companies, you MUST assume they possess standard industry practices — even if not explicitly listed:
- Version control (Git), pull requests, code reviews
- CI/CD pipelines, automated testing, unit testing
- Agile/Scrum methodologies
- Basic monitoring, logging, and debugging
- REST API design and consumption
- Technical documentation

**How to apply this:**
1. Cross-reference experience (roles, companies, tenure) with JD seniority signals to gauge caliber.
2. If a JD requirement is a FUNDAMENTAL skill any competent professional at this seniority level would possess, treat it as MATCHED — do not flag it as a gap.
3. If a JD requirement is a SPECIALIZED skill (specific frameworks, niche tools, domain knowledge), evaluate normally — only explicit evidence counts.
4. In rankedRisks, do NOT create entries for skills obviously implied by seniority.
5. In categoryScores.hardMatch, credit inferred fundamental skills the same as explicit ones.

**The test:** "Would a hiring manager seriously question whether this candidate knows [skill]?" If no, it is inferred and should not reduce scores or appear as a risk.

## Critical: No Obvious JD Parroting
The candidate uploaded this JD themselves — they already know every requirement listed.
NEVER give advice that simply restates a JD requirement as something to learn or acquire.

ANTI-PATTERNS (NEVER DO THESE):
- "Learn French" (when French is in the JD — they already know it's required)
- "Get proficient in Kubernetes" (they can see it's a must-have)
- "Develop your Python skills" (obvious from the JD)
- "Gain experience with AWS" (just restating the requirement)

WHAT TO DO INSTEAD — focus on STRATEGY, not restating requirements:
- If the candidate LACKS a JD skill: Tell them how to compensate, bridge, or fast-track
  - GOOD: "You lack Kubernetes experience — complete the 'CKAD crash course' (8hrs) and build a sample deployment to discuss in your interview, or reframe your Docker Compose experience as container orchestration fundamentals"
- If the candidate HAS the skill but it's buried: Tell them how to surface it
  - GOOD: "Your French fluency is mentioned once in passing — move it to a prominent position and note the business contexts where you used it"
- If the skill is a language/certification with no shortcut: Focus on adjacent strengths to compensate
  - GOOD: "French fluency will take years — instead, emphasize your experience working with French-speaking clients at [Company] and your willingness to work in bilingual environments"

THE TEST: Would the candidate say "I already knew that" after reading your advice? If yes, it's useless. Rewrite it to tell them something they DON'T know — a strategy, a reframe, a specific resource, or a tactical workaround.

Analyze the candidate's interview readiness and return a JSON object with:

1. **categoryScores** (0-1 for each, USE THE FULL RANGE):
   CALIBRATION: Use these anchors — do NOT default everything to 0.6-0.85:
   - 0.0-0.2 = Almost no match / severe deficiency
   - 0.2-0.4 = Significant gaps, would struggle
   - 0.4-0.6 = Mixed — some evidence but notable weaknesses
   - 0.6-0.75 = Good match with minor gaps
   - 0.75-0.9 = Strong match, well-prepared
   - 0.9-1.0 = Exceptional — near-perfect alignment

   RULE: Each dimension MUST be independently assessed. If hardMatch is 0.8 but clarity is 0.45, that's correct — don't pull them together. Scores should differ by 0.15+ when the evidence differs.

   - hardMatch: How well skills/experience match must-have requirements (credit both explicitly listed AND inferred fundamental skills per the Skill Inference rules above). For hardMatch: count matched_must_haves / total_must_haves. Below 50% coverage = below 0.5.
   - evidenceDepth: Quality of metrics, ownership, and concrete achievements. For evidenceDepth: count quantified metrics. Fewer than 3 = below 0.6.
   - roundReadiness: Preparation level for ${roundType} interview specifically
   - clarity: Resume communication quality and structure
   - companyProxy: Match to implied company expectations

2. **rankedRisks** (10-15 items, ordered by severity):
   Each risk should identify a specific gap that could cause rejection.
   Reference rubric IDs and JD requirements that support this risk.
   Each rationale MUST cite specific resume gaps or JD mismatches, not generic assessments.
   For each risk, the rationale must explain WHY this gap matters strategically (not just "JD says X, resume lacks X").
   The missingEvidence field should suggest what specific evidence COULD bridge this gap.
   IMPORTANT: Do NOT flag fundamental/standard skills as risks when clearly implied by seniority (see Skill Inference rules above). Only flag GENUINE gaps in specialized or non-obvious skills.
   - BAD: "Lack of relevant experience"
   - BAD: "Resume does not mention pull requests" (when candidate is a senior engineer — this is an implied skill)
   - GOOD: "Resume shows no Kubernetes experience, but JD lists it as must-have requirement #3"
   - GOOD: "Despite 8 years of backend experience, resume shows no evidence of distributed systems design, which the JD emphasizes for this staff-level role"
${roundType === 'technical' ? `
   ROUND-TYPE FILTER (TECHNICAL): This is a TECHNICAL interview. Only flag risks directly relevant to technical performance:
   - Flag: Missing technical skills, frameworks, languages, system design gaps, algorithm weaknesses, architecture knowledge gaps
   - Do NOT flag: Language/bilingual requirements, soft skills, communication style, cultural fit, behavioral competencies, certifications unrelated to technical depth
   - If the JD mentions non-technical requirements (e.g. "bilingual", "leadership style"), SKIP them — they are irrelevant to a technical round assessment.
` : roundType === 'behavioral' ? `
   ROUND-TYPE FILTER (BEHAVIORAL): This is a BEHAVIORAL interview. Prioritize risks related to:
   - Storytelling gaps, lack of STAR-format evidence, missing leadership examples, weak conflict resolution evidence, communication concerns
   - De-prioritize: Specific technical framework gaps, algorithm knowledge, system design depth
` : roundType === 'research' ? `
   ROUND-TYPE FILTER (RESEARCH): This is a RESEARCH interview. Prioritize risks related to:
   - Research methodology gaps, publication gaps, ML/AI depth, experimental design weaknesses, paper discussion readiness
   - De-prioritize: Soft skills, cultural fit, non-research technical frameworks
` : ''}
3. **interviewQuestions** (15-20 questions, MINIMUM 10):
   Generate a focused set of technical and job-relevant questions based on skill gaps and experience gaps identified. Each question should relate to the candidate's ability to perform the job role. Include a mix of question types: technical deep-dives, behavioral/situational, case-based/problem-solving, and role-specific.
   IMPORTANT: Do NOT include any questions about citizenship, nationality, immigration status, age, religion, marital status, family planning, disability, or any other protected characteristics. These are illegal to ask in interviews and not relevant to technical assessment.

4. **studyPlan** (${prepPreferences ? getTaskCountRange(prepPreferences.timeline) : '5-8'} items):
   Concrete prep tasks with time estimates, mapped to risk IDs.
   Study plan tasks must NEVER be "learn [JD requirement]". Instead they should be specific drills, projects, or exercises.
   - BAD: "Study distributed systems"
   - GOOD: "Design a URL shortener system on paper (30 min), then compare against the Grokking System Design solution, focusing on partition strategy since the JD emphasizes horizontal scaling"${
     prepPreferences
       ? `
   For each task, also include:
   - description: A 1-2 sentence explanation of what to do and why
   - priority: "critical" | "high" | "medium" | "low" based on impact
   - category: "technical" | "behavioral" | "practice" | "review"`
       : ''
   }

5. **recruiterSignals** (recruiter perspective simulation):
   Simulate how a recruiter would perceive this candidate on first resume scan:
   - immediateRedFlags: 2-5 things that would make a recruiter hesitate
${roundType === 'technical' ? `     For this TECHNICAL round assessment, red flags should focus on technical gaps only — not language, cultural fit, or soft skills.
` : ''}   - hiddenStrengths: 2-4 undervalued strengths a quick scan might miss
   - estimatedScreenTimeSeconds: How long a recruiter would spend (15-120 typical)
   - firstImpression: "proceed" (advance to screen), "maybe" (on fence), or "reject"

   IMPORTANT: Each red flag and hidden strength MUST reference specific resume details or JD requirements.
   - BAD: "Strong technical background"
   - GOOD: "Strong React/TypeScript stack with 3 years of production experience matches JD's core requirement"
   - BAD: "Lack of relevant experience"
   - GOOD: "Resume shows no Kubernetes experience, but JD lists it as must-have requirement"

   - **internalNotes** (recruiter's private notepad — what they'd actually scribble):
     - firstGlanceReaction: The recruiter's 3-second internal monologue when they first open the resume. Write in first person, candid, e.g. "Hmm, solid React stack but where's the backend depth they need?"
     - starredItem: The ONE thing on the resume they'd physically star or underline — the single most attention-grabbing detail.
     - internalConcerns: 2-4 frank, candid concerns they'd note privately (franker and more blunt than red flags — internal talk, not client-facing).
     - phoneScreenQuestions: 3-5 specific questions they'd want answered on a phone screen before advancing. These should probe the exact gaps or ambiguities in the resume.

   - **debriefSummary** (30-second hallway conversation with the hiring manager):
     - oneLinerVerdict: A single sentence the recruiter would use to summarize this candidate to the hiring manager.
     - advocateReasons: 2-3 concise reasons to advance this candidate.
     - pushbackReasons: 2-3 concise reasons to pass on this candidate.
     - recommendationParagraph: A 3-5 sentence recommendation written in the style of an internal ATS note (Greenhouse/Lever style). Professional, balanced, data-driven.
     - comparativeNote: How this candidate compares to a typical applicant pool for this role/level.

   - **candidatePositioning** (where they sit in the pool):
     - estimatedPoolPercentile: 0-100, where this candidate falls relative to a typical applicant pool for this role.
     - standoutDifferentiator: The biggest competitive advantage this candidate has over others.
     - biggestLiability: The single biggest reason a recruiter might pass.
     - advanceRationale: A sentence explaining why they would or wouldn't advance this candidate.

6. **personalizedCoaching** (CRITICAL - candidate-specific actionable advice):
   Generate advice that directly references THIS candidate's specific resume and JD.

   ABSOLUTE RULE: If your advice could be generated by simply reading the JD bullet points aloud, it is WORTHLESS. Every tip must contain insight the candidate couldn't get by reading the JD themselves — a strategy, a reframe, a preparation technique, a specific resource, or an insider perspective.

   IMPORTANT: Every piece of advice MUST be specific and actionable. Avoid generic advice like:
   - BAD: "Practice explaining complex concepts"
   - BAD: "Use the STAR method"
   - BAD: "Focus on technical fundamentals"

   Instead, reference specific skills, technologies, projects, and gaps from the resume and JD:
   - GOOD: "Your Kubernetes experience is strong but buried in bullet 4 - lead your intro pitch with it since the JD mentions it 3 times"
   - GOOD: "The payment processing project lacks metrics - add latency/throughput numbers before your interview"

   Fields:
   - archetypeTips: 4 coaching tips tailored to their specific weakness pattern
     Each tip should reference a specific skill, project, or gap from the resume/JD analysis.

   - roundFocus: One specific focus statement for their weakest interview round
     Example: "Your behavioral stories mention teamwork but lack conflict resolution examples. Prepare 3 stories about technical disagreements using 'My Position → Their Position → Resolution → Outcome' format."

   - priorityActions: Top 5 things to do before the interview
     Each must have:
     - action: Specific, concrete task (not "practice more" but "solve 8 medium BFS/DFS problems")
     - rationale: Why this matters for THIS candidate's specific gaps
     - resources: (optional) Array of 2-5 specific resources with real URL links when possible
${(() => {
  if (prepPreferences) {
    const topicSeeds = [...jdData.mustHave, ...jdData.keywords];
    const relevant = getRelevantResources(topicSeeds, prepPreferences.timeline, 15);
    const rules = getResourceSelectionRules(prepPreferences.timeline);
    const formattedResources = formatResourcesForPrompt(relevant);
    return `  RESOURCE TIME RULES (candidate has ${getTimelineDays(prepPreferences.timeline)} days):
  ${rules}
  - NEVER suggest resources that take longer than the candidate's total prep window
  - Prefer resources from this verified list when they match the topic:
${formattedResources}
  - If suggesting resources NOT in the list, only use well-known platforms (YouTube, LeetCode, Coursera, GitHub, MDN, freeCodeCamp)
  - NEVER fabricate or guess URLs — if unsure of exact URL, provide the resource name without a link`;
  } else {
    return `  Prefer well-known platforms (YouTube, LeetCode, Coursera, GitHub, MDN).
  NEVER fabricate URLs — if unsure of exact URL, provide the resource name without a link.`;
  }
})()}

7. **roundCoaching** (CRITICAL — round-specific coaching for ${roundType} interview):
   Generate in-depth coaching content specifically for the candidate's selected round type: "${roundType}".
   Do NOT generate content for other round types — ONLY for "${roundType}".

   All content MUST reference the candidate's actual resume details, the specific JD requirements, and the company by name (if known).
   Think like a senior recruiter/career advisor giving insider tips to help this specific candidate stand out.

   Fields:
   - roundType: "${roundType}"
   - coachingRecommendations: 4-6 specific, actionable tips for succeeding in a ${roundType} interview at this company.
     Each tip should reference specific skills, projects, or gaps from the resume/JD.
     - BAD: "Practice coding problems"
     - GOOD: "Your distributed systems experience at [Company] is directly relevant to their microservices architecture — prepare a 2-minute walkthrough of how you designed the event-driven pipeline, focusing on trade-offs you made"

   - waysToStandOut: 3-5 differentiation strategies unique to this candidate.
     What can THEY specifically do that other candidates cannot? Reference their unique experiences.
     - BAD: "Show enthusiasm"
     - GOOD: "Your open-source contribution to [Project] directly relates to their tech stack — mention it proactively and offer to discuss the PR you authored"

   - questionsToAskInterviewer: 4-6 impressive questions the candidate should ask their interviewer.
     Each with { question, context } where context explains WHY this question impresses interviewers.
     Questions should demonstrate the candidate did research and understands the role deeply.
     - BAD: { question: "What's the team culture like?", context: "Shows interest" }
     - GOOD: { question: "I noticed [Company] recently migrated to [Tech] — how has that changed the team's deployment workflow?", context: "Shows you researched their tech blog and understand infrastructure implications" }

   - sampleResponses: 3-4 model answers (MINIMUM 2) in STAR format showing passion and fit.
     Each with { scenario, situation, task, action, result, whyItWorks }.
     - scenario: A realistic interview question for this role
     - situation: 2-3 sentences setting the scene — company, team, project context from the candidate's ACTUAL resume
     - task: 1-2 sentences describing the specific challenge or objective they owned
     - action: 3-4 sentences detailing the concrete steps taken, technologies used, and decisions made
     - result: 1-2 sentences with quantifiable outcomes (metrics, percentages, timeframes)
     - whyItWorks: Why this STAR answer is effective for this specific role

   - passionSignals: 3-5 specific ways the candidate can demonstrate genuine passion and fit during the interview.
     These should be concrete actions, not vague platitudes.
     - BAD: "Show you're passionate about the company"
     - GOOD: "Mention how their recent launch of [Product Feature] aligns with the recommendation engine you built at [Previous Company] — this shows you follow their product updates and can contribute immediately"

Return ONLY valid JSON matching this exact structure:
{
  "categoryScores": {
    "hardMatch": <0-1>,
    "evidenceDepth": <0-1>,
    "roundReadiness": <0-1>,
    "clarity": <0-1>,
    "companyProxy": <0-1>
  },
  "rankedRisks": [
    {
      "id": "risk-1",
      "title": "Short descriptive title",
      "severity": "critical|high|medium|low",
      "rationale": "Why this is a rejection risk",
      "missingEvidence": "What's missing from resume",
      "rubricRefs": ["rubric-chunk-id"],
      "jdRefs": ["JD requirement text"]
    }
  ],
  "interviewQuestions": [
    {
      "question": "The interview question",
      "mappedRiskId": "risk-1",
      "why": "Why they might ask this"
    }
  ],
  "studyPlan": [
    {
      "task": "Specific prep task",
      "timeEstimateMinutes": 30,
      "mappedRiskId": "risk-1"${
        prepPreferences
          ? `,
      "description": "What to do and why this helps",
      "priority": "critical|high|medium",
      "category": "technical|behavioral|practice|review"`
          : ''
      }
    }
  ],
  "recruiterSignals": {
    "immediateRedFlags": ["Red flag that would make recruiter hesitate"],
    "hiddenStrengths": ["Strength that quick scan might miss"],
    "estimatedScreenTimeSeconds": 45,
    "firstImpression": "proceed|maybe|reject",
    "internalNotes": {
      "firstGlanceReaction": "First-person internal monologue on seeing the resume...",
      "starredItem": "The one thing they'd physically star or underline...",
      "internalConcerns": ["Frank internal concern 1", "Frank internal concern 2"],
      "phoneScreenQuestions": ["Specific phone screen question 1", "Specific question 2", "Specific question 3"]
    },
    "debriefSummary": {
      "oneLinerVerdict": "Single sentence summary for hiring manager...",
      "advocateReasons": ["Reason to advance 1", "Reason to advance 2"],
      "pushbackReasons": ["Reason to pass 1", "Reason to pass 2"],
      "recommendationParagraph": "3-5 sentence ATS-style recommendation paragraph...",
      "comparativeNote": "How candidate compares to typical applicant pool..."
    },
    "candidatePositioning": {
      "estimatedPoolPercentile": 65,
      "standoutDifferentiator": "Biggest competitive advantage...",
      "biggestLiability": "Biggest reason to pass...",
      "advanceRationale": "Why they would/wouldn't advance..."
    }
  },
  "personalizedCoaching": {
    "archetypeTips": [
      "Specific tip referencing their actual resume skills/projects...",
      "Another tip addressing a specific JD requirement gap...",
      "Tip about a specific technology or experience they should highlight...",
      "Tip about a specific weakness to address with concrete action..."
    ],
    "roundFocus": "Specific focus statement for their weakest round, referencing actual gaps and concrete steps...",
    "priorityActions": [
      {
        "action": "Specific action referencing their resume/JD",
        "rationale": "Why this matters for THIS candidate",
        "resources": [
          "Coursera's Deep Learning Specialization - https://www.coursera.org/specializations/deep-learning",
          "3Blue1Brown Neural Networks playlist - https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi"
        ]
      }
    ]
  },
  "roundCoaching": {
    "roundType": "${roundType}",
    "coachingRecommendations": [
      "Specific coaching tip referencing resume/JD details..."
    ],
    "waysToStandOut": [
      "Specific differentiation strategy for this candidate..."
    ],
    "questionsToAskInterviewer": [
      {
        "question": "Impressive question to ask the interviewer...",
        "context": "Why this question works and what it signals..."
      }
    ],
    "sampleResponses": [
      {
        "scenario": "Likely interview question for this role...",
        "situation": "2-3 sentences of context from the candidate's resume...",
        "task": "The specific challenge or objective they owned...",
        "action": "3-4 sentences of concrete steps, technologies, and decisions...",
        "result": "Quantifiable outcomes with metrics...",
        "whyItWorks": "Why this STAR answer is effective..."
      }
    ],
    "passionSignals": [
      "Specific way to demonstrate passion and fit..."
    ]
  }
}`;
}

/**
 * Performs LLM analysis on extracted resume and JD data.
 * Returns strict JSON output matching LLMAnalysis schema.
 *
 * LLM acts as analyst, NOT as scoring authority.
 * The deterministic scoring engine computes the final score.
 */
export async function performAnalysis(
  resumeData: ExtractedResume,
  jdData: ExtractedJD,
  roundType: RoundType,
  context: AnalysisContext,
  prepPreferences?: PrepPreferences,
  retries = 2,
  priorEmployment?: PriorEmploymentSignal
): Promise<LLMAnalysis> {
  const openai = getOpenAIClient();
  const deadline = Date.now() + 90_000; // 90s cumulative deadline for all retries

  // Compute company difficulty for prompt calibration
  const companyDifficulty = computeCompanyDifficulty(
    jdData.companyName,
    prepPreferences?.experienceLevel ?? 'mid',
    jdData,
    resumeData
  );

  const prompt = buildAnalysisPrompt(
    resumeData,
    jdData,
    roundType,
    context,
    prepPreferences,
    companyDifficulty,
    priorEmployment
  );

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0 && Date.now() > deadline) {
      throw new Error(
        'Analysis deadline exceeded — not enough time remaining for another retry'
      );
    }
    try {
      const response = await openai.chat.completions.create({
        model: MODELS.reasoning,
        temperature: 0.3, // Moderate temperature for wider score distribution
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You are an expert interview analyst. Return only valid JSON matching the exact schema requested. Be thorough but honest in your assessment.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from LLM');
      }

      const parsed = JSON.parse(content);
      const validated = LLMAnalysisSchema.parse(parsed);

      // Ensure we have enough risks (pad if needed)
      if (validated.rankedRisks.length < 10) {
        console.warn(`LLM returned only ${validated.rankedRisks.length} risks, expected 10-15`);
      }

      if (validated.interviewQuestions.length < 15) {
        console.warn(`LLM returned only ${validated.interviewQuestions.length} questions, expected 15-20`);
      }

      return validated;
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.warn(
          `Validation failed (attempt ${attempt + 1}):`,
          error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ')
        );
      }
      if (attempt === retries) {
        console.error('LLM analysis failed after retries:', error);
        throw new Error(
          `Failed to perform analysis: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
      console.warn(`Analysis attempt ${attempt + 1} failed, retrying...`);
    }
  }

  throw new Error('Unexpected analysis failure');
}

/**
 * Generates a unique risk ID.
 */
export function generateRiskId(): string {
  return `risk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
