/**
 * Action executors — invoked by /api/cron/execute-approved-actions.
 *
 * An executor takes an approved AgentAction and produces a result row. The
 * cron handles state transitions (assertTransitionAllowed → update row)
 * and audit emission; an executor only owns the side effect.
 *
 * Phase A5 ships stub executors for the two existing external-send action
 * types (draft_recruiter_reply, rewrite_resume_bullet). Real Gmail send
 * lands in Phase D; a real resume-write lands when we add a profile-artifact
 * surface. Until then these executors are no-ops that succeed cleanly so
 * the lifecycle is visible end-to-end without doing anything irreversible.
 *
 * Adding a new executor:
 *   1. Implement a function in this folder (`src/server/executors/<type>.ts`)
 *      that returns ExecutorResult.
 *   2. Add an entry to EXECUTORS below.
 *   3. The cron will pick it up automatically.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AgentActionRow } from '@/lib/agent/types';
import { executeDraftRecruiterReply } from './draft_recruiter_reply';
import { executeRewriteResumeBullet } from './rewrite_resume_bullet';
import { executeDelegateToSpecialist } from './delegate_to_specialist';

export interface ExecutorContext {
  supabase: SupabaseClient;
}

export interface ExecutorResult {
  ok: boolean;
  resultJson?: Record<string, unknown> | null;
  error?: string | null;
}

export type ActionExecutor = (
  action: AgentActionRow,
  ctx: ExecutorContext
) => Promise<ExecutorResult>;

export const EXECUTORS: Partial<Record<string, ActionExecutor>> = {
  draft_recruiter_reply: executeDraftRecruiterReply,
  rewrite_resume_bullet: executeRewriteResumeBullet,
  delegate_to_specialist: executeDelegateToSpecialist,
};

export function getExecutor(actionType: string): ActionExecutor | null {
  return EXECUTORS[actionType] ?? null;
}
