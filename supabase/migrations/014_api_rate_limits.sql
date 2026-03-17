CREATE TABLE IF NOT EXISTS api_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_api_rate_limits_key_time ON api_rate_limits (key, attempted_at);
ALTER TABLE api_rate_limits ENABLE ROW LEVEL SECURITY;
