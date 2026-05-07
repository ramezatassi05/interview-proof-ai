-- Migration 040: Per-agent guardrail tier configuration (Part 3 of CEO Command Center vision)
-- Stores the operator's chosen autonomy tier for each agent kind.
-- Default behavior is "manual" — every action awaits approval.
-- "guarded" auto-executes low-risk drafts at low/medium priority.
-- "autonomous" auto-executes all low-risk drafts. High-risk action types
-- (create_task, request_approval) always require approval regardless of tier.

CREATE TABLE IF NOT EXISTS company_agent_guardrails (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_kind TEXT NOT NULL CHECK (agent_kind IN (
    'ceo_orchestrator',
    'executive_assistant',
    'director_marketing',
    'director_finance',
    'director_engineering'
  )),
  tier TEXT NOT NULL DEFAULT 'manual' CHECK (tier IN ('manual', 'guarded', 'autonomous')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, agent_kind)
);

CREATE INDEX IF NOT EXISTS idx_company_agent_guardrails_user_id
  ON company_agent_guardrails(user_id);

CREATE OR REPLACE FUNCTION update_company_agent_guardrails_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_company_agent_guardrails_updated_at ON company_agent_guardrails;
CREATE TRIGGER trg_company_agent_guardrails_updated_at
  BEFORE UPDATE ON company_agent_guardrails
  FOR EACH ROW
  EXECUTE FUNCTION update_company_agent_guardrails_updated_at();

ALTER TABLE company_agent_guardrails ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own company_agent_guardrails" ON company_agent_guardrails;
CREATE POLICY "Users can read own company_agent_guardrails"
  ON company_agent_guardrails FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own company_agent_guardrails" ON company_agent_guardrails;
CREATE POLICY "Users can insert own company_agent_guardrails"
  ON company_agent_guardrails FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own company_agent_guardrails" ON company_agent_guardrails;
CREATE POLICY "Users can update own company_agent_guardrails"
  ON company_agent_guardrails FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own company_agent_guardrails" ON company_agent_guardrails;
CREATE POLICY "Users can delete own company_agent_guardrails"
  ON company_agent_guardrails FOR DELETE
  USING (auth.uid() = user_id);
