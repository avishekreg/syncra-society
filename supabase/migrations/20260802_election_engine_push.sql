-- mAI Society Election Engine + Push Notification logs
-- Ballot secrecy: participation seals (flat-bound) are separate from anonymous ballots (no flat_id).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Elections
-- ---------------------------------------------------------------------------
create table if not exists public.society_elections (
  id uuid primary key default gen_random_uuid(),
  society_id text not null,
  title text not null,
  description text not null default '',
  status text not null default 'draft'
    check (status in ('draft', 'open', 'closed', 'published')),
  positions jsonb not null default '[]'::jsonb,
  public_key jsonb,
  locked_private_key text,
  private_key_destroyed_at timestamptz,
  pepper text not null,
  eligible_flat_count integer not null default 0,
  eligible_flat_ids jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  opened_at timestamptz,
  closed_at timestamptz,
  published_at timestamptz,
  closes_at timestamptz
);

create index if not exists society_elections_society_idx
  on public.society_elections (society_id, created_at desc);

create index if not exists society_elections_status_idx
  on public.society_elections (society_id, status);

-- Participation seals: prove Flat X voted for a position (1 flat = 1 vote).
-- NEVER store candidate choice here.
create table if not exists public.election_participation_seals (
  id uuid primary key default gen_random_uuid(),
  election_id uuid not null references public.society_elections (id) on delete cascade,
  society_id text not null,
  position_id text not null,
  flat_id text not null,
  seal_hash text not null,
  cast_at timestamptz not null default now(),
  unique (election_id, position_id, flat_id),
  unique (election_id, position_id, seal_hash)
);

create index if not exists election_seals_election_idx
  on public.election_participation_seals (election_id, position_id);

-- Anonymous ballots: encrypted candidate choice with NO flat/voter identity.
create table if not exists public.election_anonymous_ballots (
  id uuid primary key default gen_random_uuid(),
  election_id uuid not null references public.society_elections (id) on delete cascade,
  society_id text not null,
  position_id text not null,
  encrypted_choice text not null,
  cast_at timestamptz not null default now()
);

create index if not exists election_ballots_election_idx
  on public.election_anonymous_ballots (election_id, position_id);

-- Published aggregate bulletin (immutable after publish).
create table if not exists public.election_published_bulletins (
  id uuid primary key default gen_random_uuid(),
  election_id uuid not null unique references public.society_elections (id) on delete cascade,
  society_id text not null,
  title text not null,
  description text not null default '',
  published_at timestamptz not null default now(),
  opened_at timestamptz,
  closed_at timestamptz,
  eligible_flat_count integer not null default 0,
  total_ballots integer not null default 0,
  position_results jsonb not null default '[]'::jsonb,
  integrity jsonb not null default '{}'::jsonb,
  secrecy_statement text not null default
    'Individual ballots are secret. Only aggregate results are published. No flat-to-candidate link exists in this system.'
);

create index if not exists election_bulletins_society_idx
  on public.election_published_bulletins (society_id, published_at desc);

-- Push notification dispatch log
create table if not exists public.push_notification_logs (
  id uuid primary key default gen_random_uuid(),
  society_id text not null,
  event_type text not null,
  title text not null,
  body text not null,
  target_url text,
  audience text not null default 'society',
  flat_id text,
  channel text not null default 'in_app',
  status text not null default 'dispatched',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists push_notification_logs_society_idx
  on public.push_notification_logs (society_id, created_at desc);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.society_elections enable row level security;
alter table public.election_participation_seals enable row level security;
alter table public.election_anonymous_ballots enable row level security;
alter table public.election_published_bulletins enable row level security;
alter table public.push_notification_logs enable row level security;

-- Demo-friendly authenticated access (mirrors notices pattern); tighten with auth_user_society_ids() in production.
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'society_elections' and policyname = 'elections_read'
  ) then
    create policy elections_read on public.society_elections for select using (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'society_elections' and policyname = 'elections_write'
  ) then
    create policy elections_write on public.society_elections for all using (true) with check (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'election_participation_seals' and policyname = 'election_seals_all'
  ) then
    create policy election_seals_all on public.election_participation_seals for all using (true) with check (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'election_anonymous_ballots' and policyname = 'election_ballots_all'
  ) then
    create policy election_ballots_all on public.election_anonymous_ballots for all using (true) with check (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'election_published_bulletins' and policyname = 'election_bulletins_all'
  ) then
    create policy election_bulletins_all on public.election_published_bulletins for all using (true) with check (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'push_notification_logs' and policyname = 'push_logs_all'
  ) then
    create policy push_logs_all on public.push_notification_logs for all using (true) with check (true);
  end if;
end $$;

grant select, insert, update, delete on public.society_elections to anon, authenticated, service_role;
grant select, insert, update, delete on public.election_participation_seals to anon, authenticated, service_role;
grant select, insert, update, delete on public.election_anonymous_ballots to anon, authenticated, service_role;
grant select, insert, update, delete on public.election_published_bulletins to anon, authenticated, service_role;
grant select, insert, update, delete on public.push_notification_logs to anon, authenticated, service_role;
