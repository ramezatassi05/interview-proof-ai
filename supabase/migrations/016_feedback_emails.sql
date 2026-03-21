-- Track feedback email status on reports
ALTER TABLE reports ADD COLUMN feedback_email_sent_at TIMESTAMPTZ;
CREATE INDEX idx_reports_feedback_pending ON reports(feedback_email_sent_at) WHERE feedback_email_sent_at IS NULL;

-- Store feedback responses
CREATE TABLE feedback_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  most_useful TEXT,
  improvement TEXT,
  would_recommend TEXT CHECK (would_recommend IN ('yes', 'no', 'maybe')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(report_id)
);

CREATE INDEX idx_feedback_responses_report_id ON feedback_responses(report_id);

-- RLS
ALTER TABLE feedback_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert own feedback" ON feedback_responses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read own feedback" ON feedback_responses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role full access" ON feedback_responses FOR ALL USING (auth.role() = 'service_role');
