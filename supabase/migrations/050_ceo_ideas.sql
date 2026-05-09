-- Migration 050: CEO Ideas Bridge
-- Adds the ingestion surface for ideas posted from the CEO's Claude Code CLI.
-- Strictly additive: existing autonomous flows (cron, agent, user-initiated) keep
-- working unchanged. We only widen two CHECK constraints to *accept additional*
-- triggered_by values, and create one new table for the raw inbound payloads.

-- ============================================================
-- 1. Widen triggered_by enum on company_agent_sessions and company_agent_actions
--    to allow 'ceo_cli' (Claude Code CLI) and 'ceo_chat' (future direct chat).
-- ============================================================
ALTER TABLE company_agent_sessions
  DROP CONSTRAINT IF EXISTS company_agent_sessions_triggered_by_check;
ALTER TABLE company_agent_sessions
  ADD CONSTRAINT company_agent_sessions_triggered_by_check
    CHECK (triggered_by IN ('user', 'cron', 'agent', 'ceo_cli', 'ceo_chat'));

ALTER TABLE company_agent_actions
  DROP CONSTRAINT IF EXISTS company_agent_actions_triggered_by_check;
ALTER TABLE company_agent_actions
  ADD CONSTRAINT company_agent_actions_triggered_by_check
    CHECK (triggered_by IN ('user', 'cron', 'agent', 'ceo_cli', 'ceo_chat'));

-- ============================================================
-- 2. ceo_ideas — raw text submissions from the CEO's external clients.
-- ============================================================
CREATE TABLE IF NOT EXISTS ceo_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('cli', 'chat')),
  raw_text TEXT NOT NULL CHECK (char_length(raw_text) BETWEEN 1 AND 8000),
  context_json JSONB,
  status TEXT NOT NULL DEFAULT 'triaging'
    CHECK (status IN ('triaging', 'routed', 'completed', 'failed')),
  triage_session_id UUID REFERENCES company_agent_sessions(id) ON DELETE SET NULL,
  spawned_action_ids UUID[] NOT NULL DEFAULT '{}'::UUID[],
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ceo_ideas_user_created
  ON ceo_ideas (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ceo_ideas_status
  ON ceo_ideas (status, created_at DESC);

-- updated_at trigger
CREATE OR REPLACE FUNCTION ceo_ideas_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ceo_ideas_updated_at ON ceo_ideas;
CREATE TRIGGER trg_ceo_ideas_updated_at
  BEFORE UPDATE ON ceo_ideas
  FOR EACH ROW
  EXECUTE FUNCTION ceo_ideas_set_updated_at();

-- ============================================================
-- RLS — owner reads only. Inserts/updates flow through the service-role
-- /api/ceo/idea route (gated by CEO_BRIDGE_SECRET) which bypasses RLS.
-- ============================================================
ALTER TABLE ceo_ideas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner reads own ideas" ON ceo_ideas;
CREATE POLICY "Owner reads own ideas"
  ON ceo_ideas FOR SELECT
  USING (auth.uid() = user_id);
