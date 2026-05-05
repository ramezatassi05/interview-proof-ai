import type { SkillDefinition } from '../types';

export const fetchDeployHistorySkill: SkillDefinition = {
  id: 'fetch_deploy_history',
  agentKinds: ['director_engineering'],
  kind: 'read',
  ui: {
    label: 'Look at recent deploys',
    description: 'Last few production deploys + outcomes.',
    icon: 'rocket',
  },
  tool: {
    name: 'fetch_deploy_history',
    description:
      "Pull the last few production deploys and how they went. (Stub — deploy log isn't wired up. Be honest with the CEO if asked.)",
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
        note: "Deploy log isn't wired up — tell the CEO you couldn't pull recent deploys.",
        deploys: [],
      },
    };
  },
};
