/**
 * Google OAuth helpers — minimal REST wrapper, no SDK dependency.
 *
 * Scopes requested:
 *   - openid email             (so we can identify the connected account)
 *   - https://www.googleapis.com/auth/gmail.send
 *   - https://www.googleapis.com/auth/calendar.events
 *
 * Refresh-token loop: googleExchangeRefreshToken() should be called when an
 * access token has expired (compare expires_at against now()).
 */
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const AUTHORIZE_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const USERINFO_ENDPOINT = 'https://openidconnect.googleapis.com/v1/userinfo';

export const GOOGLE_OAUTH_SCOPES = [
  'openid',
  'email',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/calendar.events',
] as const;

export class GoogleOAuthError extends Error {
  readonly status?: number;
  constructor(message: string, opts?: { status?: number; cause?: unknown }) {
    super(message);
    this.name = 'GoogleOAuthError';
    this.status = opts?.status;
  }
}

export interface GoogleOAuthEnv {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export function readGoogleOAuthEnv(): GoogleOAuthEnv | null {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!clientId || !clientSecret || !appUrl) return null;
  return {
    clientId,
    clientSecret,
    redirectUri: `${appUrl.replace(/\/$/, '')}/api/auth/google/callback`,
  };
}

export function buildAuthorizeUrl(env: GoogleOAuthEnv, state: string): string {
  const params = new URLSearchParams({
    client_id: env.clientId,
    redirect_uri: env.redirectUri,
    response_type: 'code',
    scope: GOOGLE_OAUTH_SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state,
  });
  return `${AUTHORIZE_ENDPOINT}?${params.toString()}`;
}

export interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number; // seconds
  scope: string;
  token_type: 'Bearer';
  id_token?: string;
}

export async function exchangeCodeForTokens(
  env: GoogleOAuthEnv,
  code: string
): Promise<GoogleTokenResponse> {
  const body = new URLSearchParams({
    code,
    client_id: env.clientId,
    client_secret: env.clientSecret,
    redirect_uri: env.redirectUri,
    grant_type: 'authorization_code',
  });
  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new GoogleOAuthError(`Token exchange failed: ${text}`, { status: res.status });
  }
  return (await res.json()) as GoogleTokenResponse;
}

export async function refreshAccessToken(
  env: GoogleOAuthEnv,
  refreshToken: string
): Promise<GoogleTokenResponse> {
  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: env.clientId,
    client_secret: env.clientSecret,
    grant_type: 'refresh_token',
  });
  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new GoogleOAuthError(`Token refresh failed: ${text}`, { status: res.status });
  }
  return (await res.json()) as GoogleTokenResponse;
}

export async function fetchUserEmail(accessToken: string): Promise<string | null> {
  const res = await fetch(USERINFO_ENDPOINT, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { email?: string };
  return json.email ?? null;
}
