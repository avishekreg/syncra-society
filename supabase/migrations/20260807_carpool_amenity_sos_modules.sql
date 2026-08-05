-- Community & security ops: carpool, kid gate safety, amenities, emergency SOS.
-- Overstay uses visitor_logs (approved + not exited) with application-side timeout.

-- ---------------------------------------------------------------------------
-- Carpool (maiCommute)
-- ---------------------------------------------------------------------------
create table if not exists public.carpool_rides (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  offered_by_flat_id uuid not null references public.flats(id) on delete cascade,
  offered_by_flat_number text not null,
  offered_by_user_id text not null,
  destination text not null,
  departure_time timestamptz not null,
  available_seats integer not null check (available_seats >= 0),
  notes text,
  status text not null default 'ACTIVE'
    check (status in ('ACTIVE', 'COMPLETED', 'CANCELLED')),
  created_at timestamptz not null default now()
);

create index if not exists idx_carpool_rides_society_status
  on public.carpool_rides(society_id, status, departure_time);

create table if not exists public.carpool_requests (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid not null references public.carpool_rides(id) on delete cascade,
  passenger_user_id text not null,
  passenger_flat_id uuid not null references public.flats(id) on delete cascade,
  passenger_flat_number text not null,
  status text not null default 'PENDING'
    check (status in ('PENDING', 'ACCEPTED', 'REJECTED')),
  created_at timestamptz not null default now(),
  unique (ride_id, passenger_user_id)
);

create index if not exists idx_carpool_requests_ride on public.carpool_requests(ride_id, status);

-- ---------------------------------------------------------------------------
-- Kid gate safety
-- ---------------------------------------------------------------------------
create table if not exists public.kid_exit_approvals (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  flat_id uuid not null references public.flats(id) on delete cascade,
  flat_number text not null,
  kid_name text not null,
  accompanied_by text not null,
  valid_until timestamptz not null,
  status text not null default 'APPROVED'
    check (status in ('APPROVED', 'EXPIRED', 'USED')),
  created_by_user_id text,
  created_at timestamptz not null default now()
);

create index if not exists idx_kid_exit_approvals_flat
  on public.kid_exit_approvals(society_id, flat_id, status, valid_until);

-- ---------------------------------------------------------------------------
-- Amenities & bookings
-- ---------------------------------------------------------------------------
create table if not exists public.amenities (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  name text not null,
  capacity integer not null default 1 check (capacity > 0),
  slot_duration_mins integer not null default 60 check (slot_duration_mins > 0),
  pricing_type text not null default 'FREE' check (pricing_type in ('FREE', 'PAID')),
  price_per_slot numeric(12, 2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (society_id, name)
);

create index if not exists idx_amenities_society on public.amenities(society_id, is_active);

create table if not exists public.amenity_bookings (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  amenity_id uuid not null references public.amenities(id) on delete cascade,
  flat_id uuid not null references public.flats(id) on delete cascade,
  flat_number text not null,
  user_id text not null,
  booking_date date not null,
  start_time time not null,
  end_time time not null,
  amount_paid numeric(12, 2) not null default 0,
  status text not null default 'CONFIRMED'
    check (status in ('CONFIRMED', 'CANCELLED')),
  created_at timestamptz not null default now(),
  check (end_time > start_time)
);

create index if not exists idx_amenity_bookings_slot
  on public.amenity_bookings(amenity_id, booking_date, status);

-- ---------------------------------------------------------------------------
-- Emergency SOS
-- ---------------------------------------------------------------------------
create table if not exists public.emergency_sos_alerts (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  flat_id uuid not null references public.flats(id) on delete cascade,
  flat_number text not null,
  triggered_by_user_id text not null,
  alert_type text not null check (alert_type in ('MEDICAL', 'SECURITY', 'FIRE')),
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'RESOLVED')),
  resolved_by text,
  contact_phone text,
  notes text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists idx_emergency_sos_society_status
  on public.emergency_sos_alerts(society_id, status, created_at desc);

-- ---------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------
create or replace function public.accept_carpool_request(p_request_id uuid)
returns public.carpool_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  req public.carpool_requests;
  ride public.carpool_rides;
begin
  select * into req from public.carpool_requests where id = p_request_id for update;
  if not found then raise exception 'Carpool request not found'; end if;
  if req.status <> 'PENDING' then raise exception 'Request is not pending'; end if;

  select * into ride from public.carpool_rides where id = req.ride_id for update;
  if not found then raise exception 'Ride not found'; end if;
  if ride.status <> 'ACTIVE' then raise exception 'Ride is not active'; end if;
  if ride.available_seats < 1 then raise exception 'No seats available'; end if;
  if ride.offered_by_user_id <> auth.uid()::text and auth.role() <> 'service_role' then
    raise exception 'Only the ride host can accept requests';
  end if;

  update public.carpool_rides
  set available_seats = available_seats - 1,
      status = case when available_seats - 1 = 0 then 'COMPLETED' else status end
  where id = ride.id;

  update public.carpool_requests
  set status = 'ACCEPTED'
  where id = p_request_id
  returning * into req;

  return req;
