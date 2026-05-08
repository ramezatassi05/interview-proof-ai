import { COMPANY_AGENT_KINDS } from '../../types';
import { MEMORY_TOPICS, isMemoryTopic, type MemoryTopic } from '../../memory-topics';
import type { SkillDefinition } from '../types';

interface RememberInput {
  topic?: string;
  key: string;
  summary?: string;
  body?: string;
  value?: unknown;
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
      "Keep a fact in mind for next time you talk to the CEO. Use this when they tell you something worth holding onto — a goal, a number, a preference, a decision. Don't use it for guesses or running thoughts. Pick the topic that fits best so the fact ends up in the right section of your memory next time.",
    input_schema: {
      type: 'object',
      additionalProperties: false,
      required: ['topic', 'key'],
      properties: {
        topic: {
          type: 'string',
          enum: [...MEMORY_TOPICS],
          description:
            "Which section of memory this belongs in. 'goals' = outcomes the CEO is driving toward. 'preferences' = how they like to work or what they've corrected. 'facts' = concrete numbers, decisions, dates. 'people' = names, roles, relationships. 'context' = how things work in this domain. 'general' only if nothing else fits.",
        },
        key: {
          type: 'string',
          description:
            'A short label for the fact (like "target_gross_margin" or "primary_icp"). If you reuse a label within the same topic, the new content replaces the old.',
        },
        summary: {
          type: 'string',
          description:
            'One-line description shown in the memory index. Skip if the value is already a one-liner.',
        },
        body: {
          type: 'string',
          description:
            'Optional richer text body — use when the fact needs a paragraph (e.g., a decision and its reason). Markdown is fine.',
        },
        value: {
          description:
            'Optional structured value — a number, date, or short object. Most facts can be expressed via summary/body alone; only set this when the value really is structured.',
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

    const topic: MemoryTopic = isMemoryTopic(input.topic) ? input.topic : 'general';

    const value = input.value ?? null;
    const valueJson =
      value === null
        ? null
        : typeof value === 'object' && value !== null
          ? value
          : { value };

    const summary = input.summary?.trim() || null;
    const body = input.body?.trim() || null;

    const { error } = await ctx.supabase.from('company_agent_memory').upsert(
      {
        user_id: ctx.userId,
        agent_kind: ctx.agentKind,
        topic,
        key,
        summary,
        body,
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
      output: { ok: true, topic, key, reason: input.reason ?? null },
    };
  },
};
