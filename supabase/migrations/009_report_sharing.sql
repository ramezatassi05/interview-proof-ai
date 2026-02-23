-- Report Sharing: share_token + share_enabled on reports
-- Allows anonymous read-only access to shared reports

-- Add sharing columns to reports
ALTER TABLE reports
  ADD COLUMN share_token TEXT UNIQUE,
  ADD COLUMN share_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN share_created_at TIMESTAMPTZ;

-- Index for fast lookups by share_token
CREATE INDEX idx_reports_share_token ON reports(share_token) WHERE share_token IS NOT NULL;

-- RLS policy: anonymous SELECT when sharing is enabled
CREATE POLICY "Anyone can view shared reports" ON reports
  FOR SELECT USING (
    share_enabled = TRUE AND share_token IS NOT NULL
  );

-- RLS policy: anonymous SELECT on runs belonging to shared reports
CREATE POLICY "Anyone can view runs for shared reports" ON runs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM reports
      WHERE reports.id = runs.report_id
        AND reports.share_enabled = TRUE
        AND reports.share_token IS NOT NULL
    )
  );
