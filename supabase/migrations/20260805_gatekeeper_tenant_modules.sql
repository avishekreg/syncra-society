-- Gatekeeper ops: recurring staff passes, delivery pre-approvals, tenant lifecycle.
-- Aligns with maiSociety flat+society membership model (user_and_flats).

-- Ensure flats registry exists for UUID FKs (idempotent with schema.sql).
create table if not exists public.flats (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  flat_number text not null,
  owner_name text not null default '',
  owner_phone text not null default '',
  created_at timestamptz not null default now(),
  unique (society_id, flat_number)
);

create index if not exists idx_flats_society on public.flats(society_id);

alter table public.flats enable row level security;

drop policy if exists "flats_read_own_society" on public.flats;
create policy "flats_read_own_society"
  on public.flats for select to authenticated
  using (society_id in (select public.auth_user_society_ids()));

drop policy if exists "flats_write_own_society" on public.flats;
create policy "flats_write_own_society"
  on public.flats for insert to authenticated
  with check (society_id in (select public.auth_user_society_ids()));

drop policy if exists "flats_service_all" on public.flats;
create policy "flats_service_all"
  on public.flats for all to service_role
  using (true) with check (true);

-- Occupancy identity on membership rows (no separate users/profiles table).
alter table public.user_and_flats
  add column if not exists user_type text not null default 'OWNER'
    check (user_type in ('OWNER', 'TENANT')),
  add column if not exists linked_flat_id uuid references public.flats(id) on delete set null,
  add column if not exists notification_primary boolean not null default true;

create index if not exists idx_user_and_flats_linked_flat
  on public.user_and_flats(linked_flat_id);

