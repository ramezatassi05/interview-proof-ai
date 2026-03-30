-- Job market data cache (1-hour TTL checked at query time)
CREATE TABLE IF NOT EXISTS job_market_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL UNIQUE,
  response_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_market_cache_key ON job_market_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_job_market_cache_created ON job_market_cache(created_at);
