-- Migration 019: User profiles for onboarding personalization
-- Adds a comprehensive user profile table to support the 12-step onboarding wizard.

-- Career status enum
CREATE TYPE career_status AS ENUM (
  'student', 'early_career', 'mid_career', 'senior', 'executive', 'career_changer'
);

-- Interview timeline urgency enum
CREATE TYPE onboarding_interview_timeline AS ENUM (
  'this_week', 'two_weeks', 'one_month', 'one_to_three_months', 'exploring'
);

-- User profiles table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Step 1: Name
  display_name TEXT,

  -- Step 2: Resume (persisted per-profile)
  resume_file_path TEXT,           -- Supabase Storage path
  resume_text TEXT,                -- Parsed text from PDF
  resume_parsed_json JSONB,        -- AI-extracted structured data (ExtractedResume shape)

  -- Step 3: Career Status
  career_status career_status,

  -- Step 4: Years of Experience
  years_of_experience INTEGER,     -- 0 to 21 (21 = 20+)

  -- Step 5: Industry & Function
  industries TEXT[] DEFAULT '{}',  -- multi-select
  job_functions TEXT[] DEFAULT '{}',   -- multi-select (renamed from "functions" to avoid reserved word)

  -- Step 6: Current Situation
  current_job_role TEXT,           -- renamed from "current_role" to avoid reserved word
  current_company TEXT,

  -- Step 7: Target Role
  target_role TEXT,

  -- Step 8: Target Companies
  target_companies JSONB DEFAULT '[]',  -- [{name: string, tier?: string}]

  -- Step 9: Interview Timeline
  interview_timeline onboarding_interview_timeline,

  -- Step 10: Biggest Concerns
  concerns TEXT[] DEFAULT '{}',    -- multi-select (up to 5)

  -- Step 11: Compensation (optional)
  current_compensation_range TEXT,
  target_compensation_range TEXT,

  -- Onboarding state
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  onboarding_current_step INTEGER NOT NULL DEFAULT 1,

  -- AI-generated summary (Step 12)
  profile_summary_json JSONB,      -- {readinessEstimate, projectedPotential, summaryText, recommendations[], strengths[]}

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_onboarding ON user_profiles(onboarding_completed);

-- RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profiles_updated_at();
