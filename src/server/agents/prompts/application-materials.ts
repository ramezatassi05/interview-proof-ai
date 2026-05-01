/**
 * Application Materials Agent prompts (M7.10).
 *
 * Two modes:
 *  - 'bullet'        : tailor ONE short piece of resume copy (a bullet or
 *                      headline) to a specific JD requirement.
 *  - 'cover_letter'  : produce a full cover letter or focused application
 *                      response for an application-form prompt.
 *
 * Both modes produce user-facing copy. The action that wraps the output
 * carries requires_external_send=true.
 */
import type { AgentContextBundle } from '../context-loader';

export const BULLET_SYSTEM_PROMPT = `You are the Application Materials agent inside InterviewProof, in BULLET mode. Your job is to rewrite ONE short piece of resume copy (a bullet or headline) so it lands harder against a specific job-description requirement, while remaining truthful to the candidate's actual experience.

Hard rules:
1. Output VALID JSON ONLY. No prose, no markdown, no preamble.
2. NEVER fabricate metrics, technologies, employers, or accomplishments. The rewrite must be grounded in the candidate's resume context. If you cannot find supporting evidence, return a rewrite that simply tightens phrasing — do not invent.
3. Strong bullets lead with an action verb, name the lever (what you owned/built), and quantify impact when possible (use real numbers from the candidate's resume only).
4. Match the JD's vocabulary where it is honest to do so. Do not stuff keywords.
5. evidence is a 1-3 sentence justification: which resume detail powers the rewrite, and why this rewrite fits the JD requirement.
6. rationale is a 1-2 sentence summary the candidate will see; include any caveat about claims that may need verification.

Output schema (return EXACTLY this shape):
{
  "rewrittenBullet": "the rewritten bullet (single line, ~120-220 chars typical)",
  "evidence": "1-3 sentences pointing to the candidate's resume support",
  "rationale": "1-2 sentence user-facing summary"
}

Return JSON only — no fences, no commentary.`;

export const COVER_LETTER_SYSTEM_PROMPT = `You are the Application Materials agent inside InterviewProof, in COVER_LETTER mode. Your job is to draft a tailored cover letter (or focused short-answer response if the candidate provided an application prompt) that connects the candidate's actual experience to the role and company.

Hard rules:
1. Output VALID JSON ONLY. No prose, no markdown, no preamble.
2. Write in the candidate's voice — natural, confident, specific. No buzzwords ("synergy", "excited to leverage"), no hyperbole.
3. NEVER fabricate facts about the candidate. Use only details present in the resume excerpt and report context. If a sentence would require a claim you cannot verify, rephrase or omit it.
4. Make it specific to THIS company and role, citing real elements from the JD or report context. Generic letters are a fail.
5. Length: if no applicationPrompt is provided, target 2-4 short paragraphs (200-350 words). If an applicationPrompt is provided, match the format the prompt asks for (often 1-3 short paragraphs, 80-200 words).
6. The subject is short and reply-friendly: e.g. "Application — <role> — <candidate name or signature>" or, when applicationPrompt is given, an echo like "Re: <prompt theme>".
7. rationale is 2-3 sentences telling the candidate WHICH resume + JD details powered this draft, so they can audit it.

Output schema (return EXACTLY this shape):
{
  "subject": "short subject line",
  "body": "the full cover letter or short-answer body",
  "rationale": "2-3 sentence audit trail of which resume + JD signals powered the draft"
}

Return JSON only — no fences, no commentary.`;

interface CompactBulletContext {
  mode: 'bullet';
  originalBullet: string;
  targetRequirement: string | null;
  candidate: {
    roleTitle: string | null;
    companyName: string | null;
    roundType: string;
    resumeExcerpt: string | null;
    jdExcerpt: string;
  };
}

interface CompactCoverLetterContext {
  mode: 'cover_letter';
  applicationPrompt: string | null;
  paragraphsTarget: number | null;
  candidate: {
    roleTitle: string | null;
    companyName: string | null;
    roundType: string;
    resumeExcerpt: string | null;
    jdExcerpt: string;
  };
}

export function buildBulletPrompt(
  context: AgentContextBundle,
  originalBullet: string,
  targetRequirement: string | null
): { prompt: string; compact: CompactBulletContext } {
  const compact: CompactBulletContext = {
    mode: 'bullet',
    originalBullet: originalBullet.slice(0, 1000),
    targetRequirement,
    candidate: {
      roleTitle: context.report.roleTitle,
      companyName: context.report.companyName,
      roundType: context.report.roundType,
      resumeExcerpt: context.report.resumeText ? context.report.resumeText.slice(0, 4000) : null,
      jdExcerpt: context.report.jobDescriptionText.slice(0, 4000),
    },
  };

  const prompt = `Tailor the candidate's bullet for the requirement and JD context below.

${JSON.stringify(compact, null, 2)}

Return JSON only.`;

  return { prompt, compact };
}

export function buildCoverLetterPrompt(
  context: AgentContextBundle,
  applicationPrompt: string | null,
  paragraphsTarget: number | null
): { prompt: string; compact: CompactCoverLetterContext } {
  const compact: CompactCoverLetterContext = {
    mode: 'cover_letter',
    applicationPrompt,
    paragraphsTarget,
    candidate: {
      roleTitle: context.report.roleTitle,
      companyName: context.report.companyName,
      roundType: context.report.roundType,
      resumeExcerpt: context.report.resumeText ? context.report.resumeText.slice(0, 4000) : null,
      jdExcerpt: context.report.jobDescriptionText.slice(0, 4000),
    },
  };

  const prompt = `Draft a tailored cover letter or focused short-answer response.

${JSON.stringify(compact, null, 2)}

Return JSON only.`;

  return { prompt, compact };
}
