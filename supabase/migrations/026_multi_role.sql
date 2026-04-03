-- 026: Convert single target_role TEXT to target_roles JSONB array (max 3)
-- Mirrors the target_domain → target_domains migration pattern from 025

ALTER TABLE user_profiles ADD COLUMN target_roles JSONB DEFAULT '[]'::jsonb;

UPDATE user_profiles
SET target_roles = CASE
  WHEN target_role IS NOT NULL AND target_role != ''
    THEN jsonb_build_array(target_role)
  ELSE '[]'::jsonb
END;

ALTER TABLE user_profiles DROP COLUMN target_role;
