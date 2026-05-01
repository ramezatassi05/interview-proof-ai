-- Migration 031: Opportunity Pipeline
-- M2 of Agentic Platform initiative.
-- Tracks job opportunities (companies, roles, stages) so the
-- opportunity_tracker agent can persist pipeline state and reason about
-- prep plans in context of an upcoming interview.

-- ============================================================
-- 1. opportunities
-- ============================================================
CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  role_title TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'applied' CHECK (stage IN (
    'applied',
    'recruiter_screen',
    'phone_screen',
    'onsite',
    'offer',
    'rejected',
    'withdrawn'
  )),
  interview_date TIMESTAMPTZ,
  notes TEXT,
  archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_opportunities_user_id ON opportunities(user_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_stage ON opportunities(stage);
CREATE INDEX IF NOT EXISTS idx_opportunities_archived ON opportunities(archived);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_opportunities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_opportunities_updated_at ON opportunities;
CREATE TRIGGER trg_opportunities_updated_at
  BEFORE UPDATE ON opportunities
  FOR EACH ROW
  EXECUTE FUNCTION update_opportunities_updated_at();

-- RLS
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own opportunities" ON opportunities;
CREATE POLICY "Users can read own opportunities"
  ON opportunities FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own opportunities" ON opportunities;
CREATE POLICY "Users can insert own opportunities"
  ON opportunities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own opportunities" ON opportunities;
CREATE POLICY "Users can update own opportunities"
  ON opportunities FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own opportunities" ON opportunities;
CREATE POLICY "Users can delete own opportunities"
  ON opportunities FOR DELETE
  USING (auth.uid() = user_id);


-- ============================================================
-- 2. Deferred FK from prep_plans.opportunity_id (declared in 030
--    without a constraint because opportunities did not yet exist).
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'prep_plans_opportunity_id_fkey'
  ) THEN
    ALTER TABLE prep_plans
      ADD CONSTRAINT prep_plans_opportunity_id_fkey
      FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE SET NULL;
  END IF;
END $$;
