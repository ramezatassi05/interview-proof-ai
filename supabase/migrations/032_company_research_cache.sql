-- Migration 032: Company Research Cache (shared, non-user-scoped)
-- M2 of Agentic Platform initiative.
-- A shared cache of company research blobs the company_research agent
-- produces. Scoped GLOBALLY (not per-user) — research about a company is
-- the same regardless of who asked. Authenticated users get read access;
-- only the service role (which bypasses RLS) writes/expires entries.

-- ============================================================
-- company_research_cache
-- ============================================================
CREATE TABLE IF NOT EXISTS company_research_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name_normalized TEXT NOT NULL UNIQUE,
  research_json JSONB NOT NULL,
  sources_json JSONB,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_research_cache_expires_at
  ON company_research_cache(expires_at);

-- RLS — only authenticated users can read; writes happen via service role.
ALTER TABLE company_research_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read research cache" ON company_research_cache;
CREATE POLICY "Authenticated users can read research cache"
  ON company_research_cache FOR SELECT
  USING (auth.role() = 'authenticated');

-- Intentionally no INSERT / UPDATE / DELETE policies. Service role
-- bypasses RLS so the agent backend can populate and expire entries.
