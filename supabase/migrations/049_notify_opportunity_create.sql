-- Migration 049: extend notify_action_drafted() for propose_opportunity_create
-- Phase D follow-up — keeps bell text matching the artifact card.

CREATE OR REPLACE FUNCTION notify_action_drafted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pretty TEXT;
BEGIN
  IF NEW.status NOT IN ('drafted', 'awaiting_approval') THEN
    RETURN NEW;
  END IF;

  pretty := CASE NEW.action_type
    WHEN 'recommend_drill' THEN 'New drill recommendation ready'
    WHEN 'rewrite_resume_bullet' THEN 'Resume bullet rewrite drafted'
    WHEN 'draft_recruiter_reply' THEN 'Recruiter reply drafted'
    WHEN 'create_company_brief' THEN 'Company brief drafted'
    WHEN 'update_prep_plan' THEN 'Prep plan update drafted'
    WHEN 'propose_opportunity_update' THEN 'Opportunity update proposed'
    WHEN 'propose_opportunity_create' THEN 'New job match found'
    WHEN 'summarize_progress' THEN 'Progress summary ready'
    WHEN 'start_mock_interview' THEN 'Mock interview suggested'
    WHEN 'score_answer' THEN 'Practice answer scored'
    WHEN 'delegate_to_specialist' THEN 'Hand-off to a specialist proposed'
    ELSE 'New agent draft ready'
  END;

  INSERT INTO user_notifications (user_id, kind, title, body, action_id, href)
  VALUES (
    NEW.user_id,
    'action_drafted',
    pretty,
    NULL,
    NEW.id,
    CASE
      WHEN NEW.action_type = 'propose_opportunity_create' THEN '/opportunities'
      WHEN NEW.report_id IS NOT NULL THEN '/r/' || NEW.report_id || '/full?tab=coach'
      ELSE NULL
    END
  );

  RETURN NEW;
END;
$$;
