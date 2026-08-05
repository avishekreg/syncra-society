-- mAI Space: Spatial Interior & Home Setup Intelligence
-- Depends on societies + flats; extends feature toggle seed/activate after botanist.

-- ---------------------------------------------------------------------------
-- Spatial room scans
-- ---------------------------------------------------------------------------
create table if not exists public.interior_spatial_scans (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  flat_id uuid not null references public.flats(id) on delete cascade,
  flat_number text not null,
  user_id text not null,
  room_type text not null check (room_type in ('LIVING_ROOM', 'BEDROOM', 'BALCONY', 'KITCHEN')),
  room_photo_url text,
  viewing_distance_ft numeric(8, 2) not null check (viewing_distance_ft > 0),
  recommended_tv_size_inches text not null,
  recommended_sofa_type text not null,
  acoustics_recommendation text not null,
  spatial_guidance jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_interior_scans_society
  on public.interior_spatial_scans(society_id, created_at desc);

create index if not exists idx_interior_scans_flat
  on public.interior_spatial_scans(society_id, flat_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Interior vendor monetization leads
-- ---------------------------------------------------------------------------
create table if not exists public.interior_vendor_leads (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  scan_id uuid references public.interior_spatial_scans(id) on delete set null,
  flat_id uuid not null references public.flats(id) on delete cascade,
  flat_number text not null,
  vendor_name text not null,
  vendor_category text not null default 'INTERIOR'
    check (vendor_category in ('INTERIOR', 'WOODCRAFT', 'ELECTRONICS', 'LIGHTING')),
  budget_range text not null,
  status text not null default 'LEAD_GENERATED'
    check (status in ('LEAD_GENERATED', 'CONNECTED', 'CLOSED')),
  notes text,
  created_by_user_id text,
  created_at timestamptz not null default now()
);

create index if not exists idx_interior_leads_society
  on public.interior_vendor_leads(society_id, status, created_at desc);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.interior_spatial_scans enable row level security;
alter table public.interior_vendor_leads enable row level security;

drop policy if exists "interior_scans_select" on public.interior_spatial_scans;
create policy "interior_scans_select" on public.interior_spatial_scans for select to authenticated
  using (
    society_id in (select public.auth_user_society_ids())
    and (
      public.auth_user_is_rwa_admin(society_id)
      or public.auth_user_owns_flat(society_id, flat_id)
      or user_id = auth.uid()::text
    )
  );

drop policy if exists "interior_scans_insert" on public.interior_spatial_scans;
create policy "interior_scans_insert" on public.interior_spatial_scans for insert to authenticated
  with check (
    society_id in (select public.auth_user_society_ids())
    and user_id = auth.uid()::text
  );

drop policy if exists "interior_scans_service" on public.interior_spatial_scans;
create policy "interior_scans_service" on public.interior_spatial_scans for all to service_role
  using (true) with check (true);

drop policy if exists "interior_leads_select" on public.interior_vendor_leads;
create policy "interior_leads_select" on public.interior_vendor_leads for select to authenticated
  using (
    society_id in (select public.auth_user_society_ids())
    and (
      public.auth_user_is_rwa_admin(society_id)
      or public.auth_user_owns_flat(society_id, flat_id)
      or created_by_user_id = auth.uid()::text
    )
  );

drop policy if exists "interior_leads_insert" on public.interior_vendor_leads;
create policy "interior_leads_insert" on public.interior_vendor_leads for insert to authenticated
  with check (society_id in (select public.auth_user_society_ids()));

drop policy if exists "interior_leads_update_admin" on public.interior_vendor_leads;
create policy "interior_leads_update_admin" on public.interior_vendor_leads for update to authenticated
  using (
    society_id in (select public.auth_user_society_ids())
    and public.auth_user_is_rwa_admin(society_id)
  );

drop policy if exists "interior_leads_service" on public.interior_vendor_leads;
create policy "interior_leads_service" on public.interior_vendor_leads for all to service_role
  using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Feature licensing seed + activate (includes botanist + mai_space)
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
    'mai_botanist',
    'mai_space'
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
    elsif normalized in ('space', 'mai_space_interior', 'interior', 'spatial') then
      normalized := 'mai_space';
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
      'mai_botanist',
      'mai_space'
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
          'mai_botanist',
          'mai_space'
        ])
      );
end;
$$;
