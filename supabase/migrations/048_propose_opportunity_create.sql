-- Migration 048: propose_opportunity_create action type
-- Phase D — Adzuna-driven daily job ingestion. The cron drafts one
-- propose_opportunity_create per matching job; on user approval the executor
-- inserts a row into opportunities.

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
    'delegate_to_specialist',
    'propose_opportunity_create'
  ));
