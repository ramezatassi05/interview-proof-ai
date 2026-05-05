import type { SkillDefinition } from '../types';

interface DraftEngineeringSpecInput {
  feature: string;
  goal: string;
  constraints?: string;
  estimatedSize?: 'small' | 'medium' | 'large';
}

export const draftEngineeringSpecSkill: SkillDefinition<DraftEngineeringSpecInput> = {
  id: 'draft_engineering_spec',
  agentKinds: ['director_engineering'],
  kind: 'write',
  ui: {
    label: 'Draft a spec',
    description: 'Short spec the team can pick up and start on.',
    icon: 'doc',
  },
  tool: {
    name: 'draft_engineering_spec',
    description:
      "Draft a short spec the team can pick up. Goes through approval first. Pull the codebase summary if you're not sure how it fits with what's already there.",
    input_schema: {
      type: 'object',
      additionalProperties: false,
      required: ['feature', 'goal'],
      properties: {
        feature: { type: 'string', description: 'The feature / change in one phrase.' },
        goal: { type: 'string', description: 'What we want this to do for the user / business.' },
        constraints: { type: 'string', description: 'Anything to keep in mind.' },
        estimatedSize: {
          type: 'string',
          enum: ['small', 'medium', 'large'],
          description: 'Rough size — small (a day), medium (a week), large (multi-week).',
        },
      },
    },
  },
  async handler(input, ctx) {
    const { actionId } = await ctx.persistAction({
      actionType: 'draft_engineering_spec',
      title: input.feature,
      rationale: input.goal,
      priority: 'medium',
      payload: {
        feature: input.feature,
        goal: input.goal,
        constraints: input.constraints ?? null,
        estimatedSize: input.estimatedSize ?? 'medium',
      },
    });
    return {
      status: 'awaiting_approval',
      output: { actionId, feature: input.feature },
      linkedActionId: actionId,
    };
  },
};
