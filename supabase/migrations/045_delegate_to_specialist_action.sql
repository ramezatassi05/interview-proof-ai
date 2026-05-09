-- Migration 045: delegate_to_specialist action type
-- Phase B (inter-agent collaboration) of the customer-agentic roadmap.
-- Extends the agent_actions.action_type CHECK constraint to add
-- `delegate_to_specialist`, used when one agent (typically the orchestrator)
-- proposes that another specialist agent take over a task.

ALTER TABLE agent_actions DROP CONSTRAINT IF EXISTS agent_actions_action_type_check;

ALTER TABLE agent_actions ADD CONSTRAINT agent_actions_action_type_check
  CHECK (action_type IN (
    'recommend_drill',
    'start_mock_interview',
    'score_answer',
    'draft_recruiter_reply',
    'rewrite_resume_bullet',
    'create_company_brief',
    'update_prep_plan',
    'propose_opportunity_update',
    'summarize_progress',
    'delegate_to_specialist'
  ));
