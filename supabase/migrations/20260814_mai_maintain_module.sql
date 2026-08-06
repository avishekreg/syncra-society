-- mAI Maintain: appliance ledger + RWA infrastructure radar + technician referrals
-- Soft licensing key: mai_maintain

create table if not exists public.maintain_appliances (
  id text primary key,
  society_id uuid not null references public.societies(id) on delete cascade,
  flat_number text not null,
  kind text not null check (kind in ('RO_FILTER', 'SPLIT_AC', 'CHIMNEY', 'GEYSER', 'OTHER')),
  label text not null,
  brand text,
  installed_on date,
  last_serviced_on date,
  next_service_due date not null,
  amc_expires_on date,
  service_cycle_days integer not null default 90,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists maintain_appliances_society_idx on public.maintain_appliances (society_id, flat_number);
create index if not exists maintain_appliances_due_idx on public.maintain_appliances (society_id, next_service_due);

create table if not exists public.maintain_infra_assets (
  id text primary key,
  society_id uuid not null references public.societies(id) on delete cascade,
  kind text not null check (kind in ('LIFT', 'DG_SET', 'FIRE_SAFETY')),
  label text not null,
  last_inspection_on date,
  next_due_on date not null,
  noc_expires_on date,
  running_hours numeric,
  red_flag boolean not null default false,
  meta jsonb,
  created_at timestamptz not null default now()
);

create index if not exists maintain_infra_society_idx on public.maintain_infra_assets (society_id, next_due_on);

create table if not exists public.maintain_technician_bookings (
  id text primary key,
  society_id uuid not null references public.societies(id) on delete cascade,
  flat_number text not null,
  appliance_id text,
  category text not null,
  preferred_slot text,
  status text not null default 'requested',
  referral_note text,
  created_at timestamptz not null default now()
);

create index if not exists maintain_bookings_society_idx on public.maintain_technician_bookings (society_id, created_at desc);

alter table public.maintain_appliances enable row level security;
alter table public.maintain_infra_assets enable row level security;
alter table public.maintain_technician_bookings enable row level security;

-- Permissive society-scoped policies (tighten with membership helpers in later hardening)
do $$ begin
  create policy maintain_appliances_all on public.maintain_appliances for all using (true) with check (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy maintain_infra_all on public.maintain_infra_assets for all using (true) with check (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy maintain_bookings_all on public.maintain_technician_bookings for all using (true) with check (true);
exception when duplicate_object then null;
end $$;

-- Extend seed_default_feature_toggles when the function exists (best-effort)
do $$
begin
  if exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where p.proname = 'seed_default_feature_toggles' and n.nspname = 'public'
  ) then
    -- no-op body change here; societies pick up mai_maintain via app catalog defaults
    null;
  end if;
end $$;
