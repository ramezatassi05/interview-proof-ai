-- Migration 044: User Notifications
-- A3 of the customer-agentic Phase A foundations.
-- Persistent inbox surface for the user — drives the NotificationBell in the
-- header and the Phase C copilot "what changed while you were away" digest.
-- Auto-populated by an INSERT trigger on agent_actions, plus a service-role
-- write path for the Phase C proactive digest cron.

-- ============================================================
-- user_notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN (
    'action_drafted',
    'action_completed',
    'action_failed',
    'digest',
    'system'
  )),
  title TEXT NOT NULL,
  body TEXT,
  action_id UUID REFERENCES agent_actions(id) ON DELETE SET NULL,
  href TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_created
  ON user_notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_notifications_unread
  ON user_notifications (user_id) WHERE read_at IS NULL;

-- ============================================================
-- RLS — users read & mark-read their own. INSERTs are service-role only
-- (the trigger below runs as SECURITY DEFINER; the cron path uses
-- createServiceClient which bypasses RLS).
-- ============================================================
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own notifications" ON user_notifications;
CREATE POLICY "Users can read own notifications"
  ON user_notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can mark own notifications read" ON user_notifications;
CREATE POLICY "Users can mark own notifications read"
  ON user_notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notifications" ON user_notifications;
CREATE POLICY "Users can delete own notifications"
  ON user_notifications FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- Trigger: auto-notify on a freshly drafted agent_action.
-- Fires only for new rows landing in 'drafted' or 'awaiting_approval' so we
-- do not double-notify when an action is later approved/rejected. The Phase
-- A5 executor uses the service-role write path for completion notices.
-- ============================================================
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
    WHEN 'summarize_progress' THEN 'Progress summary ready'
    WHEN 'start_mock_interview' THEN 'Mock interview suggested'
    WHEN 'score_answer' THEN 'Practice answer scored'
    ELSE 'New agent draft ready'
  END;

  INSERT INTO user_notifications (user_id, kind, title, body, action_id, href)
  VALUES (
    NEW.user_id,
    'action_drafted',
    pretty,
    NULL,
    NEW.id,
    CASE WHEN NEW.report_id IS NOT NULL THEN '/r/' || NEW.report_id || '/full?tab=coach' ELSE NULL END
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_action_drafted ON agent_actions;
CREATE TRIGGER trg_notify_action_drafted
  AFTER INSERT ON agent_actions
  FOR EACH ROW
  EXECUTE FUNCTION notify_action_drafted();
