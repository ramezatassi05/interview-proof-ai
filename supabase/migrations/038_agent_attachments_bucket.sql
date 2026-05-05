-- Migration 038: Storage bucket + RLS for company_agent_attachments uploads.
-- Files are private and stored under `${userId}/${sessionId|pending}/${uuid}.${ext}`.
-- The owner (auth.uid()) is the first path segment, so policies match on that.

INSERT INTO storage.buckets (id, name, public)
VALUES ('agent-attachments', 'agent-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- RLS: owner-only access. Mirrors the shape used elsewhere in 037 — read /
-- insert / update / delete are all gated on the first path segment matching
-- the calling user's id.
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can read own agent-attachments objects" ON storage.objects;
CREATE POLICY "Users can read own agent-attachments objects"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'agent-attachments'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can insert own agent-attachments objects" ON storage.objects;
CREATE POLICY "Users can insert own agent-attachments objects"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'agent-attachments'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can update own agent-attachments objects" ON storage.objects;
CREATE POLICY "Users can update own agent-attachments objects"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'agent-attachments'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'agent-attachments'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete own agent-attachments objects" ON storage.objects;
CREATE POLICY "Users can delete own agent-attachments objects"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'agent-attachments'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