end;
$$;

create or replace function public.book_amenity_slot(
  p_society_id uuid,
  p_amenity_id uuid,
  p_flat_id uuid,
  p_flat_number text,
  p_user_id text,
  p_booking_date date,
  p_start_time time,
  p_end_time time
)
returns public.amenity_bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  amenity public.amenities;
  overlap_count integer;
  booking public.amenity_bookings;
  amount numeric(12, 2);
begin
  select * into amenity from public.amenities where id = p_amenity_id and society_id = p_society_id;
  if not found or not amenity.is_active then
    raise exception 'Amenity not available';
  end if;
  if p_end_time <= p_start_time then
    raise exception 'Invalid slot window';
  end if;

  select count(*) into overlap_count
  from public.amenity_bookings b
  where b.amenity_id = p_amenity_id
    and b.booking_date = p_booking_date
    and b.status = 'CONFIRMED'
    and b.start_time < p_end_time
    and b.end_time > p_start_time;

  if overlap_count >= amenity.capacity then
    raise exception 'Slot unavailable — already booked';
  end if;

  amount := case when amenity.pricing_type = 'PAID' then amenity.price_per_slot else 0 end;

  insert into public.amenity_bookings (
    society_id, amenity_id, flat_id, flat_number, user_id,
    booking_date, start_time, end_time, amount_paid, status
  )
  values (
    p_society_id, p_amenity_id, p_flat_id, p_flat_number, p_user_id,
    p_booking_date, p_start_time, p_end_time, amount, 'CONFIRMED'
  )
  returning * into booking;

  return booking;
end;
$$;

