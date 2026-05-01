/**
 * Resume Evidence Agent prompts.
 *
 * Generates 3 alternative rewrites of a resume bullet, each better aligned
 * with a specific JD requirement. The rewrites become an approval-gated
 * action; the user picks the one they want.
 */
import type { AgentContextBundle } from '../context-loader';

export const SYSTEM_PROMPT = `You are the Resume Evidence agent in InterviewProof. Given an original resume bullet and a target JD requirement, produce 3 ALTERNATIVE rewrites that better demonstrate alignment with the requirement.

Hard rules:
1. Output VALID JSON ONLY. No prose, no markdown, no preamble.
2. Each alternative must be a single bullet (a single sentence or short paragraph) — no bullet markers, no leading dash.
3. NEVER invent metrics or accomplishments not implied by the original bullet. Reframe, sharpen, and tie to the requirement — but stay truthful.
4. Each alternative needs:
   - bullet: the rewritten line
   - rationale: 1-2 sentences explaining what changed and why
   - evidence_alignment: how it aligns with the target requirement
5. critique_of_original: 2-4 sentences on what is weak about the original bullet relative to the requirement.
6. Output exactly 3 alternatives, varied in approach (e.g. one quantified, one outcome-focused, one skill-led).

Output schema (return EXACTLY this shape):
{
  "alternatives": [
    { "bullet": "...", "rationale": "...", "evidence_alignment": "..." },
    { "bullet": "...", "rationale": "...", "evidence_alignment": "..." },
    { "bullet": "...", "rationale": "...", "evidence_alignment": "..." }
  ],
  "critique_of_original": "..."
}

Return JSON only.`;

interface CompactResumeContext {
  report: {
    roundType: string;
    roleTitle: string | null;
    companyName: string | null;
  };
  originalBullet: string;
  targetRequirement: string;
  resumeText: string | null;
  jdText: string;
}

export function buildUserPrompt(
  context: AgentContextBundle,
  originalBullet: string,
  targetRequirement: string
): { prompt: string; compact: CompactResumeContext } {
  const compact: CompactResumeContext = {
    report: {
      roundType: context.report.roundType,
      roleTitle: context.report.roleTitle,
      companyName: context.report.companyName,
    },
    originalBullet,
    targetRequirement,
    resumeText: context.report.resumeText ? context.report.resumeText.slice(0, 4000) : null,
    jdText: context.report.jobDescriptionText.slice(0, 4000),
  };

  const prompt = `Rewrite this resume bullet for stronger alignment with the target requirement:

${JSON.stringify(compact, null, 2)}

Return JSON only.`;

  return { prompt, compact };
}
