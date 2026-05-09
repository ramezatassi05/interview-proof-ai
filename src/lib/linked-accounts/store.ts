/**
 * Linked-account read/refresh helper for executors.
 *
 * Handles the refresh-token loop transparently: if the access token has
 * expired (or is within REFRESH_BUFFER_SECONDS of expiry), refresh it
 * against Google and persist the new access token + expiry.
 *
 * Service-role caller required (executors run from cron with service-role).
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { decryptToken, encryptToken } from './crypto';
import { GoogleOAuthError, readGoogleOAuthEnv, refreshAccessToken } from './google';

const REFRESH_BUFFER_SECONDS = 120;

interface LinkedAccountRow {
  id: string;
  user_id: string;
  provider: 'google';
  account_email: string | null;
  access_token_encrypted: string;
  refresh_token_encrypted: string | null;
  scope: string;
  expires_at: string | null;
}

export interface ResolvedLinkedAccount {
  provider: 'google';
  accountEmail: string | null;
  accessToken: string;
  scope: string;
  expiresAt: string | null;
}

export class LinkedAccountMissingError extends Error {
  constructor(provider: string) {
    super(`User has not connected ${provider}`);
    this.name = 'LinkedAccountMissingError';
  }
}

export async function getLiveAccessToken(
  supabase: SupabaseClient,
  userId: string,
  provider: 'google'
): Promise<ResolvedLinkedAccount> {
  const { data, error } = await supabase
    .from('user_linked_accounts')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', provider)
    .single();

  if (error || !data) {
    throw new LinkedAccountMissingError(provider);
  }

  const row = data as LinkedAccountRow;
  const accessToken = await decryptToken(row.access_token_encrypted);
  const expiresAtMs = row.expires_at ? new Date(row.expires_at).getTime() : 0;
  const nowMs = Date.now();
  const fresh = expiresAtMs - nowMs > REFRESH_BUFFER_SECONDS * 1000;

  if (fresh) {
    return {
      provider,
      accountEmail: row.account_email,
      accessToken,
      scope: row.scope,
      expiresAt: row.expires_at,
    };
  }

  if (!row.refresh_token_encrypted) {
    throw new GoogleOAuthError('Access token expired and no refresh token on file');
  }
  const refreshToken = await decryptToken(row.refresh_token_encrypted);
  const env = readGoogleOAuthEnv();
  if (!env) {
    throw new GoogleOAuthError('Google OAuth env not configured');
  }
  const refreshed = await refreshAccessToken(env, refreshToken);
  const newExpiry = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
  const newAccessEnc = await encryptToken(refreshed.access_token);

  await supabase
    .from('user_linked_accounts')
    .update({
      access_token_encrypted: newAccessEnc,
      expires_at: newExpiry,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('provider', provider);

  return {
    provider,
    accountEmail: row.account_email,
    accessToken: refreshed.access_token,
    scope: refreshed.scope ?? row.scope,
    expiresAt: newExpiry,
  };
}
