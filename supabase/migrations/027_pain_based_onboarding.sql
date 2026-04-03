-- Pain-based onboarding fields (replaces demographic questions with emotional/pain-point questions)
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS practice_pain TEXT,
  ADD COLUMN IF NOT EXISTS interview_motivation TEXT,
  ADD COLUMN IF NOT EXISTS confidence_drop TEXT;
