import crypto from 'crypto';
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

const REFERRAL_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || 'referral-key-fallback';

/**
 * Generate an opaque referral code from a user ID using HMAC.
 * Not reversible — cannot derive the user ID from the code.
 */
export function generateReferralCode(userId: string): string {
  return crypto.createHmac('sha256', REFERRAL_SECRET).update(userId).digest('hex').slice(0, 8).toUpperCase();
}

/**
 * Look up a referrer by their referral code.
 * Iterates distinct user_ids and checks the HMAC-derived code for each.
 */
export async function lookupReferrerByCode(
  supabase: SupabaseClient,
  code: string
): Promise<string | null> {
  if (!/^[A-Z0-9]{8}$/i.test(code)) {
    return null;
  }

  const { data, error } = await supabase.from('reports').select('user_id');

  if (error || !data || data.length === 0) {
    return null;
  }

  const uniqueUserIds = [...new Set(data.map((row) => row.user_id))];
  const normalizedCode = code.toUpperCase();

  for (const userId of uniqueUserIds) {
    if (generateReferralCode(userId) === normalizedCode) {
      return userId;
    }
  }

  return null;
}
