-- mAI Botanist & Green Society Intelligence
-- Depends on societies + flats (gatekeeper) and feature toggle helpers (20260807+).

-- ---------------------------------------------------------------------------
-- Botanical assets (QR-tagged trees / plants)
-- ---------------------------------------------------------------------------
create table if not exists public.society_botanical_assets (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  plant_name text not null,
  species text,
  qr_tag_code text not null,
  location_zone text not null,
  planted_date date,
  adopted_by_flat_id uuid references public.flats(id) on delete set null,
  adopted_by_flat_number text,
  health_status text not null default 'HEALTHY'
    check (health_status in ('HEALTHY', 'NEEDS_CARE', 'TREATED')),
  carbon_offset_kg numeric(12, 2) not null default 0,
  photo_url text,
  last_diagnosis text,
  care_steps text,
  created_at timestamptz not null default now(),
  unique (qr_tag_code),
  unique (society_id, qr_tag_code)
);

create index if not exists idx_botanical_assets_society
  on public.society_botanical_assets(society_id, health_status, created_at desc);

-- ---------------------------------------------------------------------------
-- Gardening task dispatcher
-- ---------------------------------------------------------------------------
create table if not exists public.gardening_tasks (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  botanical_asset_id uuid references public.society_botanical_assets(id) on delete set null,
  task_type text not null check (task_type in ('WATERING', 'FERTILIZER', 'PRUNING', 'PEST_CONTROL')),
  assigned_gardener_name text not null,
  scheduled_for date not null,
  status text not null default 'PENDING' check (status in ('PENDING', 'COMPLETED')),
  water_liters numeric(10, 2) default 0,
  fertilizer_kg numeric(10, 2) default 0,
  weather_note text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_gardening_tasks_society
  on public.gardening_tasks(society_id, status, scheduled_for desc);

-- ---------------------------------------------------------------------------
-- Compost inventory + resident doorstep orders
-- ---------------------------------------------------------------------------
create table if not exists public.green_compost_inventory (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  batch_number text not null,
  total_weight_kg numeric(12, 2) not null check (total_weight_kg >= 0),
  available_for_residents_kg numeric(12, 2) not null check (available_for_residents_kg >= 0),
  price_per_kg numeric(12, 2) not null default 0 check (price_per_kg >= 0),
  created_at timestamptz not null default now(),
  unique (society_id, batch_number)
);

create index if not exists idx_green_compost_society
  on public.green_compost_inventory(society_id, created_at desc);

create table if not exists public.green_compost_orders (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  inventory_id uuid not null references public.green_compost_inventory(id) on delete cascade,
  flat_id uuid not null references public.flats(id) on delete cascade,
  flat_number text not null,
  requested_by_user_id text not null,
  quantity_kg numeric(12, 2) not null check (quantity_kg > 0),
  status text not null default 'REQUESTED'
    check (status in ('REQUESTED', 'DELIVERED', 'CANCELLED')),
  created_at timestamptz not null default now()
);

create index if not exists idx_green_compost_orders_society
  on public.green_compost_orders(society_id, status, created_at desc);

-- ---------------------------------------------------------------------------
-- Plant & seed swap exchange
-- ---------------------------------------------------------------------------
create table if not exists public.plant_swap_listings (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  offered_by_flat_id uuid not null references public.flats(id) on delete cascade,
  offered_by_flat_number text not null,
  offered_by_user_id text not null,
  title text not null,
  plant_type text not null check (plant_type in ('CUTTING', 'POTTED', 'SEEDS', 'SAPLING')),
  description text,
  status text not null default 'AVAILABLE'
    check (status in ('AVAILABLE', 'CLAIMED', 'CLOSED')),
  claimed_by_flat_number text,
  created_at timestamptz not null default now()
);

create index if not exists idx_plant_swap_society
  on public.plant_swap_listings(society_id, status, created_at desc);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.society_botanical_assets enable row level security;
alter table public.gardening_tasks enable row level security;
alter table public.green_compost_inventory enable row level security;
alter table public.green_compost_orders enable row level security;
alter table public.plant_swap_listings enable row level security;

drop policy if exists "botanical_select" on public.society_botanical_assets;
create policy "botanical_select" on public.society_botanical_assets for select to authenticated
  using (society_id in (select public.auth_user_society_ids()));

drop policy if exists "botanical_write" on public.society_botanical_assets;
create policy "botanical_write" on public.society_botanical_assets for all to authenticated
  using (
    society_id in (select public.auth_user_society_ids())
    and (
      public.auth_user_is_rwa_admin(society_id)
      or adopted_by_flat_id is null
      or public.auth_user_owns_flat(society_id, adopted_by_flat_id)
    )
  )
  with check (society_id in (select public.auth_user_society_ids()));

drop policy if exists "botanical_service" on public.society_botanical_assets;
create policy "botanical_service" on public.society_botanical_assets for all to service_role
  using (true) with check (true);

drop policy if exists "gardening_select" on public.gardening_tasks;
create policy "gardening_select" on public.gardening_tasks for select to authenticated
  using (society_id in (select public.auth_user_society_ids()));

drop policy if exists "gardening_admin_write" on public.gardening_tasks;
create policy "gardening_admin_write" on public.gardening_tasks for all to authenticated
  using (
    society_id in (select public.auth_user_society_ids())
    and public.auth_user_is_rwa_admin(society_id)
  )
  with check (
    society_id in (select public.auth_user_society_ids())
    and public.auth_user_is_rwa_admin(society_id)
  );

drop policy if exists "gardening_service" on public.gardening_tasks;
create policy "gardening_service" on public.gardening_tasks for all to service_role
  using (true) with check (true);

drop policy if exists "compost_inv_select" on public.green_compost_inventory;
create policy "compost_inv_select" on public.green_compost_inventory for select to authenticated
  using (society_id in (select public.auth_user_society_ids()));

drop policy if exists "compost_inv_admin" on public.green_compost_inventory;
create policy "compost_inv_admin" on public.green_compost_inventory for all to authenticated
  using (
    society_id in (select public.auth_user_society_ids())
    and public.auth_user_is_rwa_admin(society_id)
  )
  with check (
    society_id in (select public.auth_user_society_ids())
    and public.auth_user_is_rwa_admin(society_id)
  );

drop policy if exists "compost_inv_service" on public.green_compost_inventory;
create policy "compost_inv_service" on public.green_compost_inventory for all to service_role
  using (true) with check (true);

drop policy if exists "compost_orders_select" on public.green_compost_orders;
create policy "compost_orders_select" on public.green_compost_orders for select to authenticated
  using (society_id in (select public.auth_user_society_ids()));

drop policy if exists "compost_orders_insert" on public.green_compost_orders;
create policy "compost_orders_insert" on public.green_compost_orders for insert to authenticated
  with check (
    society_id in (select public.auth_user_society_ids())
    and requested_by_user_id = auth.uid()::text
  );

drop policy if exists "compost_orders_update" on public.green_compost_orders;
create policy "compost_orders_update" on public.green_compost_orders for update to authenticated
  using (
    society_id in (select public.auth_user_society_ids())
    and (
      requested_by_user_id = auth.uid()::text
      or public.auth_user_is_rwa_admin(society_id)
    )
  );

drop policy if exists "compost_orders_service" on public.green_compost_orders;
create policy "compost_orders_service" on public.green_compost_orders for all to service_role
  using (true) with check (true);

drop policy if exists "plant_swap_select" on public.plant_swap_listings;
create policy "plant_swap_select" on public.plant_swap_listings for select to authenticated
  using (society_id in (select public.auth_user_society_ids()));

drop policy if exists "plant_swap_insert" on public.plant_swap_listings;
create policy "plant_swap_insert" on public.plant_swap_listings for insert to authenticated
  with check (
    society_id in (select public.auth_user_society_ids())
    and offered_by_user_id = auth.uid()::text
  );

drop policy if exists "plant_swap_update" on public.plant_swap_listings;
create policy "plant_swap_update" on public.plant_swap_listings for update to authenticated
  using (society_id in (select public.auth_user_society_ids()));

drop policy if exists "plant_swap_service" on public.plant_swap_listings;
create policy "plant_swap_service" on public.plant_swap_listings for all to service_role
  using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Feature licensing: seed + activate (includes intelligence + botanist)
-- ---------------------------------------------------------------------------
create or replace function public.seed_default_feature_toggles(p_society_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  premium_modules text[] := array[
    'whatsapp_automation',
    'election_module',
    'ai_rwa_audit',
    'smart_parking',
    'vendor_sla',
    'resident_marketplace',
    'mai_commute',
    'kid_gatekeeper',
    'amenity_booking',
    'mai_emergency_sos',
    'mai_auditor',
    'mai_energy',
    'mai_vote_recall',
    'mai_guardian',
    'mai_nyaya',
    'mai_find_asset',
    'mai_botanist'
  ];
  module text;
begin
  if p_society_id is null then
    raise exception 'society_id is required';
  end if;

  foreach module in array premium_modules loop
    insert into public.feature_toggles (society_id, module_name, is_enabled, source)
    values (p_society_id, module, false, 'base')
    on conflict (society_id, module_name) do nothing;
  end loop;
end;
$$;

do $$
declare
  sid uuid;
begin
  for sid in select id from public.societies loop
    perform public.seed_default_feature_toggles(sid);
  end loop;
end $$;

create or replace function public.activate_society_addons(
  p_society_id uuid,
  p_modules text[]
)
returns setof public.feature_toggles
language plpgsql
security definer
set search_path = public
as $$
declare
  module text;
  normalized text;
begin
  if p_society_id is null then
    raise exception 'society_id is required';
  end if;

  perform public.seed_default_feature_toggles(p_society_id);

  if p_modules is null then
    return;
  end if;

  foreach module in array p_modules loop
    normalized := lower(trim(module));
    if normalized in ('whatsapp_alerts', 'whatsappalerts', 'whatsapp') then
      normalized := 'whatsapp_automation';
    elsif normalized in ('election_engine', 'electionmodule', 'elections') then
      normalized := 'election_module';
    elsif normalized in ('ai_audit', 'airwaaudit') then
      normalized := 'ai_rwa_audit';
    elsif normalized in ('smartparking') then
      normalized := 'smart_parking';
    elsif normalized in ('vendorsla') then
      normalized := 'vendor_sla';
    elsif normalized in ('marketplace', 'residentmarketplace') then
      normalized := 'resident_marketplace';
    elsif normalized in ('carpool', 'maicommute') then
      normalized := 'mai_commute';
    elsif normalized in ('kid_safety', 'kidgatekeeper') then
      normalized := 'kid_gatekeeper';
    elsif normalized in ('amenities', 'amenity') then
      normalized := 'amenity_booking';
    elsif normalized in ('sos', 'emergency_sos', 'maiemergency') then
      normalized := 'mai_emergency_sos';
    elsif normalized in ('auditor') then
      normalized := 'mai_auditor';
    elsif normalized in ('energy', 'maienergy') then
      normalized := 'mai_energy';
    elsif normalized in ('recall', 'impeachment') then
      normalized := 'mai_vote_recall';
    elsif normalized in ('guardian') then
      normalized := 'mai_guardian';
    elsif normalized in ('nyaya', 'mediation') then
      normalized := 'mai_nyaya';
    elsif normalized in ('find_asset', 'asset_finder') then
      normalized := 'mai_find_asset';
    elsif normalized in ('botanist', 'green_society', 'mai_green', 'compost') then
      normalized := 'mai_botanist';
    end if;

    if normalized not in (
      'whatsapp_automation',
      'election_module',
      'ai_rwa_audit',
      'smart_parking',
      'vendor_sla',
      'resident_marketplace',
      'mai_commute',
      'kid_gatekeeper',
      'amenity_booking',
      'mai_emergency_sos',
      'mai_auditor',
      'mai_energy',
      'mai_vote_recall',
      'mai_guardian',
      'mai_nyaya',
      'mai_find_asset',
      'mai_botanist'
    ) then
      continue;
    end if;

    insert into public.feature_toggles (society_id, module_name, is_enabled, source, updated_at)
    values (p_society_id, normalized, true, 'purchased', now())
    on conflict (society_id, module_name)
    do update set
      is_enabled = true,
      source = case
        when public.feature_toggles.source = 'super_admin' then 'super_admin'
        else 'purchased'
      end,
      updated_at = now();
  end loop;

  return query
    select *
    from public.feature_toggles
    where society_id = p_society_id
      and module_name = any (
        select unnest(array[
          'whatsapp_automation',
          'election_module',
          'ai_rwa_audit',
          'smart_parking',
          'vendor_sla',
          'resident_marketplace',
          'mai_commute',
          'kid_gatekeeper',
          'amenity_booking',
          'mai_emergency_sos',
          'mai_auditor',
          'mai_energy',
          'mai_vote_recall',
          'mai_guardian',
          'mai_nyaya',
          'mai_find_asset',
          'mai_botanist'
        ])
      );
end;
$$;
