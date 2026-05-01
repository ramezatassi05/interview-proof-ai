/**
 * Prep Plan Agent prompts.
 *
 * Generates a day-by-day prep plan keyed off the user's risks, practice
 * progress, and JD requirements. Aligned with the prep_plan_tasks DB enum.
 */
import type { AgentContextBundle } from '../context-loader';

export const SYSTEM_PROMPT = `You are the Prep Plan agent in InterviewProof. Generate a day-by-day prep schedule that is realistic, concrete, and risk-targeted.

Hard rules:
1. Output VALID JSON ONLY. No prose, no markdown, no preamble.
2. day_offset starts at 0 (today) and increments by 1 per day. Cover the user's available days.
3. Total tasks across the whole plan MUST be at most 50. Keep it sustainable — typically 2-5 tasks/day.
4. Each task must be concrete enough to act on without further clarification ("Practice STAR for the cross-functional collaboration risk" beats "do behavioral prep").
5. Use ONLY these categories (lowercase exact match):
   - practice (drills, mock answers)
   - study (reading, watching tutorials)
   - behavioral (behavioral question prep)
   - technical (technical-skill prep)
   - company_research (company/team-specific research)
   - review (reviewing past mistakes / past notes)
   - rest (intentional rest days; 0 estimated_minutes is fine)
6. estimated_minutes is an integer in [0, 240].
7. Tie tasks to specific risks where possible (the user's top risks are in the input).

Output schema (return EXACTLY this shape):
{
  "overview": "2-4 sentence high-level plan summary",
  "days": [
    {
      "day_offset": 0,
      "focus": "Single-sentence theme of the day",
      "tasks": [
        {
          "title": "...",
          "description": "...",
          "category": "practice|study|behavioral|technical|company_research|review|rest",
          "estimated_minutes": 30
        }
      ]
    }
  ]
}

Return JSON only.`;

interface CompactPrepPlanContext {
  report: {
    roundType: string;
    roleTitle: string | null;
    companyName: string | null;
  };
  topRisks: Array<{ id: string; title: string; severity: string; missingEvidence: string }>;
  practiceProgress: {
    answersAttempted: number;
    avgScore: number | null;
    weakestRiskIds: string[];
  };
  daysAvailable: number;
  targetDate: string | null;
  upcomingInterview: { companyName: string; roleTitle: string; interviewDate: string } | null;
}

export function buildUserPrompt(
  context: AgentContextBundle,
  options: { daysAvailable: number; targetDate: string | null }
): { prompt: string; compact: CompactPrepPlanContext } {
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

  const now = Date.now();
  const upcoming = context.opportunities
    .filter((o) => o.interviewDate && new Date(o.interviewDate).getTime() > now)
    .sort(
      (a, b) =>
        new Date(a.interviewDate as string).getTime() -
        new Date(b.interviewDate as string).getTime()
    )[0];

  const compact: CompactPrepPlanContext = {
    report: {
      roundType: context.report.roundType,
      roleTitle: context.report.roleTitle,
      companyName: context.report.companyName,
    },
    topRisks,
    practiceProgress: {
      answersAttempted: context.practiceProgress.answersAttempted,
      avgScore: context.practiceProgress.avgScore,
      weakestRiskIds: context.practiceProgress.weakestRiskIds,
    },
    daysAvailable: options.daysAvailable,
    targetDate: options.targetDate,
    upcomingInterview: upcoming
      ? {
          companyName: upcoming.companyName,
          roleTitle: upcoming.roleTitle,
          interviewDate: upcoming.interviewDate as string,
        }
      : null,
  };

  const prompt = `Build the prep plan for this user:

${JSON.stringify(compact, null, 2)}

Cover ${options.daysAvailable} days starting day_offset=0. Total tasks ≤ 50. Return JSON only.`;

  return { prompt, compact };
}
