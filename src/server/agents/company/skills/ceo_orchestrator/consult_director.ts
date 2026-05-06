import type { SkillDefinition } from '../types';
import type { CompanyTaskOwnerKind } from '../../types';

const CONSULT_TARGETS: readonly CompanyTaskOwnerKind[] = [
  'executive_assistant',
  'director_marketing',
  'director_finance',
  'director_engineering',
];

interface ConsultInput {
  targetAgent: CompanyTaskOwnerKind;
  question: string;
}

const ANSWER_CHAR_CAP = 4000;

// CEO-only. Synchronously invokes a target director's runner with the CEO's
// question and returns the director's text answer to the CEO. Budget-gated
// (2 consults per CEO turn) and depth-marked (`parentTurnId`) so inner runs
// can't recurse. Persists an 'archived' session for traceability — visible
// in audit but hidden from the director's drawer list.
//
// Imports of streamCompanyAgent + loadDirectorContext are dynamic so the
// skill registry doesn't pull the runner into the import graph at module
// init time (the runner imports the skill registry).
export const consultDirectorSkill: SkillDefinition<ConsultInput> = {
  id: 'consult_director',
  agentKinds: ['ceo_orchestrator'],
  kind: 'read',
  ui: {
    label: 'Ask a director',
    description: "Get a domain answer from one of your directors and bring it into your reply.",
    icon: 'message-circle',
  },
  tool: {
    name: 'consult_director',
    description:
      "Ask one of your direct reports a domain question and get their answer back. Use this when the operator asks something specific (revenue, funnel, eng status, etc.) that you don't have context for. The director will run with their full context and skills, and you'll receive their text answer to incorporate in your reply. Budget: 2 consults per turn.",
    input_schema: {
      type: 'object',
      additionalProperties: false,
      required: ['targetAgent', 'question'],
      properties: {
        targetAgent: {
          type: 'string',
          enum: [...CONSULT_TARGETS],
          description: 'Which direct report to consult.',
        },
        question: {
          type: 'string',
          description:
            "The exact question to ask. Be specific — they won't see your conversation, just this question.",
        },
      },
    },
  },
  async handler(input, ctx) {
    if (!ctx.consultBudget || ctx.consultBudget.remaining <= 0) {
      return {
        status: 'failed',
        output: { error: 'Consult budget exhausted (max 2 consults per turn).' },
      };
    }

    const targetAgent = input.targetAgent;
    const question = input.question?.trim();
    if (!question) return { status: 'failed', output: { error: 'question is required' } };
    if (!CONSULT_TARGETS.includes(targetAgent)) {
      return {
        status: 'failed',
        output: { error: `Invalid targetAgent "${targetAgent}".` },
      };
    }

    ctx.consultBudget.remaining -= 1;

    // Ephemeral 'archived' session keeps the consult auditable without
    // polluting the director's user-facing drawer list.
    const { data: session, error: sessionError } = await ctx.supabase
      .from('company_agent_sessions')
      .insert({
        user_id: ctx.userId,
        agent_kind: targetAgent,
        title: `CEO consult: ${question.slice(0, 60)}`,
        status: 'archived',
        triggered_by: 'agent',
        last_message_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (sessionError || !session) {
      return {
        status: 'failed',
        output: { error: sessionError?.message ?? 'Could not create consult session.' },
      };
    }

    // Dynamic imports break the consult_director ↔ runner ↔ skill-index cycle.
    const { streamCompanyAgent } = await import('../../company-agent-runner');
    const { loadDirectorContext } = await import('../../director-context');

    const directorContext = await loadDirectorContext({
      supabase: ctx.supabase,
      userId: ctx.userId,
      kind: targetAgent,
    });

    try {
      const result = await streamCompanyAgent({
        userId: ctx.userId,
        sessionId: session.id,
        agentKind: targetAgent,
        message: question,
        supabase: ctx.supabase,
        metrics: ctx.metrics,
        directorContext,
        triggeredBy: 'agent',
        parentTurnId: ctx.sessionId,
      });

      return {
        status: 'succeeded',
        output: {
          targetAgent,
          answer: result.text.slice(0, ANSWER_CHAR_CAP),
          innerSessionId: session.id,
          tokensIn: result.tokensIn,
          tokensOut: result.tokensOut,
        },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        status: 'failed',
        output: { error: `Consult failed: ${message}` },
      };
    }
  },
};
