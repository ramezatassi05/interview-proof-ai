/**
 * GET /api/auth/google/callback
 *
 * Phase A4 — Google OAuth callback. Validates state, exchanges code for
 * tokens, encrypts via the AES-GCM vault, and upserts into
 * user_linked_accounts. Service role required for the upsert (RLS allows
 * users only to read/delete; INSERT/UPDATE go through the service role).
 *
 * Approved use of createServiceClient — see src/lib/agent/audit.ts header.
 */
// Approved use of createServiceClient — see file header.
import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { encryptToken } from '@/lib/linked-accounts/crypto';
import {
  exchangeCodeForTokens,
  fetchUserEmail,
  GOOGLE_OAUTH_SCOPES,
  GoogleOAuthError,
  readGoogleOAuthEnv,
} from '@/lib/linked-accounts/google';

function redirectWith(error: string | null = null, success = false): NextResponse {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const url = new URL('/account', base || 'http://localhost:3000');
  if (error) url.searchParams.set('linked_error', error);
  if (success) url.searchParams.set('linked_ok', 'google');
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const env = readGoogleOAuthEnv();
  if (!env) {
    return redirectWith('oauth_not_configured');
  }

  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const errorParam = url.searchParams.get('error');

  if (errorParam) return redirectWith(`google_${errorParam}`);
  if (!code || !state) return redirectWith('missing_code_or_state');

  const cookieState = request.cookies.get('google_oauth_state')?.value;
  if (!cookieState || cookieState !== state) {
    return redirectWith('state_mismatch');
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return redirectWith('unauthorized');

  let tokens;
  try {
    tokens = await exchangeCodeForTokens(env, code);
  } catch (err) {
    console.error('[google-callback] exchange failed:', err);
    return redirectWith(err instanceof GoogleOAuthError ? 'token_exchange_failed' : 'unknown');
  }

  // Refuse if Google didn't grant the scopes we asked for.
  const grantedScopes = (tokens.scope ?? '').split(/\s+/);
  const requiredSends = GOOGLE_OAUTH_SCOPES.filter((s) => s.startsWith('https://'));
  const missing = requiredSends.filter((s) => !grantedScopes.includes(s));
  if (missing.length > 0) {
    return redirectWith('insufficient_scope');
  }

  const email = await fetchUserEmail(tokens.access_token);

  const accessTokenEnc = await encryptToken(tokens.access_token);
  const refreshTokenEnc = tokens.refresh_token
    ? await encryptToken(tokens.refresh_token)
    : null;

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  const service = await createServiceClient();
  const { error: upsertErr } = await service.from('user_linked_accounts').upsert(
    {
      user_id: user.id,
      provider: 'google',
      account_email: email,
      access_token_encrypted: accessTokenEnc,
      refresh_token_encrypted: refreshTokenEnc,
      scope: tokens.scope,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,provider' }
  );

  if (upsertErr) {
    console.error('[google-callback] upsert failed:', upsertErr);
    return redirectWith('store_failed');
  }

  const res = redirectWith(null, true);
  res.cookies.delete('google_oauth_state');
  return res;
}
