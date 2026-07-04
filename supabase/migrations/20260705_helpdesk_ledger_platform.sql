-- Helpdesk tickets, society ledger, and platform settings (referenced by the Vite client)

create table if not exists complaints_and_suggestions (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references societies(id) on delete cascade,
  raised_by_user_id text not null,
  subject text not null,
  description text,
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'resolved', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_complaints_society
  on complaints_and_suggestions(society_id, created_at desc);
create index if not exists idx_complaints_user
  on complaints_and_suggestions(raised_by_user_id);

create table if not exists society_ledger (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references societies(id) on delete cascade,
  date text not null,
  type text not null check (type in ('credit', 'debit')),
  amount numeric(14, 2) not null check (amount >= 0),
  description text,
  invoice_url text,
  created_at timestamptz not null default now()
);

create index if not exists idx_society_ledger_society
  on society_ledger(society_id, created_at desc);

create table if not exists platform_settings (
  id text primary key,
  payload jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

alter table complaints_and_suggestions enable row level security;
alter table society_ledger enable row level security;
alter table platform_settings enable row level security;

drop policy if exists "complaints_read_all" on complaints_and_suggestions;
create policy "complaints_read_all"
  on complaints_and_suggestions for select to authenticated, anon using (true);

drop policy if exists "complaints_write_all" on complaints_and_suggestions;
create policy "complaints_write_all"
  on complaints_and_suggestions for all to authenticated, anon using (true) with check (true);

drop policy if exists "complaints_write_service" on complaints_and_suggestions;
create policy "complaints_write_service"
  on complaints_and_suggestions for all to service_role using (true) with check (true);

drop policy if exists "society_ledger_read_all" on society_ledger;
create policy "society_ledger_read_all"
  on society_ledger for select to authenticated, anon using (true);

drop policy if exists "society_ledger_write_all" on society_ledger;
create policy "society_ledger_write_all"
  on society_ledger for all to authenticated, anon using (true) with check (true);

drop policy if exists "society_ledger_write_service" on society_ledger;
create policy "society_ledger_write_service"
  on society_ledger for all to service_role using (true) with check (true);

drop policy if exists "platform_settings_service" on platform_settings;
create policy "platform_settings_service"
  on platform_settings for all to service_role using (true) with check (true);
