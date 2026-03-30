-- Migration 021: Add interview experience and target company tier columns
-- These support personalized focus area generation during onboarding

ALTER TABLE user_profiles
  ADD COLUMN interview_experience TEXT CHECK (interview_experience IN ('none', 'a_few', 'many')),
  ADD COLUMN target_company_tier TEXT CHECK (target_company_tier IN ('big_tech', 'startup', 'any'));
