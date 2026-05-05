import type { SupabaseClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { CLAUDE_MODELS, getAnthropicClient } from '@/lib/anthropic';
import {
  COMPANY_ACTION_TYPES,
  COMPANY_AGENT_KINDS,
  type CompanyAgentKind,
  type CompanyAgentOutput,
  type CompanyAgentTriggeredBy,
  type CompanyMetricsSnapshot,
} from './types';
import type { DirectorContext } from './director-context';
import { COMPANY_AGENT_OUTPUT_TOOL, COMPANY_AGENT_OUTPUT_TOOL_NAME } from './company-agent-tools';
import {
  buildCompanySystemPrompt,
  buildCompanyUserPrompt,
  COMPANY_AGENT_VERSION,
} from './company-agent-prompts';

const EvidenceRefSchema = z.object({
  label: z.string().min(1).max(160),
  source: z.string().min(1).max(200),
});

const ProposedActionSchema = z.object({
  title: z.string().min(1).max(200),
  actionType: z.enum(COMPANY_ACTION_TYPES),
  rationale: z.string().min(1).max(1000),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  payload: z.record(z.string(), z.unknown()),
  requiresApproval: z.boolean().optional().default(true),
});

const CompanyAgentOutputSchema = z.object({
  agentKind: z.enum(COMPANY_AGENT_KINDS),
  summary: z.string().min(1).max(2400),
  priorities: z.array(z.string().min(1).max(280)).max(5),
  proposedActions: z.array(ProposedActionSchema).max(5),
  evidenceRefs: z.array(EvidenceRefSchema).max(8),
});

export class CompanyAgentError extends Error {
  readonly cause?: unknown;
  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = 'CompanyAgentError';
    this.cause = options?.cause;
  }
}

export interface RunCompanyAgentArgs {
  userId: string;
  sessionId: string;
  agentKind: CompanyAgentKind;
  message: string;
  supabase: SupabaseClient;
  metrics: CompanyMetricsSnapshot;
  directorContext?: DirectorContext;
  triggeredBy?: CompanyAgentTriggeredBy;
}

export interface RunCompanyAgentResult {
  output: CompanyAgentOutput;
  actionIds: string[];
  tokensIn: number;
  tokensOut: number;
}

function extractToolInput(message: Anthropic.Messages.Message): unknown {
  const block = message.content.find(
    (contentBlock): contentBlock is Anthropic.Messages.ToolUseBlock =>
      contentBlock.type === 'tool_use' && contentBlock.name === COMPANY_AGENT_OUTPUT_TOOL_NAME
  );

  return block?.input;
}

function metricsToPrompt(metrics: CompanyMetricsSnapshot): string {
  return [
    `Total users: ${metrics.totalUsers}`,
    `Total reports: ${metrics.totalReports}`,
    `Unlocked reports: ${metrics.unlockedReports}`,
    `Unlock rate: ${Math.round(metrics.unlockRate * 100)}%`,
    `Credits purchased: ${metrics.totalCreditsPurchased}`,
    `Estimated revenue: $${(metrics.estimatedRevenueCents / 100).toFixed(2)}`,
    `Pending company actions: ${metrics.pendingCompanyActions}`,
    `Active company sessions: ${metrics.activeCompanySessions}`,
    `Captured at: ${metrics.capturedAt}`,
  ].join('\n');
}

async function loadRecentActionsContext(args: {
  supabase: SupabaseClient;
  userId: string;
}): Promise<string> {
  const { data, error } = await args.supabase
    .from('company_agent_actions')
    .select('agent_kind,title,status,priority,created_at')
    .eq('user_id', args.userId)
    .order('created_at', { ascending: false })
    .limit(8);

  if (error || !data || data.length === 0) return 'No recent internal company actions yet.';

  return data
    .map((row) => {
      const item = row as {
        agent_kind: string;
        title: string;
        status: string;
        priority: string;
        created_at: string;
      };
      return `- [${item.status}/${item.priority}] ${item.agent_kind}: ${item.title} (${item.created_at})`;
    })
    .join('\n');
}

