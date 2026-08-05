-- maiList: Dual-engine rental + resale property syndication
-- Depends on societies + flats; extends feature toggle seed/activate.

create table if not exists public.property_market_listings (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  flat_id uuid not null references public.flats(id) on delete cascade,
  flat_number text not null,
  listed_by_user_id text not null,
  listing_purpose text not null check (listing_purpose in ('RENT', 'SALE')),
  -- Rental fields
  monthly_rent numeric(12, 2),
  security_deposit numeric(12, 2),
  available_from date,
  furnishing text check (furnishing is null or furnishing in ('UNFURNISHED', 'SEMI', 'FULLY')),
  -- Sale / resale fields
  expected_sale_price numeric(14, 2),
  carpet_area_sqft numeric(10, 2),
  super_area_sqft numeric(10, 2),
  price_per_sqft numeric(12, 2),
  ownership_type text check (ownership_type is null or ownership_type in ('FREEHOLD', 'LEASEHOLD', 'COOPERATIVE')),
  society_noc_status boolean not null default false,
  is_negotiable boolean not null default true,
  title_document_url text,
  -- Shared
  bhk text,
  parking_available boolean not null default false,
  parking_count integer not null default 0 check (parking_count >= 0),
  description text,
  contact_phone text,
  contact_email text,
  status text not null default 'DRAFT'
    check (status in ('DRAFT', 'PUBLISHED', 'SYNDICATED', 'CLOSED')),
  syndication_portals jsonb not null default '[]'::jsonb,
  syndication_payload jsonb,
  rwa_resale_badge jsonb,
  maintenance_dues_clear boolean not null default false,
  society_security_score integer check (society_security_score is null or society_security_score between 0 and 100),
  broadcast_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint property_listings_purpose_pricing check (
    (listing_purpose = 'RENT' and monthly_rent is not null)
    or (listing_purpose = 'SALE' and expected_sale_price is not null)
  )
);

create index if not exists idx_property_listings_society
  on public.property_market_listings(society_id, listing_purpose, status, created_at desc);

create table if not exists public.property_listing_inquiries (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  listing_id uuid not null references public.property_market_listings(id) on delete cascade,
  inquirer_user_id text,
  inquirer_name text not null,
  inquirer_phone text,
  inquirer_email text,
  message text,
  inquiry_type text not null default 'CONTACT'
    check (inquiry_type in ('CONTACT', 'HOME_LOAN', 'SITE_VISIT')),
  created_at timestamptz not null default now()
);

create index if not exists idx_property_inquiries_listing
  on public.property_listing_inquiries(listing_id, created_at desc);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.property_market_listings enable row level security;
alter table public.property_listing_inquiries enable row level security;

drop policy if exists "property_listings_select" on public.property_market_listings;
create policy "property_listings_select" on public.property_market_listings for select to authenticated
  using (
    society_id in (select public.auth_user_society_ids())
    and (
      status in ('PUBLISHED', 'SYNDICATED')
      or listed_by_user_id = auth.uid()::text
      or public.auth_user_is_rwa_admin(society_id)
    )
  );

drop policy if exists "property_listings_insert" on public.property_market_listings;
create policy "property_listings_insert" on public.property_market_listings for insert to authenticated
  with check (
    society_id in (select public.auth_user_society_ids())
    and listed_by_user_id = auth.uid()::text
  );

drop policy if exists "property_listings_update" on public.property_market_listings;
create policy "property_listings_update" on public.property_market_listings for update to authenticated
  using (
    society_id in (select public.auth_user_society_ids())
    and (
      listed_by_user_id = auth.uid()::text
      or public.auth_user_is_rwa_admin(society_id)
    )
  );

drop policy if exists "property_listings_service" on public.property_market_listings;
create policy "property_listings_service" on public.property_market_listings for all to service_role
  using (true) with check (true);

drop policy if exists "property_inquiries_select" on public.property_listing_inquiries;
create policy "property_inquiries_select" on public.property_listing_inquiries for select to authenticated
  using (
    society_id in (select public.auth_user_society_ids())
    and (
      inquirer_user_id = auth.uid()::text
      or public.auth_user_is_rwa_admin(society_id)
      or exists (
        select 1 from public.property_market_listings l
        where l.id = listing_id and l.listed_by_user_id = auth.uid()::text
      )
    )
  );

drop policy if exists "property_inquiries_insert" on public.property_listing_inquiries;
create policy "property_inquiries_insert" on public.property_listing_inquiries for insert to authenticated
  with check (society_id in (select public.auth_user_society_ids()));

drop policy if exists "property_inquiries_service" on public.property_listing_inquiries;
create policy "property_inquiries_service" on public.property_listing_inquiries for all to service_role
  using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Feature licensing
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
    'mai_space',
    'mai_list'
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
    elsif normalized in ('mailist', 'mai_list', 'rental_syndication', 'resale', 'property_listings') then
      normalized := 'mai_list';
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
      'mai_space',
      'mai_list'
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
          'mai_space',
          'mai_list'
        ])
      );
end;
$$;
