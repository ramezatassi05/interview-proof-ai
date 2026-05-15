# Google OAuth — Production Wiring (Phase D1)

Until these three Vercel env vars are populated, the `draft_recruiter_reply`
executor falls back to **`manual_copy`** mode (action moves to `completed`
with a result blob the user copies into Gmail themselves) — no real send.

## Required Vercel env (production + preview)

| Key | Value | Notes |
|---|---|---|
| `GOOGLE_OAUTH_CLIENT_ID` | `...apps.googleusercontent.com` | OAuth 2.0 Web Client ID |
| `GOOGLE_OAUTH_CLIENT_SECRET` | `GOCSPX-...` | OAuth 2.0 Web Client secret |
| `LINKED_ACCOUNT_KEY` | 32-byte base64 | AES-GCM key for token vault. Generate once with `openssl rand -base64 32` — **never rotate without re-linking every connected account** |
| `NEXT_PUBLIC_APP_URL` | `https://<prod-domain>` | Used by `/api/auth/google/start` to build the absolute redirect URI |

## Google Cloud Console steps

1. https://console.cloud.google.com/apis/credentials → **+ CREATE CREDENTIALS → OAuth client ID**.
2. Application type: **Web application**.
3. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/google/callback` (local dev)
   - `https://<preview-domain>/api/auth/google/callback` (Vercel preview, optional)
   - `https://<prod-domain>/api/auth/google/callback` (production)
4. Scopes (request at consent screen): `gmail.send`, `calendar.events`.
5. Copy `client_id` + `client_secret` → push to Vercel via
   `vercel env add GOOGLE_OAUTH_CLIENT_ID production` (and `preview`),
   ditto for the secret.

## Local development

`.env.local` already contains a fresh `LINKED_ACCOUNT_KEY`. Uncomment and fill
`GOOGLE_OAUTH_CLIENT_ID` / `GOOGLE_OAUTH_CLIENT_SECRET` / `NEXT_PUBLIC_APP_URL`
when you want to test the `/api/auth/google/start` flow end-to-end.

## Verifying

After env is set, visit `/account` → "Connected accounts" panel → click
**Connect Google**. A successful round-trip lands you back on `/account` with
`google` listed and `scopes` including `gmail.send`. Drafted recruiter replies
will then send via Gmail when approved.
