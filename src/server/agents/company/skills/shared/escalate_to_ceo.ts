import type { SkillDefinition } from '../types';

interface EscalateInput {
  taskId: string;
  reason: string;
}

// Director-only. Stamps escalated_at + escalation_reason on a task the calling
// director owns. The CEO sees this in their "what's going on right now" block
// (loaded by ceo-context.ts) and the org chart shows an "escalated" badge.
export const escalateToCeoSkill: SkillDefinition<EscalateInput> = {
  id: 'escalate_to_ceo',
  agentKinds: [
    'executive_assistant',
    'director_marketing',
    'director_finance',
    'director_engineering',
  ],
  kind: 'write',
  ui: {
    label: 'Escalate to CEO',
    description: "Flag a stuck or out-of-scope task so the CEO addresses it next.",
    icon: 'alert-triangle',
  },
  tool: {
    name: 'escalate_to_ceo',
    description:
      "Push a task you can't move forward back to the CEO. Use this when a task is out of scope for your role, blocked on a decision only the CEO can make, or you've stalled. Don't sit on stuck work.",
    input_schema: {
      type: 'object',
      additionalProperties: false,
      required: ['taskId', 'reason'],
      properties: {
        taskId: {
          type: 'string',
          description: 'The id of the task to escalate. Must be a task you own.',
        },
        reason: {
          type: 'string',
          description:
            "One short paragraph explaining why this needs the CEO. Be concrete — what's blocked, what decision is needed, or what's outside your scope.",
        },
      },
    },
  },
  async handler(input, ctx) {
    const taskId = input.taskId?.trim();
    const reason = input.reason?.trim();
    if (!taskId) return { status: 'failed', output: { error: 'taskId is required' } };
    if (!reason) return { status: 'failed', output: { error: 'reason is required' } };

    const { data: existing, error: fetchError } = await ctx.supabase
      .from('company_tasks')
      .select('id, owner_kind, escalated_at')
      .eq('id', taskId)
      .eq('user_id', ctx.userId)
      .maybeSingle();

    if (fetchError) {
      return { status: 'failed', output: { error: fetchError.message } };
    }
    if (!existing) {
      return { status: 'failed', output: { error: `Task ${taskId} not found.` } };
    }
    if (existing.owner_kind !== ctx.agentKind) {
      return {
        status: 'failed',
        output: {
          error: `You can only escalate tasks you own. Task ${taskId} is owned by ${existing.owner_kind}.`,
        },
      };
    }

    const escalatedAt = new Date().toISOString();
    const { error: updateError } = await ctx.supabase
      .from('company_tasks')
      .update({
        escalated_at: escalatedAt,
        escalation_reason: reason,
        updated_at: escalatedAt,
      })
      .eq('id', taskId)
      .eq('user_id', ctx.userId);

    if (updateError) {
      return { status: 'failed', output: { error: updateError.message } };
    }

    return {
      status: 'succeeded',
      output: { ok: true, taskId, escalatedAt },
    };
  },
};
