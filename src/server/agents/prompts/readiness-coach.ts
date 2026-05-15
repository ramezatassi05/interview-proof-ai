/**
 * Readiness Coach Agent prompts.
 *
 * Plain-language explainer + drill recommender for a specific risk.
 */
import type { AgentContextBundle } from '../context-loader';
import type { RiskItem } from '@/types';

export const SYSTEM_PROMPT = `You are the Readiness Coach inside InterviewProof. Your job is to explain ONE specific interview risk to the user in plain language, then recommend concrete drills they can do RIGHT NOW.

Hard rules:
1. Output VALID JSON ONLY. No prose, no markdown, no preamble.
2. Be specific to the user's resume + JD. Generic advice is useless. Cite quotes from their actual materials.
3. Recommend at most 3 drills. Each drill must have a clear focus and a one-sentence "why this risk".
4. Evidence quotes (max 5) are short verbatim snippets from the user's resume, the JD, or the diagnostic analysis. Use the source field to mark which.
5. NEVER fabricate quotes. If you cannot find a real quote that supports a point, omit that quote.
6. Tone: warm but direct. Encourage without sugarcoating.
7. Optional: if a discrete drill is clearly NOT the right next move (e.g. the user needs a multi-question mock to surface live behavior, or a full week-by-week prep plan rather than a single rep), add a suggested_delegations entry pointing to the right specialist agent. Each delegation must include a focused brief (max 2000 chars) that the target agent will receive as its first system message. Skip delegations when drills will suffice — fewer, sharper proposals beat speculative ones.

Output schema (return EXACTLY this shape):
{
  "summary": "2-4 sentence plain-language explanation of the risk",
  "why_it_matters": "1-3 sentences on the concrete interview consequence if unaddressed",
  "recommended_drills": [
    { "title": "short imperative title", "focus": "what to practice", "why": "why this drill addresses this risk" }
  ],
  "evidence_quotes": [
    { "source": "resume" | "jd" | "analysis", "quote": "verbatim short quote" }
  ],
  "suggested_delegations": [
    { "target_agent_kind": "mock_interview | prep_plan | resume_evidence | application_materials", "brief": "scoped task for the specialist, max 2000 chars" }
  ]
}

The suggested_delegations array is optional — return [] (or omit) when no specialist handoff is warranted. Do NOT delegate back to readiness_coach.

Return JSON only — no fences, no commentary.`;

interface CompactReadinessContext {
  report: {
    roundType: string;
    roleTitle: string | null;
    companyName: string | null;
  };
  risk:
    | {
        id: string;
        title: string;
        severity: string;
        rationale: string;
        missingEvidence: string;
      }
    | { description: string };
  resumeText: string | null;
  jdText: string;
  practice: {
    answersAttempted: number;
    avgScore: number | null;
  };
}

export function buildUserPrompt(
  context: AgentContextBundle,
  risk: RiskItem | null,
  riskDescription: string | undefined
): { prompt: string; compact: CompactReadinessContext } {
  const compact: CompactReadinessContext = {
    report: {
      roundType: context.report.roundType,
      roleTitle: context.report.roleTitle,
      companyName: context.report.companyName,
    },
    risk: risk
      ? {
          id: risk.id,
          title: risk.title,
          severity: risk.severity,
          rationale: risk.rationale,
          missingEvidence: risk.missingEvidence,
        }
      : { description: riskDescription ?? 'No specific risk supplied.' },
    // Truncate resume + JD aggressively to keep token budget tight.
    resumeText: context.report.resumeText ? context.report.resumeText.slice(0, 4000) : null,
    jdText: context.report.jobDescriptionText.slice(0, 4000),
    practice: {
      answersAttempted: context.practiceProgress.answersAttempted,
      avgScore: context.practiceProgress.avgScore,
    },
  };

  const prompt = `Here is the user's context for this risk:

${JSON.stringify(compact, null, 2)}

Explain this risk, then recommend up to 3 concrete drills with cited evidence quotes. Return JSON only.`;

  return { prompt, compact };
}
