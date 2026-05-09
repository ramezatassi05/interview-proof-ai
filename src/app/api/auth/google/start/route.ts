/**
 * GET /api/auth/google/start
 *
 * Phase A4 — kicks off Google OAuth. Generates a random `state`, stashes it
 * in an http-only cookie (CSRF guard), and 302s to Google's consent screen.
 *
 * Required env: GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET,
 * NEXT_PUBLIC_APP_URL. If any are missing, returns 503 with a clear
 * setup-needed message — surfaced by the /account UI.
 */
import { NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { createClient } from '@/lib/supabase/server';
import { buildAuthorizeUrl, readGoogleOAuthEnv } from '@/lib/linked-accounts/google';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const env = readGoogleOAuthEnv();
  if (!env) {
    return NextResponse.json(
      {
        error:
          'Google OAuth is not configured. Set GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, and NEXT_PUBLIC_APP_URL.',
        code: 'oauth_not_configured',
      },
      { status: 503 }
    );
  }

  const state = randomBytes(24).toString('base64url');
  const url = buildAuthorizeUrl(env, state);

  const res = NextResponse.redirect(url);
  res.cookies.set('google_oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 600, // 10 min
  });
  return res;
}
