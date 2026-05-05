import type { SkillDefinition } from '../types';

interface SummarizeThreadsInput {
  topic?: string;
}

export const summarizeThreadsSkill: SkillDefinition<SummarizeThreadsInput> = {
  id: 'summarize_threads',
  agentKinds: ['executive_assistant'],
  kind: 'read',
  ui: {
    label: 'Summarize threads',
    description: 'Pull together what’s happening across the CEO’s open conversations.',
    icon: 'list',
  },
  tool: {
    name: 'summarize_threads',
    description:
      "Round up what's happening across the CEO's open inbox threads. (Stub for now — email isn't wired up yet, so don't make anything up.)",
    input_schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        topic: {
          type: 'string',
          description: 'Narrow it to a topic or person (optional).',
        },
      },
    },
  },
  async handler(input) {
    return {
      status: 'succeeded',
      output: {
        note: "Email isn't wired up yet — be honest with the CEO that you couldn't pull threads.",
        topic: input.topic ?? null,
        threads: [],
      },
    };
  },
};
