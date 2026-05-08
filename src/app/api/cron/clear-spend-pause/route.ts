/**
 * GET /api/cron/clear-spend-pause
 *
 * Clears expired spend_paused_until timestamps on company_agent_guardrails.
 * Runs at 00:05 UTC on the 1st of each month so agents that hit their cap
 * in the prior month resume automatically without operator intervention.
 *
 * Idempotent: only updates rows where spend_paused_until is in the past.
 *
 * Auth: requires `Authorization: Bearer ${CRON_SECRET}` header.
 *
 * Service role: needed because guardrail rows are RLS-scoped per user but
 * the sweep runs cross-user. Mirrors the pattern in /api/cron/cleanup-stale-actions.
 */
// Approved use of createServiceClient — see file header.
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { verifyCronSecret } from '@/lib/security';

export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const unauthorized = verifyCronSecret(request.headers.get('authorization'));
  if (unauthorized) return unauthorized;

  const supabase = await createServiceClient();
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from('company_agent_guardrails')
    .update({ spend_paused_until: null })
    .lt('spend_paused_until', nowIso)
    .not('spend_paused_until', 'is', null)
    .select('user_id, agent_kind');

  if (error) {
    console.error('[clear-spend-pause] update error:', error);
    return NextResponse.json({ error: 'Failed to clear spend pauses' }, { status: 500 });
  }

  return NextResponse.json({ data: { clearedCount: data?.length ?? 0 } });
}