export async function runCompanyAgent(args: RunCompanyAgentArgs): Promise<RunCompanyAgentResult> {
  const { userId, sessionId, agentKind, message, supabase, metrics, directorContext } = args;
  const triggeredBy: CompanyAgentTriggeredBy = args.triggeredBy ?? 'user';
  const client = getAnthropicClient();
  const recentActionsContext = await loadRecentActionsContext({ supabase, userId });

  const userPromptBase = buildCompanyUserPrompt({
    agentKind,
    message,
    metricsContext: metricsToPrompt(metrics),
    recentActionsContext,
  });
  const userPrompt = directorContext
    ? `${userPromptBase}\n\n## ROLE CONTEXT\n${directorContext.summary}\n\n## STRUCTURED\n${JSON.stringify(directorContext.structured, null, 2)}`
    : userPromptBase;

  let response: Anthropic.Messages.Message;
  try {
    response = await client.messages.create({
      model: CLAUDE_MODELS.reasoning,
      max_tokens: 1800,
      system: [
        {
          type: 'text',
          text: buildCompanySystemPrompt(agentKind),
          cache_control: { type: 'ephemeral' },
        },
      ],
      tools: [COMPANY_AGENT_OUTPUT_TOOL],
      tool_choice: { type: 'tool', name: COMPANY_AGENT_OUTPUT_TOOL_NAME },
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });
  } catch (err) {
    throw new CompanyAgentError('Anthropic company-agent call failed', { cause: err });
  }

  const toolInput = extractToolInput(response);
  const validated = CompanyAgentOutputSchema.safeParse(toolInput);
  if (!validated.success) {
    throw new CompanyAgentError('Company agent output failed schema validation', {
      cause: validated.error.flatten(),
    });
  }

  const output: CompanyAgentOutput = {
    ...validated.data,
    agentKind,
    proposedActions: validated.data.proposedActions.map((action) => ({
      ...action,
      requiresApproval: true,
    })),
  };

  const tokensIn = response.usage?.input_tokens ?? 0;
  const tokensOut = response.usage?.output_tokens ?? 0;

  const { error: userMessageError } = await supabase.from('company_agent_messages').insert({
    session_id: sessionId,
    role: 'user',
    agent_kind: agentKind,
    content_json: { text: message, triggeredBy },
  });
  if (userMessageError) {
    throw new CompanyAgentError('Failed to persist CEO message', { cause: userMessageError });
  }

  const { error: agentMessageError } = await supabase.from('company_agent_messages').insert({
    session_id: sessionId,
    role: 'agent',
    agent_kind: agentKind,
    content_json: {
      ...output,
      version: COMPANY_AGENT_VERSION,
    },
    tokens_in: tokensIn,
    tokens_out: tokensOut,
  });
  if (agentMessageError) {
    throw new CompanyAgentError('Failed to persist company-agent message', {
      cause: agentMessageError,
    });
  }

  const actionRows = output.proposedActions.map((action) => ({
    user_id: userId,
    session_id: sessionId,
    agent_kind: agentKind,
    action_type: action.actionType,
    title: action.title,
    rationale: action.rationale,
    priority: action.priority,
    payload_json: action.payload,
    status: 'awaiting_approval',
    evidence_refs_json: output.evidenceRefs,
    requires_approval: true,
    triggered_by: triggeredBy,
  }));

  let actionIds: string[] = [];
  if (actionRows.length > 0) {
    const { data: insertedActions, error: actionsError } = await supabase
      .from('company_agent_actions')
      .insert(actionRows)
      .select('id');

    if (actionsError || !insertedActions) {
      throw new CompanyAgentError('Failed to persist company-agent actions', {
        cause: actionsError,
      });
    }

    actionIds = insertedActions.map((row) => (row as { id: string }).id);
  }

  await supabase
    .from('company_agent_sessions')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', sessionId)
    .eq('user_id', userId);

  return {
    output,
    actionIds,
    tokensIn,
    tokensOut,
  };
}
