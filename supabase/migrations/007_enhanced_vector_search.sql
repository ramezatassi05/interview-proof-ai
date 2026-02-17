-- Enhanced vector search functions with domain/company filtering and quality weighting
-- Replaces functions from 002_vector_search_functions.sql

-- Drop old 4-parameter function signatures to avoid overload conflicts
DROP FUNCTION IF EXISTS match_rubric_chunks(vector(1536), float, int, round_type);
DROP FUNCTION IF EXISTS match_question_archetypes(vector(1536), float, int, round_type);

-- Enhanced rubric chunk matching with domain, company filtering and quality weighting
CREATE OR REPLACE FUNCTION match_rubric_chunks(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 8,
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
    ((1 - (rc.embedding <=> query_embedding)) * rc.quality_score)::float AS similarity
  FROM rubric_chunks rc
  WHERE
    rc.embedding IS NOT NULL
    AND rc.is_active = TRUE
    AND (filter_round_type IS NULL OR rc.round_type = filter_round_type)
    AND (filter_domain IS NULL OR rc.domain = filter_domain)
    AND (filter_company IS NULL OR rc.company_name = filter_company OR rc.company_name IS NULL)
    AND (1 - (rc.embedding <=> query_embedding)) * rc.quality_score > match_threshold
  ORDER BY (rc.embedding <=> query_embedding) / rc.quality_score
  LIMIT match_count;
END;
$$;

-- Enhanced question archetype matching with domain, company filtering and quality weighting
CREATE OR REPLACE FUNCTION match_question_archetypes(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 8,
  filter_round_type round_type DEFAULT NULL,
  filter_domain domain_type DEFAULT NULL,
  filter_company text DEFAULT NULL
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
    ((1 - (qa.embedding <=> query_embedding)) * qa.quality_score)::float AS similarity
  FROM question_archetypes qa
  WHERE
    qa.embedding IS NOT NULL
    AND qa.is_active = TRUE
    AND (filter_round_type IS NULL OR qa.round_type = filter_round_type)
    AND (filter_domain IS NULL OR qa.domain = filter_domain)
    AND (filter_company IS NULL OR qa.company_name = filter_company OR qa.company_name IS NULL)
    AND (1 - (qa.embedding <=> query_embedding)) * qa.quality_score > match_threshold
  ORDER BY (qa.embedding <=> query_embedding) / qa.quality_score
  LIMIT match_count;
END;
$$;

-- Re-grant execute permissions
GRANT EXECUTE ON FUNCTION match_rubric_chunks TO authenticated;
GRANT EXECUTE ON FUNCTION match_question_archetypes TO authenticated;
