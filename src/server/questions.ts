import { z } from 'zod';
import { getOpenAIClient, MODELS } from '@/lib/openai';
import type {
  ExtractedResume,
  ExtractedJD,
  RoundType,
  LLMAnalysis,
  QuestionFeedbackResponse,
  BestAnswerResponse,
} from '@/types';

const FeedbackSchema = z.object({
  feedback: z.string(),
  score: z.number().min(0).max(100),
  strengths: z.array(z.string()).min(1).max(5),
  improvements: z.array(z.string()).min(1).max(5),
});

const BestAnswerSchema = z.object({
  bestAnswer: z.string(),
  keyPoints: z.array(z.string()).min(2).max(6),
});

const QuestionsSchema = z.array(
  z.object({
    question: z.string(),
    mappedRiskId: z.string(),
    why: z.string(),
  })
);

function buildCandidateContext(resumeData: ExtractedResume, jdData: ExtractedJD): string {
  return `## Candidate Resume
Skills: ${resumeData.skills.join(', ')}
Experience:
${resumeData.experiences.map((e) => `- ${e.role} at ${e.company} (${e.dates}): ${e.achievements.join('; ')}`).join('\n')}
Metrics: ${resumeData.metrics.join('; ')}

## Job Description
Company: ${jdData.companyName ?? 'Not specified'}
Must Have: ${jdData.mustHave.join(', ')}
Nice to Have: ${jdData.niceToHave.join(', ')}
Keywords: ${jdData.keywords.join(', ')}`;
}

/**
 * Generate AI feedback for a user's answer to an interview question.
 */
export async function generateAnswerFeedback(
  question: string,
  userAnswer: string,
  resumeData: ExtractedResume,
  jdData: ExtractedJD,
  roundType: RoundType,
  retries = 1
): Promise<QuestionFeedbackResponse> {
  const openai = getOpenAIClient();
  const context = buildCandidateContext(resumeData, jdData);

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model: MODELS.extraction,
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              "You are an expert interview coach. Evaluate the candidate's answer and provide actionable feedback. Return only valid JSON.",
          },
          {
            role: 'user',
            content: `${context}

## Interview Context
Round type: ${roundType}
Question: "${question}"

## Candidate's Answer
"${userAnswer}"

Evaluate this answer and return JSON:
{
  "feedback": "2-3 sentence overall assessment of the answer quality",
  "score": <0-100 score>,
  "strengths": ["specific things the answer did well"],
  "improvements": ["specific actionable improvements with examples"]
}

Score guide: 0-30 = weak/off-topic, 31-60 = partial/needs work, 61-80 = good/solid, 81-100 = excellent/comprehensive.
Be specific — reference the actual content of their answer, not generic advice.`,
          },
        ],
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('Empty response from LLM');

      return FeedbackSchema.parse(JSON.parse(content));
    } catch (error) {
      if (attempt === retries) {
        console.error('Answer feedback generation failed:', error);
        throw new Error('Failed to generate feedback');
      }
    }
  }

  throw new Error('Unexpected feedback failure');
}

/**
 * Generate the best/ideal answer for an interview question.
 */
export async function generateBestAnswer(
  question: string,
  why: string,
  resumeData: ExtractedResume,
  jdData: ExtractedJD,
  roundType: RoundType,
  retries = 1
): Promise<BestAnswerResponse> {
  const openai = getOpenAIClient();
  const context = buildCandidateContext(resumeData, jdData);

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model: MODELS.extraction,
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You are an expert interview coach. Generate the ideal answer a strong candidate would give. Return only valid JSON.',
          },
          {
            role: 'user',
            content: `${context}

## Interview Context
Round type: ${roundType}
Question: "${question}"
Why they might ask this: "${why}"

Generate the ideal answer this specific candidate should give, leveraging their actual experience and skills from the resume. Return JSON:
{
  "bestAnswer": "A complete, well-structured ideal answer (3-5 paragraphs) that uses specific details from the candidate's resume",
  "keyPoints": ["key point the answer should hit", "another key point"]
}

The answer should:
- Reference specific projects, metrics, and experiences from the resume
- Be structured appropriately for a ${roundType} interview
- Demonstrate the skills the JD requires
- Be realistic and authentic to the candidate's background`,
          },
        ],
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('Empty response from LLM');

      return BestAnswerSchema.parse(JSON.parse(content));
    } catch (error) {
      if (attempt === retries) {
        console.error('Best answer generation failed:', error);
        throw new Error('Failed to generate best answer');
      }
    }
  }

  throw new Error('Unexpected best answer failure');
}

/**
 * Generate additional interview questions when the pool is exhausted.
 */
export async function generateMoreQuestions(
  resumeData: ExtractedResume,
  jdData: ExtractedJD,
  roundType: RoundType,
  existingQuestions: string[],
  count = 25,
  retries = 1
): Promise<LLMAnalysis['interviewQuestions']> {
  const openai = getOpenAIClient();
  const context = buildCandidateContext(resumeData, jdData);

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model: MODELS.extraction,
        temperature: 0.5,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You are an expert interview question designer. Generate unique, relevant interview questions. Return only valid JSON.',
          },
          {
            role: 'user',
            content: `${context}

## Interview Context
Round type: ${roundType}

## Already Asked Questions (DO NOT repeat these)
${existingQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

Generate ${count} NEW interview questions that are different from the ones above. Include a mix of:
- Technical deep-dives
- Behavioral/situational questions
- Case-based/problem-solving
- Role-specific questions

Return JSON:
{
  "questions": [
    {
      "question": "The interview question",
      "mappedRiskId": "risk-general",
      "why": "Why an interviewer would ask this"
    }
  ]
}`,
          },
        ],
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('Empty response from LLM');

      const parsed = JSON.parse(content);
      return QuestionsSchema.parse(parsed.questions);
    } catch (error) {
      if (attempt === retries) {
        console.error('Question generation failed:', error);
        throw new Error('Failed to generate more questions');
      }
    }
  }

  throw new Error('Unexpected question generation failure');
}
