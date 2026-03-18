-- Migration: Remove finance/case round types and TOP_FINANCE company tier
-- Focus product on SWE/tech interviews only (technical, behavioral, research)

-- 1. Reclassify existing reports with removed round types → 'technical'
UPDATE reports
SET round_type = 'technical'
WHERE round_type IN ('case', 'finance');

-- 2. Reclassify rubric_chunks and question_archetypes with finance domain → 'general'
UPDATE rubric_chunks
SET domain = 'general'
WHERE domain = 'finance';

UPDATE question_archetypes
SET domain = 'general'
WHERE domain = 'finance';

-- 3. Swap round_type enum: create new → migrate → drop old
-- Note: Postgres does not allow removing values from an existing enum directly

-- Create new enum
CREATE TYPE round_type_new AS ENUM ('technical', 'behavioral', 'research');

-- Alter columns to use the new enum
ALTER TABLE reports
  ALTER COLUMN round_type TYPE round_type_new
  USING round_type::text::round_type_new;

ALTER TABLE rubric_chunks
  ALTER COLUMN round_type TYPE round_type_new
  USING round_type::text::round_type_new;

ALTER TABLE question_archetypes
  ALTER COLUMN round_type TYPE round_type_new
  USING round_type::text::round_type_new;

-- Drop old enum and rename new one
DROP TYPE IF EXISTS round_type;
ALTER TYPE round_type_new RENAME TO round_type;

-- 4. Swap domain enum: remove 'finance' value
CREATE TYPE domain_type_new AS ENUM ('swe', 'ds', 'general');

ALTER TABLE rubric_chunks
  ALTER COLUMN domain TYPE domain_type_new
  USING domain::text::domain_type_new;

ALTER TABLE question_archetypes
  ALTER COLUMN domain TYPE domain_type_new
  USING domain::text::domain_type_new;

DROP TYPE IF EXISTS domain_type;
ALTER TYPE domain_type_new RENAME TO domain_type;

-- 5. Recreate vector search functions with new enum types
-- (These functions reference the enum types and need to be recreated)

-- Recreate match_rubric_chunks if it exists
CREATE OR REPLACE FUNCTION match_rubric_chunks(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_round_type round_type DEFAULT NULL,
  filter_domain domain_type DEFAULT NULL,
  filter_company text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  chunk_text text,
  domain domain_type,
  round_type round_type,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    rc.id,
    rc.chunk_text,
    rc.domain,
    rc.round_type,
    rc.metadata,
    1 - (rc.embedding <=> query_embedding) AS similarity
  FROM rubric_chunks rc
  WHERE
    (filter_round_type IS NULL OR rc.round_type = filter_round_type)
    AND (filter_domain IS NULL OR rc.domain = filter_domain)
    AND 1 - (rc.embedding <=> query_embedding) > match_threshold
  ORDER BY rc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Recreate match_question_archetypes if it exists
CREATE OR REPLACE FUNCTION match_question_archetypes(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_round_type round_type DEFAULT NULL,
  filter_domain domain_type DEFAULT NULL,
  filter_company text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  question_template text,
  domain domain_type,
  round_type round_type,
  tags text[],
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    qa.id,
    qa.question_template,
    qa.domain,
    qa.round_type,
    qa.tags,
    1 - (qa.embedding <=> query_embedding) AS similarity
  FROM question_archetypes qa
  WHERE
    (filter_round_type IS NULL OR qa.round_type = filter_round_type)
    AND (filter_domain IS NULL OR qa.domain = filter_domain)
    AND 1 - (qa.embedding <=> query_embedding) > match_threshold
  ORDER BY qa.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
