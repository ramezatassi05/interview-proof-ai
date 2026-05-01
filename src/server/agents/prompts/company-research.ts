/**
 * Company Research Agent prompts (M7.6).
 *
 * Produces a structured, interview-ready company brief. The prompt enforces
 * a strict JSON output shape that maps onto CompanyResearchOutput in types.
 */
import type { AgentContextBundle } from '../context-loader';

export const SYSTEM_PROMPT = `You are the Company Research agent inside InterviewProof. Your job is to produce a structured, interview-ready brief about a single target company so the candidate can walk into their interview prepared with concrete, specific knowledge about that company.

Hard rules:
1. Output VALID JSON ONLY. No prose, no markdown, no preamble.
2. Be concrete and specific. Generic platitudes ("great culture", "innovative") are useless. Cite real product lines, named teams, and recent shipping news when you know them.
3. If you do NOT know something with confidence, return an empty array or short fallback text rather than fabricating details. It is better to return an empty array than invented facts.
4. recentNews items should be dated when possible (e.g., "2025 Q4 launch of X"). Do not include speculative items.
5. interviewerHints are concrete behavioral signals an interviewer at THIS company likely probes for, derived from the company's stated values and product priorities — not generic interview tips.
6. sources is a list of real publicly-known references the candidate can read (official site, recent press, engineering blog). Each source MUST have a non-empty title; url and snippet are optional.
7. Where the candidate's resume or JD context is provided, tailor recentNews / hiringSignals / interviewerHints to overlap with the candidate's experience and the role being interviewed.

Output schema (return EXACTLY this shape):
{
  "summary": "2-4 sentences positioning the company in its market",
  "mission": "1-2 sentences on the company's stated mission",
  "recentNews": ["dated news item", ...],
  "productAreas": ["named product or area", ...],
  "hiringSignals": ["what they appear to be hiring for / scaling", ...],
  "cultureSignals": ["concrete value or working norm", ...],
  "interviewerHints": ["specific signal interviewers will probe for", ...],
  "sources": [{ "title": "...", "url": "...", "snippet": "..." }, ...]
}

Return JSON only — no fences, no commentary.`;

interface CompactCompanyContext {
  companyName: string;
  roleTitle: string | null;
  reportContext: {
    candidateRoundType: string;
    candidateResumeExcerpt: string | null;
    jdExcerpt: string;
  } | null;
}

export function buildUserPrompt(
  companyName: string,
  roleTitle: string | null,
  context: AgentContextBundle | null
): { prompt: string; compact: CompactCompanyContext } {
  const compact: CompactCompanyContext = {
    companyName,
    roleTitle: roleTitle ?? context?.report.roleTitle ?? null,
    reportContext: context
      ? {
          candidateRoundType: context.report.roundType,
          candidateResumeExcerpt: context.report.resumeText
            ? context.report.resumeText.slice(0, 2000)
            : null,
          jdExcerpt: context.report.jobDescriptionText.slice(0, 2000),
        }
      : null,
  };

  const prompt = `Research the following company and produce an interview-ready brief.

${JSON.stringify(compact, null, 2)}

Tailor the brief to be most useful for a candidate preparing for the interview round noted above. Return JSON only.`;

  return { prompt, compact };
}
