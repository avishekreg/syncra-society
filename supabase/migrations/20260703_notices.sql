-- Society notice board

create table if not exists notices (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references societies(id) on delete cascade,
  title text not null,
  body text not null,
  attachment_url text,
  created_at timestamptz not null default now()
);

create index if not exists idx_notices_society on notices(society_id, created_at desc);

alter table notices enable row level security;

create policy "notices_read_authenticated"
  on notices for select
  to authenticated
  using (true);

create policy "notices_insert_authenticated"
  on notices for insert
  to authenticated
  with check (true);

create policy "notices_delete_authenticated"
  on notices for delete
  to authenticated
  using (true);

-- Allow anon read for demo/dev REST with anon key (tighten before public launch if needed)
create policy "notices_read_anon"
  on notices for select
  to anon
  using (true);

create policy "notices_write_anon"
  on notices for insert
  to anon
  with check (true);

create policy "notices_delete_anon"
  on notices for delete
  to anon
  using (true);
