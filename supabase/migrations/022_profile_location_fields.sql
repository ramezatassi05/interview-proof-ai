-- Add location preference fields to user_profiles
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS target_countries TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS target_cities TEXT[] DEFAULT '{}';
