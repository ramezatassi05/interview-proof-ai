/**
 * GET /api/cron/cleanup-stale-actions
 *
 * Auto-fails agent_actions stuck in `status='drafted'` for more than 7 days.
 * These are typically actions an LLM proposed but the user never engaged
 * with — keeping them in the queue forever pollutes the approval UI.
 *
 * Auth: requires `Authorization: Bearer ${CRON_SECRET}` header. Mirrors the
 * pattern used by /api/cron/feedback-emails (see verifyCronSecret).
 *
 * Service role: createServiceClient is used here so the job can read+write
 * across all users in a single sweep. This file is one of two approved sites
 * for createServiceClient (the other is src/lib/agent/audit.ts). Do not
 * widen the scope.
 *
 * Wiring: this is a cron route. To activate it, add the following entry to
 * vercel.json under "crons":
 *
 *   {
 *     "path": "/api/cron/cleanup-stale-actions",
 *     "schedule": "0 6 * * *"
 *   }
 *
 * (Daily at 06:00 UTC — once a day is plenty for a 7-day TTL.) The repo's
 * vercel.json is intentionally NOT updated here; an operator can land that
 * change in a follow-up PR.
 */
// Approved use of createServiceClient — see file header.
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { verifyCronSecret } from '@/lib/security';
import { recordAuditEvent } from '@/lib/agent/audit';

export const maxDuration = 60;

const STALE_DRAFT_TTL_DAYS = 7;
const AUTO_EXPIRE_REASON = 'auto_expired_after_7_days';

export async function GET(request: NextRequest) {
  const unauthorized = verifyCronSecret(request.headers.get('authorization'));
  if (unauthorized) return unauthorized;

  const supabase = await createServiceClient();

  const cutoffIso = new Date(Date.now() - STALE_DRAFT_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();

  // Pull the stale drafts first (we need their ids/user_ids/session_ids for
  // audit emission) then mark them all failed in a single update.
  const { data: stale, error: selectError } = await supabase
    .from('agent_actions')
    .select('id, user_id, session_id, action_type, created_at')
    .eq('status', 'drafted')
    .lt('created_at', cutoffIso);

  if (selectError) {
    console.error('[cleanup-stale-actions] select error:', selectError);
    return NextResponse.json({ error: 'Failed to query stale actions' }, { status: 500 });
  }

  const rows = stale ?? [];
  if (rows.length === 0) {
    return NextResponse.json({ data: { expiredCount: 0 } });
  }

  const ids = rows.map((r) => r.id as string);
  const nowIso = new Date().toISOString();

  const { error: updateError } = await supabase
    .from('agent_actions')
    .update({
      status: 'failed',
      error: AUTO_EXPIRE_REASON,
      completed_at: nowIso,
    })
    .in('id', ids);

  if (updateError) {
    console.error('[cleanup-stale-actions] update error:', updateError);
    return NextResponse.json({ error: 'Failed to expire stale actions' }, { status: 500 });
  }

  // Best-effort audit emission per row. recordAuditEvent already swallows
  // its own errors, so a single bad row never blocks the rest.
  for (const row of rows) {
    await recordAuditEvent({
      userId: row.user_id as string,
      actionId: row.id as string,
      sessionId: (row.session_id as string | null) ?? null,
      eventType: 'action_failed',
      metadata: {
        from_status: 'drafted',
        to_status: 'failed',
        error: AUTO_EXPIRE_REASON,
        action_type: row.action_type,
        ttl_days: STALE_DRAFT_TTL_DAYS,
        created_at: row.created_at,
      },
    });
  }

  return NextResponse.json({ data: { expiredCount: rows.length } });
}
