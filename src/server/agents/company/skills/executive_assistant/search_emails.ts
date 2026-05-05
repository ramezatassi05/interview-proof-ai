import type { SkillDefinition } from '../types';

interface SearchEmailsInput {
  query: string;
  limit?: number;
}

export const searchEmailsSkill: SkillDefinition<SearchEmailsInput> = {
  id: 'search_emails',
  agentKinds: ['executive_assistant'],
  kind: 'read',
  ui: {
    label: 'Look through email',
    description: "Skim the CEO's inbox for threads matching what they're asking about.",
    icon: 'mail',
  },
  tool: {
    name: 'search_emails',
    description:
      "Look through the CEO's email for threads matching the query. Use this when they reference something an investor, customer, or partner wrote. (Right now this is a stub — it returns a note saying email isn't wired up yet, so don't fabricate results.)",
    input_schema: {
      type: 'object',
      additionalProperties: false,
      required: ['query'],
      properties: {
        query: {
          type: 'string',
          description: 'What to search for — a person, a thread topic, a company.',
        },
        limit: {
          type: 'number',
          description: 'How many threads to return. Default 5.',
        },
      },
    },
  },
  async handler(input) {
    return {
      status: 'succeeded',
      output: {
        note: "Email isn't wired up yet — tell the CEO you couldn't actually search and ask if they want to paste the thread.",
        query: input.query,
        results: [],
      },
    };
  },
};
