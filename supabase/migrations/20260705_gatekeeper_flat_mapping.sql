-- Gatekeeper console: flat_no + phone_number mapping for realtime resident alerts

alter table if exists visitor_logs
  add column if not exists flat_no text,
  add column if not exists phone_number text;

update visitor_logs
set flat_no = target_flat_number
where flat_no is null and target_flat_number is not null;

alter table visitor_logs drop constraint if exists visitor_logs_status_check;

alter table visitor_logs
  add constraint visitor_logs_status_check
  check (status in ('pending', 'pending_approval', 'approved', 'denied', 'exited'));

create index if not exists idx_visitor_logs_flat_no
  on visitor_logs(society_id, flat_no, status);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'visitor_logs'
  ) then
    alter publication supabase_realtime add table visitor_logs;
  end if;
end $$;
