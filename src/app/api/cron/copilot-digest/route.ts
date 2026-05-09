/**
 * GET /api/cron/copilot-digest
 *
 * Phase C — proactive copilot sweep.
 *
 * Once a day, for each user who has been active in the last 14 days, run
 * the prep orchestrator with `userMessage='proactive_digest'` against their
 * latest report. The orchestrator drafts up to 3 actions; the existing
 * trigger surfaces those as bell notifications, so the user returns to a
 * "what changed while you were away" experience.
 *
 * Auth: Authorization: Bearer ${CRON_SECRET}.
 *
 * Service role: required to read across all users + invoke the orchestrator
 * runner with each user's id. Approved use site documented in
 * src/lib/agent/audit.ts file header.
 *
 * Wiring: vercel.json — daily at 13:00 UTC (covers most US morning hours
 * with one job; per-user TZ handling deferred to Phase C+1).
 *
 * Cost guard: capped at MAX_USERS_PER_RUN per run; the sweep is
 * idempotent-ish — running twice in the same day will draft duplicate
 * suggestions, so the cron stays daily.
 */
// Approved use of createServiceClient — see file header.
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { verifyCronSecret } from '@/lib/security';
import { runPrepOrchestrator } from '@/server/agents/prep-orchestrator';
import { rowToAgentSession } from '@/lib/agent/types';
import type { AgentSessionRow } from '@/lib/agent/types';

export const maxDuration = 300;

const MAX_USERS_PER_RUN = 50;
const ACTIVITY_WINDOW_DAYS = 14;
const PROACTIVE_USER_MESSAGE =
  'proactive_digest: surface the highest-leverage 1–3 things this user should do next. Bias toward concrete drills and prep-plan updates over recruiter sends.';

interface SweepStats {
  considered: number;
  ran: number;
  failed: number;
  skipped: number;
}

export async function GET(request: NextRequest) {
  const unauthorized = verifyCronSecret(request.headers.get('authorization'));
  if (unauthorized) return unauthorized;

  const supabase = await createServiceClient();
  const stats: SweepStats = { considered: 0, ran: 0, failed: 0, skipped: 0 };

  const cutoffIso = new Date(Date.now() - ACTIVITY_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();

  // Pull the most-recent report per user that has been touched in the window.
  // We use latest by created_at as a coarse "active" signal; refining to
  // last login would need an auth.users join we'd rather not bake in here.
  const { data: recentReports, error: reportsErr } = await supabase
    .from('reports')
    .select('id, user_id, created_at')
    .gte('created_at', cutoffIso)
    .order('created_at', { ascending: false });

  if (reportsErr) {
    console.error('[copilot-digest] reports query error:', reportsErr);
    return NextResponse.json({ error: 'Failed to query reports' }, { status: 500 });
  }

  // Dedupe: one most-recent report per user.
  const seen = new Set<string>();
  const candidates: { userId: string; reportId: string }[] = [];
  for (const row of recentReports ?? []) {
    const userId = row.user_id as string;
    if (seen.has(userId)) continue;
    seen.add(userId);
    candidates.push({ userId, reportId: row.id as string });
    if (candidates.length >= MAX_USERS_PER_RUN) break;
  }

  stats.considered = candidates.length;

  for (const { userId, reportId } of candidates) {
    try {
      const { data: newSession, error: createErr } = await supabase
        .from('agent_sessions')
        .insert({ user_id: userId, agent_kind: 'orchestrator', report_id: reportId })
        .select()
        .single();

      if (createErr || !newSession) {
        console.error('[copilot-digest] session create failed for user', userId, createErr);
        stats.failed += 1;
        continue;
      }

      const sessionId = rowToAgentSession(newSession as AgentSessionRow).id;

      await runPrepOrchestrator({
        userId,
        reportId,
        sessionId,
        supabase,
        userMessage: PROACTIVE_USER_MESSAGE,
      });

      stats.ran += 1;
    } catch (err) {
      console.error('[copilot-digest] orchestrator error for user', userId, err);
      stats.failed += 1;
    }
  }

  return NextResponse.json({ data: stats });
}
