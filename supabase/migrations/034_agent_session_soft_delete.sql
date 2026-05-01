-- Migration 034: Agent Sessions Soft Delete
-- M9 of Agentic Platform initiative.
-- Adds `archived_at` to agent_sessions so DELETE acts as a soft archive
-- (preserves messages and audit trail). The list endpoint filters by
-- `archived_at IS NULL` by default; an explicit `?archived=true` flag
-- surfaces archived sessions for restoration / debugging.

ALTER TABLE agent_sessions
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_agent_sessions_archived_at
  ON agent_sessions(archived_at);
