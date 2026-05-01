/**
 * Opportunity Tracker Agent prompts (M7.8).
 *
 * Reviews ONE opportunity in light of the user's practice progress, memory,
 * and (optionally) latest readiness report, and proposes updates to that
 * opportunity plus an optional patch to the active prep plan.
 */
import type { AgentContextBundle } from '../context-loader';
import type { Opportunity } from '@/types';

export const SYSTEM_PROMPT = `You are the Opportunity Tracker agent inside InterviewProof. Your job is to review ONE opportunity (a job the candidate is pursuing) in light of their practice signals, recent memory, and any readiness report context, and propose concrete updates to the opportunity record plus an optional patch to their active prep plan.

You never modify data directly — every recommendation becomes a drafted action the candidate must approve.

Hard rules:
1. Output VALID JSON ONLY. No prose, no markdown, no preamble.
2. Be conservative about stage transitions. Only propose a stage change when the candidate's notes or recent activity clearly indicate it (e.g., "scheduled phone screen for Tuesday" → propose moving to phone_screen). Do not invent stage transitions.
3. interviewDate suggestions must come from explicit signals in the notes, recruiter messages, or memory. If no explicit date is present, omit the field.
4. notes patches are append-style — write the NEW notes content the user should review, not "add this to existing notes". Be concrete.
5. prepRecommendation answers: should we update or create a prep plan for this opportunity? Only flag needsPrepPlan=true when the opportunity has an upcoming interview AND the candidate's practice progress suggests gaps.
6. evidenceSignals is a short list of specific facts (1-2 sentences each) that informed your recommendation. Reference fields: opportunity.notes, practiceProgress.weakestRiskIds, recentMemory entries, the readiness report's risk band, etc.
7. If there is nothing actionable to propose, return proposedChanges as an empty object and prepRecommendation.needsPrepPlan=false. An empty recommendation is a valid output.

Output schema (return EXACTLY this shape):
{
  "summary": "1-2 sentence assessment of where this opportunity stands",
  "proposedChanges": {
    "stage": "applied | recruiter_screen | phone_screen | onsite | offer | rejected | withdrawn (omit if no change)",
    "interviewDate": "ISO date string or omit",
    "notes": "new notes content or omit"
  },
  "prepRecommendation": {
    "needsPrepPlan": true | false,
    "reason": "1-2 sentence why",
    "suggestedFocus": ["focus area", ...]
  },
  "evidenceSignals": ["concrete signal that informed this", ...]
}

Return JSON only — no fences, no commentary.`;

interface CompactOpportunityContext {
  opportunity: {
    id: string;
    companyName: string;
    roleTitle: string;
    stage: string;
    interviewDate: string | null;
    notes: string | null;
    archived: boolean;
    createdAt: string;
    updatedAt: string;
  };
  candidate: {
    roleTitle: string | null;
    companyName: string | null;
    roundType: string | null;
    riskBand: string | null;
    readinessScore: number | null;
  } | null;
  practiceProgress: {
    answersAttempted: number;
    avgScore: number | null;
    scoreTrend: string;
    weakestRiskIds: string[];
    lastPracticedAt: string | null;
  } | null;
  recentMemoryDigest: { kind: string; key: string }[];
  hasActivePrepPlan: boolean;
}

export function buildUserPrompt(
  opportunity: Opportunity,
  context: AgentContextBundle | null
): { prompt: string; compact: CompactOpportunityContext } {
  const compact: CompactOpportunityContext = {
    opportunity: {
      id: opportunity.id,
      companyName: opportunity.companyName,
      roleTitle: opportunity.roleTitle,
      stage: opportunity.stage,
      interviewDate: opportunity.interviewDate ?? null,
      notes: opportunity.notes ?? null,
      archived: opportunity.archived,
      createdAt: opportunity.createdAt,
      updatedAt: opportunity.updatedAt,
    },
    candidate: context
      ? {
          roleTitle: context.report.roleTitle,
          companyName: context.report.companyName,
          roundType: context.report.roundType,
          riskBand: context.report.riskBand,
          readinessScore: context.report.readinessScore,
        }
      : null,
    practiceProgress: context
      ? {
          answersAttempted: context.practiceProgress.answersAttempted,
          avgScore: context.practiceProgress.avgScore,
          scoreTrend: context.practiceProgress.scoreTrend,
          weakestRiskIds: context.practiceProgress.weakestRiskIds,
          lastPracticedAt: context.practiceProgress.lastPracticedAt,
        }
      : null,
    recentMemoryDigest: (context?.recentMemory ?? []).map((m) => ({
      kind: m.kind,
      key: m.key,
    })),
    hasActivePrepPlan: Boolean(context?.activePrepPlan),
  };

  const prompt = `Review this opportunity and propose concrete updates if any are warranted.

${JSON.stringify(compact, null, 2)}

Return JSON only.`;

  return { prompt, compact };
}
