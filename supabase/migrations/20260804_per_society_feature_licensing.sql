-- Per-society dynamic licensing: expand module registry, track entitlement source,
-- and auto-activate purchased add-ons for a specific society_id only.

alter table public.feature_toggles
  add column if not exists source text not null default 'base'
    check (source in ('base', 'purchased', 'super_admin'));

create index if not exists idx_feature_toggles_society_enabled
  on public.feature_toggles(society_id, is_enabled);

-- Core modules default ON; premium add-ons default OFF.
create or replace function public.seed_default_feature_toggles(p_society_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  core_modules text[] := array[
    'election_module',
    'vendor_sla',
    'resident_marketplace'
  ];
  premium_modules text[] := array[
    'whatsapp_automation',
    'ai_rwa_audit',
    'smart_parking'
  ];
  module text;
begin
  if p_society_id is null then
    raise exception 'society_id is required';
  end if;

  foreach module in array core_modules loop
    insert into public.feature_toggles (society_id, module_name, is_enabled, source)
    values (p_society_id, module, true, 'base')
    on conflict (society_id, module_name) do nothing;
  end loop;

  foreach module in array premium_modules loop
    insert into public.feature_toggles (society_id, module_name, is_enabled, source)
    values (p_society_id, module, false, 'base')
    on conflict (society_id, module_name) do nothing;
  end loop;
end;
$$;

-- Backfill any missing module rows for existing societies (does not overwrite toggles).
do $$
declare
  sid uuid;
begin
  for sid in select id from public.societies loop
    perform public.seed_default_feature_toggles(sid);
  end loop;
end $$;

-- Checkout / webhook: enable purchased modules for ONE society only.
create or replace function public.activate_society_addons(
  p_society_id uuid,
  p_modules text[]
)
returns setof public.feature_toggles
language plpgsql
security definer
set search_path = public
as $$
declare
  module text;
  normalized text;
begin
  if p_society_id is null then
    raise exception 'society_id is required';
  end if;

  perform public.seed_default_feature_toggles(p_society_id);

  if p_modules is null then
    return;
  end if;

  foreach module in array p_modules loop
    normalized := lower(trim(module));
    -- Alias normalization
    if normalized in ('whatsapp_alerts', 'whatsappalerts', 'whatsapp') then
      normalized := 'whatsapp_automation';
    elsif normalized in ('election_engine', 'electionmodule', 'elections') then
      normalized := 'election_module';
    elsif normalized in ('ai_audit', 'airwaaudit') then
      normalized := 'ai_rwa_audit';
    elsif normalized in ('smartparking') then
      normalized := 'smart_parking';
    elsif normalized in ('vendorsla') then
      normalized := 'vendor_sla';
    elsif normalized in ('marketplace', 'residentmarketplace') then
      normalized := 'resident_marketplace';
    end if;

    if normalized not in (
      'whatsapp_automation',
      'election_module',
      'ai_rwa_audit',
      'smart_parking',
      'vendor_sla',
      'resident_marketplace'
    ) then
      continue;
    end if;

    insert into public.feature_toggles (society_id, module_name, is_enabled, source, updated_at)
    values (p_society_id, normalized, true, 'purchased', now())
    on conflict (society_id, module_name)
    do update set
      is_enabled = true,
      source = case
        when public.feature_toggles.source = 'super_admin' then 'super_admin'
        else 'purchased'
      end,
      updated_at = now();
  end loop;

  return query
    select *
    from public.feature_toggles
    where society_id = p_society_id
      and module_name = any (
        select unnest(array[
          'whatsapp_automation',
          'election_module',
          'ai_rwa_audit',
          'smart_parking',
          'vendor_sla',
          'resident_marketplace'
        ])
      );
end;
$$;

grant execute on function public.activate_society_addons(uuid, text[]) to authenticated, service_role;

-- Super Admin toggle records entitlement source.
create or replace function public.set_feature_toggle(
  p_society_id uuid,
  p_module_name text,
  p_is_enabled boolean
)
returns public.feature_toggles
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.feature_toggles;
  normalized text;
begin
  if p_society_id is null then
    raise exception 'society_id is required';
  end if;

  if not public.is_platform_super_admin() then
    raise exception 'Only Super Admin can update feature toggles';
  end if;

  normalized := lower(trim(p_module_name));
  if normalized in ('whatsapp_alerts', 'whatsappalerts') then
    normalized := 'whatsapp_automation';
  end if;

  insert into public.feature_toggles (society_id, module_name, is_enabled, source, updated_at)
  values (p_society_id, normalized, p_is_enabled, 'super_admin', now())
  on conflict (society_id, module_name)
  do update set
    is_enabled = excluded.is_enabled,
    source = 'super_admin',
    updated_at = now()
  returning * into result;

  return result;
end;
$$;

-- Tighten SELECT: society members only see their society; super admin sees all.
drop policy if exists "feature_toggles_select_society_members" on public.feature_toggles;
create policy "feature_toggles_select_society_members"
  on public.feature_toggles
  for select
  to authenticated
  using (
    public.is_platform_super_admin()
    or society_id in (select public.auth_user_society_ids())
  );
