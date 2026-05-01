/**
 * computeUserPracticeProgress — derives a longitudinal practice signal from
 * the persisted `practice_answers` rows. Parallel module to (and intentionally
 * separate from) `computePracticeIntelligence()` in `src/server/scoring/practice.ts`.
 *
 * No LLM. No deterministic-scoring mutation. Read-only summary used by the
 * agentic platform to give the orchestrator memory of how the user has been
 * trending across sessions.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import type { PracticeProgress } from '@/types';

export const PRACTICE_PROGRESS_VERSION = 'v1.0.0';

interface PracticeAnswerRow {
  question_index: number;
  mapped_risk_id: string | null;
  score: number | null;
  attempt_number: number;
  created_at: string;
}

const TREND_EPSILON = 3; // points; smaller deltas are treated as "flat"

function classifyTrend(scores: number[]): 'improving' | 'flat' | 'declining' {
  if (scores.length < 2) return 'flat';

  // Compare the average of the first half vs the second half (chronological order).
  // Practice answers grow over time, so the second half is the "recent" practice.
  const mid = Math.floor(scores.length / 2);
  const earlier = scores.slice(0, mid);
  const later = scores.slice(mid);

  if (earlier.length === 0 || later.length === 0) return 'flat';

  const avg = (xs: number[]): number => xs.reduce((a, b) => a + b, 0) / xs.length;
  const delta = avg(later) - avg(earlier);

  if (delta > TREND_EPSILON) return 'improving';
  if (delta < -TREND_EPSILON) return 'declining';
  return 'flat';
}

/**
 * Computes longitudinal practice progress for one user / one report.
 *
 * - `answersAttempted` counts every row (each retry is a separate row per D2).
 * - `avgScore` averages every scored row (null if no rows had scores).
 * - `scoreTrend` compares earlier-half vs later-half average score chronologically.
 * - `weakestRiskIds` lists up to 3 `mapped_risk_id` values whose latest-attempt
 *   score is the lowest, only counting risk ids that actually have a score.
 * - `lastPracticedAt` is the most recent `created_at`.
 *
 * Returns sane zeros (`answersAttempted: 0`, `avgScore: null`, `scoreTrend: 'flat'`,
 * `weakestRiskIds: []`, `lastPracticedAt: null`) when the user has no rows.
 */
export async function computeUserPracticeProgress(
  userId: string,
  reportId: string,
  client?: SupabaseClient
): Promise<PracticeProgress> {
  const supabase = client ?? (await createClient());

  const { data, error } = await supabase
    .from('practice_answers')
    .select('question_index, mapped_risk_id, score, attempt_number, created_at')
    .eq('user_id', userId)
    .eq('report_id', reportId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('computeUserPracticeProgress query error:', error);
    return {
      answersAttempted: 0,
      avgScore: null,
      scoreTrend: 'flat',
      weakestRiskIds: [],
      lastPracticedAt: null,
    };
  }

  const rows = (data ?? []) as PracticeAnswerRow[];

  if (rows.length === 0) {
    return {
      answersAttempted: 0,
      avgScore: null,
      scoreTrend: 'flat',
      weakestRiskIds: [],
      lastPracticedAt: null,
    };
  }

  const scoredRows = rows.filter(
    (r): r is PracticeAnswerRow & { score: number } => typeof r.score === 'number'
  );

  const avgScore =
    scoredRows.length > 0
      ? Math.round(scoredRows.reduce((sum, r) => sum + r.score, 0) / scoredRows.length)
      : null;

  const scoreTrend = classifyTrend(scoredRows.map((r) => r.score));

  // Weakest risks: per mapped_risk_id, take the latest-attempt scored row.
  // Then sort by score ascending; take up to 3.
  const latestPerRisk = new Map<
    string,
    { score: number; attemptNumber: number; createdAt: string }
  >();
  for (const row of scoredRows) {
    if (!row.mapped_risk_id) continue;
    const existing = latestPerRisk.get(row.mapped_risk_id);
    if (
      !existing ||
      row.attempt_number > existing.attemptNumber ||
      (row.attempt_number === existing.attemptNumber && row.created_at > existing.createdAt)
    ) {
      latestPerRisk.set(row.mapped_risk_id, {
        score: row.score,
        attemptNumber: row.attempt_number,
        createdAt: row.created_at,
      });
    }
  }

  const weakestRiskIds = Array.from(latestPerRisk.entries())
    .sort((a, b) => a[1].score - b[1].score)
    .slice(0, 3)
    .map(([riskId]) => riskId);

  const lastPracticedAt = rows[rows.length - 1].created_at;

  return {
    answersAttempted: rows.length,
    avgScore,
    scoreTrend,
    weakestRiskIds,
    lastPracticedAt,
  };
}
