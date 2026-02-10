import { z } from 'zod';
import { getOpenAIClient, MODELS } from '@/lib/openai';
import type {
  ExtractedResume,
  ExtractedJD,
  RoundType,
  LLMAnalysis,
  PrepPreferences,
} from '@/types';
import type { RubricChunk, QuestionArchetype } from './retrieval';

// Zod schema for recruiter signals (new in Phase 7b)
const RecruiterSignalsSchema = z.object({
  immediateRedFlags: z.array(z.string()),
  hiddenStrengths: z.array(z.string()),
  estimatedScreenTimeSeconds: z.number().min(5).max(300),
  firstImpression: z.enum(['proceed', 'maybe', 'reject']),
});

// Zod schema for personalized coaching (LLM-generated specific advice)
const PersonalizedCoachingSchema = z.object({
  archetypeTips: z.array(z.string()).min(3).max(5),
  roundFocus: z.string().min(30),
  priorityActions: z
    .array(
      z.object({
        action: z.string(),
        rationale: z.string(),
        resource: z.string().optional(),
      })
    )
    .min(2)
    .max(4),
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
  ),
  studyPlan: z.array(
    z.object({
      task: z.string(),
      timeEstimateMinutes: z.number(),
      mappedRiskId: z.string(),
      // Enhanced fields (optional for backwards compatibility)
      description: z.string().optional(),
      priority: z.enum(['critical', 'high', 'medium']).optional(),
      category: z.enum(['technical', 'behavioral', 'practice', 'review']).optional(),
    })
  ),
  recruiterSignals: RecruiterSignalsSchema,
  personalizedCoaching: PersonalizedCoachingSchema,
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
    entry: 'entry-level (0-2 years)',
    mid: 'mid-level (2-5 years)',
    senior: 'senior (5-10 years)',
    staff_plus: 'staff+ (10+ years)',
  };
  return mapping[level];
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
  prepPreferences?: PrepPreferences
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
## Your Task
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

Analyze the candidate's interview readiness and return a JSON object with:

1. **categoryScores** (0-1 for each):
   - hardMatch: How well skills/experience match must-have requirements (credit both explicitly listed AND inferred fundamental skills per the Skill Inference rules above)
   - evidenceDepth: Quality of metrics, ownership, and concrete achievements
   - roundReadiness: Preparation level for ${roundType} interview specifically
   - clarity: Resume communication quality and structure
   - companyProxy: Match to implied company expectations

2. **rankedRisks** (10-15 items, ordered by severity):
   Each risk should identify a specific gap that could cause rejection.
   Reference rubric IDs and JD requirements that support this risk.
   Each rationale MUST cite specific resume gaps or JD mismatches, not generic assessments.
   IMPORTANT: Do NOT flag fundamental/standard skills as risks when clearly implied by seniority (see Skill Inference rules above). Only flag GENUINE gaps in specialized or non-obvious skills.
   - BAD: "Lack of relevant experience"
   - BAD: "Resume does not mention pull requests" (when candidate is a senior engineer — this is an implied skill)
   - GOOD: "Resume shows no Kubernetes experience, but JD lists it as must-have requirement #3"
   - GOOD: "Despite 8 years of backend experience, resume shows no evidence of distributed systems design, which the JD emphasizes for this staff-level role"

3. **interviewQuestions** (100-120 questions):
   Generate a diverse pool of technical and job-relevant questions based on skill gaps and experience gaps identified. Each question should relate to the candidate's ability to perform the job role. Include a mix of question types: technical deep-dives, behavioral/situational, case-based/problem-solving, and role-specific.
   IMPORTANT: Do NOT include any questions about citizenship, nationality, immigration status, age, religion, marital status, family planning, disability, or any other protected characteristics. These are illegal to ask in interviews and not relevant to technical assessment.

4. **studyPlan** (${prepPreferences ? '8-12' : '5-8'} items):
   Concrete prep tasks with time estimates, mapped to risk IDs.${
     prepPreferences
       ? `
   For each task, also include:
   - description: A 1-2 sentence explanation of what to do and why
   - priority: "critical" | "high" | "medium" based on impact
   - category: "technical" | "behavioral" | "practice" | "review"`
       : ''
   }

5. **recruiterSignals** (recruiter perspective simulation):
   Simulate how a recruiter would perceive this candidate on first resume scan:
   - immediateRedFlags: 2-5 things that would make a recruiter hesitate
   - hiddenStrengths: 2-4 undervalued strengths a quick scan might miss
   - estimatedScreenTimeSeconds: How long a recruiter would spend (15-120 typical)
   - firstImpression: "proceed" (advance to screen), "maybe" (on fence), or "reject"

   IMPORTANT: Each red flag and hidden strength MUST reference specific resume details or JD requirements.
   - BAD: "Strong technical background"
   - GOOD: "Strong React/TypeScript stack with 3 years of production experience matches JD's core requirement"
   - BAD: "Lack of relevant experience"
   - GOOD: "Resume shows no Kubernetes experience, but JD lists it as must-have requirement"

6. **personalizedCoaching** (CRITICAL - candidate-specific actionable advice):
   Generate advice that directly references THIS candidate's specific resume and JD.

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

   - priorityActions: Top 3 things to do before the interview
     Each must have:
     - action: Specific, concrete task (not "practice more" but "solve 8 medium BFS/DFS problems")
     - rationale: Why this matters for THIS candidate's specific gaps
     - resource: (optional) Specific resource, tool, or approach

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
    "firstImpression": "proceed|maybe|reject"
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
        "resource": "Optional specific resource or approach"
      }
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
  retries = 2
): Promise<LLMAnalysis> {
  const openai = getOpenAIClient();
  const prompt = buildAnalysisPrompt(resumeData, jdData, roundType, context, prepPreferences);

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model: MODELS.reasoning,
        temperature: 0.2, // Low temperature for consistency
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

      return validated;
    } catch (error) {
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
