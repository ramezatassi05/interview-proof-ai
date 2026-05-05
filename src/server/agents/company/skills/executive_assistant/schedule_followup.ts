import type { SkillDefinition } from '../types';

interface ScheduleFollowupInput {
  title: string;
  whenISO?: string;
  notes?: string;
}

export const scheduleFollowupSkill: SkillDefinition<ScheduleFollowupInput> = {
  id: 'schedule_followup',
  agentKinds: ['executive_assistant'],
  kind: 'write',
  ui: {
    label: 'Schedule a follow-up',
    description: 'Drop something on the CEO’s list with a due date so it doesn’t fall through.',
    icon: 'clock',
  },
  tool: {
    name: 'schedule_followup',
    description:
      "Add a follow-up to the CEO's list — something to circle back on by a date. This becomes a task they need to OK first. Use it when they say \"remind me to...\" or \"chase X next week\".",
    input_schema: {
      type: 'object',
      additionalProperties: false,
      required: ['title'],
      properties: {
        title: {
          type: 'string',
          description: 'A short name for the follow-up (e.g. "Chase the legal review on contract terms").',
        },
        whenISO: {
          type: 'string',
          description: 'When to chase it. ISO 8601 timestamp. Optional.',
        },
        notes: {
          type: 'string',
          description: 'Anything extra worth knowing.',
        },
      },
    },
  },
  async handler(input, ctx) {
    const title = input.title.trim();
    const { actionId } = await ctx.persistAction({
      actionType: 'create_task',
      title,
      rationale:
        input.notes?.trim() ||
        "Follow-up the CEO asked you to keep on the list so it doesn't slip.",
      priority: 'medium',
      payload: {
        ownerKind: 'executive_assistant',
        description: input.notes ?? null,
        dueAt: input.whenISO ?? null,
      },
    });
    return {
      status: 'awaiting_approval',
      output: { actionId, title, whenISO: input.whenISO ?? null },
      linkedActionId: actionId,
    };
  },
};
