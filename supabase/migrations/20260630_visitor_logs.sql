-- Syncra Gatekeeper: visitor logs + state trace events

create table if not exists visitor_logs (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references societies(id) on delete cascade,
  visitor_name text not null,
  purpose text not null,
  vehicle_number text,
  target_building text not null,
  target_flat_number text not null,
  status text not null default 'pending_approval'
    check (status in ('pending_approval', 'approved', 'denied', 'exited')),
  requested_at timestamptz not null default now(),
  actioned_at timestamptz,
  actioned_by_user_id uuid,
  exited_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists visitor_log_events (
  id uuid primary key default gen_random_uuid(),
  visitor_log_id uuid not null references visitor_logs(id) on delete cascade,
  event_type text not null
    check (event_type in ('request_created', 'approved', 'denied', 'exit_logged')),
  actor_user_id uuid,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_visitor_logs_society on visitor_logs(society_id);
create index if not exists idx_visitor_logs_flat_status on visitor_logs(society_id, target_flat_number, status);
create index if not exists idx_visitor_log_events_log on visitor_log_events(visitor_log_id);
