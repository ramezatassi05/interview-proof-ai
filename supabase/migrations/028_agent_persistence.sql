-- Migration 028: Agent Persistence Foundation
-- M2 of Agentic Platform initiative.
-- Creates tables for agent sessions, messages, actions, and per-user memory.
-- No agent logic, API routes, or UI live here yet — this migration only lays
-- the data foundation so later milestones can wire orchestration on top.

-- ============================================================
-- 1. agent_sessions
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_id UUID NULL REFERENCES reports(id) ON DELETE SET NULL,
  agent_kind TEXT NOT NULL CHECK (agent_kind IN (
    'orchestrator',
    'readiness_coach',
    'answer_feedback',
    'mock_interview',
    'prep_plan',
    'resume_evidence',
    'company_research',
    'recruiter_comm',
    'opportunity_tracker',
    'post_interview_debrief',
    'application_materials'
  )),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'completed')),
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_sessions_user_id ON agent_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_report_id ON agent_sessions(report_id);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_status ON agent_sessions(status);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_agent_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_agent_sessions_updated_at ON agent_sessions;
CREATE TRIGGER trg_agent_sessions_updated_at
  BEFORE UPDATE ON agent_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_sessions_updated_at();

-- RLS
ALTER TABLE agent_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own agent_sessions" ON agent_sessions;
CREATE POLICY "Users can read own agent_sessions"
  ON agent_sessions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own agent_sessions" ON agent_sessions;
CREATE POLICY "Users can insert own agent_sessions"
  ON agent_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own agent_sessions" ON agent_sessions;
CREATE POLICY "Users can update own agent_sessions"
  ON agent_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own agent_sessions" ON agent_sessions;
CREATE POLICY "Users can delete own agent_sessions"
  ON agent_sessions FOR DELETE
  USING (auth.uid() = user_id);


-- ============================================================
-- 2. agent_messages
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES agent_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'agent', 'system', 'tool')),
  content_json JSONB NOT NULL,
  tokens_in INTEGER,
  tokens_out INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_messages_session_id ON agent_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_agent_messages_created_at ON agent_messages(created_at);

-- RLS — nested EXISTS via parent session
ALTER TABLE agent_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read messages for own sessions" ON agent_messages;
CREATE POLICY "Users can read messages for own sessions"
  ON agent_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM agent_sessions s
    WHERE s.id = agent_messages.session_id AND s.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can insert messages for own sessions" ON agent_messages;
CREATE POLICY "Users can insert messages for own sessions"
  ON agent_messages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM agent_sessions s
    WHERE s.id = agent_messages.session_id AND s.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can update messages for own sessions" ON agent_messages;
CREATE POLICY "Users can update messages for own sessions"
  ON agent_messages FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM agent_sessions s
    WHERE s.id = agent_messages.session_id AND s.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM agent_sessions s
    WHERE s.id = agent_messages.session_id AND s.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can delete messages for own sessions" ON agent_messages;
CREATE POLICY "Users can delete messages for own sessions"
  ON agent_messages FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM agent_sessions s
    WHERE s.id = agent_messages.session_id AND s.user_id = auth.uid()
  ));


-- ============================================================
-- 3. agent_actions
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NULL REFERENCES agent_sessions(id) ON DELETE SET NULL,
  report_id UUID NULL REFERENCES reports(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'recommend_drill',
    'start_mock_interview',
    'score_answer',
    'draft_recruiter_reply',
    'rewrite_resume_bullet',
    'create_company_brief',
    'update_prep_plan',
    'propose_opportunity_update',
    'summarize_progress'
  )),
  payload_json JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'drafted' CHECK (status IN (
    'drafted',
    'awaiting_approval',
    'approved',
    'rejected',
    'completed',
    'failed'
  )),
  result_json JSONB,
  evidence_refs_json JSONB,
  requires_external_send BOOLEAN NOT NULL DEFAULT FALSE,
  approved_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_actions_user_id ON agent_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_actions_session_id ON agent_actions(session_id);
CREATE INDEX IF NOT EXISTS idx_agent_actions_status ON agent_actions(status);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_agent_actions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_agent_actions_updated_at ON agent_actions;
CREATE TRIGGER trg_agent_actions_updated_at
  BEFORE UPDATE ON agent_actions
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_actions_updated_at();

-- RLS
ALTER TABLE agent_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own agent_actions" ON agent_actions;
CREATE POLICY "Users can read own agent_actions"
  ON agent_actions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own agent_actions" ON agent_actions;
CREATE POLICY "Users can insert own agent_actions"
  ON agent_actions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own agent_actions" ON agent_actions;
CREATE POLICY "Users can update own agent_actions"
  ON agent_actions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own agent_actions" ON agent_actions;
CREATE POLICY "Users can delete own agent_actions"
  ON agent_actions FOR DELETE
  USING (auth.uid() = user_id);


-- ============================================================
-- 4. user_memory
-- ============================================================
CREATE TABLE IF NOT EXISTS user_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('weakness', 'preference', 'interview_date', 'goal', 'custom')),
  key TEXT NOT NULL,
  value_json JSONB NOT NULL,
  source_action_id UUID NULL REFERENCES agent_actions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, kind, key)
);

CREATE INDEX IF NOT EXISTS idx_user_memory_user_id ON user_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memory_kind ON user_memory(kind);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_user_memory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_memory_updated_at ON user_memory;
CREATE TRIGGER trg_user_memory_updated_at
  BEFORE UPDATE ON user_memory
  FOR EACH ROW
  EXECUTE FUNCTION update_user_memory_updated_at();

-- RLS
ALTER TABLE user_memory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own user_memory" ON user_memory;
CREATE POLICY "Users can read own user_memory"
  ON user_memory FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own user_memory" ON user_memory;
CREATE POLICY "Users can insert own user_memory"
  ON user_memory FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own user_memory" ON user_memory;
CREATE POLICY "Users can update own user_memory"
  ON user_memory FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own user_memory" ON user_memory;
CREATE POLICY "Users can delete own user_memory"
  ON user_memory FOR DELETE
  USING (auth.uid() = user_id);
