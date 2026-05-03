-- Migration 036: Add triggered_by to company agent sessions and actions.
-- Distinguishes user-initiated work from autonomous (cron) and agent-initiated work.

ALTER TABLE company_agent_sessions
  ADD COLUMN IF NOT EXISTS triggered_by TEXT NOT NULL DEFAULT 'user'
    CHECK (triggered_by IN ('user', 'cron', 'agent'));

ALTER TABLE company_agent_actions
  ADD COLUMN IF NOT EXISTS triggered_by TEXT NOT NULL DEFAULT 'user'
    CHECK (triggered_by IN ('user', 'cron', 'agent'));

CREATE INDEX IF NOT EXISTS idx_company_agent_actions_kind_triggered
  ON company_agent_actions (agent_kind, triggered_by, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_company_agent_sessions_kind_triggered
  ON company_agent_sessions (agent_kind, triggered_by, last_message_at DESC NULLS LAST);
