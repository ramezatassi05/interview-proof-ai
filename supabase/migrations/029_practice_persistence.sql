-- Migration 029: Practice Persistence (CEO Decision D2 — dual-write)
-- M2 of Agentic Platform initiative.
-- Persists practice sessions and their answers so the orchestrator agent
-- can read longitudinal practice signals. Existing practice flow continues
-- to write to its current store (dual-write); these tables become the
-- canonical agentic source.

-- ============================================================
-- 1. practice_sessions
-- ============================================================
CREATE TABLE IF NOT EXISTS practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('drill', 'mock', 'timed')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  summary_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_id ON practice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_report_id ON practice_sessions(report_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_practice_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_practice_sessions_updated_at ON practice_sessions;
CREATE TRIGGER trg_practice_sessions_updated_at
  BEFORE UPDATE ON practice_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_practice_sessions_updated_at();

-- RLS
ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own practice_sessions" ON practice_sessions;
CREATE POLICY "Users can read own practice_sessions"
  ON practice_sessions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own practice_sessions" ON practice_sessions;
CREATE POLICY "Users can insert own practice_sessions"
  ON practice_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own practice_sessions" ON practice_sessions;
CREATE POLICY "Users can update own practice_sessions"
  ON practice_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own practice_sessions" ON practice_sessions;
CREATE POLICY "Users can delete own practice_sessions"
  ON practice_sessions FOR DELETE
  USING (auth.uid() = user_id);


-- ============================================================
-- 2. practice_answers
-- ============================================================
CREATE TABLE IF NOT EXISTS practice_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_session_id UUID NOT NULL REFERENCES practice_sessions(id) ON DELETE CASCADE,
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_index INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  mapped_risk_id TEXT,
  answer_text TEXT NOT NULL,
  feedback_json JSONB,
  score INTEGER CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
  attempt_number INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_practice_answers_session ON practice_answers(practice_session_id);
CREATE INDEX IF NOT EXISTS idx_practice_answers_user_report ON practice_answers(user_id, report_id);
CREATE INDEX IF NOT EXISTS idx_practice_answers_question_index ON practice_answers(practice_session_id, question_index);

-- RLS — defense in depth: nested EXISTS via practice_session AND direct user_id check
ALTER TABLE practice_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own practice_answers" ON practice_answers;
CREATE POLICY "Users can read own practice_answers"
  ON practice_answers FOR SELECT
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM practice_sessions ps
      WHERE ps.id = practice_answers.practice_session_id
        AND ps.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own practice_answers" ON practice_answers;
CREATE POLICY "Users can insert own practice_answers"
  ON practice_answers FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM practice_sessions ps
      WHERE ps.id = practice_answers.practice_session_id
        AND ps.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own practice_answers" ON practice_answers;
CREATE POLICY "Users can update own practice_answers"
  ON practice_answers FOR UPDATE
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM practice_sessions ps
      WHERE ps.id = practice_answers.practice_session_id
        AND ps.user_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM practice_sessions ps
      WHERE ps.id = practice_answers.practice_session_id
        AND ps.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own practice_answers" ON practice_answers;
CREATE POLICY "Users can delete own practice_answers"
  ON practice_answers FOR DELETE
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM practice_sessions ps
      WHERE ps.id = practice_answers.practice_session_id
        AND ps.user_id = auth.uid()
    )
  );
