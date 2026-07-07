-- Society billing policy engine + avatar storage bucket.

create table if not exists public.society_billing_rules (
  society_id uuid primary key references public.societies(id) on delete cascade,
  maintenance_due_date integer not null default 5
    check (maintenance_due_date between 1 and 28),
  late_fee_grace_period_days integer not null default 7
    check (late_fee_grace_period_days >= 0),
  late_fee_flat_amount numeric(14, 2) not null default 0,
  interest_rate_percentage numeric(8, 4) not null default 0,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.society_billing_rules enable row level security;

drop policy if exists "society_billing_rules_read_own_society" on public.society_billing_rules;
create policy "society_billing_rules_read_own_society"
  on public.society_billing_rules
  for select
  to authenticated
  using (society_id in (select public.auth_user_society_ids()));

drop policy if exists "society_billing_rules_write_staff" on public.society_billing_rules;
create policy "society_billing_rules_write_staff"
  on public.society_billing_rules
  for all
  to authenticated
  using (society_id in (select public.auth_user_society_ids()))
  with check (society_id in (select public.auth_user_society_ids()));

drop policy if exists "society_billing_rules_service_all" on public.society_billing_rules;
create policy "society_billing_rules_service_all"
  on public.society_billing_rules
  for all
  to service_role
  using (true)
  with check (true);

insert into public.society_billing_rules (society_id, maintenance_due_date, late_fee_grace_period_days, late_fee_flat_amount, interest_rate_percentage)
select id, 5, 7, 500, 1.5
from public.societies
where id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
on conflict (society_id) do nothing;

-- Avatar uploads (public read, authenticated write to own folder).
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read"
  on storage.objects
  for select
  to public
  using (bucket_id = 'avatars');

drop policy if exists "avatars_authenticated_insert" on storage.objects;
create policy "avatars_authenticated_insert"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'avatars');

drop policy if exists "avatars_authenticated_update" on storage.objects;
create policy "avatars_authenticated_update"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'avatars');
