import { COMPANY_AGENT_KINDS } from '../../types';
import type { SkillDefinition } from '../types';

interface RememberInput {
  key: string;
  value: unknown;
  reason?: string;
}

export const rememberSkill: SkillDefinition<RememberInput> = {
  id: 'remember',
  agentKinds: COMPANY_AGENT_KINDS,
  kind: 'write',
  ui: {
    label: 'Remember this',
    description: "Hold onto a fact the CEO wants you to keep in mind next time.",
    icon: 'brain',
  },
  tool: {
    name: 'remember',
    description:
      "Keep a fact in mind for next time you talk to the CEO. Use this when they tell you something worth holding onto — a goal, a number, a preference, a decision. Don't use it for guesses or running thoughts.",
    input_schema: {
      type: 'object',
      additionalProperties: false,
      required: ['key', 'value'],
      properties: {
        key: {
          type: 'string',
          description:
            'A short label for the fact (like "target_gross_margin" or "primary_icp"). If you reuse a label, the new value replaces the old one.',
        },
        value: {
          description: 'The thing to remember — a string, number, or short object.',
        },
        reason: {
          type: 'string',
          description: 'One short sentence on why this is worth keeping.',
        },
      },
    },
  },
  async handler(input, ctx) {
    const key = input.key?.trim();
    if (!key) {
      return { status: 'failed', output: { error: 'key is required' } };
    }
    const value = input.value ?? null;
    const valueJson = typeof value === 'object' && value !== null ? value : { value };

    const { error } = await ctx.supabase.from('company_agent_memory').upsert(
      {
        user_id: ctx.userId,
        agent_kind: ctx.agentKind,
        key,
        value_json: valueJson,
        source: 'agent_remember',
      },
      { onConflict: 'user_id,agent_kind,key' }
    );

    if (error) {
      return { status: 'failed', output: { error: error.message } };
    }

    return {
      status: 'succeeded',
      output: { ok: true, key, reason: input.reason ?? null },
    };
  },
};
