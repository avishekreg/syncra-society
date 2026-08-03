-- Super Admin Feature Control & zero-hardware module foundations.
-- Extends existing `societies` table (do not recreate).

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.is_platform_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    lower(coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '')) = 'super_admin'
    or lower(coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '')) = 'super_admin'
    or lower(coalesce(auth.jwt() ->> 'email', '')) in (
      'superadmin@syncra.com',
      'superadmin@syncrasystems.com'
    )
    or exists (
      select 1
      from public.user_and_flats uaf
      where uaf.user_id = auth.uid()::text
        and lower(uaf.role) = 'super_admin'
    ),
    false
  );
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Feature toggles
-- ---------------------------------------------------------------------------

create table if not exists public.feature_toggles (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  module_name text not null,
  is_enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (society_id, module_name)
);

create index if not exists idx_feature_toggles_society on public.feature_toggles(society_id);
create index if not exists idx_feature_toggles_module on public.feature_toggles(module_name);

drop trigger if exists trg_feature_toggles_updated_at on public.feature_toggles;
create trigger trg_feature_toggles_updated_at
  before update on public.feature_toggles
  for each row execute function public.touch_updated_at();

create or replace function public.seed_default_feature_toggles(p_society_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  modules text[] := array[
    'election_module',
    'ai_rwa_audit',
    'smart_parking',
    'vendor_sla',
    'resident_marketplace'
  ];
  module text;
begin
  foreach module in array modules loop
    insert into public.feature_toggles (society_id, module_name, is_enabled)
    values (p_society_id, module, false)
    on conflict (society_id, module_name) do nothing;
  end loop;
end;
$$;

create or replace function public.on_society_insert_seed_feature_toggles()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.seed_default_feature_toggles(new.id);
  return new;
end;
$$;

drop trigger if exists trg_societies_seed_feature_toggles on public.societies;
create trigger trg_societies_seed_feature_toggles
  after insert on public.societies
  for each row execute function public.on_society_insert_seed_feature_toggles();

-- Backfill existing societies
do $$
declare
  sid uuid;
begin
  for sid in select id from public.societies loop
    perform public.seed_default_feature_toggles(sid);
  end loop;
end $$;

alter table public.feature_toggles enable row level security;

drop policy if exists "feature_toggles_select_society_members" on public.feature_toggles;
create policy "feature_toggles_select_society_members"
  on public.feature_toggles
  for select
  to authenticated
  using (
    public.is_platform_super_admin()
    or society_id in (select public.auth_user_society_ids())
  );

drop policy if exists "feature_toggles_write_super_admin" on public.feature_toggles;
create policy "feature_toggles_write_super_admin"
  on public.feature_toggles
  for all
  to authenticated
  using (public.is_platform_super_admin())
  with check (public.is_platform_super_admin());

drop policy if exists "feature_toggles_service_all" on public.feature_toggles;
create policy "feature_toggles_service_all"
  on public.feature_toggles
  for all
  to service_role
  using (true)
  with check (true);

-- Super Admin toggle RPC (preferred write path)
create or replace function public.set_feature_toggle(
  p_society_id uuid,
  p_module_name text,
  p_is_enabled boolean
)
returns public.feature_toggles
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.feature_toggles;
begin
  if not public.is_platform_super_admin() then
    raise exception 'Only Super Admin can update feature toggles';
  end if;

  insert into public.feature_toggles (society_id, module_name, is_enabled, updated_at)
  values (p_society_id, p_module_name, p_is_enabled, now())
  on conflict (society_id, module_name)
  do update set
    is_enabled = excluded.is_enabled,
    updated_at = now()
  returning * into result;

  return result;
end;
$$;

grant execute on function public.set_feature_toggle(uuid, text, boolean) to authenticated;
grant execute on function public.seed_default_feature_toggles(uuid) to service_role;

do $$
begin
  alter publication supabase_realtime add table public.feature_toggles;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Smart Parking (crowdsourced, zero-hardware)
-- ---------------------------------------------------------------------------

create table if not exists public.parking_slots (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  flat_number text not null,
  slot_code text not null,
  is_static boolean not null default true,
  created_at timestamptz not null default now(),
  unique (society_id, slot_code)
);

create table if not exists public.parking_presence (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  flat_number text not null,
  status text not null default 'in_station'
    check (status in ('in_station', 'out_of_station')),
  updated_at timestamptz not null default now(),
  unique (society_id, flat_number)
);

create table if not exists public.parking_allocations (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  slot_id uuid not null references public.parking_slots(id) on delete cascade,
  visitor_label text not null,
  allocated_to_flat text,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  status text not null default 'active'
    check (status in ('active', 'released', 'expired')),
  created_at timestamptz not null default now()
);

create index if not exists idx_parking_slots_society on public.parking_slots(society_id);
create index if not exists idx_parking_allocations_society on public.parking_allocations(society_id);

alter table public.parking_slots enable row level security;
alter table public.parking_presence enable row level security;
alter table public.parking_allocations enable row level security;

drop policy if exists "parking_slots_society_rw" on public.parking_slots;
create policy "parking_slots_society_rw" on public.parking_slots
  for all to authenticated
  using (society_id in (select public.auth_user_society_ids()) or public.is_platform_super_admin())
  with check (society_id in (select public.auth_user_society_ids()) or public.is_platform_super_admin());

drop policy if exists "parking_presence_society_rw" on public.parking_presence;
create policy "parking_presence_society_rw" on public.parking_presence
  for all to authenticated
  using (society_id in (select public.auth_user_society_ids()) or public.is_platform_super_admin())
  with check (society_id in (select public.auth_user_society_ids()) or public.is_platform_super_admin());

drop policy if exists "parking_allocations_society_rw" on public.parking_allocations;
create policy "parking_allocations_society_rw" on public.parking_allocations
  for all to authenticated
  using (society_id in (select public.auth_user_society_ids()) or public.is_platform_super_admin())
  with check (society_id in (select public.auth_user_society_ids()) or public.is_platform_super_admin());

-- ---------------------------------------------------------------------------
-- Vendor SLA tracking
-- ---------------------------------------------------------------------------

create table if not exists public.vendor_sla_logs (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  category text not null check (category in ('housekeeping', 'security', 'maintenance', 'other')),
  rating integer not null check (rating between 1 and 5),
  comment text,
  submitted_by text,
  flat_number text,
  logged_on date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists idx_vendor_sla_logs_society_date
  on public.vendor_sla_logs(society_id, logged_on desc);

alter table public.vendor_sla_logs enable row level security;

drop policy if exists "vendor_sla_logs_society_rw" on public.vendor_sla_logs;
create policy "vendor_sla_logs_society_rw" on public.vendor_sla_logs
  for all to authenticated
  using (society_id in (select public.auth_user_society_ids()) or public.is_platform_super_admin())
  with check (society_id in (select public.auth_user_society_ids()) or public.is_platform_super_admin());

-- ---------------------------------------------------------------------------
-- AI RWA Audit / Society Health Index
-- ---------------------------------------------------------------------------

create table if not exists public.society_health_snapshots (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  period_month date not null,
  collection_pct numeric(5, 2) not null default 0,
  utility_promptness_pct numeric(5, 2) not null default 0,
  complaint_sla_pct numeric(5, 2) not null default 0,
  health_index numeric(5, 2) not null default 0,
  notes text,
  computed_at timestamptz not null default now(),
  unique (society_id, period_month)
);

alter table public.society_health_snapshots enable row level security;

drop policy if exists "society_health_snapshots_society_rw" on public.society_health_snapshots;
create policy "society_health_snapshots_society_rw" on public.society_health_snapshots
  for all to authenticated
  using (society_id in (select public.auth_user_society_ids()) or public.is_platform_super_admin())
  with check (society_id in (select public.auth_user_society_ids()) or public.is_platform_super_admin());
