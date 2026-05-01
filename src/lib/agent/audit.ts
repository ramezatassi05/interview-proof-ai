/**
 * Agent audit trail.
 *
 * recordAuditEvent writes an append-only row into agent_audit_events. We use
 * createServiceClient so inserts succeed regardless of RLS context — the
 * audit table intentionally has no INSERT policy, so service-role bypass is
 * the only write path. This file is one of two approved sites for
 * createServiceClient (the other is the cron cleanup route).
 *
 * runAgentCall is a thin wrapper that records `agent_call_started`,
 * `agent_call_completed` (with token + duration metadata), or
 * `agent_call_failed` (with error class + message) around an LLM call. All
 * audit writes are best-effort: a failure to insert never breaks the user
 * flow — we log and continue.
 */
// Approved use of createServiceClient — see file header.
import { createServiceClient } from '@/lib/supabase/server';

export type AgentAuditEventType =
  | 'action_drafted'
  | 'action_awaiting_approval'
  | 'action_approved'
  | 'action_rejected'
  | 'action_completed'
  | 'action_failed'
  | 'session_created'
  | 'session_archived'
  | 'rate_limited'
  | 'agent_call_started'
  | 'agent_call_completed'
  | 'agent_call_failed';

export interface RecordAuditEventArgs {
  userId: string;
  actionId?: string | null;
  sessionId?: string | null;
  eventType: AgentAuditEventType;
  agentKind?: string | null;
  metadata?: Record<string, unknown> | null;
}

export async function recordAuditEvent(args: RecordAuditEventArgs): Promise<void> {
  const { userId, actionId, sessionId, eventType, agentKind, metadata } = args;
  try {
    const supabase = await createServiceClient();
    const { error } = await supabase.from('agent_audit_events').insert({
      user_id: userId,
      action_id: actionId ?? null,
      session_id: sessionId ?? null,
      event_type: eventType,
      agent_kind: agentKind ?? null,
      metadata_json: metadata ?? null,
    });
    if (error) {
      console.error('[audit] recordAuditEvent insert error:', error);
    }
  } catch (err) {
    console.error('[audit] recordAuditEvent unexpected error:', err);
  }
}

export interface RunAgentCallOpts {
  userId: string;
  sessionId?: string | null;
  agentKind: string;
  model: string;
}

export interface AgentCallResult<T> {
  result: T;
  durationMs: number;
  tokensIn: number | null;
  tokensOut: number | null;
}

/**
 * Wraps an LLM call (or any agent step that returns Anthropic-shaped usage)
 * with audit instrumentation. The callback receives no args and must return
 * its result plus optional `tokensIn`/`tokensOut` so we can persist them.
 *
 * Audit semantics:
 *   - `agent_call_started` is recorded before the callback runs
 *   - `agent_call_completed` is recorded on success, with tokens + duration
 *   - `agent_call_failed` is recorded on throw (with error class + message),
 *     and the original error is re-thrown so the caller's existing error
 *     path remains intact.
 */
export async function runAgentCall<T>(
  opts: RunAgentCallOpts,
  fn: () => Promise<{ value: T; tokensIn?: number | null; tokensOut?: number | null }>
): Promise<AgentCallResult<T>> {
  const { userId, sessionId, agentKind, model } = opts;
  const startedAt = Date.now();

  await recordAuditEvent({
    userId,
    sessionId,
    eventType: 'agent_call_started',
    agentKind,
    metadata: { agent_kind: agentKind, model },
  });

  try {
    const { value, tokensIn = null, tokensOut = null } = await fn();
    const durationMs = Date.now() - startedAt;

    await recordAuditEvent({
      userId,
      sessionId,
      eventType: 'agent_call_completed',
      agentKind,
      metadata: {
        agent_kind: agentKind,
        model,
        tokens_in: tokensIn,
        tokens_out: tokensOut,
        duration_ms: durationMs,
      },
    });

    return { result: value, durationMs, tokensIn, tokensOut };
  } catch (err) {
    const durationMs = Date.now() - startedAt;
    const errorClass = err instanceof Error ? err.constructor.name : typeof err;
    const errorMessage =
      err instanceof Error ? err.message : typeof err === 'string' ? err : 'unknown error';

    await recordAuditEvent({
      userId,
      sessionId,
      eventType: 'agent_call_failed',
      agentKind,
      metadata: {
        agent_kind: agentKind,
        model,
        error_class: errorClass,
        error_message: errorMessage,
        duration_ms: durationMs,
      },
    });

    throw err;
  }
}
