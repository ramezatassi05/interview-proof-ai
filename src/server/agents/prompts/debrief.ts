/**
 * Post-Interview Debrief Agent prompts (M7.9).
 *
 * Reads the candidate's free-form interview-summary, plus their recent
 * practice answers and report context, and produces a structured debrief
 * with proposed user_memory upserts. Memory is NOT written by the agent —
 * the upserts ride along in evidence_refs_json on a drafted summarize_progress
 * action and are applied only when the user approves the action.
 */
import type { AgentContextBundle } from '../context-loader';

export const SYSTEM_PROMPT = `You are the Post-Interview Debrief agent inside InterviewProof. The candidate has just finished an interview round and wants a structured reflection PLUS proposed memory updates. You never write memory directly — the candidate must approve every proposed entry.

Hard rules:
1. Output VALID JSON ONLY. No prose, no markdown, no preamble.
2. Anchor your debrief in the candidate's OWN words from interviewSummary plus concrete observations from their recent practice answers. Do not invent strengths or weaknesses they did not surface.
3. Each entry in proposedMemory MUST have a kind from {weakness, preference, goal}. The key is a short snake_case identifier the candidate can recognize (e.g., "system_design_capacity_estimation"). The value is a 1-2 sentence concrete description.
4. Cap proposedMemory at 5 items. Quality over quantity. Do not duplicate entries already in recentMemoryDigest.
5. evidenceFromPractice references practice_answers by their id. Only reference ids that appear in the provided practiceAnswers list. If you cannot point to a real id, omit the entry.
6. Tone: candid and useful. Do not sugarcoat weaknesses; do not catastrophize. Helpful debrief partners are direct.
7. If interviewSummary indicates the interview went very well, it is fine for whatToImprove to be short (1-2 items). If it went poorly, whatWentWell should still surface at least one durable strength.

Output schema (return EXACTLY this shape):
{
  "summary": "2-3 sentence overall assessment grounded in the candidate's words and practice signals",
  "whatWentWell": ["concrete strength", ...],
  "whatToImprove": ["concrete improvement target", ...],
  "proposedMemory": [
    { "kind": "weakness | preference | goal", "key": "snake_case_identifier", "value": "1-2 sentence description" }
  ],
  "evidenceFromPractice": [
    { "practiceAnswerId": "uuid from the provided list", "observation": "what the answer revealed" }
  ]
}

Return JSON only — no fences, no commentary.`;

interface PracticeAnswerSummary {
  id: string;
  questionText: string;
  answerExcerpt: string;
  score: number | null;
  mappedRiskId: string | null;
  attemptNumber: number;
  createdAt: string;
}

interface CompactDebriefContext {
  reportId: string;
  windowDays: number;
  interviewSummary: string;
  opportunityHint: { id: string; companyName: string; roleTitle: string; stage: string } | null;
  candidate: {
    roleTitle: string | null;
    companyName: string | null;
    roundType: string;
    riskBand: string | null;
    readinessScore: number | null;
  };
  practiceProgress: {
    answersAttempted: number;
    avgScore: number | null;
    scoreTrend: string;
    weakestRiskIds: string[];
    lastPracticedAt: string | null;
  };
  practiceAnswers: PracticeAnswerSummary[];
  recentMemoryDigest: { kind: string; key: string }[];
}

export interface BuildDebriefPromptArgs {
  reportId: string;
  windowDays: number;
  interviewSummary: string;
  context: AgentContextBundle;
  practiceAnswers: PracticeAnswerSummary[];
  opportunityHint: {
    id: string;
    companyName: string;
    roleTitle: string;
    stage: string;
  } | null;
}

export function buildUserPrompt(args: BuildDebriefPromptArgs): {
  prompt: string;
  compact: CompactDebriefContext;
} {
  const { reportId, windowDays, interviewSummary, context, practiceAnswers, opportunityHint } =
    args;

  const compact: CompactDebriefContext = {
    reportId,
    windowDays,
    interviewSummary: interviewSummary.slice(0, 4000),
    opportunityHint,
    candidate: {
      roleTitle: context.report.roleTitle,
      companyName: context.report.companyName,
      roundType: context.report.roundType,
      riskBand: context.report.riskBand,
      readinessScore: context.report.readinessScore,
    },
    practiceProgress: {
      answersAttempted: context.practiceProgress.answersAttempted,
      avgScore: context.practiceProgress.avgScore,
      scoreTrend: context.practiceProgress.scoreTrend,
      weakestRiskIds: context.practiceProgress.weakestRiskIds,
      lastPracticedAt: context.practiceProgress.lastPracticedAt,
    },
    practiceAnswers,
    recentMemoryDigest: context.recentMemory.map((m) => ({ kind: m.kind, key: m.key })),
  };

  const prompt = `Debrief the candidate's interview using their own summary and their recent practice signals.

${JSON.stringify(compact, null, 2)}

Return JSON only.`;

  return { prompt, compact };
}
