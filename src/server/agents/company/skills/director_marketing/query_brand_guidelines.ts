import type { SkillDefinition } from '../types';

const BRAND_NOTES = `Voice: confident, plain, evidence-led. We don't oversell. We don't use generic SaaS phrases ("game-changer", "unlock your potential", "supercharge"). We talk like a coach who's seen a lot of interviews go sideways and knows what would have prevented it.

Audience: people getting ready for a high-stakes interview — usually tech / quant / consulting / finance roles. They're smart, they're nervous, and they've been burned by surface-level prep before.

What we sell: a diagnostic that finds the specific things that would get them rejected, then a fix plan for those exact gaps. Not "interview practice" in general.

Words we like: rejection-proof, evidence, gap, drill, prep, blind spot, ready.
Words we avoid: synergy, holistic, end-to-end, world-class, revolutionary.

Visual: clean, no AI gloss, sharp edges, uses real numbers in the copy.`;

export const queryBrandGuidelinesSkill: SkillDefinition = {
  id: 'query_brand_guidelines',
  agentKinds: ['director_marketing'],
  kind: 'read',
  ui: {
    label: 'Check the brand voice',
    description: 'Refresh on how we talk so the copy lands right.',
    icon: 'book',
  },
  tool: {
    name: 'query_brand_guidelines',
    description:
      "Pull our brand voice notes — how we sound, who we're talking to, words we like and avoid. Call this before drafting copy if you're not sure of the voice.",
    input_schema: {
      type: 'object',
      additionalProperties: false,
      properties: {},
    },
  },
  async handler() {
    return {
      status: 'succeeded',
      output: { notes: BRAND_NOTES },
    };
  },
};
