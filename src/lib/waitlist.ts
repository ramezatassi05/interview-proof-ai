import crypto from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { WaitlistTier } from '@/types';

/**
 * Generate a 6-character alphanumeric referral code.
 */
export function generateReferralCode(): string {
  return crypto.randomBytes(4).toString('base64url').slice(0, 6).toUpperCase();
}

/**
 * Check if an IP address is rate-limited (>= 3 attempts in the last hour).
 */
export async function isRateLimited(supabase: SupabaseClient, ip: string): Promise<boolean> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error } = await supabase
    .from('waitlist_rate_limits')
    .select('*', { count: 'exact', head: true })
    .eq('ip_address', ip)
    .gte('attempt_at', oneHourAgo);

  if (error) {
    console.error('Rate limit check error:', error);
    return false; // fail open
  }

  return (count ?? 0) >= 3;
}

/**
 * Record a rate limit attempt for an IP address.
 */
export async function recordRateLimitAttempt(
  supabase: SupabaseClient,
  ip: string
): Promise<void> {
  const { error } = await supabase
    .from('waitlist_rate_limits')
    .insert({ ip_address: ip });

  if (error) {
    console.error('Rate limit record error:', error);
  }
}

/**
 * Common disposable email domains to block.
 */
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'guerrillamail.com',
  'tempmail.com',
  'throwaway.email',
  'yopmail.com',
  'sharklasers.com',
  'guerrillamailblock.com',
  'grr.la',
  'dispostable.com',
  'trashmail.com',
  'temp-mail.org',
  'fakeinbox.com',
]);

/**
 * Check if an email uses a disposable/temporary domain.
 */
export function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  return DISPOSABLE_DOMAINS.has(domain);
}

/**
 * Determine the waitlist tier based on position.
 */
export function getWaitlistTier(position: number | null): WaitlistTier {
  if (position == null) return 'standard';
  if (position <= 100) return 'top100';
  if (position <= 500) return 'top500';
  return 'standard';
}

/**
 * Get the tier display label.
 */
export function getTierLabel(tier: WaitlistTier): string {
  switch (tier) {
    case 'top100':
      return 'Top 100 — Lifetime 30% Discount';
    case 'top500':
      return 'Top 500 — 10 Bonus Credits at Launch';
    default:
      return '';
  }
}
