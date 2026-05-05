import type { SkillDefinition } from '../types';

export const fetchUptimeSkill: SkillDefinition = {
  id: 'fetch_uptime',
  agentKinds: ['director_engineering'],
  kind: 'read',
  ui: {
    label: 'Check uptime',
    description: 'How well prod has been holding up.',
    icon: 'pulse',
  },
  tool: {
    name: 'fetch_uptime',
    description:
      "Pull recent uptime / availability for prod. (Stub — uptime monitoring isn't wired up. Don't fabricate numbers; tell the CEO straight.)",
    input_schema: {
      type: 'object',
      additionalProperties: false,
      properties: {},
    },
  },
  async handler() {
    return {
      status: 'succeeded',
      output: {
        note: "Uptime monitoring isn't wired up yet — say so plainly.",
        uptimePct: null,
      },
    };
  },
};
