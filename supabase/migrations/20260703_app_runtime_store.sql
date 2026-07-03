-- Serverless-safe key/value store for platform pricing + automation settings

create table if not exists app_runtime_store (
  key text primary key,
  payload jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

alter table app_runtime_store enable row level security;

create policy "app_runtime_store_service"
  on app_runtime_store for all
  to service_role
  using (true)
  with check (true);
