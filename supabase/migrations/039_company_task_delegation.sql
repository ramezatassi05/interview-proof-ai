-- Part 2: Role mapping — delegation + escalation columns on company_tasks.
--
-- delegated_by         : which agent kind delegated this task. NULL means picked up by an agent autonomously.
-- delegation_rationale : short explanation set when CEO calls delegate_task.
-- escalated_at         : timestamp set when a director calls escalate_to_ceo. NULL = not escalated.
-- escalation_reason    : director's explanation for the escalation.

ALTER TABLE company_tasks
  ADD COLUMN IF NOT EXISTS delegated_by TEXT NULL
    CHECK (delegated_by IS NULL OR delegated_by IN (
      'ceo_orchestrator',
      'executive_assistant',
      'director_marketing',
      'director_finance',
      'director_engineering'
    )),
  ADD COLUMN IF NOT EXISTS delegation_rationale TEXT NULL,
  ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS escalation_reason TEXT NULL;

CREATE INDEX IF NOT EXISTS idx_company_tasks_delegated_by
  ON company_tasks(user_id, delegated_by)
  WHERE delegated_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_company_tasks_escalated
  ON company_tasks(user_id, escalated_at)
  WHERE escalated_at IS NOT NULL;
