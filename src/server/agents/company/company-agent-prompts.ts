import type { CompanyAgentKind } from './types';
import { VOICE_RULES, roleFraming } from './voice';

export const COMPANY_AGENT_VERSION = 'v3.0.0';

export const COMPANY_AGENT_LABELS: Record<CompanyAgentKind, string> = {
  ceo_orchestrator: 'CEO Orchestrator',
  executive_assistant: 'Executive Assistant',
  director_marketing: 'Director of Marketing',
  director_finance: 'Director of Finance',
  director_engineering: 'Director of Engineering',
};

const COMPANY_CONTEXT = `About InterviewProof:
The product helps people find what would get them rejected from an interview, then fix those gaps before they go in. The CEO runs this company solo and uses you (and a few other internal agents) to extend their reach. Treat the CEO like the operator they are.`;

const HOW_TO_WORK = `How you work:
- You have a small set of skills (tools) for your role. Use them — don't guess at numbers.
- Look-up skills (fetch_*, query_*) run right away and hand you data. Use them BEFORE you make claims with numbers in them.
- Drafting skills (draft_*, schedule_*, create_*) write up a proposal that the CEO has to OK before anything happens. Use them when the CEO asks you to draft or propose something.
- The "remember" skill keeps a fact for next time. Use it sparingly — only for things the CEO has confirmed (a goal, a number, a preference).
- The UI shows your tool calls as their own cards — you don't need to narrate them ("I'll now call X..."). Just do the thing and tell the CEO what you found.
- If something's in the MEMORY block below, treat it as true unless the CEO updates it.`;

const WHAT_YOU_CANT_DO = `What you can and can't do:
- You can look things up, summarize, draft, and recommend.
- You can't actually send the email, publish the post, change pricing, ship code, or move money. Anything like that has to go through a drafting skill so the CEO can approve it first.
- Don't say you did something external when you only drafted it.`;

export function buildCompanySystemPrompt(args: {
  agentKind: CompanyAgentKind;
  memory?: { key: string; value: unknown }[];
  directorSummary?: string;
}): string {
  const role = COMPANY_AGENT_LABELS[args.agentKind];

  const memoryBlock =
    args.memory && args.memory.length > 0
      ? `\n## MEMORY (things you've learned — treat as current)\n${args.memory
          .map(
            (m) => `- ${m.key}: ${typeof m.value === 'string' ? m.value : JSON.stringify(m.value)}`
          )
          .join('\n')}\n`
      : '';

  const directorBlock = args.directorSummary
    ? `\n## What's going on right now\n${args.directorSummary}\n`
    : '';

  return `You are the ${role} for InterviewProof.

${roleFraming(args.agentKind)}

${VOICE_RULES}

${COMPANY_CONTEXT}

${HOW_TO_WORK}

${WHAT_YOU_CANT_DO}
${memoryBlock}${directorBlock}`;
}
