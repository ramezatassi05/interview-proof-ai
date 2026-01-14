-- Vector search functions for RAG retrieval
-- Run this after 001_initial_schema.sql

-- Function to match rubric chunks by embedding similarity
CREATE OR REPLACE FUNCTION match_rubric_chunks(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 8,
  filter_round_type round_type DEFAULT NULL
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
    rc.embedding IS NOT NULL
    AND (filter_round_type IS NULL OR rc.round_type = filter_round_type)
    AND 1 - (rc.embedding <=> query_embedding) > match_threshold
  ORDER BY rc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to match question archetypes by embedding similarity
CREATE OR REPLACE FUNCTION match_question_archetypes(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 8,
  filter_round_type round_type DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  question_template text,
  domain domain_type,
  round_type round_type,
  tags jsonb,
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
    qa.embedding IS NOT NULL
    AND (filter_round_type IS NULL OR qa.round_type = filter_round_type)
    AND 1 - (qa.embedding <=> query_embedding) > match_threshold
  ORDER BY qa.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION match_rubric_chunks TO authenticated;
GRANT EXECUTE ON FUNCTION match_question_archetypes TO authenticated;
