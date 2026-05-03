import type { SupabaseClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { CLAUDE_MODELS, getAnthropicClient } from '@/lib/anthropic';
import { loadCompanyMetrics } from '../company-metrics';
import type { CompanyAgentActionRow, CompanyActionType } from '../types';

export interface ExecutionResult {
  status: 'completed' | 'failed';
  resultJson?: Record<string, unknown>;
  error?: string;
}

function extractText(message: Anthropic.Messages.Message): string {
  return message.content
    .filter((block): block is Anthropic.Messages.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();
}

async function generate(prompt: string, system: string, maxTokens = 1500): Promise<string> {
  const client = getAnthropicClient();
  const response = await client.messages.create({
    model: CLAUDE_MODELS.reasoning,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: prompt }],
  });
  return extractText(response);
}

function payloadString(payload: Record<string, unknown>, keys: string[]): string {
  return keys
    .map((k) => {
      const v = payload[k];
      if (v === undefined || v === null) return '';
      return `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`;
    })
    .filter(Boolean)
    .join('\n');
}

async function execDraftBrief(
  action: CompanyAgentActionRow,
  supabase: SupabaseClient
): Promise<ExecutionResult> {
  const metrics = await loadCompanyMetrics({ supabase, userId: action.user_id });
  const content = await generate(
    `Draft a concise weekly brief for the operator.\nCompany metrics:\n${JSON.stringify(metrics, null, 2)}\n\nAction request:\n${action.title}\n\nRationale:\n${action.rationale}\n\nPayload context:\n${JSON.stringify(action.payload_json, null, 2)}\n\nReturn 4 sections: WINS, RISKS, NEXT STEPS, DECISIONS NEEDED. Each 2-4 bullets, terse.`,
    'You are the InterviewProof Executive Assistant. Briefs must be scannable in 30 seconds. No fluff.',
    1200
  );

  const today = new Date();
  const day = today.getUTCDay(); // 0 = Sun
  const diffToMon = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setUTCDate(today.getUTCDate() + diffToMon);
  const weekStart = monday.toISOString().slice(0, 10);

  const briefContent = { title: action.title, body: content, capturedAt: new Date().toISOString() };

  const { data: brief, error } = await supabase
    .from('company_weekly_briefs')
    .upsert(
      {
        user_id: action.user_id,
        week_start: weekStart,
        content_json: briefContent,
      },
      { onConflict: 'user_id,week_start' }
    )
    .select('id')
    .single();

  if (error) return { status: 'failed', error: error.message };
  return {
    status: 'completed',
    resultJson: { briefId: (brief as { id: string }).id, weekStart, body: content },
  };
}

async function execDraftMarketingAsset(
  action: CompanyAgentActionRow,
  supabase: SupabaseClient
): Promise<ExecutionResult> {
  const summary = payloadString(action.payload_json, [
    'channel',
    'audience',
    'tone',
    'goal',
    'angle',
    'format',
  ]);
  const copy = await generate(
    `Draft marketing copy for InterviewProof.ai.\n\nSpec:\n${summary || JSON.stringify(action.payload_json)}\n\nTitle: ${action.title}\nRationale: ${action.rationale}\n\nReturn the copy only — no preamble. If the channel is unspecified, default to a social post under 280 chars.`,
    'You are the InterviewProof Director of Marketing. Copy must be specific, evidence-backed, and avoid generic SaaS jargon.',
    900
  );

  const { data: task, error } = await supabase
    .from('company_tasks')
    .insert({
      user_id: action.user_id,
      source_action_id: action.id,
      owner_kind: 'director_marketing',
      title: action.title,
      description: copy,
      status: 'todo',
    })
    .select('id')
    .single();

  if (error) return { status: 'failed', error: error.message };
  return {
    status: 'completed',
    resultJson: { taskId: (task as { id: string }).id, copy, ownerKind: 'director_marketing' },
  };
}

async function execDraftFinanceMemo(
  action: CompanyAgentActionRow,
  supabase: SupabaseClient
): Promise<ExecutionResult> {
  const metrics = await loadCompanyMetrics({ supabase, userId: action.user_id });
  const memo = await generate(
    `Draft a finance memo.\n\nMetrics:\n${JSON.stringify(metrics, null, 2)}\n\nRequest: ${action.title}\nRationale: ${action.rationale}\nPayload:\n${JSON.stringify(action.payload_json, null, 2)}\n\nFormat: 1) Situation, 2) Numbers, 3) Recommendation, 4) Risks. Be specific and quantitative.`,
    'You are the InterviewProof Director of Finance. Memos drive decisions — every claim cites a number.',
    1200
  );

  const { data: decision, error } = await supabase
    .from('company_decisions')
    .insert({
      user_id: action.user_id,
      source_action_id: action.id,
      title: action.title,
      decision_text: memo,
      rationale: action.rationale,
    })
    .select('id')
    .single();

  if (error) return { status: 'failed', error: error.message };
  return {
    status: 'completed',
    resultJson: { decisionId: (decision as { id: string }).id, memo },
  };
}

