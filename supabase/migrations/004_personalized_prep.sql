-- Migration: Add personalized prep preferences support
-- Phase: Personalized Study Plan Feature
-- Date: 2026-01-26

-- Add prep preferences column to reports table
-- Stores user's interview timeline, daily hours, experience level, focus areas, and optional context
ALTER TABLE reports ADD COLUMN IF NOT EXISTS prep_preferences_json JSONB;

-- Add personalized study plan column to runs table
-- Stores the generated day-by-day study plan based on user preferences
ALTER TABLE runs ADD COLUMN IF NOT EXISTS personalized_study_plan_json JSONB;

-- Add index for reports with prep preferences (for analytics/querying)
CREATE INDEX IF NOT EXISTS idx_reports_has_prep_preferences
ON reports ((prep_preferences_json IS NOT NULL));

-- Comment on columns for documentation
COMMENT ON COLUMN reports.prep_preferences_json IS 'User prep preferences: timeline, dailyHours, experienceLevel, focusAreas, additionalContext';
COMMENT ON COLUMN runs.personalized_study_plan_json IS 'Generated personalized study plan: dailyPlans with tasks distributed by priority and focus areas';