-- ---------------------------------------------------------------------------
-- 1) Regular staff recurring passes
-- ---------------------------------------------------------------------------
create table if not exists public.regular_staff (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  flat_id uuid not null references public.flats(id) on delete cascade,
  flat_number text not null,
  name text not null,
  role text not null,
  phone text,
  qr_pass_code text not null unique,
  allowed_time_start time not null default '06:00',
  allowed_time_end time not null default '22:00',
  is_active boolean not null default true,
  created_by_user_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_regular_staff_society on public.regular_staff(society_id);
create index if not exists idx_regular_staff_flat on public.regular_staff(flat_id);
create index if not exists idx_regular_staff_active on public.regular_staff(society_id, is_active)
  where is_active = true;

create table if not exists public.staff_entry_logs (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  staff_id uuid not null references public.regular_staff(id) on delete cascade,
  scanned_by_user_id text,
  outside_window boolean not null default false,
  override_used boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_staff_entry_logs_society
  on public.staff_entry_logs(society_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 2) Delivery pre-approvals
-- ---------------------------------------------------------------------------
create table if not exists public.delivery_pre_approvals (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  flat_id uuid not null references public.flats(id) on delete cascade,
  flat_number text not null,
  service_provider text not null
    check (service_provider in (
      'Swiggy', 'Zomato', 'Blinkit', 'Zepto', 'BigBasket',
      'Amazon', 'Flipkart', 'Blue Dart', 'Delhivery', 'DTDC', 'Xpressbees', 'Shadowfax',
      'India Post / Speed Post', 'Registered Parcel',
      'Generic Courier / Parcel'
    )),
  expected_window_end timestamptz not null,
  status text not null default 'PRE_APPROVED'
    check (status in ('PRE_APPROVED', 'COMPLETED', 'EXPIRED')),
  created_by_user_id text,
  created_at timestamptz not null default now()
);

create index if not exists idx_delivery_pre_approvals_society
  on public.delivery_pre_approvals(society_id, status);
create index if not exists idx_delivery_pre_approvals_window
  on public.delivery_pre_approvals(expected_window_end)
  where status = 'PRE_APPROVED';

-- ---------------------------------------------------------------------------
-- 3) Tenant lifecycle / lease approval
-- ---------------------------------------------------------------------------
create table if not exists public.tenant_requests (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  flat_id uuid not null references public.flats(id) on delete cascade,
  flat_number text not null,
  owner_id text not null,
  tenant_name text not null,
  tenant_phone text not null,
  tenant_email text,
  occupants_count integer not null default 1 check (occupants_count > 0),
  lease_start_date date not null,
  lease_end_date date not null,
  agreement_doc_url text,
  status text not null default 'PENDING_APPROVAL'
    check (status in ('PENDING_APPROVAL', 'APPROVED', 'REJECTED')),
  approved_by text,
  rejection_reason text,
  tenant_user_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (lease_end_date >= lease_start_date)
);

create index if not exists idx_tenant_requests_society_status
  on public.tenant_requests(society_id, status, created_at desc);
create index if not exists idx_tenant_requests_owner
  on public.tenant_requests(owner_id);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.auth_user_is_rwa_admin(p_society_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_and_flats uaf
    where uaf.society_id = p_society_id
      and uaf.user_id = auth.uid()::text
      and uaf.role in ('rwa_owner', 'rwa_secretary')
  );
$$;

create or replace function public.auth_user_is_gatekeeper(p_society_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_and_flats uaf
    where uaf.society_id = p_society_id
      and uaf.user_id = auth.uid()::text
      and uaf.role = 'gatekeeper'
  );
$$;

create or replace function public.auth_user_owns_flat(p_society_id uuid, p_flat_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_and_flats uaf
    join public.flats f on f.id = p_flat_id and f.society_id = uaf.society_id
    where uaf.society_id = p_society_id
      and uaf.user_id = auth.uid()::text
      and (
        uaf.linked_flat_id = p_flat_id
        or lower(uaf.flat_number) = lower(f.flat_number)
      )
  );
$$;

create or replace function public.ensure_society_flat(
  p_society_id uuid,
  p_flat_number text,
  p_owner_name text default '',
  p_owner_phone text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_flat text := trim(p_flat_number);
begin
  if p_society_id is null or v_flat = '' then
    raise exception 'society_id and flat_number are required';
  end if;

  select id into v_id
  from public.flats
  where society_id = p_society_id and lower(flat_number) = lower(v_flat)
  limit 1;

  if v_id is null then
    insert into public.flats (society_id, flat_number, owner_name, owner_phone)
    values (p_society_id, v_flat, coalesce(nullif(p_owner_name, ''), 'Owner'), coalesce(p_owner_phone, ''))
    returning id into v_id;
  end if;

  return v_id;
end;
$$;

-- Expire stale delivery windows
create or replace function public.expire_delivery_pre_approvals()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count integer;
begin
  update public.delivery_pre_approvals
  set status = 'EXPIRED'
  where status = 'PRE_APPROVED'
    and expected_window_end < now();
  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

-- Tenant approval: mark approved, link TENANT profile, shift notice/alert primary to tenant.
create or replace function public.approve_tenant_request(request_id uuid)
returns public.tenant_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  req public.tenant_requests;
  tenant_uid text;
begin
  select * into req from public.tenant_requests where id = request_id for update;
  if not found then
    raise exception 'Tenant request not found';
  end if;

  if not public.auth_user_is_rwa_admin(req.society_id)
     and auth.role() <> 'service_role' then
    raise exception 'Only RWA admin/president can approve tenant requests';
  end if;

  if req.status <> 'PENDING_APPROVAL' then
    raise exception 'Request is not pending approval';
  end if;

  -- Prefer existing auth user by email; otherwise keep placeholder until invite accepts.
  tenant_uid := coalesce(req.tenant_user_id, req.tenant_email, 'tenant:' || req.id::text);

  insert into public.user_and_flats (
    user_id, society_id, flat_number, name, phone, email, role, user_type, linked_flat_id, notification_primary
  )
  values (
    tenant_uid,
    req.society_id,
    req.flat_number,
    req.tenant_name,
    req.tenant_phone,
    req.tenant_email,
    'resident',
    'TENANT',
    req.flat_id,
    true
  )
  on conflict (society_id, user_id, flat_number) do update
    set user_type = 'TENANT',
        linked_flat_id = excluded.linked_flat_id,
        notification_primary = true,
        name = excluded.name,
        phone = excluded.phone,
        email = excluded.email,
        updated_at = now();

  -- Owner retains financial audit access but is no longer primary for ops alerts.
  update public.user_and_flats
  set notification_primary = false,
      user_type = 'OWNER',
      linked_flat_id = coalesce(linked_flat_id, req.flat_id),
      updated_at = now()
  where society_id = req.society_id
    and user_id = req.owner_id
    and lower(flat_number) = lower(req.flat_number);

  update public.tenant_requests
  set status = 'APPROVED',
      approved_by = coalesce(auth.uid()::text, req.approved_by),
      tenant_user_id = tenant_uid,
      updated_at = now()
  where id = request_id
  returning * into req;

  return req;
end;
$$;

create or replace function public.reject_tenant_request(request_id uuid, p_reason text default null)
returns public.tenant_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  req public.tenant_requests;
begin
  select * into req from public.tenant_requests where id = request_id for update;
  if not found then
    raise exception 'Tenant request not found';
  end if;

  if not public.auth_user_is_rwa_admin(req.society_id)
     and auth.role() <> 'service_role' then
    raise exception 'Only RWA admin/president can reject tenant requests';
  end if;

  update public.tenant_requests
  set status = 'REJECTED',
      approved_by = coalesce(auth.uid()::text, req.approved_by),
      rejection_reason = p_reason,
      updated_at = now()
  where id = request_id
  returning * into req;

  return req;
end;
$$;

grant execute on function public.ensure_society_flat(uuid, text, text, text) to authenticated, service_role;
grant execute on function public.expire_delivery_pre_approvals() to authenticated, service_role;
grant execute on function public.approve_tenant_request(uuid) to authenticated, service_role;
grant execute on function public.reject_tenant_request(uuid, text) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.regular_staff enable row level security;
alter table public.staff_entry_logs enable row level security;
alter table public.delivery_pre_approvals enable row level security;
alter table public.tenant_requests enable row level security;

-- Regular staff: residents manage own flat; guards/admins read society-wide.
drop policy if exists "regular_staff_select" on public.regular_staff;
create policy "regular_staff_select"
  on public.regular_staff for select to authenticated
  using (
    society_id in (select public.auth_user_society_ids())
    and (
      public.auth_user_owns_flat(society_id, flat_id)
      or public.auth_user_is_rwa_admin(society_id)
      or public.auth_user_is_gatekeeper(society_id)
    )
  );

drop policy if exists "regular_staff_insert" on public.regular_staff;
create policy "regular_staff_insert"
  on public.regular_staff for insert to authenticated
  with check (
    society_id in (select public.auth_user_society_ids())
    and public.auth_user_owns_flat(society_id, flat_id)
  );

drop policy if exists "regular_staff_update" on public.regular_staff;
create policy "regular_staff_update"
  on public.regular_staff for update to authenticated
  using (
    society_id in (select public.auth_user_society_ids())
    and (
      public.auth_user_owns_flat(society_id, flat_id)
      or public.auth_user_is_rwa_admin(society_id)
    )
  )
  with check (
    society_id in (select public.auth_user_society_ids())
    and (
      public.auth_user_owns_flat(society_id, flat_id)
      or public.auth_user_is_rwa_admin(society_id)
    )
  );

drop policy if exists "regular_staff_service_all" on public.regular_staff;
create policy "regular_staff_service_all"
  on public.regular_staff for all to service_role using (true) with check (true);

drop policy if exists "staff_entry_logs_select" on public.staff_entry_logs;
create policy "staff_entry_logs_select"
  on public.staff_entry_logs for select to authenticated
  using (
    society_id in (select public.auth_user_society_ids())
    and (
      public.auth_user_is_rwa_admin(society_id)
      or public.auth_user_is_gatekeeper(society_id)
    )
  );

drop policy if exists "staff_entry_logs_insert" on public.staff_entry_logs;
create policy "staff_entry_logs_insert"
  on public.staff_entry_logs for insert to authenticated
  with check (
    society_id in (select public.auth_user_society_ids())
    and (
      public.auth_user_is_gatekeeper(society_id)
      or public.auth_user_is_rwa_admin(society_id)
    )
  );

drop policy if exists "staff_entry_logs_service_all" on public.staff_entry_logs;
create policy "staff_entry_logs_service_all"
  on public.staff_entry_logs for all to service_role using (true) with check (true);

-- Delivery pre-approvals
drop policy if exists "delivery_pre_approvals_select" on public.delivery_pre_approvals;
create policy "delivery_pre_approvals_select"
  on public.delivery_pre_approvals for select to authenticated
  using (
    society_id in (select public.auth_user_society_ids())
    and (
      public.auth_user_owns_flat(society_id, flat_id)
      or public.auth_user_is_rwa_admin(society_id)
      or public.auth_user_is_gatekeeper(society_id)
    )
  );

drop policy if exists "delivery_pre_approvals_insert" on public.delivery_pre_approvals;
create policy "delivery_pre_approvals_insert"
  on public.delivery_pre_approvals for insert to authenticated
  with check (
    society_id in (select public.auth_user_society_ids())
    and public.auth_user_owns_flat(society_id, flat_id)
  );

drop policy if exists "delivery_pre_approvals_update" on public.delivery_pre_approvals;
create policy "delivery_pre_approvals_update"
  on public.delivery_pre_approvals for update to authenticated
  using (
    society_id in (select public.auth_user_society_ids())
    and (
      public.auth_user_owns_flat(society_id, flat_id)
      or public.auth_user_is_gatekeeper(society_id)
      or public.auth_user_is_rwa_admin(society_id)
    )
  )
  with check (society_id in (select public.auth_user_society_ids()));

drop policy if exists "delivery_pre_approvals_service_all" on public.delivery_pre_approvals;
create policy "delivery_pre_approvals_service_all"
  on public.delivery_pre_approvals for all to service_role using (true) with check (true);

-- Tenant requests
drop policy if exists "tenant_requests_select" on public.tenant_requests;
create policy "tenant_requests_select"
  on public.tenant_requests for select to authenticated
  using (
    society_id in (select public.auth_user_society_ids())
    and (
      owner_id = auth.uid()::text
      or public.auth_user_owns_flat(society_id, flat_id)
      or public.auth_user_is_rwa_admin(society_id)
    )
  );

drop policy if exists "tenant_requests_insert" on public.tenant_requests;
create policy "tenant_requests_insert"
  on public.tenant_requests for insert to authenticated
  with check (
    society_id in (select public.auth_user_society_ids())
    and owner_id = auth.uid()::text
    and public.auth_user_owns_flat(society_id, flat_id)
  );

drop policy if exists "tenant_requests_update" on public.tenant_requests;
create policy "tenant_requests_update"
  on public.tenant_requests for update to authenticated
  using (
    society_id in (select public.auth_user_society_ids())
    and public.auth_user_is_rwa_admin(society_id)
  )
  with check (
    society_id in (select public.auth_user_society_ids())
    and public.auth_user_is_rwa_admin(society_id)
  );

drop policy if exists "tenant_requests_service_all" on public.tenant_requests;
create policy "tenant_requests_service_all"
  on public.tenant_requests for all to service_role using (true) with check (true);
