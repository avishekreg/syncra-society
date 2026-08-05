-- Autonomous Society Intelligence & Governance modules.
-- Depends on societies + flats (from gatekeeper migrations).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- mAI Auditor
-- ---------------------------------------------------------------------------
create table if not exists public.ai_audit_logs (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  category text not null check (category in ('WATER', 'ELECTRICITY', 'VENDOR_INVOICE', 'REPAIR')),
  detected_anomaly text not null,
  variance_percentage numeric(8, 2) not null default 0,
  ai_recommendation text not null,
  health_score integer check (health_score between 0 and 100),
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_audit_logs_society
  on public.ai_audit_logs(society_id, created_at desc);

-- ---------------------------------------------------------------------------
-- maiEnergy P2P trading
-- ---------------------------------------------------------------------------
create table if not exists public.p2p_energy_trades (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  seller_flat_id uuid not null references public.flats(id) on delete cascade,
  seller_flat_number text not null,
  buyer_flat_id uuid not null references public.flats(id) on delete cascade,
  buyer_flat_number text not null,
  energy_kwh numeric(12, 3) not null check (energy_kwh > 0),
  credits_transferred numeric(12, 2) not null check (credits_transferred >= 0),
  status text not null default 'COMPLETED'
    check (status in ('PENDING', 'COMPLETED', 'CANCELLED')),
  created_at timestamptz not null default now()
);

create index if not exists idx_p2p_energy_society
  on public.p2p_energy_trades(society_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Recall / impeachment motions (mAI Vote)
-- ---------------------------------------------------------------------------
create table if not exists public.recall_motions (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  target_official_role text not null,
  reason text not null,
  votes_required_count integer not null check (votes_required_count > 0),
  current_votes_count integer not null default 0 check (current_votes_count >= 0),
  status text not null default 'ACTIVE'
    check (status in ('ACTIVE', 'PASSED', 'EXPIRED')),
  created_by_user_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.recall_ballots (
  id uuid primary key default gen_random_uuid(),
  motion_id uuid not null references public.recall_motions(id) on delete cascade,
  society_id uuid not null references public.societies(id) on delete cascade,
  flat_id uuid not null references public.flats(id) on delete cascade,
  ballot_hash text not null,
  created_at timestamptz not null default now(),
  unique (motion_id, flat_id)
);

create index if not exists idx_recall_motions_society
  on public.recall_motions(society_id, status, created_at desc);

-- ---------------------------------------------------------------------------
-- mAI Nyaya disputes
-- ---------------------------------------------------------------------------
create table if not exists public.community_disputes (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  plaintiff_flat_id uuid not null references public.flats(id) on delete cascade,
  plaintiff_flat_number text not null,
  respondent_flat_id uuid not null references public.flats(id) on delete cascade,
  respondent_flat_number text not null,
  issue_type text not null check (issue_type in ('PARKING', 'SEEPAGE', 'PETS', 'NOISE')),
  description text not null,
  ai_mediation_summary text,
  suggested_fine_amount numeric(12, 2) default 0,
  status text not null default 'PENDING_MEDIATION'
    check (status in ('PENDING_MEDIATION', 'SETTLED', 'ESCALATED', 'DISMISSED')),
  plaintiff_signed_at timestamptz,
  respondent_signed_at timestamptz,
  created_by_user_id text,
  created_at timestamptz not null default now()
);

create index if not exists idx_community_disputes_society
  on public.community_disputes(society_id, status, created_at desc);

-- ---------------------------------------------------------------------------
-- mAI Find Asset
-- ---------------------------------------------------------------------------
create table if not exists public.lost_asset_signals (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  owner_user_id text not null,
  owner_flat_number text,
  asset_name text not null,
  asset_type text not null check (asset_type in ('PHONE', 'WATCH', 'VEHICLE', 'KEYS')),
  last_seen_location text,
  last_seen_at timestamptz,
  detected_by_user_id text,
  ble_fingerprint text,
  status text not null default 'LOST' check (status in ('LOST', 'FOUND')),
  created_at timestamptz not null default now()
);

create index if not exists idx_lost_asset_signals_society
  on public.lost_asset_signals(society_id, status, created_at desc);

-- ---------------------------------------------------------------------------
-- mAI Guardian geofence / vehicle motion
-- ---------------------------------------------------------------------------
create table if not exists public.guardian_motion_alerts (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  flat_id uuid references public.flats(id) on delete set null,
  flat_number text,
  subject_type text not null check (subject_type in ('KID', 'SENIOR', 'VEHICLE')),
  subject_label text not null,
  event_type text not null check (event_type in ('GEOFENCE_EXIT', 'GEOFENCE_ENTER', 'UNAUTHORIZED_MOTION')),
  location_label text,
  owner_proximity boolean not null default false,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'ACKNOWLEDGED', 'CLEARED')),
  created_at timestamptz not null default now()
);

create index if not exists idx_guardian_motion_society
  on public.guardian_motion_alerts(society_id, status, created_at desc);

-- ---------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------
create or replace function public.cast_recall_ballot(
  p_motion_id uuid,
  p_flat_id uuid,
  p_ballot_salt text
)
returns public.recall_motions
language plpgsql
security definer
set search_path = public
as $$
declare
  motion public.recall_motions;
  ballot_digest text;
begin
  select * into motion from public.recall_motions where id = p_motion_id for update;
  if not found then raise exception 'Recall motion not found'; end if;
  if motion.status <> 'ACTIVE' then raise exception 'Motion is not active'; end if;

  ballot_digest := encode(digest(p_motion_id::text || ':' || p_flat_id::text || ':' || coalesce(p_ballot_salt, ''), 'sha256'), 'hex');

  insert into public.recall_ballots (motion_id, society_id, flat_id, ballot_hash)
  values (p_motion_id, motion.society_id, p_flat_id, ballot_digest);

  update public.recall_motions
  set current_votes_count = current_votes_count + 1,
      status = case
        when current_votes_count + 1 >= votes_required_count then 'PASSED'
        else status
      end
  where id = p_motion_id
  returning * into motion;

  return motion;
exception
  when unique_violation then
    raise exception 'This flat has already cast a ballot on this motion';
end;
$$;

grant execute on function public.cast_recall_ballot(uuid, uuid, text) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.ai_audit_logs enable row level security;
alter table public.p2p_energy_trades enable row level security;
alter table public.recall_motions enable row level security;
alter table public.recall_ballots enable row level security;
alter table public.community_disputes enable row level security;
alter table public.lost_asset_signals enable row level security;
alter table public.guardian_motion_alerts enable row level security;

drop policy if exists "ai_audit_select" on public.ai_audit_logs;
create policy "ai_audit_select" on public.ai_audit_logs for select to authenticated
  using (society_id in (select public.auth_user_society_ids()));

drop policy if exists "ai_audit_write_admin" on public.ai_audit_logs;
create policy "ai_audit_write_admin" on public.ai_audit_logs for insert to authenticated
  with check (
    society_id in (select public.auth_user_society_ids())
    and public.auth_user_is_rwa_admin(society_id)
  );

drop policy if exists "ai_audit_service" on public.ai_audit_logs;
create policy "ai_audit_service" on public.ai_audit_logs for all to service_role using (true) with check (true);

drop policy if exists "energy_select" on public.p2p_energy_trades;
create policy "energy_select" on public.p2p_energy_trades for select to authenticated
  using (society_id in (select public.auth_user_society_ids()));

drop policy if exists "energy_insert" on public.p2p_energy_trades;
create policy "energy_insert" on public.p2p_energy_trades for insert to authenticated
  with check (society_id in (select public.auth_user_society_ids()));

drop policy if exists "energy_service" on public.p2p_energy_trades;
create policy "energy_service" on public.p2p_energy_trades for all to service_role using (true) with check (true);

drop policy if exists "recall_select" on public.recall_motions;
create policy "recall_select" on public.recall_motions for select to authenticated
  using (society_id in (select public.auth_user_society_ids()));

drop policy if exists "recall_insert" on public.recall_motions;
create policy "recall_insert" on public.recall_motions for insert to authenticated
  with check (society_id in (select public.auth_user_society_ids()));

drop policy if exists "recall_update_admin" on public.recall_motions;
create policy "recall_update_admin" on public.recall_motions for update to authenticated
  using (
    society_id in (select public.auth_user_society_ids())
    and (public.auth_user_is_rwa_admin(society_id) or created_by_user_id = auth.uid()::text)
  );

drop policy if exists "recall_service" on public.recall_motions;
create policy "recall_service" on public.recall_motions for all to service_role using (true) with check (true);

drop policy if exists "recall_ballots_select" on public.recall_ballots;
create policy "recall_ballots_select" on public.recall_ballots for select to authenticated
  using (society_id in (select public.auth_user_society_ids()));

drop policy if exists "recall_ballots_insert" on public.recall_ballots;
create policy "recall_ballots_insert" on public.recall_ballots for insert to authenticated
  with check (society_id in (select public.auth_user_society_ids()));

drop policy if exists "recall_ballots_service" on public.recall_ballots;
create policy "recall_ballots_service" on public.recall_ballots for all to service_role using (true) with check (true);

drop policy if exists "disputes_select" on public.community_disputes;
create policy "disputes_select" on public.community_disputes for select to authenticated
  using (society_id in (select public.auth_user_society_ids()));

drop policy if exists "disputes_insert" on public.community_disputes;
create policy "disputes_insert" on public.community_disputes for insert to authenticated
  with check (society_id in (select public.auth_user_society_ids()));

drop policy if exists "disputes_update" on public.community_disputes;
create policy "disputes_update" on public.community_disputes for update to authenticated
  using (society_id in (select public.auth_user_society_ids()));

drop policy if exists "disputes_service" on public.community_disputes;
create policy "disputes_service" on public.community_disputes for all to service_role using (true) with check (true);

drop policy if exists "lost_assets_select" on public.lost_asset_signals;
create policy "lost_assets_select" on public.lost_asset_signals for select to authenticated
  using (society_id in (select public.auth_user_society_ids()));

drop policy if exists "lost_assets_insert" on public.lost_asset_signals;
create policy "lost_assets_insert" on public.lost_asset_signals for insert to authenticated
  with check (
    society_id in (select public.auth_user_society_ids())
    and owner_user_id = auth.uid()::text
  );

drop policy if exists "lost_assets_update" on public.lost_asset_signals;
create policy "lost_assets_update" on public.lost_asset_signals for update to authenticated
  using (society_id in (select public.auth_user_society_ids()));

drop policy if exists "lost_assets_service" on public.lost_asset_signals;
create policy "lost_assets_service" on public.lost_asset_signals for all to service_role using (true) with check (true);

drop policy if exists "guardian_select" on public.guardian_motion_alerts;
create policy "guardian_select" on public.guardian_motion_alerts for select to authenticated
  using (
    society_id in (select public.auth_user_society_ids())
    and (
      public.auth_user_is_rwa_admin(society_id)
      or public.auth_user_is_gatekeeper(society_id)
      or public.auth_user_owns_flat(society_id, flat_id)
      or flat_id is null
    )
  );

drop policy if exists "guardian_insert" on public.guardian_motion_alerts;
create policy "guardian_insert" on public.guardian_motion_alerts for insert to authenticated
  with check (society_id in (select public.auth_user_society_ids()));

drop policy if exists "guardian_update" on public.guardian_motion_alerts;
create policy "guardian_update" on public.guardian_motion_alerts for update to authenticated
  using (
    society_id in (select public.auth_user_society_ids())
    and (public.auth_user_is_rwa_admin(society_id) or public.auth_user_is_gatekeeper(society_id))
  );

drop policy if exists "guardian_service" on public.guardian_motion_alerts;
create policy "guardian_service" on public.guardian_motion_alerts for all to service_role using (true) with check (true);
