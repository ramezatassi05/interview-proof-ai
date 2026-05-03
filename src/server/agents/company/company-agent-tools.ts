import type { Tool } from '@anthropic-ai/sdk/resources/messages/messages';

export const COMPANY_AGENT_OUTPUT_TOOL_NAME = 'record_company_agent_output';

export const COMPANY_AGENT_OUTPUT_TOOL: Tool = {
  name: COMPANY_AGENT_OUTPUT_TOOL_NAME,
  description:
    'Records the internal company-agent response and any draft-only actions that require CEO approval.',
  input_schema: {
    type: 'object',
    additionalProperties: false,
    required: ['agentKind', 'summary', 'priorities', 'proposedActions', 'evidenceRefs'],
    properties: {
      agentKind: {
        type: 'string',
        enum: [
          'ceo_orchestrator',
          'executive_assistant',
          'director_marketing',
          'director_finance',
          'director_engineering',
        ],
      },
      summary: {
        type: 'string',
        description: 'CEO-ready summary of the answer in 1-3 concise paragraphs.',
      },
      priorities: {
        type: 'array',
        maxItems: 5,
        items: { type: 'string' },
      },
      proposedActions: {
        type: 'array',
        maxItems: 5,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['title', 'actionType', 'rationale', 'priority', 'payload', 'requiresApproval'],
          properties: {
            title: { type: 'string' },
            actionType: {
              type: 'string',
              enum: [
                'draft_brief',
                'draft_marketing_asset',
                'draft_finance_memo',
                'draft_engineering_spec',
                'create_task',
                'record_decision',
                'request_approval',
                'summarize_metrics',
              ],
            },
            rationale: { type: 'string' },
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
            payload: {
              type: 'object',
              additionalProperties: true,
            },
            requiresApproval: {
              type: 'boolean',
              description: 'Must be true for all launch-mode actions.',
            },
          },
        },
      },
      evidenceRefs: {
        type: 'array',
        maxItems: 8,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['label', 'source'],
          properties: {
            label: { type: 'string' },
            source: { type: 'string' },
          },
        },
      },
    },
  },
};
