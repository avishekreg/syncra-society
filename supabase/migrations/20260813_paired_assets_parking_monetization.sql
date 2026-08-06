-- Paired Bluetooth asset tracking + monetized parking marketplace.
-- Zero extra hardware: residents' own paired phones/watches/earbuds + software listings.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Paired Bluetooth devices (owner's own accessories)
-- ---------------------------------------------------------------------------
create table if not exists public.paired_bluetooth_devices (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  owner_user_id text not null,
  owner_flat_number text,
  device_name text not null,
  device_type text not null
    check (device_type in ('SMARTWATCH', 'TWS', 'SECONDARY_PHONE')),
  bluetooth_name text,
  last_seen_zone text,
  last_seen_at timestamptz,
  last_rssi integer,
  last_ping_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_paired_bt_owner
  on public.paired_bluetooth_devices(society_id, owner_user_id, is_active);

create table if not exists public.paired_device_sightings (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.paired_bluetooth_devices(id) on delete cascade,
  society_id uuid not null references public.societies(id) on delete cascade,
  event_type text not null
    check (event_type in ('DISCONNECT_RSSI', 'RECONNECT', 'PROXIMITY_PING', 'MANUAL_UPDATE')),
  rssi integer,
  zone_label text,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_paired_sightings_device
  on public.paired_device_sightings(device_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Community Lost & Found (non-electronic physical items only)
-- ---------------------------------------------------------------------------
create table if not exists public.lost_found_posts (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  posted_by_user_id text not null,
  posted_by_flat_number text,
  item_category text not null
    check (item_category in ('KEYS', 'WALLET', 'BAG', 'DOCUMENTS', 'OTHER')),
  title text not null,
  description text,
  photo_url text,
  claim_desk text not null default 'Gate 1',
  status text not null default 'OPEN'
    check (status in ('OPEN', 'CLAIMED', 'CLOSED')),
  claimed_by_user_id text,
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_lost_found_society
  on public.lost_found_posts(society_id, status, created_at desc);

-- ---------------------------------------------------------------------------
-- Monetized parking marketplace
-- ---------------------------------------------------------------------------
create table if not exists public.parking_owner_wallets (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  owner_user_id text not null,
  owner_flat_number text not null,
  balance_inr numeric(12, 2) not null default 0 check (balance_inr >= 0),
  lifetime_earned_inr numeric(12, 2) not null default 0 check (lifetime_earned_inr >= 0),
  upi_id text,
  updated_at timestamptz not null default now(),
  unique (society_id, owner_user_id)
);

create table if not exists public.parking_marketplace_listings (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  owner_user_id text not null,
  owner_flat_number text not null,
  slot_code text not null,
  mode text not null check (mode in ('HOURLY', 'MONTHLY')),
  -- Hourly window (Mode A)
  available_from_local time,
  available_to_local time,
  hourly_rate_inr numeric(10, 2),
  owner_return_at timestamptz,
  vacate_reminder_sent_at timestamptz,
  -- Monthly lease (Mode B)
  monthly_rate_inr numeric(10, 2),
  lease_available_from date,
  status text not null default 'ACTIVE'
    check (status in ('ACTIVE', 'PAUSED', 'BOOKED', 'CLOSED')),
  earn_enabled boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_parking_listings_society
  on public.parking_marketplace_listings(society_id, status, mode);

create table if not exists public.parking_marketplace_bookings (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.parking_marketplace_listings(id) on delete cascade,
  society_id uuid not null references public.societies(id) on delete cascade,
  renter_user_id text not null,
  renter_flat_number text,
  renter_label text not null,
  vehicle_label text,
  mode text not null check (mode in ('HOURLY', 'MONTHLY')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  hours_booked numeric(8, 2),
  amount_inr numeric(12, 2) not null check (amount_inr >= 0),
  payment_method text not null default 'UPI',
  upi_reference text,
  payment_status text not null default 'PENDING_UPI'
    check (payment_status in ('PENDING_UPI', 'PAID', 'CREDITED', 'CANCELLED', 'REFUNDED')),
  status text not null default 'ACTIVE'
    check (status in ('ACTIVE', 'COMPLETED', 'CANCELLED', 'AUTO_VACATE')),
  created_at timestamptz not null default now()
);

create index if not exists idx_parking_bookings_listing
  on public.parking_marketplace_bookings(listing_id, status);

create index if not exists idx_parking_bookings_society
  on public.parking_marketplace_bookings(society_id, created_at desc);

-- Credit owner wallet when booking marked paid
create or replace function public.credit_parking_wallet_on_paid()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_listing public.parking_marketplace_listings%rowtype;
begin
  if new.payment_status = 'PAID'
     and (old.payment_status is distinct from 'PAID')
     and (old.payment_status is distinct from 'CREDITED') then
    select * into v_listing from public.parking_marketplace_listings where id = new.listing_id;
    if found then
      insert into public.parking_owner_wallets as w (
        society_id, owner_user_id, owner_flat_number, balance_inr, lifetime_earned_inr, updated_at
      ) values (
        v_listing.society_id, v_listing.owner_user_id, v_listing.owner_flat_number,
        new.amount_inr, new.amount_inr, now()
      )
      on conflict (society_id, owner_user_id) do update
        set balance_inr = w.balance_inr + excluded.balance_inr,
            lifetime_earned_inr = w.lifetime_earned_inr + excluded.lifetime_earned_inr,
            updated_at = now();
      new.payment_status := 'CREDITED';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_parking_booking_credit on public.parking_marketplace_bookings;
create trigger trg_parking_booking_credit
  before update of payment_status on public.parking_marketplace_bookings
  for each row execute function public.credit_parking_wallet_on_paid();

-- RLS (permissive for authenticated society members — align with other module tables)
alter table public.paired_bluetooth_devices enable row level security;
alter table public.paired_device_sightings enable row level security;
alter table public.lost_found_posts enable row level security;
alter table public.parking_owner_wallets enable row level security;
alter table public.parking_marketplace_listings enable row level security;
alter table public.parking_marketplace_bookings enable row level security;

do $$ begin
  create policy paired_bt_all on public.paired_bluetooth_devices for all using (true) with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy paired_sight_all on public.paired_device_sightings for all using (true) with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy lost_found_all on public.lost_found_posts for all using (true) with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy parking_wallet_all on public.parking_owner_wallets for all using (true) with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy parking_list_all on public.parking_marketplace_listings for all using (true) with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy parking_book_all on public.parking_marketplace_bookings for all using (true) with check (true);
exception when duplicate_object then null; end $$;
