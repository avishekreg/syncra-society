-- SaaS billing (subscriptions) and usage telemetry for Syncra Systems.
-- Coexists with legacy society_subscriptions; does not modify existing tables.

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  plan_type text not null default 'trial'
    check (plan_type in ('trial', 'medium', 'portfolio', 'enterprise')),
  status text not null default 'trialing'
    check (status in ('active', 'trialing', 'expired', 'past_due')),
  max_flats integer not null default 5,
  trial_start timestamptz not null default now(),
  trial_end timestamptz not null default (now() + interval '30 days'),
  razorpay_sub_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscriptions_society_id_key unique (society_id)
);

create index if not exists idx_subscriptions_society_id
  on public.subscriptions(society_id);

create index if not exists idx_subscriptions_status
  on public.subscriptions(status);

create index if not exists idx_subscriptions_plan_type
  on public.subscriptions(plan_type);

create index if not exists idx_subscriptions_razorpay_sub_id
  on public.subscriptions(razorpay_sub_id)
  where razorpay_sub_id is not null;

create or replace function public.subscriptions_apply_max_flats()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if new.plan_type = 'trial' then
      new.max_flats := coalesce(new.max_flats, 5);
    else
      new.max_flats := coalesce(nullif(new.max_flats, 5), 99999);
    end if;
  elsif new.plan_type is distinct from old.plan_type then
    if new.plan_type = 'trial' then
      new.max_flats := 5;
    else
      new.max_flats := 99999;
    end if;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists subscriptions_apply_max_flats_trigger on public.subscriptions;
create trigger subscriptions_apply_max_flats_trigger
  before insert or update of plan_type, max_flats
  on public.subscriptions
  for each row
  execute function public.subscriptions_apply_max_flats();

create table if not exists public.usage_counters (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  billing_cycle_start timestamptz not null default now(),
  whatsapp_alerts_sent integer not null default 0
    check (whatsapp_alerts_sent >= 0),
  whatsapp_addon_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint usage_counters_society_id_key unique (society_id)
);

create index if not exists idx_usage_counters_society_id
  on public.usage_counters(society_id);

create index if not exists idx_usage_counters_billing_cycle_start
  on public.usage_counters(billing_cycle_start);

create or replace function public.usage_counters_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists usage_counters_touch_updated_at_trigger on public.usage_counters;
create trigger usage_counters_touch_updated_at_trigger
  before update on public.usage_counters
  for each row
  execute function public.usage_counters_touch_updated_at();

-- Row Level Security
alter table public.subscriptions enable row level security;
alter table public.usage_counters enable row level security;

drop policy if exists "subscriptions_read_own_society" on public.subscriptions;
create policy "subscriptions_read_own_society"
  on public.subscriptions
  for select
  to authenticated
  using (society_id in (select public.auth_user_society_ids()));

drop policy if exists "subscriptions_write_own_society" on public.subscriptions;
create policy "subscriptions_write_own_society"
  on public.subscriptions
  for all
  to authenticated
  using (society_id in (select public.auth_user_society_ids()))
  with check (society_id in (select public.auth_user_society_ids()));

drop policy if exists "subscriptions_service_all" on public.subscriptions;
create policy "subscriptions_service_all"
  on public.subscriptions
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "usage_counters_read_own_society" on public.usage_counters;
create policy "usage_counters_read_own_society"
  on public.usage_counters
  for select
  to authenticated
  using (society_id in (select public.auth_user_society_ids()));

drop policy if exists "usage_counters_write_own_society" on public.usage_counters;
create policy "usage_counters_write_own_society"
  on public.usage_counters
  for all
  to authenticated
  using (society_id in (select public.auth_user_society_ids()))
  with check (society_id in (select public.auth_user_society_ids()));

drop policy if exists "usage_counters_service_all" on public.usage_counters;
create policy "usage_counters_service_all"
  on public.usage_counters
  for all
  to service_role
  using (true)
  with check (true);

grant select, insert, update, delete on public.subscriptions to authenticated, service_role;
grant select, insert, update, delete on public.usage_counters to authenticated, service_role;
