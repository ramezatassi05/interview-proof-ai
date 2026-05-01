import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { AGENT_ACTION_STATUSES, rowToAgentAction } from '@/lib/agent/types';
import type { AgentActionRow, AgentActionStatus } from '@/lib/agent/types';
import { assertTransitionAllowed, validateActionPayload } from '@/lib/agent/actions';
import { recordAuditEvent, type AgentAuditEventType } from '@/lib/agent/audit';

const PROPOSED_MEMORY_KINDS = new Set(['weakness', 'preference', 'goal']);

interface ProposedMemoryEntry {
  kind: string;
  key: string;
  value: string;
}

interface EvidenceRefBlock {
  kind?: unknown;
  entries?: unknown;
}

async function applyProposedMemoryUpserts(args: {
  supabase: SupabaseClient;
  userId: string;
  actionId: string;
  evidenceRefs: unknown[];
}): Promise<void> {
  const { supabase, userId, actionId, evidenceRefs } = args;
  const block = evidenceRefs.find(
    (r): r is EvidenceRefBlock =>
      typeof r === 'object' &&
      r !== null &&
      (r as EvidenceRefBlock).kind === 'proposed_memory_upserts'
  );
  if (!block || !Array.isArray(block.entries)) return;

  const rows = (block.entries as unknown[])
    .filter(
      (e): e is ProposedMemoryEntry =>
        typeof e === 'object' &&
        e !== null &&
        typeof (e as ProposedMemoryEntry).kind === 'string' &&
        PROPOSED_MEMORY_KINDS.has((e as ProposedMemoryEntry).kind) &&
        typeof (e as ProposedMemoryEntry).key === 'string' &&
        typeof (e as ProposedMemoryEntry).value === 'string'
    )
    .map((e) => ({
      user_id: userId,
      kind: e.kind,
      key: e.key.slice(0, 100),
      value_json: { value: e.value.slice(0, 800) },
      source_action_id: actionId,
    }));

  if (rows.length === 0) return;

  const { error } = await supabase
    .from('user_memory')
    .upsert(rows, { onConflict: 'user_id,kind,key' });

  if (error) {
    console.error('[agent_actions] memory upsert error:', error);
  }
}

const STATUS_TO_AUDIT_EVENT: Record<string, AgentAuditEventType | null> = {
  drafted: 'action_drafted',
  awaiting_approval: 'action_awaiting_approval',
  approved: 'action_approved',
  rejected: 'action_rejected',
  completed: 'action_completed',
  failed: 'action_failed',
};

const PatchSchema = z.object({
  status: z.enum(AGENT_ACTION_STATUSES as unknown as [string, ...string[]]),
  resultJson: z.record(z.string(), z.unknown()).optional(),
  // Optional payload override allowed only on awaiting_approval → approved
  // transition. Re-validated against the action_type schema before persisting.
  payloadJson: z.record(z.string(), z.unknown()).optional(),
  error: z.string().optional(),
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allowed = await checkRateLimit({
      prefix: 'agent_read',
      identifier: `user:${user.id}`,
      maxRequests: 240,
      windowSeconds: 3600,
    });
    if (!allowed) return rateLimitResponse(60);

    const { data: row } = await supabase
      .from('agent_actions')
      .select()
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!row) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ data: rowToAgentAction(row as AgentActionRow) });
  } catch (err) {
    console.error('GET /api/agent/actions/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allowed = await checkRateLimit({
      prefix: 'agent_action_write',
      identifier: `user:${user.id}`,
      maxRequests: 60,
      windowSeconds: 3600,
    });
    if (!allowed) {
      await recordAuditEvent({
        userId: user.id,
        eventType: 'rate_limited',
        metadata: { prefix: 'agent_action_write', retry_after_seconds: 3600 },
      });
      return rateLimitResponse(3600);
    }

    const body = await request.json();
    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { data: existing } = await supabase
      .from('agent_actions')
      .select()
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const current = existing as AgentActionRow;
    const requestedStatus = parsed.data.status as AgentActionStatus;

    const transition = assertTransitionAllowed(current.status, requestedStatus, {
      actionType: current.action_type,
      requiresExternalSend: current.requires_external_send,
    });

    if (!transition.ok) {
      return NextResponse.json(
        {
          error: transition.message,
          code: transition.reason,
          from: current.status,
          to: requestedStatus,
          allowed: transition.allowed,
        },
        { status: 409 }
      );
    }

    const update: Record<string, unknown> = { status: requestedStatus };
    const nowIso = new Date().toISOString();
    if (requestedStatus === 'approved') {
      update.approved_at = nowIso;
      // Allow user-supplied payload edits at the moment of approval, e.g. the
      // approval modal merging a chosen resume-bullet alternative or an
      // inline-edited recruiter reply. Re-validated against the action_type
      // schema; rejected if invalid.
      if (parsed.data.payloadJson !== undefined) {
        const v = validateActionPayload(current.action_type, parsed.data.payloadJson);
        if (!v.ok) {
          return NextResponse.json(
            { error: 'Invalid payload', details: v.error, code: 'invalid_payload' },
            { status: 400 }
          );
        }
        update.payload_json = v.payload;
      }
    } else if (parsed.data.payloadJson !== undefined) {
      // payload_json edits are only permitted on the approval transition.
      return NextResponse.json(
        {
          error: 'payload_json updates only allowed on awaiting_approval → approved transition',
          code: 'payload_update_not_allowed',
        },
        { status: 400 }
      );
    }
    if (requestedStatus === 'completed' || requestedStatus === 'failed') {
      update.completed_at = nowIso;
      if (parsed.data.resultJson !== undefined) update.result_json = parsed.data.resultJson;
      if (parsed.data.error !== undefined) update.error = parsed.data.error;
    }

    const { data: updated, error } = await supabase
      .from('agent_actions')
      .update(update)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error || !updated) {
      console.error('agent_actions update error:', error);
      return NextResponse.json({ error: 'Failed to update action' }, { status: 500 });
    }

    const auditEventType = STATUS_TO_AUDIT_EVENT[requestedStatus];
    if (auditEventType) {
      await recordAuditEvent({
        userId: user.id,
        actionId: id,
        sessionId: current.session_id ?? null,
        eventType: auditEventType,
        metadata: {
          from_status: current.status,
          to_status: requestedStatus,
          ...(parsed.data.error !== undefined ? { error: parsed.data.error } : {}),
        },
      });
    }

    // Side effect: when a debrief's summarize_progress action transitions to
    // `approved`, apply the proposed user_memory upserts that the agent put
    // in evidence_refs_json. Best-effort — a memory write failure is logged
    // but does not fail the approval (the action is already updated).
    if (
      current.action_type === 'summarize_progress' &&
      requestedStatus === 'approved' &&
      Array.isArray(current.evidence_refs_json)
    ) {
      await applyProposedMemoryUpserts({
        supabase,
        userId: user.id,
        actionId: id,
        evidenceRefs: current.evidence_refs_json,
      });
    }

    return NextResponse.json({ data: rowToAgentAction(updated as AgentActionRow) });
  } catch (err) {
    console.error('PATCH /api/agent/actions/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
