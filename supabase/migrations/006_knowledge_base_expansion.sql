-- Knowledge Base Expansion: Source tracking and ingestion job management
-- Backwards-compatible: all new columns are nullable or have defaults

-- Add source tracking columns to rubric_chunks
ALTER TABLE rubric_chunks
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS source_type TEXT NOT NULL DEFAULT 'internal',
  ADD COLUMN IF NOT EXISTS company_name TEXT,
  ADD COLUMN IF NOT EXISTS scraped_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS quality_score FLOAT NOT NULL DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- Add source tracking columns to question_archetypes
ALTER TABLE question_archetypes
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS source_type TEXT NOT NULL DEFAULT 'internal',
  ADD COLUMN IF NOT EXISTS company_name TEXT,
  ADD COLUMN IF NOT EXISTS scraped_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS quality_score FLOAT NOT NULL DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- Knowledge ingestion jobs: tracks scraping/ingestion runs
CREATE TABLE IF NOT EXISTS knowledge_ingestion_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_config_id TEXT NOT NULL,
  source_name TEXT NOT NULL,
  source_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'scraping', 'transforming', 'embedding', 'complete', 'failed')),
  total_chunks_created INTEGER NOT NULL DEFAULT 0,
  total_questions_created INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'
);

-- Indexes for efficient filtering
CREATE INDEX IF NOT EXISTS idx_rubric_chunks_source_type ON rubric_chunks(source_type);
CREATE INDEX IF NOT EXISTS idx_rubric_chunks_company_name ON rubric_chunks(company_name) WHERE company_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_rubric_chunks_is_active ON rubric_chunks(is_active);

CREATE INDEX IF NOT EXISTS idx_question_archetypes_source_type ON question_archetypes(source_type);
CREATE INDEX IF NOT EXISTS idx_question_archetypes_company_name ON question_archetypes(company_name) WHERE company_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_question_archetypes_is_active ON question_archetypes(is_active);

CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_status ON knowledge_ingestion_jobs(status);

-- RLS for ingestion jobs (service role only — no user access needed)
ALTER TABLE knowledge_ingestion_jobs ENABLE ROW LEVEL SECURITY;