async function execDraftEngineeringSpec(
  action: CompanyAgentActionRow,
  supabase: SupabaseClient
): Promise<ExecutionResult> {
  const spec = await generate(
    `Draft an engineering spec.\n\nRequest: ${action.title}\nRationale: ${action.rationale}\nPayload:\n${JSON.stringify(action.payload_json, null, 2)}\n\nFormat: Goal, Constraints, Approach, Acceptance Criteria, Estimated Effort.`,
    'You are the InterviewProof Director of Engineering. Specs are tight and unambiguous.',
    1500
  );

  const { data: task, error } = await supabase
    .from('company_tasks')
    .insert({
      user_id: action.user_id,
      source_action_id: action.id,
      owner_kind: 'director_engineering',
      title: action.title,
      description: spec,
      status: 'todo',
    })
    .select('id')
    .single();

  if (error) return { status: 'failed', error: error.message };
  return {
    status: 'completed',
    resultJson: { taskId: (task as { id: string }).id, spec, ownerKind: 'director_engineering' },
  };
}

const TASK_OWNER_KINDS = new Set([
  'executive_assistant',
  'director_marketing',
  'director_finance',
  'director_engineering',
]);

async function execCreateTask(
  action: CompanyAgentActionRow,
  supabase: SupabaseClient
): Promise<ExecutionResult> {
  const payload = action.payload_json ?? {};
  const ownerKindRaw = (payload.ownerKind as string) ?? action.agent_kind;
  const ownerKind = TASK_OWNER_KINDS.has(ownerKindRaw) ? ownerKindRaw : 'executive_assistant';
  const description = (payload.description as string) ?? action.rationale;
  const dueAt = (payload.dueAt as string) ?? null;

  const { data: task, error } = await supabase
    .from('company_tasks')
    .insert({
      user_id: action.user_id,
      source_action_id: action.id,
      owner_kind: ownerKind,
      title: action.title,
      description,
      status: 'todo',
      due_at: dueAt,
    })
    .select('id')
    .single();

  if (error) return { status: 'failed', error: error.message };
  return {
    status: 'completed',
    resultJson: { taskId: (task as { id: string }).id, ownerKind },
  };
}

async function execRecordDecision(
  action: CompanyAgentActionRow,
  supabase: SupabaseClient
): Promise<ExecutionResult> {
  const payload = action.payload_json ?? {};
  const decisionText =
    (payload.decisionText as string) ?? (payload.body as string) ?? action.rationale;

  const { data: decision, error } = await supabase
    .from('company_decisions')
    .insert({
      user_id: action.user_id,
      source_action_id: action.id,
      title: action.title,
      decision_text: decisionText,
      rationale: action.rationale,
    })
    .select('id')
    .single();

  if (error) return { status: 'failed', error: error.message };
  return {
    status: 'completed',
    resultJson: { decisionId: (decision as { id: string }).id },
  };
}

async function execRequestApproval(): Promise<ExecutionResult> {
  return {
    status: 'completed',
    resultJson: { note: 'Approval recorded. No further action required.' },
  };
}

async function execSummarizeMetrics(
  action: CompanyAgentActionRow,
  supabase: SupabaseClient
): Promise<ExecutionResult> {
  const metrics = await loadCompanyMetrics({ supabase, userId: action.user_id });
  const summary = await generate(
    `Summarize these metrics in plain English for a busy operator.\n\n${JSON.stringify(metrics, null, 2)}\n\nFlag the single most important number to watch this week and why.`,
    'You are the InterviewProof Executive Assistant. Be terse.',
    800
  );
  return {
    status: 'completed',
    resultJson: { metrics, summary },
  };
}

const EXECUTORS: Record<
  CompanyActionType,
  (action: CompanyAgentActionRow, supabase: SupabaseClient) => Promise<ExecutionResult>
> = {
  draft_brief: execDraftBrief,
  draft_marketing_asset: execDraftMarketingAsset,
  draft_finance_memo: execDraftFinanceMemo,
  draft_engineering_spec: execDraftEngineeringSpec,
  create_task: execCreateTask,
  record_decision: execRecordDecision,
  request_approval: execRequestApproval,
  summarize_metrics: execSummarizeMetrics,
};

export async function executeAction(
  action: CompanyAgentActionRow,
  supabase: SupabaseClient
): Promise<ExecutionResult> {
  const handler = EXECUTORS[action.action_type];
  if (!handler) {
    return { status: 'failed', error: `No executor for action_type ${action.action_type}` };
  }
  try {
    return await handler(action, supabase);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown executor error';
    return { status: 'failed', error: message };
  }
}
