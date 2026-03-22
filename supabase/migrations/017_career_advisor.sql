-- ============================================
-- Phase 9: Career Advisor
-- Tables: user_resumes, skill_demand, career_advisor_conversations
-- View: skill_demand_30d
-- ============================================

-- ============================================
-- 1. user_resumes — One resume per user, persistent LLM memory
-- ============================================
CREATE TABLE IF NOT EXISTS user_resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  raw_text TEXT,
  raw_file_url TEXT,
  file_name TEXT,
  file_type TEXT,
  parsed_data JSONB NOT NULL DEFAULT '{}',
  skills TEXT[] NOT NULL DEFAULT '{}',
  skill_ids TEXT[] NOT NULL DEFAULT '{}',
  target_role TEXT,
  target_industry TEXT,
  experience_level TEXT CHECK (experience_level IN ('student', 'new_grad', 'junior', 'mid')),
  graduation_date TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_parsed_at TIMESTAMPTZ,
  parse_version TEXT NOT NULL DEFAULT 'v1.0',
  UNIQUE(user_id)
);

ALTER TABLE user_resumes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own resume"
  ON user_resumes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own resume"
  ON user_resumes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own resume"
  ON user_resumes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own resume"
  ON user_resumes FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_user_resumes_user_id ON user_resumes(user_id);

-- ============================================
-- 2. skill_demand — Job market skill demand data (populated by scrape pipeline)
-- ============================================
CREATE TABLE IF NOT EXISTS skill_demand (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_name TEXT NOT NULL,
  skill_id TEXT,
  target_role TEXT NOT NULL,
  mention_count INTEGER NOT NULL DEFAULT 1,
  scrape_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE skill_demand ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view skill demand"
  ON skill_demand FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE INDEX idx_skill_demand_role_date ON skill_demand(target_role, scrape_date);

-- ============================================
-- 3. skill_demand_30d — Aggregated view of last 30 days
-- ============================================
CREATE OR REPLACE VIEW skill_demand_30d AS
SELECT
  skill_name,
  skill_id,
  target_role,
  SUM(mention_count)::INTEGER AS total_mentions
FROM skill_demand
WHERE scrape_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY skill_name, skill_id, target_role
ORDER BY total_mentions DESC;

-- Grant access to the view for authenticated users
GRANT SELECT ON skill_demand_30d TO authenticated;

-- ============================================
-- 4. career_advisor_conversations — Optional chat persistence
-- ============================================
CREATE TABLE IF NOT EXISTS career_advisor_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  messages JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE career_advisor_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations"
  ON career_advisor_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations"
  ON career_advisor_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
  ON career_advisor_conversations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations"
  ON career_advisor_conversations FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_career_conversations_user_id ON career_advisor_conversations(user_id);
