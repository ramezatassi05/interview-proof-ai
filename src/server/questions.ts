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
  strengths: z.array(z.string()).max(5),
  improvements: z.array(z.string()).max(5),
  strengthQuotes: z.array(z.string()).optional(),
  improvementQuotes: z.array(z.string()).optional(),
  tips: z.array(z.string()).min(1).max(4).optional(),
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
  "improvements": ["specific actionable improvements with examples"],
  "strengthQuotes": ["verbatim quote from the answer for each strength"],
  "improvementQuotes": ["verbatim quote from the answer for each improvement"],
  "tips": ["specific, actionable tip for improving this answer on a retry"]
}

IMPORTANT for quotes: Each entry in strengthQuotes/improvementQuotes must be a VERBATIM substring copied exactly from the candidate's answer, corresponding to the same array index. If a feedback item is about something MISSING from the answer (not present in the text), use an empty string "" for that quote.

For "tips", give 2-3 specific, actionable suggestions the candidate can apply RIGHT NOW if they try this question again. Each tip should tell them exactly what to say or include — not generic advice. Frame them as encouraging coaching ("Try opening with...", "Next time, mention...", "A stronger version would include...").

Score guide: 0-30 = weak/off-topic, 31-60 = partial/needs work, 61-80 = good/solid, 81-100 = excellent/comprehensive.
Be specific — reference the actual content of their answer, not generic advice.`,
          },
        ],
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('Empty response from LLM');

      const parsed = FeedbackSchema.parse(JSON.parse(content));
      // Ensure at least one entry for strengths/improvements so the UI always has something to show
      if (parsed.strengths.length === 0) {
        parsed.strengths = ['Attempted the question'];
      }
      if (parsed.improvements.length === 0) {
        parsed.improvements = ['Provide more detail and specificity in your answer'];
      }
      return parsed;
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
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You are an expert interview coach. Generate the answer as if the candidate is speaking naturally in a live interview — conversational, confident, and concise. Not an essay. Return only valid JSON.',
          },
          {
            role: 'user',
            content: `${context}

## Interview Context
Round type: ${roundType}
Question: "${question}"
Why they might ask this: "${why}"

Generate the ideal spoken answer this candidate should give in a live interview. Return JSON:
{
  "bestAnswer": "The answer as the candidate would actually say it out loud — natural, conversational, and to the point",
  "keyPoints": ["key point the answer should hit", "another key point"]
}

Rules for the answer:
- Write it as SPOKEN WORDS, not a written essay. Use the candidate's natural voice.
- Start with honest framing (e.g. "I haven't used X directly, but..." or "In my role at Y, I...")
- Use short sentences. Break up points clearly — a brief intro, 2-3 concrete examples, and a short closer.
- Reference specific projects, metrics, and experiences from the resume
- Keep it under 200 words — concise enough to say in ~90 seconds
- No filler phrases like "I am eager to expand" or "I believe they are crucial" or "Furthermore"
- End with a confident bridge, not a generic enthusiasm statement
- Be structured appropriately for a ${roundType} interview`,
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
