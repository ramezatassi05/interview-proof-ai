-- 018: Security hardening
-- 1. Referral codes table (replaces O(n) user scan with indexed lookup)
-- 2. Atomic credit spending function (prevents race condition double-spend)

-- ============================================================
-- 1. Referral codes table
-- ============================================================
CREATE TABLE IF NOT EXISTS referral_codes (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes (code);

ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;

-- Users can only read their own referral code
CREATE POLICY "Users can view own referral code"
  ON referral_codes FOR SELECT
  USING (auth.uid() = user_id);

-- Service role handles inserts (bypasses RLS)

-- ============================================================
-- 2. Atomic credit spending function
-- ============================================================
CREATE OR REPLACE FUNCTION spend_credits_atomic(
  p_user_id UUID,
  p_amount INT,
  p_report_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_balance INT;
  v_ledger_id UUID;
BEGIN
  -- Lock the user's ledger rows to prevent concurrent spending
  PERFORM 1 FROM credits_ledger WHERE user_id = p_user_id FOR UPDATE;

  SELECT COALESCE(SUM(amount), 0) INTO current_balance
  FROM credits_ledger WHERE user_id = p_user_id;

  IF current_balance < p_amount THEN
    RETURN FALSE;
  END IF;

  INSERT INTO credits_ledger (user_id, type, amount)
  VALUES (p_user_id, 'spend', -p_amount)
  RETURNING id INTO v_ledger_id;

  UPDATE reports
  SET paid_unlocked = true, credit_spend_ledger_id = v_ledger_id
  WHERE id = p_report_id AND user_id = p_user_id;

  RETURN TRUE;
END;
$$;

-- ============================================================
-- 3. Ensure unique constraint on stripe_event_id for idempotency
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'credits_ledger_stripe_event_id_unique'
  ) THEN
    -- Only add if there are no duplicates
    IF (SELECT COUNT(*) FROM (
      SELECT stripe_event_id FROM credits_ledger
      WHERE stripe_event_id IS NOT NULL
      GROUP BY stripe_event_id HAVING COUNT(*) > 1
    ) dupes) = 0 THEN
      ALTER TABLE credits_ledger
        ADD CONSTRAINT credits_ledger_stripe_event_id_unique
        UNIQUE (stripe_event_id);
    END IF;
  END IF;
END $$;
