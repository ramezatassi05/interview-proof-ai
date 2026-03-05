-- 011: Competency Benchmarks Table + Lookup Function
-- Supports dynamic, data-informed benchmark targets per company/tier/seniority/role

-- Table: competency_benchmarks
create table if not exists competency_benchmarks (
  id uuid primary key default gen_random_uuid(),
  company_tier text not null,        -- FAANG_PLUS, BIG_TECH, TOP_FINANCE, UNICORN, GROWTH, STANDARD
  seniority text not null,           -- Intern, Junior, Mid-Level, Senior, Staff+, Unknown
  role_type text not null,           -- backend, frontend, fullstack, ml_ai, data, devops_infra, etc.
  domain text not null,              -- System Design, Coding / Algorithms, etc.
  target_score integer not null check (target_score between 0 and 100),
  confidence text not null default 'calibrated', -- data_backed, calibrated, estimated
  source_notes text,                 -- where the data came from
  company_name text,                 -- NULL = tier-level default, non-NULL = company-specific override
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_tier, seniority, role_type, domain, company_name)
);

-- Index for fast lookups
create index if not exists idx_competency_benchmarks_lookup
  on competency_benchmarks (company_tier, seniority, role_type);

create index if not exists idx_competency_benchmarks_company
  on competency_benchmarks (company_name)
  where company_name is not null;

-- RLS: readable by authenticated users
alter table competency_benchmarks enable row level security;

create policy "Authenticated users can read competency benchmarks"
  on competency_benchmarks for select
  to authenticated
  using (true);

-- Function: get_competency_benchmarks with 3-tier fallback
-- 1. Company-specific match (company_name = input)
-- 2. Tier-level match (company_name IS NULL, matching tier/seniority/role_type)
-- 3. STANDARD tier fallback (company_name IS NULL, tier = 'STANDARD')
create or replace function get_competency_benchmarks(
  p_tier text,
  p_seniority text,
  p_role_type text,
  p_company_name text default null
)
returns table (
  domain text,
  target_score integer,
  confidence text,
  source_notes text,
  match_level text  -- 'company', 'tier', or 'fallback'
)
language plpgsql
stable
as $$
begin
  -- Tier 1: Company-specific override
  if p_company_name is not null then
    return query
      select cb.domain, cb.target_score, cb.confidence, cb.source_notes, 'company'::text as match_level
      from competency_benchmarks cb
      where cb.company_name = lower(p_company_name)
        and cb.seniority = p_seniority
        and cb.role_type = p_role_type;

    if found then return; end if;
  end if;

  -- Tier 2: Tier-level match
  return query
    select cb.domain, cb.target_score, cb.confidence, cb.source_notes, 'tier'::text as match_level
    from competency_benchmarks cb
    where cb.company_tier = p_tier
      and cb.seniority = p_seniority
      and cb.role_type = p_role_type
      and cb.company_name is null;

  if found then return; end if;

  -- Tier 3: STANDARD fallback
  return query
    select cb.domain, cb.target_score, cb.confidence, cb.source_notes, 'fallback'::text as match_level
    from competency_benchmarks cb
    where cb.company_tier = 'STANDARD'
      and cb.seniority = p_seniority
      and cb.role_type = 'general'
      and cb.company_name is null;
end;
$$;
