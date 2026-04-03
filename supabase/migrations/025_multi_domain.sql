-- Migration: Convert target_domain (single TEXT) to target_domains (JSONB array)
-- Supports multi-domain selection in onboarding

-- 1. Add the new JSONB column
ALTER TABLE user_profiles ADD COLUMN target_domains JSONB DEFAULT '[]'::jsonb;

-- 2. Migrate existing data
UPDATE user_profiles
SET target_domains = CASE
  WHEN target_domain IS NOT NULL THEN jsonb_build_array(target_domain)
  ELSE '[]'::jsonb
END;

-- 3. Drop the old column
ALTER TABLE user_profiles DROP COLUMN target_domain;
