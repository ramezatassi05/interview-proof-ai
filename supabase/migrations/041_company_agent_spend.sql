-- Migration 041: Per-agent monthly spend ceilings (Part 8 of CEO Command Center vision).
-- Adds an optional USD cap per (user, agent_kind) and a pause marker that the
-- runner sets when the cap is hit. A monthly cron clears expired pauses on the
-- 1st of each month. Also adds model_id on messages so per-message cost is
-- attributable when an agent's model changes (the static lookup table in
-- src/server/agents/company/agent-models.ts is the fallback for legacy rows
-- where model_id is NULL).

ALTER TABLE company_agent_guardrails
  ADD COLUMN IF NOT EXISTS monthly_spend_cap_usd NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS spend_paused_until TIMESTAMPTZ;

COMMENT ON COLUMN company_agent_guardrails.monthly_spend_cap_usd IS
  'Optional monthly USD cap. NULL means no cap. When current month spend exceeds the cap the runner refuses new model calls until the next month.';
COMMENT ON COLUMN company_agent_guardrails.spend_paused_until IS
  'Set by the runner when the cap is hit. Cleared by the clear-spend-pause cron at 00:05 UTC on the 1st of each month.';

ALTER TABLE company_agent_messages
  ADD COLUMN IF NOT EXISTS model_id TEXT;

COMMENT ON COLUMN company_agent_messages.model_id IS
  'Anthropic model id that produced this assistant message (e.g. claude-sonnet-4-6). NULL for historical rows; spend computation falls back to the static per-agent map.';

-- Spend queries filter by agent_kind + created_at within the current month, scoped
-- to a user via a session_id join. The existing (session_id) and (created_at DESC)
-- indexes cover the common query path. A compound (agent_kind, created_at DESC)
-- index helps the spend SUM by avoiding a full scan when sessions span many agents.
CREATE INDEX IF NOT EXISTS idx_company_agent_messages_kind_created
  ON company_agent_messages(agent_kind, created_at DESC);
