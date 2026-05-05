import type { SkillDefinition } from '../types';

export const fetchOpenIncidentsSkill: SkillDefinition = {
  id: 'fetch_open_incidents',
  agentKinds: ['director_engineering'],
  kind: 'read',
  ui: {
    label: 'Check open incidents',
    description: 'Anything currently broken or paging.',
    icon: 'alert',
  },
  tool: {
    name: 'fetch_open_incidents',
    description:
      "Pull anything currently broken or paging in production. (Stub — incident tracking isn't wired up yet. Tell the CEO straight up that you can't actually see incidents, don't make any up.)",
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
        note: "Incident tracking isn't wired up — be honest with the CEO that you couldn't pull live incidents.",
        incidents: [],
      },
    };
  },
};
