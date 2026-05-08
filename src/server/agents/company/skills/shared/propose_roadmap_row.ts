import type { SkillDefinition } from '../types';
import { domainForAgent } from '../../roadmap/loader';

interface ProposeRoadmapRowInput {
  title: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status?: string;
  phase?: string;
  description?: string;
  inspiration?: string;
}

export const proposeRoadmapRowSkill: SkillDefinition<ProposeRoadmapRowInput> = {
  id: 'propose_roadmap_row',
  agentKinds: ['director_engineering', 'director_marketing', 'director_finance'],
  kind: 'write',
  ui: {
    label: 'Add roadmap row',
    description: "Capture a piece of inspiration as a structured row in your domain roadmap.",
    icon: 'list',
  },
  tool: {
    name: 'propose_roadmap_row',
    description:
      "When the CEO drops an idea, link, competitor reference, or campaign worth tracking, propose appending a row to your domain roadmap CSV. The CEO will approve before anything is written. Use this for any \"hey, look at X\" moment — that's exactly what this is for. Capture the link or quote in `inspiration`.",
    input_schema: {
      type: 'object',
      additionalProperties: false,
      required: ['title', 'priority'],
      properties: {
        title: {
          type: 'string',
          description: 'Short label for the row (e.g., "Linear-style changelog page").',
        },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'critical'],
          description: 'How important this is.',
        },
        status: {
          type: 'string',
          description: 'Initial status — defaults to "Backlog".',
        },
        phase: {
          type: 'string',
          description: 'Phase or category — e.g., "Concept", "Design", "Research".',
        },
        description: {
          type: 'string',
          description: 'Longer description of what to build / explore / spend on.',
        },
        inspiration: {
          type: 'string',
          description: 'The link, quote, or reference that prompted this row.',
        },
      },
    },
  },
  async handler(input, ctx) {
    const domain = domainForAgent(ctx.agentKind);
    if (!domain) {
      throw new Error(
        `propose_roadmap_row is not available for agent kind "${ctx.agentKind}".`
      );
    }

    const rationale =
      input.description ||
      input.inspiration ||
      `Captured during chat with the CEO — "${input.title}".`;

    const { actionId } = await ctx.persistAction({
      actionType: 'append_roadmap_row',
      title: `Add roadmap row: ${input.title}`,
      rationale,
      priority: input.priority,
      payload: {
        domain,
        row: {
          title: input.title,
          priority: input.priority,
          status: input.status ?? 'Backlog',
          phase: input.phase ?? '',
          description: input.description ?? '',
          inspiration: input.inspiration ?? '',
        },
      },
    });

    return {
      status: 'awaiting_approval',
      output: { actionId, domain, title: input.title },
      linkedActionId: actionId,
    };
  },
};
