-- Migration 042: Memory topics (Part 9 of CEO Command Center vision).
-- Replaces the flat key-value memory with a topically organized structure
-- that mirrors the MEMORY.md + sub-file pattern. Existing rows default to
-- topic='general' so nothing has to be backfilled.

ALTER TABLE company_agent_memory
  ADD COLUMN IF NOT EXISTS topic TEXT NOT NULL DEFAULT 'general'
    CHECK (topic IN ('goals', 'preferences', 'facts', 'people', 'context', 'general')),
  ADD COLUMN IF NOT EXISTS summary TEXT,
  ADD COLUMN IF NOT EXISTS body TEXT;

COMMENT ON COLUMN company_agent_memory.topic IS
  'Topic the fact belongs to. Closed vocabulary so agents cannot invent dozens of single-row topics.';
COMMENT ON COLUMN company_agent_memory.summary IS
  'One-line description used in the index view and system prompt; analog of MEMORY.md frontmatter description.';
COMMENT ON COLUMN company_agent_memory.body IS
  'Optional richer markdown body for facts that need a paragraph instead of a scalar value.';

CREATE INDEX IF NOT EXISTS idx_company_agent_memory_user_agent_topic
  ON company_agent_memory(user_id, agent_kind, topic, updated_at DESC);
