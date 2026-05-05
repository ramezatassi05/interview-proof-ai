import type { SkillDefinition } from '../types';

interface DraftSocialPostInput {
  platform: 'twitter' | 'linkedin' | 'instagram' | 'tiktok';
  angle: string;
  copy?: string;
}

export const draftSocialPostSkill: SkillDefinition<DraftSocialPostInput> = {
  id: 'draft_social_post',
  agentKinds: ['director_marketing'],
  kind: 'write',
  ui: {
    label: 'Draft a social post',
    description: 'Write a quick post for X / LinkedIn / Instagram / TikTok captions.',
    icon: 'megaphone',
  },
  tool: {
    name: 'draft_social_post',
    description:
      "Draft a single post for a social channel — short, in our voice, ready to go after the CEO OKs it. Use this when they ask you to tweet/post/announce something.",
    input_schema: {
      type: 'object',
      additionalProperties: false,
      required: ['platform', 'angle'],
      properties: {
        platform: {
          type: 'string',
          enum: ['twitter', 'linkedin', 'instagram', 'tiktok'],
          description: 'Where the post goes.',
        },
        angle: { type: 'string', description: 'The hook / angle.' },
        copy: { type: 'string', description: 'First-draft copy if you have one.' },
      },
    },
  },
  async handler(input, ctx) {
    const { actionId } = await ctx.persistAction({
      actionType: 'draft_marketing_asset',
      title: `${input.platform[0].toUpperCase() + input.platform.slice(1)} post: ${input.angle.slice(0, 60)}`,
      rationale: `Drafting a ${input.platform} post around: ${input.angle}.`,
      priority: 'medium',
      payload: {
        channel: input.platform,
        angle: input.angle,
        format: input.platform === 'twitter' ? 'short post (≤280 chars)' : 'social post',
        copy: input.copy ?? null,
      },
    });
    return {
      status: 'awaiting_approval',
      output: { actionId, platform: input.platform },
      linkedActionId: actionId,
    };
  },
};
