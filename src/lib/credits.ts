import crypto from 'crypto';
import { SupabaseClient } from '@supabase/supabase-js';

export const GRANT_AMOUNTS = {
  UPLOAD_BONUS: 1,
  FIRST_UNLOCK_BONUS: 2,
  REFERRAL_BONUS: 3,
  WELCOME_BONUS: 15,
} as const;

export type GrantReason = 'upload' | 'first_unlock' | 'referral' | 'welcome';

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

function getReferralSecret(): string {
  const secret = process.env.REFERRAL_HMAC_SECRET;
  if (!secret) {
    throw new Error('REFERRAL_HMAC_SECRET environment variable is not set');
  }
  return secret;
}

/**
 * Generate an opaque referral code from a user ID using HMAC.
 * Not reversible — cannot derive the user ID from the code.
 */
export function generateReferralCode(userId: string): string {
  return crypto.createHmac('sha256', getReferralSecret()).update(userId).digest('hex').slice(0, 8).toUpperCase();
}

/**
 * Ensure a user's referral code exists in the referral_codes table.
 * Called when fetching a user's referral code (lazy creation).
 */
export async function ensureReferralCode(supabase: SupabaseClient, userId: string): Promise<string> {
  const code = generateReferralCode(userId);

  // Upsert: insert if not exists, ignore conflicts
  await supabase
    .from('referral_codes')
    .upsert({ user_id: userId, code }, { onConflict: 'user_id' });

  return code;
}

/**
 * Look up a referrer by their referral code via indexed table query.
 */
export async function lookupReferrerByCode(
  supabase: SupabaseClient,
  code: string
): Promise<string | null> {
  if (!/^[A-Z0-9]{8}$/i.test(code)) {
    return null;
  }

  const normalizedCode = code.toUpperCase();

  const { data, error } = await supabase
    .from('referral_codes')
    .select('user_id')
    .eq('code', normalizedCode)
    .single();

  if (error || !data) {
    return null;
  }

  return data.user_id;
}
