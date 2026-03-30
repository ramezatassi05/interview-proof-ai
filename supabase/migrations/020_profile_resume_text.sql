-- Migration 020: Add resume_text to user_profiles
-- Stores the user's account-level resume text (extracted from PDF during onboarding)

ALTER TABLE user_profiles ADD COLUMN resume_text TEXT;
