import type { SkillDefinition } from '../types';

interface DraftLandingCopyInput {
  audience: string;
  goal: string;
  angle?: string;
  tone?: string;
  copy?: string;
}

export const draftLandingCopySkill: SkillDefinition<DraftLandingCopyInput> = {
  id: 'draft_landing_copy',
  agentKinds: ['director_marketing'],
  kind: 'write',
  ui: {
    label: 'Draft landing-page copy',
    description: 'Put together hero copy + a few supporting lines for a landing page.',
    icon: 'pen',
  },
  tool: {
    name: 'draft_landing_copy',
    description:
      "Draft landing-page copy — a hero line, sub-headline, a few supporting points. The CEO will OK before anything goes live. Use this when they ask for landing copy or a page section. Pull funnel numbers first if you'll cite any.",
    input_schema: {
      type: 'object',
      additionalProperties: false,
      required: ['audience', 'goal'],
      properties: {
        audience: { type: 'string', description: 'Who this page is for.' },
        goal: { type: 'string', description: 'What you want them to do.' },
        angle: { type: 'string', description: 'The angle / hook.' },
        tone: { type: 'string', description: 'How it should sound. Default: confident, plain.' },
        copy: { type: 'string', description: 'A first draft of the copy if you have one.' },
      },
    },
  },
  async handler(input, ctx) {
    const { actionId } = await ctx.persistAction({
      actionType: 'draft_marketing_asset',
      title: `Landing copy for ${input.audience}`,
      rationale:
        input.angle ||
        `Drafting landing copy aimed at ${input.audience} to push them toward ${input.goal}.`,
      priority: 'medium',
      payload: {
        channel: 'landing-page',
        audience: input.audience,
        goal: input.goal,
        angle: input.angle ?? null,
        tone: input.tone ?? 'confident, plain',
        copy: input.copy ?? null,
      },
    });
    return {
      status: 'awaiting_approval',
      output: { actionId, audience: input.audience, goal: input.goal },
      linkedActionId: actionId,
    };
  },
};
