import { SupabaseClient } from '@supabase/supabase-js';

export const GRANT_AMOUNTS = {
  UPLOAD_BONUS: 1,
  FIRST_UNLOCK_BONUS: 2,
  REFERRAL_BONUS: 3,
} as const;

export type GrantReason = 'upload' | 'first_unlock' | 'referral';

/**
 * Idempotent credit grant. Uses stripe_event_id column with convention
 * `grant:{reason}:{uniqueKey}` for deduplication.
 */
export async function grantCredits(params: {
  supabase: SupabaseClient;
  userId: string;
  amount: number;
  reason: GrantReason;
  uniqueKey: string;
}): Promise<{ granted: boolean; alreadyGranted: boolean }> {
  const { supabase, userId, amount, reason, uniqueKey } = params;
  const idempotencyKey = `grant:${reason}:${uniqueKey}`;

  // Check if already granted
  const { data: existing } = await supabase
    .from('credits_ledger')
    .select('id')
    .eq('stripe_event_id', idempotencyKey)
    .single();

  if (existing) {
    return { granted: false, alreadyGranted: true };
  }

  // Insert grant
  const { error } = await supabase.from('credits_ledger').insert({
    user_id: userId,
    type: 'grant',
    amount,
    stripe_event_id: idempotencyKey,
  });

  if (error) {
    throw error;
  }

  return { granted: true, alreadyGranted: false };
}

/**
 * Generate a referral code from a user ID.
 * Takes first 8 chars of UUID (no dashes), uppercased.
 */
export function generateReferralCode(userId: string): string {
  return userId.replace(/-/g, '').slice(0, 8).toUpperCase();
}

/**
 * Look up a referrer by their referral code.
 * The code is the first 8 hex chars of the user's UUID (no dashes, uppercased).
 * Since UUID format is xxxxxxxx-xxxx-..., the first 8 no-dash chars = first segment.
 * We can query with a LIKE on user_id.
 */
export async function lookupReferrerByCode(
  supabase: SupabaseClient,
  code: string
): Promise<string | null> {
  const prefix = code.toLowerCase();

  // First 8 no-dash chars of UUID = first 8 chars of UUID (the first segment before the dash)
  // UUID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  // So we match user_id LIKE 'xxxxxxxx-%'
  const { data, error } = await supabase
    .from('reports')
    .select('user_id')
    .like('user_id', `${prefix}-%`)
    .limit(1);

  if (error || !data || data.length === 0) {
    return null;
  }

  return data[0].user_id;
}
