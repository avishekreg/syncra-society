-- User profiles, username auth, multi-flat mapping, gatekeeper role, and society-scoped RLS.

create table if not exists public.user_and_flats (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  society_id uuid not null references public.societies(id) on delete cascade,
  flat_number text not null,
  name text not null,
  username text,
  phone text,
  whatsapp_number text,
  email text,
  avatar_url text,
  role text not null default 'resident'
    check (role in ('resident', 'rwa_owner', 'rwa_secretary', 'rwa_accountant', 'gatekeeper')),
  requires_password_change boolean not null default false,
  opening_outstanding_balance numeric(14, 2) default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (society_id, username),
  unique (society_id, user_id, flat_number)
);

create index if not exists idx_user_and_flats_user_id on public.user_and_flats(user_id);
create index if not exists idx_user_and_flats_society on public.user_and_flats(society_id);
create index if not exists idx_user_and_flats_username on public.user_and_flats(society_id, username);

alter table public.user_and_flats enable row level security;

create or replace function public.auth_user_society_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select distinct uaf.society_id
  from public.user_and_flats uaf
  where uaf.user_id = auth.uid()::text;
$$;

drop policy if exists "user_and_flats_read_own_society" on public.user_and_flats;
create policy "user_and_flats_read_own_society"
  on public.user_and_flats
  for select
  to authenticated
  using (society_id in (select public.auth_user_society_ids()));

drop policy if exists "user_and_flats_update_own_row" on public.user_and_flats;
create policy "user_and_flats_update_own_row"
  on public.user_and_flats
  for update
  to authenticated
  using (user_id = auth.uid()::text)
  with check (user_id = auth.uid()::text);

drop policy if exists "user_and_flats_service_all" on public.user_and_flats;
create policy "user_and_flats_service_all"
  on public.user_and_flats
  for all
  to service_role
  using (true)
  with check (true);

-- Society-scoped visitor logs (gatekeeper portal)
alter table if exists public.visitor_logs enable row level security;

drop policy if exists "visitor_logs_read_own_society" on public.visitor_logs;
create policy "visitor_logs_read_own_society"
  on public.visitor_logs
  for select
  to authenticated
  using (society_id in (select public.auth_user_society_ids()));

drop policy if exists "visitor_logs_write_own_society" on public.visitor_logs;
create policy "visitor_logs_write_own_society"
  on public.visitor_logs
  for insert
  to authenticated
  with check (society_id in (select public.auth_user_society_ids()));

drop policy if exists "visitor_logs_update_own_society" on public.visitor_logs;
create policy "visitor_logs_update_own_society"
  on public.visitor_logs
  for update
  to authenticated
  using (society_id in (select public.auth_user_society_ids()))
  with check (society_id in (select public.auth_user_society_ids()));

drop policy if exists "visitor_logs_service_all" on public.visitor_logs;
create policy "visitor_logs_service_all"
  on public.visitor_logs
  for all
  to service_role
  using (true)
  with check (true);
