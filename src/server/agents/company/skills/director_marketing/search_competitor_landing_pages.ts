import type { SkillDefinition } from '../types';

interface SearchCompetitorInput {
  competitor: string;
}

export const searchCompetitorLandingPagesSkill: SkillDefinition<SearchCompetitorInput> = {
  id: 'search_competitor_landing_pages',
  agentKinds: ['director_marketing'],
  kind: 'read',
  ui: {
    label: 'Look at competitor pages',
    description: 'Skim how a competitor positions themselves on their landing page.',
    icon: 'eye',
  },
  tool: {
    name: 'search_competitor_landing_pages',
    description:
      "Pull what a competitor's landing page says — hero, value prop, pricing. (Stub for now — competitor scraping isn't wired up. Be honest if asked, and tell the CEO you couldn't pull it.)",
    input_schema: {
      type: 'object',
      additionalProperties: false,
      required: ['competitor'],
      properties: {
        competitor: { type: 'string', description: 'Name or URL of the competitor.' },
      },
    },
  },
  async handler(input) {
    return {
      status: 'succeeded',
      output: {
        note: "Competitor scraping isn't wired up yet — tell the CEO you couldn't actually pull it and ask if they want to paste the page.",
        competitor: input.competitor,
      },
    };
  },
};
