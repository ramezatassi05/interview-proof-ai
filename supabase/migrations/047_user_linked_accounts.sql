-- Migration 047: User Linked Accounts (Google OAuth tokens)
-- Phase A4 of the customer-agentic Phase A foundations (deferred until Phase D).
-- Stores AES-GCM-encrypted access + refresh tokens for the user's connected
-- third-party accounts. RLS lets users read/delete their own; INSERT is
-- service-role only (the OAuth callback route uses createServiceClient to
-- write the encrypted tokens).
--
-- Encryption envelope (server-side only — see src/lib/linked-accounts/crypto.ts):
--   stored value = base64(iv || ciphertext || authTag)
--   key          = LINKED_ACCOUNT_KEY env var, 32 bytes (base64)

CREATE TABLE IF NOT EXISTS user_linked_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google')),
  account_email TEXT,
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT,
  scope TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_user_linked_accounts_user
  ON user_linked_accounts (user_id);

-- ============================================================
-- RLS — read & delete own; INSERT/UPDATE service-role only.
-- ============================================================
ALTER TABLE user_linked_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own linked accounts" ON user_linked_accounts;
CREATE POLICY "Users can read own linked accounts"
  ON user_linked_accounts FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can disconnect own linked accounts" ON user_linked_accounts;
CREATE POLICY "Users can disconnect own linked accounts"
  ON user_linked_accounts FOR DELETE
  USING (auth.uid() = user_id);