create or replace function public.seed_default_amenities(p_society_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.amenities (society_id, name, capacity, slot_duration_mins, pricing_type, price_per_slot)
  values
    (p_society_id, 'Clubhouse', 1, 120, 'PAID', 999),
    (p_society_id, 'Swimming Pool', 20, 60, 'FREE', 0),
    (p_society_id, 'Tennis Court', 2, 60, 'FREE', 0),
    (p_society_id, 'Banquet Hall', 1, 180, 'PAID', 4999),
    (p_society_id, 'Guest Room', 2, 1440, 'PAID', 1499)
  on conflict (society_id, name) do nothing;
end;
$$;

grant execute on function public.accept_carpool_request(uuid) to authenticated, service_role;
grant execute on function public.book_amenity_slot(uuid, uuid, uuid, text, text, date, time, time) to authenticated, service_role;
grant execute on function public.seed_default_amenities(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.carpool_rides enable row level security;
alter table public.carpool_requests enable row level security;
alter table public.kid_exit_approvals enable row level security;
alter table public.amenities enable row level security;
alter table public.amenity_bookings enable row level security;
alter table public.emergency_sos_alerts enable row level security;

-- Carpool rides
drop policy if exists "carpool_rides_select" on public.carpool_rides;
create policy "carpool_rides_select" on public.carpool_rides for select to authenticated
  using (society_id in (select public.auth_user_society_ids()));

drop policy if exists "carpool_rides_insert" on public.carpool_rides;
create policy "carpool_rides_insert" on public.carpool_rides for insert to authenticated
  with check (
    society_id in (select public.auth_user_society_ids())
    and offered_by_user_id = auth.uid()::text
  );

drop policy if exists "carpool_rides_update" on public.carpool_rides;
create policy "carpool_rides_update" on public.carpool_rides for update to authenticated
  using (
    society_id in (select public.auth_user_society_ids())
    and (offered_by_user_id = auth.uid()::text or public.auth_user_is_rwa_admin(society_id))
  );

drop policy if exists "carpool_rides_service" on public.carpool_rides;
create policy "carpool_rides_service" on public.carpool_rides for all to service_role using (true) with check (true);

drop policy if exists "carpool_requests_select" on public.carpool_requests;
create policy "carpool_requests_select" on public.carpool_requests for select to authenticated
  using (
    exists (
      select 1 from public.carpool_rides r
      where r.id = ride_id and r.society_id in (select public.auth_user_society_ids())
    )
  );

drop policy if exists "carpool_requests_insert" on public.carpool_requests;
create policy "carpool_requests_insert" on public.carpool_requests for insert to authenticated
  with check (passenger_user_id = auth.uid()::text);

drop policy if exists "carpool_requests_update" on public.carpool_requests;
create policy "carpool_requests_update" on public.carpool_requests for update to authenticated
  using (
    exists (
      select 1 from public.carpool_rides r
      where r.id = ride_id
        and r.society_id in (select public.auth_user_society_ids())
        and (r.offered_by_user_id = auth.uid()::text or passenger_user_id = auth.uid()::text)
    )
  );

drop policy if exists "carpool_requests_service" on public.carpool_requests;
create policy "carpool_requests_service" on public.carpool_requests for all to service_role using (true) with check (true);

-- Kid exits
drop policy if exists "kid_exit_select" on public.kid_exit_approvals;
create policy "kid_exit_select" on public.kid_exit_approvals for select to authenticated
  using (
    society_id in (select public.auth_user_society_ids())
    and (
      public.auth_user_owns_flat(society_id, flat_id)
      or public.auth_user_is_rwa_admin(society_id)
      or public.auth_user_is_gatekeeper(society_id)
    )
  );

drop policy if exists "kid_exit_insert" on public.kid_exit_approvals;
create policy "kid_exit_insert" on public.kid_exit_approvals for insert to authenticated
  with check (
    society_id in (select public.auth_user_society_ids())
    and public.auth_user_owns_flat(society_id, flat_id)
  );

drop policy if exists "kid_exit_update" on public.kid_exit_approvals;
create policy "kid_exit_update" on public.kid_exit_approvals for update to authenticated
  using (
    society_id in (select public.auth_user_society_ids())
    and (
      public.auth_user_owns_flat(society_id, flat_id)
      or public.auth_user_is_rwa_admin(society_id)
      or public.auth_user_is_gatekeeper(society_id)
    )
  );

drop policy if exists "kid_exit_service" on public.kid_exit_approvals;
create policy "kid_exit_service" on public.kid_exit_approvals for all to service_role using (true) with check (true);

-- Amenities
drop policy if exists "amenities_select" on public.amenities;
create policy "amenities_select" on public.amenities for select to authenticated
  using (society_id in (select public.auth_user_society_ids()));

drop policy if exists "amenities_write_admin" on public.amenities;
create policy "amenities_write_admin" on public.amenities for all to authenticated
  using (public.auth_user_is_rwa_admin(society_id))
  with check (public.auth_user_is_rwa_admin(society_id));

drop policy if exists "amenities_service" on public.amenities;
create policy "amenities_service" on public.amenities for all to service_role using (true) with check (true);

drop policy if exists "amenity_bookings_select" on public.amenity_bookings;
create policy "amenity_bookings_select" on public.amenity_bookings for select to authenticated
  using (society_id in (select public.auth_user_society_ids()));

drop policy if exists "amenity_bookings_insert" on public.amenity_bookings;
create policy "amenity_bookings_insert" on public.amenity_bookings for insert to authenticated
  with check (
    society_id in (select public.auth_user_society_ids())
    and user_id = auth.uid()::text
  );

drop policy if exists "amenity_bookings_update" on public.amenity_bookings;
create policy "amenity_bookings_update" on public.amenity_bookings for update to authenticated
  using (
    society_id in (select public.auth_user_society_ids())
    and (user_id = auth.uid()::text or public.auth_user_is_rwa_admin(society_id))
  );

drop policy if exists "amenity_bookings_service" on public.amenity_bookings;
create policy "amenity_bookings_service" on public.amenity_bookings for all to service_role using (true) with check (true);

-- SOS
drop policy if exists "sos_select" on public.emergency_sos_alerts;
create policy "sos_select" on public.emergency_sos_alerts for select to authenticated
  using (society_id in (select public.auth_user_society_ids()));

drop policy if exists "sos_insert" on public.emergency_sos_alerts;
create policy "sos_insert" on public.emergency_sos_alerts for insert to authenticated
  with check (
    society_id in (select public.auth_user_society_ids())
    and triggered_by_user_id = auth.uid()::text
  );

drop policy if exists "sos_update" on public.emergency_sos_alerts;
create policy "sos_update" on public.emergency_sos_alerts for update to authenticated
  using (
    society_id in (select public.auth_user_society_ids())
    and (
      public.auth_user_is_rwa_admin(society_id)
      or public.auth_user_is_gatekeeper(society_id)
      or triggered_by_user_id = auth.uid()::text
    )
  );

drop policy if exists "sos_service" on public.emergency_sos_alerts;
create policy "sos_service" on public.emergency_sos_alerts for all to service_role using (true) with check (true);

-- Seed amenities for existing societies
do $$
declare
  sid uuid;
begin
  for sid in select id from public.societies loop
    perform public.seed_default_amenities(sid);
  end loop;
end $$;

-- Extend premium feature toggle seed with new community/security modules
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
    'mai_emergency_sos'
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

-- Allow checkout activation of the new premium community modules
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
      'mai_emergency_sos'
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
          'mai_emergency_sos'
        ])
      );
end;
$$;