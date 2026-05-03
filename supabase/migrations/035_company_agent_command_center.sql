-- Migration 035: Internal Company Agent Command Center
-- Adds CEO/admin-only persistence for InterviewProof's internal agentic company.
-- App-layer admin checks gate access; RLS keeps rows user-owned.

CREATE TABLE IF NOT EXISTS company_agent_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_kind TEXT NOT NULL CHECK (agent_kind IN (
    'ceo_orchestrator',
    'executive_assistant',
    'director_marketing',
    'director_finance',
    'director_engineering'
  )),
  title TEXT NOT NULL DEFAULT 'CEO Command Session',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'completed')),
  last_message_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_agent_sessions_user_id
  ON company_agent_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_company_agent_sessions_status
  ON company_agent_sessions(status);
CREATE INDEX IF NOT EXISTS idx_company_agent_sessions_last_message_at
  ON company_agent_sessions(last_message_at DESC NULLS LAST);

CREATE OR REPLACE FUNCTION update_company_agent_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_company_agent_sessions_updated_at ON company_agent_sessions;
CREATE TRIGGER trg_company_agent_sessions_updated_at
  BEFORE UPDATE ON company_agent_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_company_agent_sessions_updated_at();

ALTER TABLE company_agent_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own company_agent_sessions" ON company_agent_sessions;
CREATE POLICY "Users can read own company_agent_sessions"
  ON company_agent_sessions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own company_agent_sessions" ON company_agent_sessions;
CREATE POLICY "Users can insert own company_agent_sessions"
  ON company_agent_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own company_agent_sessions" ON company_agent_sessions;
CREATE POLICY "Users can update own company_agent_sessions"
  ON company_agent_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


CREATE TABLE IF NOT EXISTS company_agent_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES company_agent_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'agent', 'system', 'tool')),
  agent_kind TEXT NOT NULL CHECK (agent_kind IN (
    'ceo_orchestrator',
    'executive_assistant',
    'director_marketing',
    'director_finance',
    'director_engineering'
  )),
  content_json JSONB NOT NULL,
  tokens_in INTEGER,
  tokens_out INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_agent_messages_session_id
  ON company_agent_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_company_agent_messages_created_at
  ON company_agent_messages(created_at DESC);

ALTER TABLE company_agent_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read messages for own company sessions" ON company_agent_messages;
CREATE POLICY "Users can read messages for own company sessions"
  ON company_agent_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM company_agent_sessions s
    WHERE s.id = company_agent_messages.session_id
      AND s.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can insert messages for own company sessions" ON company_agent_messages;
CREATE POLICY "Users can insert messages for own company sessions"
  ON company_agent_messages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM company_agent_sessions s
    WHERE s.id = company_agent_messages.session_id
      AND s.user_id = auth.uid()
  ));


CREATE TABLE IF NOT EXISTS company_agent_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NULL REFERENCES company_agent_sessions(id) ON DELETE SET NULL,
  agent_kind TEXT NOT NULL CHECK (agent_kind IN (
    'ceo_orchestrator',
    'executive_assistant',
    'director_marketing',
    'director_finance',
    'director_engineering'
  )),
  action_type TEXT NOT NULL CHECK (action_type IN (
    'draft_brief',
    'draft_marketing_asset',
    'draft_finance_memo',
    'draft_engineering_spec',
    'create_task',
    'record_decision',
    'request_approval',
    'summarize_metrics'
  )),
  title TEXT NOT NULL,
  rationale TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'drafted' CHECK (status IN (
    'drafted',
    'awaiting_approval',
    'approved',
    'rejected',
    'completed',
    'failed'
  )),
  result_json JSONB,
  evidence_refs_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  requires_approval BOOLEAN NOT NULL DEFAULT TRUE,
  approved_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_agent_actions_user_id
  ON company_agent_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_company_agent_actions_session_id
  ON company_agent_actions(session_id);
CREATE INDEX IF NOT EXISTS idx_company_agent_actions_status
  ON company_agent_actions(status);
CREATE INDEX IF NOT EXISTS idx_company_agent_actions_agent_kind
  ON company_agent_actions(agent_kind);

CREATE OR REPLACE FUNCTION update_company_agent_actions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_company_agent_actions_updated_at ON company_agent_actions;
CREATE TRIGGER trg_company_agent_actions_updated_at
  BEFORE UPDATE ON company_agent_actions
  FOR EACH ROW
  EXECUTE FUNCTION update_company_agent_actions_updated_at();

ALTER TABLE company_agent_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own company_agent_actions" ON company_agent_actions;
CREATE POLICY "Users can read own company_agent_actions"
  ON company_agent_actions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own company_agent_actions" ON company_agent_actions;
CREATE POLICY "Users can insert own company_agent_actions"
  ON company_agent_actions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own company_agent_actions" ON company_agent_actions;
CREATE POLICY "Users can update own company_agent_actions"
  ON company_agent_actions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


CREATE TABLE IF NOT EXISTS company_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_action_id UUID NULL REFERENCES company_agent_actions(id) ON DELETE SET NULL,
  owner_kind TEXT NOT NULL CHECK (owner_kind IN (
    'executive_assistant',
    'director_marketing',
    'director_finance',
    'director_engineering'
  )),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'doing', 'blocked', 'done', 'canceled')),
  due_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_tasks_user_id ON company_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_company_tasks_status ON company_tasks(status);

ALTER TABLE company_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own company_tasks" ON company_tasks;
CREATE POLICY "Users can manage own company_tasks"
  ON company_tasks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


CREATE TABLE IF NOT EXISTS company_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_action_id UUID NULL REFERENCES company_agent_actions(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  decision_text TEXT NOT NULL,
  rationale TEXT,
  decided_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_decisions_user_id ON company_decisions(user_id);
CREATE INDEX IF NOT EXISTS idx_company_decisions_decided_at ON company_decisions(decided_at DESC);

ALTER TABLE company_decisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own company_decisions" ON company_decisions;
CREATE POLICY "Users can manage own company_decisions"
  ON company_decisions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


CREATE TABLE IF NOT EXISTS company_metrics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metrics_json JSONB NOT NULL,
  source TEXT NOT NULL DEFAULT 'internal',
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_metrics_snapshots_user_id
  ON company_metrics_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_company_metrics_snapshots_captured_at
  ON company_metrics_snapshots(captured_at DESC);

ALTER TABLE company_metrics_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own company_metrics_snapshots" ON company_metrics_snapshots;
CREATE POLICY "Users can manage own company_metrics_snapshots"
  ON company_metrics_snapshots FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


CREATE TABLE IF NOT EXISTS company_weekly_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  content_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

CREATE INDEX IF NOT EXISTS idx_company_weekly_briefs_user_id
  ON company_weekly_briefs(user_id);
CREATE INDEX IF NOT EXISTS idx_company_weekly_briefs_week_start
  ON company_weekly_briefs(week_start DESC);

ALTER TABLE company_weekly_briefs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own company_weekly_briefs" ON company_weekly_briefs;
CREATE POLICY "Users can manage own company_weekly_briefs"
  ON company_weekly_briefs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
