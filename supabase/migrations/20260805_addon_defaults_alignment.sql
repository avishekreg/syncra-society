-- Align seed defaults with marketing: Elections, Vendor SLA, and Marketplace
-- are premium add-ons (default OFF). Core RWA ops (billing, notices, gatekeeper,
-- helpdesk) are platform baseline and are not feature_toggles rows.

create or replace function public.seed_default_feature_toggles(p_society_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  premium_modules text[] := array[
    'whatsapp_automation',
    'election_module',
    'ai_rwa_audit',
    'smart_parking',
    'vendor_sla',
    'resident_marketplace'
  ];
  module text;
begin
  if p_society_id is null then
    raise exception 'society_id is required';
  end if;

  foreach module in array premium_modules loop
    insert into public.feature_toggles (society_id, module_name, is_enabled, source)
    values (p_society_id, module, false, 'base')
    on conflict (society_id, module_name) do nothing;
  end loop;
end;
$$;
