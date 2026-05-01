/**
 * Prep-plan task sync helpers (M4).
 *
 * Bridges the legacy LLM-analysis study plan + personalized day-by-day plan
 * (DetailedTask[], identified by string ids) onto the server-backed
 * prep_plan_tasks table. The mapping from client `task.id` (a string LLM
 * identifier) to `prep_plan_tasks.id` (a uuid) lives in evidence_refs_json
 * as `[{ kind: 'client_task_id', value: '<original>' }]`. This avoids a
 * schema migration for an external_id column.
 *
 * One prep_plan per (user, report) is reserved for this client-side study
 * plan tracking. It is identified by `plan_json.source === 'llm_analysis'`.
 * Plans created by the M7.4 prep-plan agent have a different source marker
 * and are not touched by these helpers.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { PrepPlanTaskCategory, PrepPlanTaskStatus } from '@/types';

export const STUDY_PLAN_SOURCE = 'llm_analysis' as const;

const CATEGORY_MAP: Record<string, PrepPlanTaskCategory> = {
  technical: 'technical',
  behavioral: 'behavioral',
  practice: 'practice',
  review: 'review',
  study: 'study',
  company_research: 'company_research',
  rest: 'rest',
};

function normalizeCategory(raw: string | null | undefined): PrepPlanTaskCategory {
  if (!raw) return 'study';
  return CATEGORY_MAP[raw] ?? 'study';
}

export interface ClientTaskInput {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  dayOffset?: number | null;
  estimatedMinutes?: number | null;
}

interface PrepPlanRow {
  id: string;
  user_id: string;
  report_id: string | null;
  status: 'active' | 'archived' | 'completed';
  plan_json: Record<string, unknown>;
}

interface PrepPlanTaskRow {
  id: string;
  prep_plan_id: string;
  day_offset: number;
  title: string;
  description: string | null;
  category: PrepPlanTaskCategory;
  estimated_minutes: number | null;
  status: PrepPlanTaskStatus;
  evidence_refs_json: unknown[] | null;
}

interface ClientTaskRef {
  kind: 'client_task_id';
  value: string;
}

export function extractClientTaskId(refs: unknown[] | null | undefined): string | null {
  if (!Array.isArray(refs)) return null;
  for (const r of refs) {
    if (
      typeof r === 'object' &&
      r !== null &&
      (r as ClientTaskRef).kind === 'client_task_id' &&
      typeof (r as ClientTaskRef).value === 'string'
    ) {
      return (r as ClientTaskRef).value;
    }
  }
  return null;
}

export interface SyncStudyPlanResult {
  planId: string;
  tasks: PrepPlanTaskRow[];
  clientIdToTaskId: Record<string, string>;
  completedClientTaskIds: string[];
}

/**
 * Lazy-create the LLM-analysis tracking prep_plan for this report (if absent),
 * insert any missing prep_plan_tasks rows for the supplied client tasks, and
 * return the current snapshot for the client to hydrate.
 *
 * Existing tasks with matching client_task_id are NOT mutated — server is
 * source of truth for status, so the client can only flip status via the
 * dedicated PATCH endpoint.
 */
export async function syncStudyPlanForReport(
  supabase: SupabaseClient,
  userId: string,
  reportId: string,
  clientTasks: ClientTaskInput[]
): Promise<SyncStudyPlanResult> {
  // 1) Find or create the dedicated tracking prep_plan
  const { data: planRows } = await supabase
    .from('prep_plans')
    .select('id, user_id, report_id, status, plan_json')
    .eq('user_id', userId)
    .eq('report_id', reportId)
    .eq('status', 'active')
    .order('updated_at', { ascending: false });

  let plan: PrepPlanRow | null = null;
  for (const row of (planRows ?? []) as PrepPlanRow[]) {
    const source = (row.plan_json as { source?: unknown })?.source;
    if (source === STUDY_PLAN_SOURCE) {
      plan = row;
      break;
    }
  }

  if (!plan) {
    const { data: created, error: createErr } = await supabase
      .from('prep_plans')
      .insert({
        user_id: userId,
        report_id: reportId,
        status: 'active',
        plan_json: { source: STUDY_PLAN_SOURCE, version: 'v1.0.0' },
      })
      .select('id, user_id, report_id, status, plan_json')
      .single();
    if (createErr || !created) {
      throw new Error(`Failed to create study-plan tracking prep_plan: ${createErr?.message}`);
    }
    plan = created as PrepPlanRow;
  }

  // 2) Read existing tasks for the plan
  const { data: existingTaskRows } = await supabase
    .from('prep_plan_tasks')
    .select(
      'id, prep_plan_id, day_offset, title, description, category, estimated_minutes, status, evidence_refs_json'
    )
    .eq('prep_plan_id', plan.id);

  const existingTasks = (existingTaskRows ?? []) as PrepPlanTaskRow[];
  const existingByClientId = new Map<string, PrepPlanTaskRow>();
  for (const t of existingTasks) {
    const cid = extractClientTaskId(t.evidence_refs_json);
    if (cid) existingByClientId.set(cid, t);
  }

  // 3) Insert any missing client tasks
  const toInsert = clientTasks
    .filter((c) => !existingByClientId.has(c.id))
    .map((c) => ({
      prep_plan_id: plan!.id,
      day_offset: c.dayOffset ?? 0,
      title: c.title.slice(0, 1000),
      description: c.description ?? null,
      category: normalizeCategory(c.category ?? null),
      estimated_minutes: c.estimatedMinutes ?? null,
      status: 'pending' as PrepPlanTaskStatus,
      evidence_refs_json: [{ kind: 'client_task_id', value: c.id }],
    }));

  if (toInsert.length > 0) {
    const { data: inserted, error: insertErr } = await supabase
      .from('prep_plan_tasks')
      .insert(toInsert)
      .select(
        'id, prep_plan_id, day_offset, title, description, category, estimated_minutes, status, evidence_refs_json'
      );
    if (insertErr) {
      throw new Error(`Failed to insert prep_plan_tasks: ${insertErr.message}`);
    }
    for (const row of (inserted ?? []) as PrepPlanTaskRow[]) {
      const cid = extractClientTaskId(row.evidence_refs_json);
      if (cid) existingByClientId.set(cid, row);
      existingTasks.push(row);
    }
  }

  // 4) Build the response snapshot
  const clientIdToTaskId: Record<string, string> = {};
  const completedClientTaskIds: string[] = [];
  for (const [clientId, row] of existingByClientId.entries()) {
    clientIdToTaskId[clientId] = row.id;
    if (row.status === 'done') completedClientTaskIds.push(clientId);
  }

  return {
    planId: plan.id,
    tasks: existingTasks,
    clientIdToTaskId,
    completedClientTaskIds,
  };
}
