import type { SkillDefinition } from '../types';
import type {
  CompanyActionPriority,
  CompanyAgentKind,
  CompanyTaskOwnerKind,
} from '../../types';

const DIRECTOR_AGENTS: readonly CompanyAgentKind[] = [
  'director_marketing',
  'director_finance',
  'director_engineering',
];

const ALLOWED_OWNERS: readonly CompanyTaskOwnerKind[] = [
  'executive_assistant',
  'director_marketing',
  'director_finance',
  'director_engineering',
];

const PRIORITIES: readonly CompanyActionPriority[] = ['low', 'medium', 'high', 'critical'];

interface FileTicketInput {
  owner: CompanyTaskOwnerKind;
  title: string;
  description?: string;
  priority?: CompanyActionPriority;
  dueAt?: string;
  rationale: string;
}

// Director-only. Lets a peer file a structured ticket against another peer
// without going through the CEO as a relay. Goes through normal approval
// (create_task is risk='high') so the CEO still sees and OKs cross-team
// requests, but the originator is preserved on the resulting task via
// requester_kind. delegate_task is the CEO's analogue and still bypasses
// approval — this is the peer-level equivalent.
export const fileTicketSkill: SkillDefinition<FileTicketInput> = {
  id: 'file_ticket',
  agentKinds: DIRECTOR_AGENTS,
  kind: 'write',
  ui: {
    label: 'File a ticket on a peer',
    description: 'Ask another director (or the EA) to take on a piece of work.',
    icon: 'send',
  },
  tool: {
    name: 'file_ticket',
    description:
      "File a ticket asking another director or the executive assistant to take on a piece of work. Use this when the work belongs to a peer's domain — e.g. Marketing asking Engineering to add a tracking parameter, or Finance asking Marketing to confirm an ad-spend cap. Goes through CEO approval before it lands on the peer's queue. You can't ticket yourself or the CEO.",
    input_schema: {
      type: 'object',
      additionalProperties: false,
      required: ['owner', 'title', 'rationale'],
      properties: {
        owner: {
          type: 'string',
          enum: [...ALLOWED_OWNERS],
          description: 'Which peer should own this work. Cannot be yourself or the CEO.',
        },
        title: {
          type: 'string',
          description: 'Short imperative title (e.g. "Add UTM param to landing redirect"). Max ~120 chars.',
        },
        description: {
          type: 'string',
          description: 'Optional detail on what done looks like.',
        },
        priority: {
          type: 'string',
          enum: [...PRIORITIES],
          description: 'Default medium.',
        },
        dueAt: {
          type: 'string',
          description: 'Optional ISO timestamp for when this is needed by.',
        },
        rationale: {
          type: 'string',
          description: 'Why you need this and why it belongs to that peer — visible on the inbox card and the ticket.',
        },
      },
    },
  },
  async handler(input, ctx) {
    const title = input.title?.trim();
    const rationale = input.rationale?.trim();
    const owner = input.owner;

    if (!title) return { status: 'failed', output: { error: 'title is required' } };
    if (!rationale) return { status: 'failed', output: { error: 'rationale is required' } };
    if (!ALLOWED_OWNERS.includes(owner)) {
      return { status: 'failed', output: { error: `Invalid owner "${owner}".` } };
    }
    if (owner === ctx.agentKind) {
      return {
        status: 'failed',
        output: { error: "You can't ticket yourself — just do the work or escalate to the CEO." },
      };
    }

    const { actionId } = await ctx.persistAction({
      actionType: 'create_task',
      title,
      rationale,
      priority: input.priority ?? 'medium',
      payload: {
        ownerKind: owner,
        requesterKind: ctx.agentKind,
        description: input.description ?? null,
        dueAt: input.dueAt ?? null,
      },
    });

    return {
      status: 'awaiting_approval',
      output: {
        actionId,
        owner,
        title,
        priority: input.priority ?? 'medium',
      },
      linkedActionId: actionId,
    };
  },
};
