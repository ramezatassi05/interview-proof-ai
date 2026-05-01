/**
 * Answer Feedback Agent prompts.
 *
 * Lightweight agent-level summary that wraps the existing
 * generateAnswerFeedback() output with encouragement + next-drill suggestion.
 */
import type { AgentContextBundle } from '../context-loader';
import type { QuestionFeedbackResponse } from '@/types';

export const SYSTEM_PROMPT = `You are the Answer Feedback agent in InterviewProof. The user just answered an interview question and the underlying scoring system has already produced detailed per-strength/per-improvement feedback. Your job is to write a SHORT, encouraging agent-level summary that helps the user feel coached, not graded.

Hard rules:
1. Output VALID JSON ONLY. No prose, no markdown, no preamble.
2. Be honest. If the answer was weak, encourage without inflating.
3. top_strengths and top_improvements are at most 3 each — distill, don't restate the underlying feedback verbatim.
4. suggested_followup_drill is OPTIONAL. Only set it if a clear next drill is warranted (typically when the score is below 70 OR the answer missed something the JD explicitly required). Otherwise set it to null.

Output schema (return EXACTLY this shape):
{
  "encouragement": "1-2 warm sentences acknowledging the attempt",
  "top_strengths": ["..."],
  "top_improvements": ["..."],
  "suggested_followup_drill": { "title": "...", "focus": "..." } | null
}

Return JSON only.`;

interface CompactAnswerFeedbackContext {
  report: {
    roundType: string;
    roleTitle: string | null;
    companyName: string | null;
  };
  question: string;
  userAnswer: string;
  feedback: {
    score: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
  };
  practice: {
    answersAttempted: number;
    avgScore: number | null;
    scoreTrend: string;
  };
}

export function buildUserPrompt(
  context: AgentContextBundle,
  question: string,
  userAnswer: string,
  feedback: QuestionFeedbackResponse
): { prompt: string; compact: CompactAnswerFeedbackContext } {
  const compact: CompactAnswerFeedbackContext = {
    report: {
      roundType: context.report.roundType,
      roleTitle: context.report.roleTitle,
      companyName: context.report.companyName,
    },
    question: question.slice(0, 1000),
    userAnswer: userAnswer.slice(0, 4000),
    feedback: {
      score: feedback.score,
      feedback: feedback.feedback,
      strengths: feedback.strengths,
      improvements: feedback.improvements,
    },
    practice: {
      answersAttempted: context.practiceProgress.answersAttempted,
      avgScore: context.practiceProgress.avgScore,
      scoreTrend: context.practiceProgress.scoreTrend,
    },
  };

  const prompt = `Here is the answer + underlying feedback:

${JSON.stringify(compact, null, 2)}

Write a short agent-level summary. Return JSON only.`;

  return { prompt, compact };
}
