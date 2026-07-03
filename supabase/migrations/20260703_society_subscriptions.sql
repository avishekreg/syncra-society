-- Two-phase Razorpay billing: activation fee + per-flat recurring subscription

do $$
begin
  if not exists (select 1 from pg_type where typname = 'activation_status_enum') then
    create type activation_status_enum as enum (
      'pending',
      'activation_paid',
      'active_subscription'
    );
  end if;
end $$;

create table if not exists society_subscriptions (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references societies(id) on delete cascade,
  activation_status activation_status_enum not null default 'pending',
  total_flats integer,
  monthly_rate_per_flat numeric(10, 2),
  razorpay_order_id text,
  razorpay_subscription_id text,
  razorpay_plan_id text,
  billing_cycle_anchor timestamptz,
  active_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint society_subscriptions_society_id_key unique (society_id)
);

create index if not exists idx_society_subscriptions_society_id
  on society_subscriptions(society_id);

create index if not exists idx_society_subscriptions_status
  on society_subscriptions(activation_status);

create index if not exists idx_society_subscriptions_razorpay_sub
  on society_subscriptions(razorpay_subscription_id)
  where razorpay_subscription_id is not null;

-- Track processed webhook events for idempotency
create table if not exists payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  razorpay_event_id text not null unique,
  event_type text not null,
  society_id uuid references societies(id) on delete set null,
  payload jsonb not null,
  processed_at timestamptz not null default now()
);

create index if not exists idx_payment_webhook_events_society
  on payment_webhook_events(society_id);
