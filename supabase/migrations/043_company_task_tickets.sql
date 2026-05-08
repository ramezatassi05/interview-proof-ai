-- Migration 043: Inter-agent tickets (Part 10 of CEO Command Center vision).
-- A "ticket" is a task with requester_kind != NULL. Reuses the company_tasks
-- table and existing lifecycle (todo / doing / blocked / done / canceled).
-- requester_kind tells you who filed the request; owner_kind already says
-- who is responsible. resolution + resolved_at give a closing audit trail.

ALTER TABLE company_tasks
  ADD COLUMN IF NOT EXISTS requester_kind TEXT
    CHECK (requester_kind IS NULL OR requester_kind IN (
      'ceo_orchestrator',
      'executive_assistant',
      'director_marketing',
      'director_finance',
      'director_engineering'
    )),
  ADD COLUMN IF NOT EXISTS resolution TEXT,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

COMMENT ON COLUMN company_tasks.requester_kind IS
  'Agent that filed the ticket. NULL for CEO-mandated tasks or system-generated work; non-null for peer-to-peer requests.';
COMMENT ON COLUMN company_tasks.resolution IS
  'Free-text "what got done" written when the task moves to done. Surfaced in audit timeline.';
COMMENT ON COLUMN company_tasks.resolved_at IS
  'Timestamp the task was marked done. Distinct from updated_at because tasks can be re-edited after closing.';

CREATE INDEX IF NOT EXISTS idx_company_tasks_owner_status
  ON company_tasks(user_id, owner_kind, status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_company_tasks_requester
  ON company_tasks(user_id, requester_kind)
  WHERE requester_kind IS NOT NULL;
