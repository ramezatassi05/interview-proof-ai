-- Migration 019: User Profiles for Onboarding
-- Stores onboarding answers, segmentation, and completion state

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Onboarding answers
  display_name TEXT,
  career_stage TEXT CHECK (career_stage IN ('student', 'new_grad', 'career_changer', 'experienced_professional')),
  target_role TEXT,
  target_domain TEXT CHECK (target_domain IN ('swe', 'ds', 'design', 'pm', 'general')),
  years_experience INTEGER CHECK (years_experience IS NULL OR (years_experience >= 0 AND years_experience <= 50)),
  prep_urgency TEXT CHECK (prep_urgency IN ('exploring', 'active_search', 'interview_scheduled', 'interview_this_week')),
  biggest_concern TEXT,

  -- Computed segmentation (career_stage + prep_urgency)
  segment TEXT,

  -- Onboarding state
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  onboarding_step INTEGER NOT NULL DEFAULT 0,
  onboarding_completed_at TIMESTAMPTZ,

  -- Aha moment snapshot (readiness estimate + focus areas)
  aha_score JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookup by user_id (UNIQUE already creates one, but explicit for clarity)
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);

-- Auto-update updated_at on modification
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profiles_updated_at();

-- Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Backfill existing users so they skip onboarding
INSERT INTO user_profiles (user_id, onboarding_completed, onboarding_completed_at)
SELECT id, TRUE, NOW()
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
