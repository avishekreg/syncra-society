-- =============================================================================
-- Syncra Society — Production Relational Schema (v2)
-- Run in Supabase Dashboard → SQL Editor
-- =============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Core entities
-- ---------------------------------------------------------------------------

create table if not exists societies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  subscription_tier text not null default 'basic',
  active_addons text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- Upgrade path for existing deployments
alter table societies add column if not exists subscription_tier text not null default 'basic';
alter table societies add column if not exists active_addons text[] not null default '{}';

create table if not exists flats (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references societies(id) on delete cascade,
  flat_number text not null,
  owner_name text not null,
  owner_phone text not null,
  created_at timestamptz not null default now(),
  unique (society_id, flat_number)
);

create table if not exists notices (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references societies(id) on delete cascade,
  title text not null,
  content text not null,
  created_at timestamptz not null default now()
);

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'notices' and column_name = 'body'
  ) then
    alter table notices add column if not exists content text;
    update notices set content = body where content is null and body is not null;
  end if;
end $$;

create table if not exists visitors (
  id uuid primary key default gen_random_uuid(),
  flat_id uuid not null references flats(id) on delete cascade,
  visitor_name text not null,
  phone_number text not null,
  purpose text not null,
  entry_time timestamptz not null default now()
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  flat_id uuid not null references flats(id) on delete cascade,
  amount numeric(12, 2) not null check (amount >= 0),
  status text not null check (status in ('paid', 'pending')),
  due_date date not null,
  gateway_order_id text,
  gateway_payment_id text,
  created_at timestamptz not null default now()
);

alter table payments add column if not exists gateway_order_id text;
alter table payments add column if not exists gateway_payment_id text;
alter table payments add column if not exists created_at timestamptz not null default now();

create table if not exists system_configs (
  key text primary key,
  value text not null default '',
  description text,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists idx_flats_society on flats(society_id);
create index if not exists idx_notices_society on notices(society_id, created_at desc);
create index if not exists idx_visitors_flat on visitors(flat_id, entry_time desc);
create index if not exists idx_payments_flat on payments(flat_id, due_date desc);
create index if not exists idx_payments_status on payments(status);
create index if not exists idx_payments_gateway_order on payments(gateway_order_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table societies enable row level security;
alter table flats enable row level security;
alter table notices enable row level security;
alter table visitors enable row level security;
alter table payments enable row level security;
alter table system_configs enable row level security;

drop policy if exists "societies_read_all" on societies;
create policy "societies_read_all" on societies for select to authenticated, anon using (true);

drop policy if exists "societies_write_service" on societies;
create policy "societies_write_service" on societies for all to service_role using (true) with check (true);

drop policy if exists "flats_read_all" on flats;
create policy "flats_read_all" on flats for select to authenticated, anon using (true);

drop policy if exists "flats_write_service" on flats;
create policy "flats_write_service" on flats for all to service_role using (true) with check (true);

drop policy if exists "notices_read_all" on notices;
create policy "notices_read_all" on notices for select to authenticated, anon using (true);

drop policy if exists "notices_write_service" on notices;
create policy "notices_write_service" on notices for all to service_role using (true) with check (true);

drop policy if exists "visitors_read_all" on visitors;
create policy "visitors_read_all" on visitors for select to authenticated, anon using (true);

drop policy if exists "visitors_write_service" on visitors;
create policy "visitors_write_service" on visitors for all to service_role using (true) with check (true);

drop policy if exists "payments_read_all" on payments;
create policy "payments_read_all" on payments for select to authenticated, anon using (true);

drop policy if exists "payments_write_service" on payments;
create policy "payments_write_service" on payments for all to service_role using (true) with check (true);

drop policy if exists "system_configs_read_service" on system_configs;
create policy "system_configs_read_service" on system_configs for select to service_role using (true);

drop policy if exists "system_configs_write_service" on system_configs;
create policy "system_configs_write_service" on system_configs for all to service_role using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Zero-code runtime configuration defaults
-- ---------------------------------------------------------------------------

insert into system_configs (key, value, description, updated_at)
values
  (
    'N8N_WEBHOOK_URL',
    'https://avishekreg-syncra-society.hf.space/webhook/syncra-society',
    'Live communication bridge webhook target',
    now()
  ),
  (
    'TWILIO_DEFAULT_FROM',
    '+14155238886',
    'Default Twilio Sandbox From Number',
    now()
  ),
  (
    'ACTIVE_PAYMENT_GATEWAY',
    'RAZORPAY',
    'Currently active provider: RAZORPAY, STRIPE, or CHILE_LOCAL',
    now()
  ),
  (
    'PAYMENT_GATEWAY_PUBLIC_KEY',
    'rzp_test_placeholder',
    'Public key for runtime gateway UI initialization',
    now()
  ),
  (
    'PAYMENT_GATEWAY_SECRET_KEY',
    'rzp_secret_placeholder',
    'Secure backend API key',
    now()
  )
on conflict (key) do update set
  value = excluded.value,
  description = excluded.description,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- Demo seed
-- ---------------------------------------------------------------------------

insert into societies (id, name, address, subscription_tier, active_addons)
values (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Syncra Windsor Castle',
  'Sector 78, Gurugram, Haryana',
  'premium',
  array['whatsapp_automation', 'payment_gateway']
)
on conflict (id) do update set
  name = excluded.name,
  address = excluded.address,
  subscription_tier = excluded.subscription_tier,
  active_addons = excluded.active_addons;

insert into societies (id, name, address, subscription_tier, active_addons)
values (
  'c2d3e4f5-a6b7-8901-cdef-234567890abc',
  'Lotus Greens (Basic)',
  'Koregaon Park, Pune',
  'basic',
  '{}'
)
on conflict (id) do update set
  name = excluded.name,
  subscription_tier = excluded.subscription_tier,
  active_addons = excluded.active_addons;

insert into flats (id, society_id, flat_number, owner_name, owner_phone)
values
  (
    'b1b2c3d4-e5f6-7890-abcd-ef1234567891',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    '402',
    'Avishek Regmi',
    '+919876543210'
  ),
  (
    'b1b2c3d4-e5f6-7890-abcd-ef1234567892',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    '501',
    'Priya Sharma',
    '+919123456789'
  )
on conflict (id) do update set
  flat_number = excluded.flat_number,
  owner_name = excluded.owner_name,
  owner_phone = excluded.owner_phone;
