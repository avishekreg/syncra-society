-- Autonomous deep-wiring: expense ledger, BLE mesh queue, kid overrides,
-- syndication delivery log, dual-sign RPC, auditor RPC, expire helpers.
-- Human-in-the-loop: kid/guard overrides + dispute dual-sign remain gated.

-- ---------------------------------------------------------------------------
-- Society expense ledger (mAI Auditor real invoice feed)
-- ---------------------------------------------------------------------------
create table if not exists public.society_expense_ledger (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  category text not null check (category in ('WATER', 'ELECTRICITY', 'VENDOR_INVOICE', 'REPAIR')),
  label text not null,
  amount numeric(14, 2) not null check (amount >= 0),
  expense_month date not null,
  vendor_name text,
  invoice_ref text,
  source text not null default 'MANUAL' check (source in ('MANUAL', 'IMPORT', 'AUTOMATION')),
  created_by_user_id text,
  created_at timestamptz not null default now()
);

create index if not exists idx_society_expense_ledger_society_month
  on public.society_expense_ledger(society_id, expense_month desc, category);

alter table public.society_expense_ledger enable row level security;

drop policy if exists society_expense_ledger_select on public.society_expense_ledger;
create policy society_expense_ledger_select on public.society_expense_ledger
  for select to authenticated
  using (society_id in (select public.auth_user_society_ids()));

drop policy if exists society_expense_ledger_write on public.society_expense_ledger;
create policy society_expense_ledger_write on public.society_expense_ledger
  for all to authenticated
  using (society_id in (select public.auth_user_society_ids()))
  with check (society_id in (select public.auth_user_society_ids()));

drop policy if exists society_expense_ledger_service on public.society_expense_ledger;
create policy society_expense_ledger_service on public.society_expense_ledger
  for all to service_role using (true) with check (true);

