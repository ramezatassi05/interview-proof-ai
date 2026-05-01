/**
 * Recruiter Communication Agent prompts (M7.7).
 *
 * Drafts a primary recruiter reply plus up to 2 tonal alternatives, all
 * grounded in the user's goal and the inbound recruiter message. Output is
 * user-facing copy — the action that wraps it is `requires_external_send=true`.
 */
import type { AgentContextBundle } from '../context-loader';
import type { Opportunity } from '@/types';

export const SYSTEM_PROMPT = `You are the Recruiter Communication agent inside InterviewProof. Your job is to draft a candidate's reply to a recruiter — never to send anything. Each draft you produce will be reviewed and edited by the candidate before they manually copy it into email/LinkedIn/etc.

Hard rules:
1. Output VALID JSON ONLY. No prose, no markdown, no preamble.
2. Write in the candidate's voice — natural, confident, professional. No corporate buzzwords ("synergy", "excited to leverage"). No filler.
3. Match the candidate's stated goal (the userGoal field). If they want to decline politely, decline politely. If they want to ask for more compensation info, ask. Do not invent a goal.
4. NEVER fabricate facts about the candidate. Only use details the candidate provided in their resume, the opportunity context, or the recruiter's message itself.
5. NEVER promise availability you cannot guarantee. Phrase scheduling as "I can do X or Y this week — does either work?" not "I will be available."
6. The primary draft is the most-likely-to-send option. Each alternative changes ONE meaningful dimension (more direct, warmer, more concise, asks more questions, etc.) and explains in the "tone" field what changed.
7. Subject lines: short, specific, reply-friendly. If the recruiter included a subject, prefer "Re: <their subject>".
8. Length: bodies should be 4–10 sentences. Concise wins. No paragraphs of throat-clearing.
9. If the recruiter's message is hostile, manipulative, or seems like a scam, return a short flag in the primary body's first sentence ("This message has some signals worth a second look — see notes below") and produce a cautious neutral reply.

Output schema (return EXACTLY this shape):
{
  "primary": { "subject": "...", "body": "...", "tone": "neutral-professional" },
  "alternatives": [
    { "subject": "...", "body": "...", "tone": "shorter | warmer | more-direct | asks-clarification | declines-firmly" }
  ],
  "rationale": "2-3 sentences explaining why the primary draft fits the candidate's goal"
}

alternatives must contain 0–2 items. Return JSON only — no fences, no commentary.`;

interface CompactRecruiterContext {
  recruiterMessage: string;
  userGoal: string;
  recipientHint: string | null;
  candidate: {
    roleTitle: string | null;
    companyName: string | null;
    roundType: string | null;
    resumeExcerpt: string | null;
  } | null;
  opportunity: {
    companyName: string;
    roleTitle: string;
    stage: string;
    interviewDate: string | null;
    notes: string | null;
  } | null;
}

export function buildUserPrompt(
  recruiterMessage: string,
  userGoal: string,
  opportunity: Opportunity | null,
  context: AgentContextBundle | null,
  recipientHint: string | null
): { prompt: string; compact: CompactRecruiterContext } {
  const compact: CompactRecruiterContext = {
    recruiterMessage: recruiterMessage.slice(0, 4000),
    userGoal,
    recipientHint,
    candidate: context
      ? {
          roleTitle: context.report.roleTitle,
          companyName: context.report.companyName,
          roundType: context.report.roundType,
          resumeExcerpt: context.report.resumeText
            ? context.report.resumeText.slice(0, 2000)
            : null,
        }
      : null,
    opportunity: opportunity
      ? {
          companyName: opportunity.companyName,
          roleTitle: opportunity.roleTitle,
          stage: opportunity.stage,
          interviewDate: opportunity.interviewDate ?? null,
          notes: opportunity.notes ?? null,
        }
      : null,
  };

  const prompt = `Draft the candidate's reply to the recruiter below. Match the candidate's stated goal.

${JSON.stringify(compact, null, 2)}

Return JSON only.`;

  return { prompt, compact };
}
