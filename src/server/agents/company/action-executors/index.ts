import type { SupabaseClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { getAnthropicClient } from '@/lib/anthropic';
import { loadCompanyMetrics } from '../company-metrics';
import { VOICE_RULES_SHORT } from '../voice';
import type { CompanyAgentActionRow, CompanyActionType, CompanyAgentKind } from '../types';
import { getModelForAgent } from '../agent-models';
import { appendRoadmapRow } from '../roadmap/loader';
import type { RoadmapDomainKey } from '../roadmap/types';

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

async function generate(
  prompt: string,
  system: string,
  agentKind: CompanyAgentKind,
  maxTokens = 1500
): Promise<string> {
  const client = getAnthropicClient();
  const response = await client.messages.create({
    model: getModelForAgent(agentKind),
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
    `Write the CEO a quick weekly update — the kind of thing an EA would say walking into the office Monday morning.

Numbers you can pull from:
${JSON.stringify(metrics, null, 2)}

What they asked for: ${action.title}
Context: ${action.rationale}
Anything extra: ${JSON.stringify(action.payload_json, null, 2)}

Write 3-4 short paragraphs. Cover what's working, what's worrying, what to do next, and anything that needs the CEO to decide. No headers, no labels, no bullets — just the way you'd say it out loud.`,
    `You are the InterviewProof CEO's Executive Assistant. ${VOICE_RULES_SHORT}`,
    action.agent_kind,
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
    `Draft the marketing copy.

What the CEO asked for: ${action.title}
Why we're doing it: ${action.rationale}
Spec / details: ${summary || JSON.stringify(action.payload_json)}

Just give me the copy — no preamble, no "here's a draft" intro. If the channel isn't specified, treat it as a short social post under 280 chars. Be specific. Skip generic SaaS phrases.`,
    `You are the InterviewProof Director of Marketing. ${VOICE_RULES_SHORT}`,
    action.agent_kind,
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
    `Write the CEO a short finance note — the kind of thing you'd Slack them after looking at the numbers.

Numbers:
${JSON.stringify(metrics, null, 2)}

What they asked: ${action.title}
Why: ${action.rationale}
Anything extra: ${JSON.stringify(action.payload_json, null, 2)}

3 short paragraphs. Where things stand, what you'd recommend, what could go wrong. Use real numbers in sentences. No headers, no bullets.`,
    `You are the InterviewProof Director of Finance. ${VOICE_RULES_SHORT}`,
    action.agent_kind,
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
    `Write a short spec the team can pick up and start on.

What the CEO asked for: ${action.title}
Why: ${action.rationale}
Anything extra: ${JSON.stringify(action.payload_json, null, 2)}

Walk through what we're building, the constraints to keep in mind, how you'd approach it, what "done" looks like, and a rough size (small / medium / large). Write it as flowing prose, not headers and bullets. Be specific — no hedging.`,
    `You are the InterviewProof Director of Engineering. ${VOICE_RULES_SHORT}`,
    action.agent_kind,
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

const VALID_ROADMAP_DOMAINS = new Set<RoadmapDomainKey>(['product', 'marketing', 'finance']);

function asString(v: unknown): string | undefined {
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}

async function execAppendRoadmapRow(
  action: CompanyAgentActionRow
): Promise<ExecutionResult> {
  const payload = action.payload_json ?? {};
  const domainRaw = (payload.domain as string) ?? '';
  if (!VALID_ROADMAP_DOMAINS.has(domainRaw as RoadmapDomainKey)) {
    return { status: 'failed', error: `append_roadmap_row: unknown domain "${domainRaw}".` };
  }
  const domain = domainRaw as RoadmapDomainKey;
  const row = (payload.row as Record<string, unknown> | undefined) ?? {};
  const title = asString(row.title);
  if (!title) {
    return { status: 'failed', error: 'append_roadmap_row: payload.row.title is required.' };
  }
  const priority = asString(row.priority);

  const result = await appendRoadmapRow(domain, {
    title,
    priority,
    status: asString(row.status),
    phase: asString(row.phase),
    description: asString(row.description),
    inspiration: asString(row.inspiration),
  });

  if (!result.ok) {
    if (result.reason === 'missing_file') {
      return {
        status: 'failed',
        error: `roadmap/${domain}.csv does not exist yet — create it first.`,
      };
    }
    if (result.reason === 'no_header') {
      return {
        status: 'failed',
        error: `roadmap/${domain}.csv has no header row — fix the file before adding rows from chat.`,
      };
    }
    if (result.reason === 'read_only_fs') {
      return {
        status: 'failed',
        error:
          'Filesystem is read-only on this host (likely Vercel). Run the command center locally to apply roadmap changes.',
      };
    }
    return { status: 'failed', error: result.error ?? 'Failed to append roadmap row.' };
  }

  return {
    status: 'completed',
    resultJson: { domain, id: result.id, line: result.line, filePath: result.filePath },
  };
}

async function execSummarizeMetrics(
  action: CompanyAgentActionRow,
  supabase: SupabaseClient
): Promise<ExecutionResult> {
  const metrics = await loadCompanyMetrics({ supabase, userId: action.user_id });
  const summary = await generate(
    `Walk the CEO through these numbers in plain English — the kind of thing you'd say in 30 seconds standing at their desk.

${JSON.stringify(metrics, null, 2)}

Then call out the one number to watch this week and why. Keep it short.`,
    `You are the InterviewProof CEO's Executive Assistant. ${VOICE_RULES_SHORT}`,
    action.agent_kind,
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
  append_roadmap_row: execAppendRoadmapRow,
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
