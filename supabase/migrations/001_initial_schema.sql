-- InterviewProof MVP Database Schema
-- Run this migration in Supabase SQL Editor

-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Enum types
CREATE TYPE round_type AS ENUM ('technical', 'behavioral', 'case', 'finance');
CREATE TYPE risk_band AS ENUM ('Low', 'Medium', 'High');
CREATE TYPE credit_type AS ENUM ('purchase', 'spend', 'refund', 'grant');
CREATE TYPE domain_type AS ENUM ('swe', 'ds', 'finance', 'general');

-- Credits Ledger: Tracks credit purchases & consumption
CREATE TABLE credits_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type credit_type NOT NULL,
  amount INTEGER NOT NULL, -- positive for purchase/grant, negative for spend
  stripe_event_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reports: A "paid diagnostic report" for a specific resume+JD+round
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  round_type round_type NOT NULL,
  resume_file_path TEXT,
  resume_text TEXT,
  job_description_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
  credit_spend_ledger_id UUID REFERENCES credits_ledger(id)
);

-- Runs: Every analysis execution (initial + rerun)
CREATE TABLE runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  run_index INTEGER NOT NULL DEFAULT 0, -- 0 = initial, 1 = rerun
  extracted_resume_json JSONB NOT NULL,
  extracted_jd_json JSONB NOT NULL,
  retrieved_context_ids JSONB NOT NULL DEFAULT '[]',
  llm_analysis_json JSONB NOT NULL,
  score_breakdown_json JSONB NOT NULL,
  readiness_score INTEGER NOT NULL,
  risk_band risk_band NOT NULL,
  ranked_risks_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(report_id, run_index)
);

-- Rubric Chunks: Curated internal library (your moat)
CREATE TABLE rubric_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain domain_type NOT NULL,
  round_type round_type NOT NULL,
  chunk_text TEXT NOT NULL,
  source_name TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT 'v0.1',
  embedding vector(1536), -- OpenAI ada-002 dimension
  metadata JSONB NOT NULL DEFAULT '{}'
);

-- Question Archetypes: Curated question bank
CREATE TABLE question_archetypes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain domain_type NOT NULL,
  round_type round_type NOT NULL,
  question_template TEXT NOT NULL,
  tags JSONB NOT NULL DEFAULT '[]',
  embedding vector(1536)
);

-- Indexes for performance
CREATE INDEX idx_credits_ledger_user_id ON credits_ledger(user_id);
CREATE INDEX idx_reports_user_id ON reports(user_id);
CREATE INDEX idx_runs_report_id ON runs(report_id);
CREATE INDEX idx_rubric_chunks_domain_round ON rubric_chunks(domain, round_type);
CREATE INDEX idx_question_archetypes_domain_round ON question_archetypes(domain, round_type);

-- Vector similarity indexes (IVFFlat for faster search)
CREATE INDEX idx_rubric_chunks_embedding ON rubric_chunks
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_question_archetypes_embedding ON question_archetypes
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Row Level Security (RLS)
ALTER TABLE credits_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rubric_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_archetypes ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own data
CREATE POLICY "Users can view own credits" ON credits_ledger
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credits" ON credits_ledger
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own reports" ON reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own reports" ON reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reports" ON reports
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view runs for own reports" ON runs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM reports WHERE reports.id = runs.report_id AND reports.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create runs for own reports" ON runs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM reports WHERE reports.id = runs.report_id AND reports.user_id = auth.uid()
    )
  );

-- Rubric chunks and question archetypes are readable by all authenticated users
CREATE POLICY "Authenticated users can view rubrics" ON rubric_chunks
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view questions" ON question_archetypes
  FOR SELECT USING (auth.role() = 'authenticated');

-- Function to compute user's credit balance
CREATE OR REPLACE FUNCTION get_user_credit_balance(p_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COALESCE(SUM(amount), 0)::INTEGER
  FROM credits_ledger
  WHERE user_id = p_user_id;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Function to check if user can spend credits
CREATE OR REPLACE FUNCTION can_spend_credit(p_user_id UUID, p_amount INTEGER)
RETURNS BOOLEAN AS $$
  SELECT get_user_credit_balance(p_user_id) >= p_amount;
$$ LANGUAGE SQL SECURITY DEFINER;
