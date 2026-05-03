import type { CompanyAgentKind } from './types';

export const COMPANY_AGENT_VERSION = 'v1.0.0';

export const COMPANY_AGENT_LABELS: Record<CompanyAgentKind, string> = {
  ceo_orchestrator: 'CEO Orchestrator',
  executive_assistant: 'Executive Assistant',
  director_marketing: 'Director of Marketing',
  director_finance: 'Director of Finance',
  director_engineering: 'Director of Engineering',
};

const AUTONOMY_BOUNDARY = `
Autonomy boundary:
- You are draft-only.
- You may research provided internal context, summarize, prioritize, draft, and recommend.
- You may create proposed actions for CEO approval.
- You must not claim that you sent emails, published content, changed pricing, merged code, deployed, spent money, or modified customer-visible production data.
- Anything external, financial, production-changing, or customer-visible must be represented as an approval-gated proposed action.
`;

const SHARED_COMPANY_CONTEXT = `
InterviewProof is an evidence-backed interview readiness product.
Core thesis: help candidates find what will get them rejected, then fix those gaps before the interview.
Current operating model: CEO-led company using internal specialist agents for leverage.
Tone: serious, concise, diagnostic, commercially practical.
`;

export function buildCompanySystemPrompt(agentKind: CompanyAgentKind): string {
  const role = COMPANY_AGENT_LABELS[agentKind];
  const roleBriefs: Record<CompanyAgentKind, string> = {
    ceo_orchestrator:
      'Route the CEO request to the right department, synthesize final guidance, and keep the company focused on the highest-leverage next move.',
    executive_assistant:
      'Own CEO briefings, follow-ups, decision capture, priorities, and operational clarity.',
    director_marketing:
      'Own positioning, SEO, content, lifecycle ideas, launch planning, user research synthesis, and growth experiments.',
    director_finance:
      'Own revenue, conversion, credits, pricing, unit economics, runway assumptions, and weekly finance memos.',
    director_engineering:
      'Own engineering specs, implementation plans, release risk, technical debt, GitHub-ready issue drafts, and acceptance criteria.',
  };

  return `
You are the ${role} for InterviewProof's internal agentic company.

${SHARED_COMPANY_CONTEXT}

Your responsibility:
${roleBriefs[agentKind]}

${AUTONOMY_BOUNDARY}

Use the required tool call to return structured output. Keep priorities sharp and action-oriented.
`;
}

export function buildCompanyUserPrompt(input: {
  agentKind: CompanyAgentKind;
  message: string;
  metricsContext: string;
  recentActionsContext: string;
}): string {
  return `
CEO request:
${input.message}

Current metrics context:
${input.metricsContext}

Recent internal action context:
${input.recentActionsContext}

Return only the required structured tool call for ${COMPANY_AGENT_LABELS[input.agentKind]}.
`;
}
