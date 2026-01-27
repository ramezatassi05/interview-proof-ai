-- Phase 7b: Add diagnostic intelligence column to runs table
-- This stores the computed diagnostic intelligence features for each analysis run

ALTER TABLE runs ADD COLUMN IF NOT EXISTS diagnostic_intelligence_json JSONB;

-- Add index for querying by archetype type (optional, for future analytics)
CREATE INDEX IF NOT EXISTS idx_runs_archetype ON runs
  USING GIN ((diagnostic_intelligence_json->'archetypeProfile'));

-- Comment for documentation
COMMENT ON COLUMN runs.diagnostic_intelligence_json IS 'Phase 7b diagnostic intelligence features including archetype profile, round forecasts, cognitive risk map, trajectory projection, and recruiter simulation. Version v0.1.';
