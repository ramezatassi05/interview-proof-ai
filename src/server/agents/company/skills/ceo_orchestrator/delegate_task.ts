import type { SkillDefinition } from '../types';
import type { CompanyActionPriority, CompanyTaskOwnerKind } from '../../types';

const ALLOWED_OWNERS: readonly CompanyTaskOwnerKind[] = [
  'executive_assistant',
  'director_marketing',
  'director_finance',
  'director_engineering',
];

const PRIORITIES: readonly CompanyActionPriority[] = ['low', 'medium', 'high', 'critical'];

interface DelegateInput {
  targetAgent: CompanyTaskOwnerKind;
  title: string;
  description?: string;
  priority?: CompanyActionPriority;
  dueAt?: string;
  rationale: string;
}

// CEO-only. Hands work to a specific direct report. Bypasses the approval
// queue — boss assigning work doesn't ask itself for permission. Provenance
// is preserved via delegated_by + delegation_rationale, surfaced in the UI
// as a "from CEO" badge on the kanban card.
export const delegateTaskSkill: SkillDefinition<DelegateInput> = {
  id: 'delegate_task',
  agentKinds: ['ceo_orchestrator'],
  kind: 'write',
  ui: {
    label: 'Delegate to a director',
    description: 'Hand a task to one of your directors with a clear rationale.',
    icon: 'send',
  },
  tool: {
    name: 'delegate_task',
    description:
      "Assign a task to one of your direct reports. Use this when the operator wants something done — pick the right director, give a clear title, and explain WHY in the rationale. Lands directly on the kanban board (no approval needed — you're the boss).",
    input_schema: {
      type: 'object',
      additionalProperties: false,
      required: ['targetAgent', 'title', 'rationale'],
      properties: {
        targetAgent: {
          type: 'string',
          enum: [...ALLOWED_OWNERS],
          description: 'Which direct report owns this task.',
        },
        title: {
          type: 'string',
          description: 'Short imperative title (e.g. "Draft Q3 launch email"). Max ~120 chars.',
        },
        description: {
          type: 'string',
          description: 'Optional: more detail on what done looks like.',
        },
        priority: {
          type: 'string',
          enum: [...PRIORITIES],
          description: 'Default medium.',
        },
        dueAt: {
          type: 'string',
          description: 'Optional ISO timestamp for when this should be done by.',
        },
        rationale: {
          type: 'string',
          description: 'Why this matters and why this director — visible on the task card.',
        },
      },
    },
  },
  async handler(input, ctx) {
    const title = input.title?.trim();
    const rationale = input.rationale?.trim();
    const targetAgent = input.targetAgent;

    if (!title) return { status: 'failed', output: { error: 'title is required' } };
    if (!rationale) return { status: 'failed', output: { error: 'rationale is required' } };
    if (!ALLOWED_OWNERS.includes(targetAgent)) {
      return {
        status: 'failed',
        output: { error: `Invalid targetAgent "${targetAgent}".` },
      };
    }

    const now = new Date().toISOString();
    const { data, error } = await ctx.supabase
      .from('company_tasks')
      .insert({
        user_id: ctx.userId,
        source_action_id: null,
        owner_kind: targetAgent,
        title,
        description: input.description ?? null,
        status: 'todo',
        due_at: input.dueAt ?? null,
        delegated_by: 'ceo_orchestrator',
        delegation_rationale: rationale,
        created_at: now,
        updated_at: now,
      })
      .select('id')
      .single();

    if (error || !data) {
      return {
        status: 'failed',
        output: { error: error?.message ?? 'Could not create task.' },
      };
    }

    return {
      status: 'succeeded',
      output: {
        ok: true,
        taskId: data.id,
        targetAgent,
        title,
        priority: input.priority ?? 'medium',
      },
    };
  },
};
