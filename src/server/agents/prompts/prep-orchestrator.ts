/**
 * Prep Orchestrator Agent prompts.
 *
 * SYSTEM_PROMPT is the cacheable preamble (large, stable, sent every call).
 * buildUserPrompt() serializes the loaded context bundle into a compact JSON
 * payload — we deliberately do NOT dump the entire LLM analysis. The model
 * gets just what it needs to pick the next best action with cited evidence.
 */
import type { AgentContextBundle } from '../context-loader';
import { AGENT_ACTION_TYPES } from '@/lib/agent/types';

const ACTION_TYPE_LIST = AGENT_ACTION_TYPES.map((t) => `- ${t}`).join('\n');

export const SYSTEM_PROMPT = `You are the Prep Orchestrator, an interview-prep coach embedded in InterviewProof.

Your job: given the user's current diagnostic state (risks, practice history, prep plan, opportunities, memory), pick the SINGLE next best action that will most reduce their interview risk, plus up to 5 supporting actions, and produce a short summary.

Hard rules — non-negotiable:
1. Output VALID JSON ONLY. No prose, no markdown, no preamble. Just the JSON object.
2. Cite specific evidence in evidenceRefs. Every nextAction or supportingAction must be grounded in either: a ranked risk id, a practice answer, a JD requirement, a resume bullet, or a user memory entry. If you cannot cite, do not propose the action.
3. NEVER propose external sends without explicit user approval. The action types draft_recruiter_reply and rewrite_resume_bullet produce drafts only; they will be queued for human review. Do NOT pretend they have been sent.
4. Stay inside the autonomy boundary. You DRAFT actions; the user APPROVES them. You do not execute, send emails, modify the user's resume, or trigger external tools. If the user asks you to "send" something, draft it and explain that approval is required.
5. Prefer concrete, scoped actions. "Practice the X risk for 20 minutes" beats "Review behavioral questions". Each action's payload must satisfy its action-type schema (see below).
6. Be honest about uncertainty. If the user has no practice history, say so in summary; do not fabricate progress.

Allowed action types (use the snake_case identifier exactly):
${ACTION_TYPE_LIST}

Required action payload shapes (camelCase keys; see also app validation):
- recommend_drill: { riskId: string, reason: string }
- start_mock_interview: { reportId: string (uuid), focusAreas: string[] (max 10) }
- score_answer: { answerId: string (uuid) }
- draft_recruiter_reply: { subject: string, body: string, recipientHint?: string }
- rewrite_resume_bullet: { originalBullet: string, rewrittenBullet: string, evidence?: string }
- create_company_brief: { companyName: string, roleTitle?: string }
- update_prep_plan: { prepPlanId: string (uuid), patch: object }
- propose_opportunity_update: { opportunityId: string (uuid), changes: object }
- summarize_progress: { reportId: string (uuid), windowDays: number (1-365) }

Output schema (return EXACTLY this shape):
{
  "summary": "1-3 sentence plain-language readout of where the user is and what to do next.",
  "nextAction": {
    "title": "Short imperative title, max 200 chars",
    "rationale": "Why this is the highest-leverage move RIGHT NOW, max 1000 chars",
    "actionType": "<one of the allowed action types>",
    "payload": { ... matching the schema above ... }
  },
  "supportingActions": [ { same shape as nextAction }, ... up to 5 ],
  "evidenceRefs": [ { "kind": "risk|practiceAnswer|jdRequirement|resumeBullet|memoryEntry", "id": "..." }, ... up to 20 ]
}

Edge cases:
- No diagnostic data yet → recommend a starter action (e.g. summarize_progress or start_mock_interview) and acknowledge limited signal.
- Practice scores trending down → prioritize recommend_drill on the weakest risk.
- Interview within 7 days (memory.kind = 'interview_date') → prioritize round-specific prep over breadth.
- No active prep plan → propose update_prep_plan ONLY if you have a concrete plan to insert; otherwise pick a different action type.

Remember: JSON only. No markdown fences, no commentary.`;

