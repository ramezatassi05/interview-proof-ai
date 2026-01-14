import { z } from 'zod';
import { getOpenAIClient, MODELS } from '@/lib/openai';
import type { ExtractedResume, ExtractedJD, RoundType, LLMAnalysis } from '@/types';
import type { RubricChunk, QuestionArchetype } from './retrieval';

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
    })
  ),
});

interface AnalysisContext {
  rubricChunks: RubricChunk[];
  questionArchetypes: QuestionArchetype[];
}

/**
 * Builds the analysis prompt for the LLM.
 */
function buildAnalysisPrompt(
  resumeData: ExtractedResume,
  jdData: ExtractedJD,
  roundType: RoundType,
  context: AnalysisContext
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
Must Have: ${jdData.mustHave.join(', ')}

Nice to Have: ${jdData.niceToHave.join(', ')}

Key Terms: ${jdData.keywords.join(', ')}

Seniority Signals: ${jdData.senioritySignals.join(', ')}

## Evaluation Rubric (Reference IDs in your response)
${rubricText}

## Question Bank (Reference IDs for likely questions)
${questionText}

## Your Task
Analyze the candidate's interview readiness and return a JSON object with:

1. **categoryScores** (0-1 for each):
   - hardMatch: How well skills/experience match must-have requirements
   - evidenceDepth: Quality of metrics, ownership, and concrete achievements
   - roundReadiness: Preparation level for ${roundType} interview specifically
   - clarity: Resume communication quality and structure
   - companyProxy: Match to implied company expectations

2. **rankedRisks** (10-15 items, ordered by severity):
   Each risk should identify a specific gap that could cause rejection.
   Reference rubric IDs and JD requirements that support this risk.

3. **interviewQuestions** (6-10 questions):
   Likely questions based on gaps, mapped to risk IDs.

4. **studyPlan** (5-8 items):
   Concrete prep tasks with time estimates, mapped to risk IDs.

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
      "mappedRiskId": "risk-1"
    }
  ]
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
  retries = 2
): Promise<LLMAnalysis> {
  const openai = getOpenAIClient();
  const prompt = buildAnalysisPrompt(resumeData, jdData, roundType, context);

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
