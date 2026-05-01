-- Migration 033: Agent Audit Events
-- M9 of Agentic Platform initiative.
-- Append-only audit trail of agent activity (action transitions, session
-- lifecycle, agent LLM calls, rate-limit hits). Users can read their own
-- audit rows; only the service role inserts (no INSERT policy here, so the
-- table is effectively immutable for normal users).

-- ============================================================
-- agent_audit_events
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_id UUID REFERENCES agent_actions(id) ON DELETE SET NULL,
  session_id UUID REFERENCES agent_sessions(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'action_drafted',
    'action_awaiting_approval',
    'action_approved',
    'action_rejected',
    'action_completed',
    'action_failed',
    'session_created',
    'session_archived',
    'rate_limited',
    'agent_call_started',
    'agent_call_completed',
    'agent_call_failed'
  )),
  agent_kind TEXT,
  metadata_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_audit_events_user_created
  ON agent_audit_events (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_audit_events_action
  ON agent_audit_events (action_id) WHERE action_id IS NOT NULL;

-- ============================================================
-- RLS — read-own only. INSERTs go through the service role
-- (createServiceClient) which bypasses RLS. There is intentionally no
-- INSERT/UPDATE/DELETE policy: audit rows are append-only and are not
-- writable by clients under any circumstances.
-- ============================================================
ALTER TABLE agent_audit_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own audit events" ON agent_audit_events;
CREATE POLICY "Users can read own audit events"
  ON agent_audit_events FOR SELECT
  USING (auth.uid() = user_id);
