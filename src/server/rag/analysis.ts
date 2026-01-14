import type { ExtractedResume, ExtractedJD, RoundType, LLMAnalysis } from '@/types';

interface AnalysisContext {
  rubricChunks: { id: string; text: string }[];
  questionArchetypes: { id: string; template: string }[];
}

/**
 * Performs LLM analysis on extracted resume and JD data.
 * Returns strict JSON output matching LLMAnalysis schema.
 *
 * LLM acts as analyst, NOT as scoring authority.
 */
export async function performAnalysis(
  resumeData: ExtractedResume,
  jdData: ExtractedJD,
  roundType: RoundType,
  context: AnalysisContext
): Promise<LLMAnalysis> {
  // TODO: Implement LLM call with strict JSON schema
  // Use low temperature (0-0.2) for consistency
  // Retry up to 2 times on JSON parse failure

  // Will use these once LLM call is implemented
  void resumeData;
  void jdData;
  void context;

  console.log('Performing analysis for round type:', roundType);

  // Placeholder - will be replaced with actual LLM call
  return {
    categoryScores: {
      hardMatch: 0,
      evidenceDepth: 0,
      roundReadiness: 0,
      clarity: 0,
      companyProxy: 0,
    },
    rankedRisks: [],
    interviewQuestions: [],
    studyPlan: [],
  };
}

/**
 * Builds the analysis prompt for the LLM.
 */
export function buildAnalysisPrompt(
  resumeData: ExtractedResume,
  jdData: ExtractedJD,
  roundType: RoundType,
  context: AnalysisContext
): string {
  return `You are an expert interview analyst. Analyze the candidate's readiness for a ${roundType} interview.

## Resume Data
${JSON.stringify(resumeData, null, 2)}

## Job Description Requirements
${JSON.stringify(jdData, null, 2)}

## Evaluation Rubric
${context.rubricChunks.map((c) => c.text).join('\n\n')}

## Question Bank Context
${context.questionArchetypes.map((q) => q.template).join('\n')}

Return a JSON object with the following structure:
{
  "categoryScores": {
    "hardMatch": <0-1 score for hard requirement match>,
    "evidenceDepth": <0-1 score for evidence depth>,
    "roundReadiness": <0-1 score for round readiness>,
    "clarity": <0-1 score for resume clarity>,
    "companyProxy": <0-1 score for company expectation match>
  },
  "rankedRisks": [
    {
      "id": "<unique id>",
      "title": "<short title>",
      "severity": "<critical|high|medium|low>",
      "rationale": "<why this is a risk>",
      "missingEvidence": "<what's missing from resume>",
      "rubricRefs": ["<chunk ids>"],
      "jdRefs": ["<JD requirement refs>"]
    }
  ],
  "interviewQuestions": [
    {
      "question": "<likely interview question>",
      "mappedRiskId": "<risk id this tests>",
      "why": "<why they might ask this>"
    }
  ],
  "studyPlan": [
    {
      "task": "<specific prep task>",
      "timeEstimateMinutes": <number>,
      "mappedRiskId": "<risk id this addresses>"
    }
  ]
}

Return ONLY valid JSON, no other text.`;
}
