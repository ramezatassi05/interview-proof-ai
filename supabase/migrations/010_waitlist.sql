-- 010: Waitlist system
-- Adds waitlist table, rate limiting, and helper functions

-- Waitlist entries
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'launched')),
  confirmation_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  confirmed_at TIMESTAMPTZ,
  referral_code TEXT NOT NULL UNIQUE,
  referred_by TEXT,  -- referral_code of the person who referred this entry
  referral_count INT NOT NULL DEFAULT 0,
  position INT,  -- assigned on confirmation
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Rate limiting table for IP-based throttling
CREATE TABLE IF NOT EXISTS waitlist_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL,
  attempt_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for rate limit lookups
CREATE INDEX IF NOT EXISTS idx_waitlist_rate_limits_ip_time
  ON waitlist_rate_limits (ip_address, attempt_at);

-- Index for referral code lookups
CREATE INDEX IF NOT EXISTS idx_waitlist_referral_code
  ON waitlist (referral_code);

-- Index for confirmation token lookups
CREATE INDEX IF NOT EXISTS idx_waitlist_confirmation_token
  ON waitlist (confirmation_token);

-- Get the next available waitlist position
CREATE OR REPLACE FUNCTION get_next_waitlist_position()
RETURNS INT
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(MAX(position), 0) + 1 FROM waitlist WHERE status = 'confirmed';
$$;

-- Get total confirmed waitlist count
CREATE OR REPLACE FUNCTION get_waitlist_count()
RETURNS INT
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(*)::INT FROM waitlist WHERE status = 'confirmed';
$$;

-- Increment referral count for a given referral code
CREATE OR REPLACE FUNCTION increment_referral_count(code TEXT)
RETURNS VOID
LANGUAGE sql
AS $$
  UPDATE waitlist SET referral_count = referral_count + 1 WHERE referral_code = code;
$$;

-- Enable RLS with NO public policies (all access via service role)
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist_rate_limits ENABLE ROW LEVEL SECURITY;

-- Clean up old rate limit entries (older than 2 hours) — can be called periodically
CREATE OR REPLACE FUNCTION cleanup_waitlist_rate_limits()
RETURNS VOID
LANGUAGE sql
AS $$
  DELETE FROM waitlist_rate_limits WHERE attempt_at < now() - INTERVAL '2 hours';
$$;
