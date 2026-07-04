-- Per-society SaaS module entitlements (automated via payment webhooks)
create table if not exists society_module_configs (
  society_id uuid primary key references societies(id) on delete cascade,
  whatsapp_alerts boolean not null default false,
  election_engine boolean not null default false,
  voice_ticketing boolean not null default false,
  smart_helpdesk boolean not null default false,
  updated_at timestamptz not null default now()
);

create index if not exists idx_society_module_configs_updated on society_module_configs(updated_at desc);

alter table society_module_configs enable row level security;

drop policy if exists "society_module_configs_read_all" on society_module_configs;
create policy "society_module_configs_read_all" on society_module_configs for select to authenticated, anon using (true);

drop policy if exists "society_module_configs_write_service" on society_module_configs;
create policy "society_module_configs_write_service" on society_module_configs for all to service_role using (true) with check (true);

insert into system_configs (key, value, description, updated_at)
values
  ('RAZORPAY_WEBHOOK_SECRET', '', 'Razorpay webhook HMAC signing secret', now()),
  ('STRIPE_WEBHOOK_SECRET', '', 'Stripe webhook signing secret (whsec_...)', now())
on conflict (key) do nothing;
