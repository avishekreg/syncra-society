-- Society Rules & Regulations guidebook — dynamic per-society knowledge base for residents and WhatsApp automation.

create table if not exists public.society_rules_guidebook (
  society_id uuid primary key references public.societies(id) on delete cascade,
  security_rules text not null default '',
  community_rules text not null default '',
  visitor_vehicle_policy text not null default '',
  amenities jsonb not null default '[]'::jsonb,
  custom_sections jsonb not null default '[]'::jsonb,
  updated_by text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.society_rules_guidebook enable row level security;

drop policy if exists "society_rules_guidebook_read_own_society" on public.society_rules_guidebook;
create policy "society_rules_guidebook_read_own_society"
  on public.society_rules_guidebook
  for select
  to authenticated
  using (society_id in (select public.auth_user_society_ids()));

drop policy if exists "society_rules_guidebook_write_staff" on public.society_rules_guidebook;
create policy "society_rules_guidebook_write_staff"
  on public.society_rules_guidebook
  for all
  to authenticated
  using (society_id in (select public.auth_user_society_ids()))
  with check (society_id in (select public.auth_user_society_ids()));

drop policy if exists "society_rules_guidebook_service_all" on public.society_rules_guidebook;
create policy "society_rules_guidebook_service_all"
  on public.society_rules_guidebook
  for all
  to service_role
  using (true)
  with check (true);