interface CompactContext {
  report: {
    id: string;
    roundType: string;
    roleTitle: string | null;
    companyName: string | null;
    readinessScore: number | null;
    riskBand: string | null;
  };
  topRisks: Array<{
    id: string;
    title: string;
    severity: string;
    missingEvidence: string;
  }>;
  practiceProgress: {
    answersAttempted: number;
    avgScore: number | null;
    scoreTrend: string;
    weakestRiskIds: string[];
    lastPracticedAt: string | null;
  };
  userProfile: {
    careerStage: string | null;
    targetRoles: string[];
    prepUrgency: string | null;
    biggestConcern: string | null;
    yearsExperience: number | null;
  } | null;
  activePrepPlan: {
    id: string;
    targetDate: string | null;
    pendingTasks: number;
  } | null;
  opportunitiesCount: number;
  upcomingInterview: { companyName: string; roleTitle: string; interviewDate: string } | null;
  recentMemory: Array<{ kind: string; key: string; value: unknown }>;
  userMessage?: string;
}

/**
 * Builds the compact user prompt. We send a JSON-shaped payload because
 * Claude is reliably good at extracting structured fields from JSON, and it
 * lets us bound token cost.
 */
export function buildUserPrompt(
  context: AgentContextBundle,
  userMessage?: string
): { prompt: string; compact: CompactContext } {
  // Top 3 risks by severity ordering (critical > high > medium > low) — fall
  // back to first 3 if rankedRisks is missing.
  const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  const allRisks = context.llmAnalysis?.rankedRisks ?? [];
  const topRisks = [...allRisks]
    .sort((a, b) => (severityOrder[a.severity] ?? 99) - (severityOrder[b.severity] ?? 99))
    .slice(0, 3)
    .map((r) => ({
      id: r.id,
      title: r.title,
      severity: r.severity,
      missingEvidence: r.missingEvidence,
    }));

  // Latest 5 memory entries (already sorted desc by updated_at in loader).
  const recentMemory = context.recentMemory.slice(0, 5).map((m) => ({
    kind: m.kind,
    key: m.key,
    value: m.valueJson,
  }));

  // Detect upcoming interview from opportunities (most-imminent future date).
  const now = Date.now();
  const upcoming = context.opportunities
    .filter((o) => o.interviewDate && new Date(o.interviewDate).getTime() > now)
    .sort(
      (a, b) =>
        new Date(a.interviewDate as string).getTime() -
        new Date(b.interviewDate as string).getTime()
    )[0];

  const pendingTasks = context.activePrepPlan
    ? context.activePrepPlan.tasks.filter(
        (t) => t.status === 'pending' || t.status === 'in_progress'
      ).length
    : 0;

  const compact: CompactContext = {
    report: {
      id: context.report.id,
      roundType: context.report.roundType,
      roleTitle: context.report.roleTitle,
      companyName: context.report.companyName,
      readinessScore: context.report.readinessScore,
      riskBand: context.report.riskBand,
    },
    topRisks,
    practiceProgress: {
      answersAttempted: context.practiceProgress.answersAttempted,
      avgScore: context.practiceProgress.avgScore,
      scoreTrend: context.practiceProgress.scoreTrend,
      weakestRiskIds: context.practiceProgress.weakestRiskIds,
      lastPracticedAt: context.practiceProgress.lastPracticedAt,
    },
    userProfile: context.userProfile
      ? {
          careerStage: context.userProfile.careerStage,
          targetRoles: context.userProfile.targetRoles,
          prepUrgency: context.userProfile.prepUrgency,
          biggestConcern: context.userProfile.biggestConcern,
          yearsExperience: context.userProfile.yearsExperience,
        }
      : null,
    activePrepPlan: context.activePrepPlan
      ? {
          id: context.activePrepPlan.plan.id,
          targetDate: context.activePrepPlan.plan.targetDate ?? null,
          pendingTasks,
        }
      : null,
    opportunitiesCount: context.opportunities.length,
    upcomingInterview: upcoming
      ? {
          companyName: upcoming.companyName,
          roleTitle: upcoming.roleTitle,
          interviewDate: upcoming.interviewDate as string,
        }
      : null,
    recentMemory,
  };

  if (userMessage && userMessage.trim().length > 0) {
    compact.userMessage = userMessage.trim();
  }

  const prompt = `Here is the user's current prep context:

${JSON.stringify(compact, null, 2)}

Pick the single highest-leverage next action plus up to 5 supporting actions. Cite evidence by id. Return JSON only.`;

  return { prompt, compact };
}
