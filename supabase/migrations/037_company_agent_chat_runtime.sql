-- Migration 037: Claude Code-style chat runtime for the CEO Command Center.
-- Adds per-(user, agent_kind) memory, attachment metadata, and a tool_calls
-- ledger so every skill invocation made by a director agent is auditable
-- and can be rendered as a Claude Code-style tool-use card in the UI.

-- ---------------------------------------------------------------------------
-- company_agent_memory: durable per-agent facts learned during conversation.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS company_agent_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_kind TEXT NOT NULL CHECK (agent_kind IN (
    'ceo_orchestrator',
    'executive_assistant',
    'director_marketing',
    'director_finance',
    'director_engineering'
  )),
  key TEXT NOT NULL,
  value_json JSONB NOT NULL,
  source TEXT NOT NULL DEFAULT 'agent_remember' CHECK (source IN (
    'user',
    'agent_remember',
    'system'
  )),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, agent_kind, key)
);

CREATE INDEX IF NOT EXISTS idx_company_agent_memory_user_agent
  ON company_agent_memory (user_id, agent_kind, updated_at DESC);

CREATE OR REPLACE FUNCTION update_company_agent_memory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_company_agent_memory_updated_at ON company_agent_memory;
CREATE TRIGGER trg_company_agent_memory_updated_at
  BEFORE UPDATE ON company_agent_memory
  FOR EACH ROW
  EXECUTE FUNCTION update_company_agent_memory_updated_at();

ALTER TABLE company_agent_memory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own company_agent_memory" ON company_agent_memory;
CREATE POLICY "Users can read own company_agent_memory"
  ON company_agent_memory FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own company_agent_memory" ON company_agent_memory;
CREATE POLICY "Users can insert own company_agent_memory"
  ON company_agent_memory FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own company_agent_memory" ON company_agent_memory;
CREATE POLICY "Users can update own company_agent_memory"
  ON company_agent_memory FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own company_agent_memory" ON company_agent_memory;
CREATE POLICY "Users can delete own company_agent_memory"
  ON company_agent_memory FOR DELETE
  USING (auth.uid() = user_id);


-- ---------------------------------------------------------------------------
-- company_agent_attachments: PDFs, images, text attached to chat messages.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS company_agent_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NULL REFERENCES company_agent_sessions(id) ON DELETE CASCADE,
  message_id UUID NULL REFERENCES company_agent_messages(id) ON DELETE SET NULL,
  kind TEXT NOT NULL CHECK (kind IN ('pdf', 'image', 'text', 'file')),
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  byte_size INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  extracted_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_agent_attachments_session
  ON company_agent_attachments (session_id);
CREATE INDEX IF NOT EXISTS idx_company_agent_attachments_user
  ON company_agent_attachments (user_id, created_at DESC);

ALTER TABLE company_agent_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own company_agent_attachments" ON company_agent_attachments;
CREATE POLICY "Users can read own company_agent_attachments"
  ON company_agent_attachments FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own company_agent_attachments" ON company_agent_attachments;
CREATE POLICY "Users can insert own company_agent_attachments"
  ON company_agent_attachments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own company_agent_attachments" ON company_agent_attachments;
CREATE POLICY "Users can update own company_agent_attachments"
  ON company_agent_attachments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own company_agent_attachments" ON company_agent_attachments;
CREATE POLICY "Users can delete own company_agent_attachments"
  ON company_agent_attachments FOR DELETE
  USING (auth.uid() = user_id);


-- ---------------------------------------------------------------------------
-- company_agent_tool_calls: one row per skill invocation by a director agent.
-- Used to render Claude Code-style tool-use cards inline in the chat UI and
-- to audit/debug agent behavior over time.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS company_agent_tool_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES company_agent_sessions(id) ON DELETE CASCADE,
  message_id UUID NULL REFERENCES company_agent_messages(id) ON DELETE SET NULL,
  agent_kind TEXT NOT NULL CHECK (agent_kind IN (
    'ceo_orchestrator',
    'executive_assistant',
    'director_marketing',
    'director_finance',
    'director_engineering'
  )),
  skill_id TEXT NOT NULL,
  tool_use_id TEXT NOT NULL,
  input_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  output_json JSONB,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN (
    'running',
    'succeeded',
    'failed',
    'awaiting_approval'
  )),
  error TEXT,
  latency_ms INTEGER,
  linked_action_id UUID NULL REFERENCES company_agent_actions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_company_agent_tool_calls_session
  ON company_agent_tool_calls (session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_company_agent_tool_calls_kind_skill
  ON company_agent_tool_calls (agent_kind, skill_id);
CREATE INDEX IF NOT EXISTS idx_company_agent_tool_calls_tool_use_id
  ON company_agent_tool_calls (tool_use_id);

ALTER TABLE company_agent_tool_calls ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own company_agent_tool_calls" ON company_agent_tool_calls;
CREATE POLICY "Users can read own company_agent_tool_calls"
  ON company_agent_tool_calls FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own company_agent_tool_calls" ON company_agent_tool_calls;
CREATE POLICY "Users can insert own company_agent_tool_calls"
  ON company_agent_tool_calls FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own company_agent_tool_calls" ON company_agent_tool_calls;
CREATE POLICY "Users can update own company_agent_tool_calls"
  ON company_agent_tool_calls FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
