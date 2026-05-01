-- Migration 030: Prep Planning
-- M2 of Agentic Platform initiative.
-- Stores generated prep plans (multi-day study/practice schedules) and the
-- discrete tasks that make them up. The prep_plan_agent will read/write here.
--
-- Note: opportunity_id is declared without a FK constraint here; the
-- foreign key to opportunities(id) is added at the end of migration 031,
-- since opportunities does not yet exist when this migration runs.

-- ============================================================
-- 1. prep_plans
-- ============================================================
CREATE TABLE IF NOT EXISTS prep_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_id UUID NULL REFERENCES reports(id) ON DELETE SET NULL,
  opportunity_id UUID NULL,
  target_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'completed')),
  plan_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prep_plans_user_id ON prep_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_prep_plans_status ON prep_plans(status);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_prep_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prep_plans_updated_at ON prep_plans;
CREATE TRIGGER trg_prep_plans_updated_at
  BEFORE UPDATE ON prep_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_prep_plans_updated_at();

-- RLS
ALTER TABLE prep_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own prep_plans" ON prep_plans;
CREATE POLICY "Users can read own prep_plans"
  ON prep_plans FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own prep_plans" ON prep_plans;
CREATE POLICY "Users can insert own prep_plans"
  ON prep_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own prep_plans" ON prep_plans;
CREATE POLICY "Users can update own prep_plans"
  ON prep_plans FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own prep_plans" ON prep_plans;
CREATE POLICY "Users can delete own prep_plans"
  ON prep_plans FOR DELETE
  USING (auth.uid() = user_id);


-- ============================================================
-- 2. prep_plan_tasks
-- ============================================================
CREATE TABLE IF NOT EXISTS prep_plan_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prep_plan_id UUID NOT NULL REFERENCES prep_plans(id) ON DELETE CASCADE,
  day_offset INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN (
    'practice',
    'study',
    'behavioral',
    'technical',
    'company_research',
    'review',
    'rest'
  )),
  estimated_minutes INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done', 'skipped')),
  evidence_refs_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prep_plan_tasks_plan ON prep_plan_tasks(prep_plan_id, day_offset);
CREATE INDEX IF NOT EXISTS idx_prep_plan_tasks_status ON prep_plan_tasks(status);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_prep_plan_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prep_plan_tasks_updated_at ON prep_plan_tasks;
CREATE TRIGGER trg_prep_plan_tasks_updated_at
  BEFORE UPDATE ON prep_plan_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_prep_plan_tasks_updated_at();

-- RLS — nested EXISTS via parent prep_plan
ALTER TABLE prep_plan_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read tasks for own prep_plans" ON prep_plan_tasks;
CREATE POLICY "Users can read tasks for own prep_plans"
  ON prep_plan_tasks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM prep_plans p
    WHERE p.id = prep_plan_tasks.prep_plan_id AND p.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can insert tasks for own prep_plans" ON prep_plan_tasks;
CREATE POLICY "Users can insert tasks for own prep_plans"
  ON prep_plan_tasks FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM prep_plans p
    WHERE p.id = prep_plan_tasks.prep_plan_id AND p.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can update tasks for own prep_plans" ON prep_plan_tasks;
CREATE POLICY "Users can update tasks for own prep_plans"
  ON prep_plan_tasks FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM prep_plans p
    WHERE p.id = prep_plan_tasks.prep_plan_id AND p.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM prep_plans p
    WHERE p.id = prep_plan_tasks.prep_plan_id AND p.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can delete tasks for own prep_plans" ON prep_plan_tasks;
CREATE POLICY "Users can delete tasks for own prep_plans"
  ON prep_plan_tasks FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM prep_plans p
    WHERE p.id = prep_plan_tasks.prep_plan_id AND p.user_id = auth.uid()
  ));
