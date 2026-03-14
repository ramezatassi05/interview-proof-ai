-- Migration 012: Add pipeline_state_json column for multi-step analysis pipeline
-- Stores intermediate state between client-driven pipeline steps to avoid
-- Vercel Hobby plan 60s timeout on the monolithic analyze endpoint.

ALTER TABLE reports ADD COLUMN IF NOT EXISTS pipeline_state_json JSONB;

COMMENT ON COLUMN reports.pipeline_state_json IS 'Temporary intermediate state for multi-step analysis pipeline. Cleared after final step inserts into runs.';