-- ---------------------------------------------------------------------------
-- BLE signal queue (mAI Find Asset mesh)
-- ---------------------------------------------------------------------------
create table if not exists public.ble_signal_queue (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  ble_fingerprint text not null,
  location_label text not null,
  rssi integer,
  detected_by_user_id text,
  processed_at timestamptz,
  matched_asset_id uuid references public.lost_asset_signals(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_ble_signal_queue_pending
  on public.ble_signal_queue(society_id, processed_at nulls first, created_at desc);

alter table public.ble_signal_queue enable row level security;

drop policy if exists ble_signal_queue_member on public.ble_signal_queue;
create policy ble_signal_queue_member on public.ble_signal_queue
  for all to authenticated
  using (society_id in (select public.auth_user_society_ids()))
  with check (society_id in (select public.auth_user_society_ids()));

drop policy if exists ble_signal_queue_service on public.ble_signal_queue;
create policy ble_signal_queue_service on public.ble_signal_queue
  for all to service_role using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Kid exit human override log (guard / parent HITL)
-- ---------------------------------------------------------------------------
create table if not exists public.kid_exit_overrides (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  flat_number text not null,
  kid_name text,
  override_by text not null check (override_by in ('PARENT', 'GUARD')),
  override_user_id text,
  reason text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_kid_exit_overrides_society
  on public.kid_exit_overrides(society_id, created_at desc);

alter table public.kid_exit_overrides enable row level security;

drop policy if exists kid_exit_overrides_member on public.kid_exit_overrides;
create policy kid_exit_overrides_member on public.kid_exit_overrides
  for all to authenticated
  using (society_id in (select public.auth_user_society_ids()))
  with check (society_id in (select public.auth_user_society_ids()));

-- ---------------------------------------------------------------------------
-- Syndication delivery log (maiList outbound webhooks)
-- ---------------------------------------------------------------------------
create table if not exists public.syndication_delivery_log (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  listing_id uuid not null references public.property_market_listings(id) on delete cascade,
  portal text not null,
  status text not null check (status in ('QUEUED', 'DELIVERED', 'FAILED')),
  response_code integer,
  response_body text,
  created_at timestamptz not null default now()
);

create index if not exists idx_syndication_delivery_listing
  on public.syndication_delivery_log(listing_id, created_at desc);

alter table public.syndication_delivery_log enable row level security;

drop policy if exists syndication_delivery_member on public.syndication_delivery_log;
create policy syndication_delivery_member on public.syndication_delivery_log
  for all to authenticated
  using (society_id in (select public.auth_user_society_ids()))
  with check (society_id in (select public.auth_user_society_ids()));

-- ---------------------------------------------------------------------------
-- Autonomous job run audit
-- ---------------------------------------------------------------------------
create table if not exists public.autonomous_job_runs (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  job_name text not null,
  status text not null check (status in ('OK', 'SKIPPED', 'ERROR')),
  detail text,
  created_at timestamptz not null default now()
);

create index if not exists idx_autonomous_job_runs_society
  on public.autonomous_job_runs(society_id, job_name, created_at desc);

alter table public.autonomous_job_runs enable row level security;

drop policy if exists autonomous_job_runs_member on public.autonomous_job_runs;
create policy autonomous_job_runs_member on public.autonomous_job_runs
  for all to authenticated
  using (society_id in (select public.auth_user_society_ids()))
  with check (society_id in (select public.auth_user_society_ids()));

-- ---------------------------------------------------------------------------
-- Society ops settings (overstay threshold etc.)
-- ---------------------------------------------------------------------------
create table if not exists public.society_ops_settings (
  society_id uuid primary key references public.societies(id) on delete cascade,
  overstay_threshold_mins integer not null default 45 check (overstay_threshold_mins between 15 and 480),
  botanist_default_gardener text default 'Society Gardener',
  botanist_lat numeric(10, 6),
  botanist_lng numeric(10, 6),
  updated_at timestamptz not null default now()
);

alter table public.society_ops_settings enable row level security;

drop policy if exists society_ops_settings_member on public.society_ops_settings;
create policy society_ops_settings_member on public.society_ops_settings
  for all to authenticated
  using (society_id in (select public.auth_user_society_ids()))
  with check (society_id in (select public.auth_user_society_ids()));

-- ---------------------------------------------------------------------------
-- Dual-signature settlement RPC (human-in-the-loop — both flats must sign)
-- ---------------------------------------------------------------------------
create or replace function public.sign_dispute_settlement(
  p_dispute_id uuid,
  p_role text,
  p_signer_flat_number text
)
returns public.community_disputes
language plpgsql
security definer
set search_path = public
as $$
declare
  row public.community_disputes;
  normalized text := lower(trim(p_signer_flat_number));
begin
  if p_role not in ('plaintiff', 'respondent') then
    raise exception 'Invalid signature role';
  end if;

  select * into row from public.community_disputes where id = p_dispute_id for update;
  if not found then
    raise exception 'Dispute not found';
  end if;

  if row.status not in ('PENDING_MEDIATION', 'ESCALATED') then
    raise exception 'Dispute is not open for signature';
  end if;

  if p_role = 'plaintiff' then
    if lower(trim(row.plaintiff_flat_number)) <> normalized then
      raise exception 'Signer flat does not match plaintiff flat';
    end if;
    row.plaintiff_signed_at := now();
  else
    if lower(trim(row.respondent_flat_number)) <> normalized then
      raise exception 'Signer flat does not match respondent flat';
    end if;
    row.respondent_signed_at := now();
  end if;

  if row.plaintiff_signed_at is not null and row.respondent_signed_at is not null then
    row.status := 'SETTLED';
  end if;

  update public.community_disputes
  set
    plaintiff_signed_at = row.plaintiff_signed_at,
    respondent_signed_at = row.respondent_signed_at,
    status = row.status
  where id = p_dispute_id
  returning * into row;

  return row;
end;
$$;

grant execute on function public.sign_dispute_settlement(uuid, text, text) to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Expire kid exit approvals (autonomous)
-- ---------------------------------------------------------------------------
create or replace function public.expire_kid_exit_approvals()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count integer;
begin
  update public.kid_exit_approvals
  set status = 'EXPIRED'
  where status = 'APPROVED'
    and valid_until < now();
  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

grant execute on function public.expire_kid_exit_approvals() to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Match BLE fingerprint to lost assets (autonomous mesh)
-- ---------------------------------------------------------------------------
create or replace function public.match_ble_signal(
  p_queue_id uuid
)
returns public.lost_asset_signals
language plpgsql
security definer
set search_path = public
as $$
declare
  q public.ble_signal_queue;
  asset public.lost_asset_signals;
begin
  select * into q from public.ble_signal_queue where id = p_queue_id for update;
  if not found then
    raise exception 'BLE queue item not found';
  end if;

  select * into asset
  from public.lost_asset_signals
  where society_id = q.society_id
    and status = 'LOST'
    and ble_fingerprint = q.ble_fingerprint
  order by created_at desc
  limit 1;

  if found then
    update public.lost_asset_signals
    set
      last_seen_location = q.location_label,
      last_seen_at = coalesce(q.created_at, now()),
      detected_by_user_id = q.detected_by_user_id
    where id = asset.id
    returning * into asset;

    update public.ble_signal_queue
    set processed_at = now(), matched_asset_id = asset.id
    where id = q.id;

    return asset;
  end if;

  update public.ble_signal_queue
  set processed_at = now()
  where id = q.id;

  return null;
end;
$$;

grant execute on function public.match_ble_signal(uuid) to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Expire stale ACTIVE recall motions older than 14 days (autonomous)
-- ---------------------------------------------------------------------------
create or replace function public.expire_stale_recall_motions()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count integer;
begin
  update public.recall_motions
  set status = 'EXPIRED'
  where status = 'ACTIVE'
    and created_at < now() - interval '14 days';
  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

grant execute on function public.expire_stale_recall_motions() to anon, authenticated, service_role;
