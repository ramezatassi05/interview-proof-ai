/**
 * GET /api/cron/execute-approved-actions
 *
 * Sweeps approved external-send actions and dispatches them to per-type
 * executors in `src/server/executors/`. The only path in the codebase that
 * may flip an action from `approved` → `completed`/`failed` for an
 * external-send type — the user-facing PATCH route refuses that transition
 * unless `executorAuthorized: true` is set, which only this cron does.
 *
 * Auth: requires `Authorization: Bearer ${CRON_SECRET}`.
 *
 * Service role: createServiceClient is used to read+write across all users.
 * This file is one of the approved sites for createServiceClient — see the
 * allowlist in src/lib/agent/audit.ts file header.
 *
 * Wiring: vercel.json cron entry — every 5 minutes (frequent enough that an
 * approval feels close to real-time without thrashing).
 */
// Approved use of createServiceClient — see file header.
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { verifyCronSecret } from '@/lib/security';
import { recordAuditEvent } from '@/lib/agent/audit';
import { assertTransitionAllowed } from '@/lib/agent/actions';
import type { AgentActionRow, AgentActionType } from '@/lib/agent/types';
import { getExecutor } from '@/server/executors';

export const maxDuration = 60;

const BATCH_SIZE = 25;

interface SweepStats {
  picked: number;
  completed: number;
  failed: number;
  skipped: number;
}

export async function GET(request: NextRequest) {
  const unauthorized = verifyCronSecret(request.headers.get('authorization'));
  if (unauthorized) return unauthorized;

  const supabase = await createServiceClient();
  const stats: SweepStats = { picked: 0, completed: 0, failed: 0, skipped: 0 };

  const { data, error } = await supabase
    .from('agent_actions')
    .select('*')
    .eq('status', 'approved')
    .eq('requires_external_send', true)
    .is('completed_at', null)
    .order('approved_at', { ascending: true })
    .limit(BATCH_SIZE);

  if (error) {
    console.error('[execute-approved-actions] select error:', error);
    return NextResponse.json({ error: 'Failed to query approved actions' }, { status: 500 });
  }

  const rows = (data ?? []) as AgentActionRow[];
  stats.picked = rows.length;
  if (rows.length === 0) {
    return NextResponse.json({ data: stats });
  }

  for (const row of rows) {
    const executor = getExecutor(row.action_type);
    if (!executor) {
      stats.skipped += 1;
      continue;
    }

    let resultJson: Record<string, unknown> | null = null;
    let errorMessage: string | null = null;
    let ok = false;

    try {
      const r = await executor(row, { supabase });
      ok = r.ok;
      resultJson = r.resultJson ?? null;
      errorMessage = r.error ?? null;
    } catch (err) {
      ok = false;
      errorMessage = err instanceof Error ? err.message : String(err);
    }

    const targetStatus: AgentActionType extends string ? 'completed' | 'failed' : never = ok
      ? 'completed'
      : 'failed';

    const transition = assertTransitionAllowed('approved', targetStatus, {
      actionType: row.action_type,
      requiresExternalSend: row.requires_external_send,
      executorAuthorized: true,
    });
    if (!transition.ok) {
      // Should never happen with executorAuthorized=true, but log if it does.
      console.error('[execute-approved-actions] transition rejected:', transition.message);
      stats.skipped += 1;
      continue;
    }

    const nowIso = new Date().toISOString();
    const { error: updateErr } = await supabase
      .from('agent_actions')
      .update({
        status: targetStatus,
        result_json: resultJson,
        error: errorMessage,
        completed_at: nowIso,
      })
      .eq('id', row.id);

    if (updateErr) {
      console.error('[execute-approved-actions] update error:', updateErr);
      stats.skipped += 1;
      continue;
    }

    if (ok) stats.completed += 1;
    else stats.failed += 1;

    await recordAuditEvent({
      userId: row.user_id,
      actionId: row.id,
      sessionId: row.session_id,
      eventType: ok ? 'action_completed' : 'action_failed',
      agentKind: 'executor',
      metadata: {
        from_status: 'approved',
        to_status: targetStatus,
        action_type: row.action_type,
        executor_result: resultJson,
        error: errorMessage,
      },
    });

    // User-facing notification so the bell lights up when a send lands.
    await supabase.from('user_notifications').insert({
      user_id: row.user_id,
      kind: ok ? 'action_completed' : 'action_failed',
      title: ok ? prettyCompleted(row.action_type) : prettyFailed(row.action_type),
      body: ok ? null : (errorMessage ?? 'Executor failed without an error message.'),
      action_id: row.id,
      href: row.report_id ? `/r/${row.report_id}/full?tab=coach` : null,
    });
  }

  return NextResponse.json({ data: stats });
}

function prettyCompleted(actionType: AgentActionType): string {
  switch (actionType) {
    case 'draft_recruiter_reply':
      return 'Recruiter reply ready in your outbox';
    case 'rewrite_resume_bullet':
      return 'Resume bullet rewrite ready';
    default:
      return 'Action completed';
  }
}

function prettyFailed(actionType: AgentActionType): string {
  switch (actionType) {
    case 'draft_recruiter_reply':
      return 'Recruiter reply failed to send';
    case 'rewrite_resume_bullet':
      return 'Resume bullet update failed';
    default:
      return 'Action failed';
  }
}
