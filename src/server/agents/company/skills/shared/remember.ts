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
    label: 'Remember',
    description: 'Save a durable fact about the company so future conversations can recall it.',
    icon: 'brain',
  },
  tool: {
    name: 'remember',
    description:
      'Persist a durable fact you want to remember across future conversations with this agent. Use sparingly — only for facts the user has confirmed or explicit decisions, not running speculation.',
    input_schema: {
      type: 'object',
      additionalProperties: false,
      required: ['key', 'value'],
      properties: {
        key: {
          type: 'string',
          description:
            'Short, stable key for the fact (e.g. "target_gross_margin", "primary_icp"). Reused keys overwrite the prior value.',
        },
        value: {
          description: 'The fact to remember. May be a string, number, or small object.',
        },
        reason: {
          type: 'string',
          description: 'One short sentence on why this is worth remembering.',
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
