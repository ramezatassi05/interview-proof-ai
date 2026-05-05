import type { SkillDefinition } from '../types';

interface DraftFinanceMemoInput {
  topic: string;
  recommendation?: string;
  numbersToCite?: string;
}

export const draftFinanceMemoSkill: SkillDefinition<DraftFinanceMemoInput> = {
  id: 'draft_finance_memo',
  agentKinds: ['director_finance'],
  kind: 'write',
  ui: {
    label: 'Draft a finance note',
    description: 'Short note for the CEO on a money question — pricing, runway, spend.',
    icon: 'note',
  },
  tool: {
    name: 'draft_finance_memo',
    description:
      "Draft a short money-side note for the CEO — the kind of thing you'd Slack them after looking at the numbers. Pull the revenue picture first if you'll cite figures. Goes through approval before being logged as a decision.",
    input_schema: {
      type: 'object',
      additionalProperties: false,
      required: ['topic'],
      properties: {
        topic: { type: 'string', description: 'What the note is about.' },
        recommendation: { type: 'string', description: 'What you would do.' },
        numbersToCite: {
          type: 'string',
          description: 'Specific numbers to anchor on (pulled from fetch_revenue_snapshot).',
        },
      },
    },
  },
  async handler(input, ctx) {
    const { actionId } = await ctx.persistAction({
      actionType: 'draft_finance_memo',
      title: input.topic,
      rationale:
        input.recommendation ||
        "Money-side note the CEO asked for. Will get logged as a decision once they OK it.",
      priority: 'medium',
      payload: {
        topic: input.topic,
        recommendation: input.recommendation ?? null,
        numbersToCite: input.numbersToCite ?? null,
      },
    });
    return {
      status: 'awaiting_approval',
      output: { actionId, topic: input.topic },
      linkedActionId: actionId,
    };
  },
};
