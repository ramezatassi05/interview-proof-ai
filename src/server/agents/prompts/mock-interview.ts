/**
 * Mock Interview Agent prompts.
 *
 * Three sub-prompts: question-set generation, per-turn evaluation, and the
 * final summary report.
 */
import type { AgentContextBundle } from '../context-loader';

export const QUESTION_SET_SYSTEM_PROMPT = `You are the Mock Interview agent in InterviewProof. Generate exactly 5 adaptive interview questions for THIS user, seeded from their top diagnostic risks. Each question should be the kind a real interviewer would ask in their target round (behavioral, technical, mixed, etc.).

Hard rules:
1. Output VALID JSON ONLY. No prose, no markdown, no preamble.
2. Each question must be tied to a specific risk id when possible (use mappedRiskId), else null.
3. Mix breadth and depth — at least one open-ended/behavioral, at least one technical depth probe.
4. Questions should be answerable in 90 seconds aloud.

Output schema (return EXACTLY this shape):
{
  "questions": [
    { "id": "q1", "prompt": "...", "mappedRiskId": "<risk-id-or-null>", "rationale": "why this question targets the user's risks" }
  ]
}

Return JSON only.`;

export const TURN_EVAL_SYSTEM_PROMPT = `You are the Mock Interview agent in InterviewProof, mid-interview. The user just answered a question. Evaluate, then decide whether to drill deeper with a follow-up or move to the next question in the queue.

Hard rules:
1. Output VALID JSON ONLY. No prose, no markdown, no preamble.
2. feedback_short is at most 2 sentences — a real interviewer's quick reaction.
3. follow_up_question is non-null ONLY when the answer was thin or evasive AND a sharper probe would teach the user something. Otherwise null and advance_to_next=true.
4. current_score is 0-100 for THIS answer alone, not cumulative.

Output schema (return EXACTLY this shape):
{
  "feedback_short": "...",
  "follow_up_question": "..." | null,
  "advance_to_next": true | false,
  "current_score": <0-100>
}

Return JSON only.`;

export const FINAL_REPORT_SYSTEM_PROMPT = `You are the Mock Interview agent in InterviewProof, wrapping up. Given the entire mock interview transcript, produce a final report.

Hard rules:
1. Output VALID JSON ONLY. No prose, no markdown, no preamble.
2. overall_score is a holistic 0-100 — not just the average.
3. per_question_scores has one entry per primary question (length matches the question count, ignoring follow-ups).
4. next_steps is at most 4 concrete drills the user should do next, each with a short rationale tied to the transcript.

Output schema (return EXACTLY this shape):
{
  "overall_score": <0-100>,
  "per_question_scores": [<0-100>, ...],
  "summary": "3-5 sentences on overall performance",
  "top_strengths": ["..."],
  "top_improvements": ["..."],
  "next_steps": [{ "title": "...", "rationale": "..." }]
}

Return JSON only.`;

interface CompactQuestionSetContext {
  report: {
    roundType: string;
    roleTitle: string | null;
    companyName: string | null;
  };
  topRisks: Array<{ id: string; title: string; severity: string; missingEvidence: string }>;
  resumeSkills: string[];
  jdMustHave: string[];
}

export function buildQuestionSetUserPrompt(context: AgentContextBundle): {
  prompt: string;
  compact: CompactQuestionSetContext;
} {
  const severityOrder: Record<string, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };
  const allRisks = context.llmAnalysis?.rankedRisks ?? [];
  const topRisks = [...allRisks]
    .sort((a, b) => (severityOrder[a.severity] ?? 99) - (severityOrder[b.severity] ?? 99))
    .slice(0, 5)
    .map((r) => ({
      id: r.id,
      title: r.title,
      severity: r.severity,
      missingEvidence: r.missingEvidence,
    }));

  const compact: CompactQuestionSetContext = {
    report: {
      roundType: context.report.roundType,
      roleTitle: context.report.roleTitle,
      companyName: context.report.companyName,
    },
    topRisks,
    resumeSkills: [],
    jdMustHave: [],
  };

  const prompt = `Generate the 5 mock-interview questions for this user:

${JSON.stringify(compact, null, 2)}

Return JSON only.`;

  return { prompt, compact };
}

export function buildTurnEvalUserPrompt(input: {
  currentQuestion: string;
  userAnswer: string;
  remainingQuestions: number;
  roundType: string;
}): string {
  return `The user is in a mock interview. Evaluate this turn.

Current question: ${input.currentQuestion}
Their answer: ${input.userAnswer}
Remaining questions in queue: ${input.remainingQuestions}
Round type: ${input.roundType}

Return JSON only.`;
}

export function buildFinalReportUserPrompt(input: {
  questions: { id: string; prompt: string }[];
  transcript: { role: string; content: string }[];
  roundType: string;
}): string {
  return `Mock interview complete. Generate the final report.

Questions:
${JSON.stringify(input.questions, null, 2)}

Transcript:
${JSON.stringify(input.transcript, null, 2)}

Round type: ${input.roundType}

Return JSON only.`;
}
