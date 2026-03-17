-- Newsletter subscribers
create table if not exists newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text not null default 'landing',
  subscribed_at timestamptz not null default now(),
  unsubscribed_at timestamptz
);

-- Index for lookups
create index if not exists idx_newsletter_email on newsletter_subscribers (email);

-- RLS
alter table newsletter_subscribers enable row level security;

-- Only service role can insert/manage (no public access)
create policy "Service role manages newsletter" on newsletter_subscribers
  for all using (true) with check (true);
