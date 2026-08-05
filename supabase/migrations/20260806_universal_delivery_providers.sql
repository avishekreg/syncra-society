-- Expand delivery_pre_approvals to universal courier / logistics / postal providers.

alter table public.delivery_pre_approvals
  drop constraint if exists delivery_pre_approvals_service_provider_check;

-- Preserve legacy "Other" rows under the new generic label.
update public.delivery_pre_approvals
set service_provider = 'Generic Courier / Parcel'
where service_provider = 'Other';

alter table public.delivery_pre_approvals
  add constraint delivery_pre_approvals_service_provider_check
  check (
    service_provider in (
      -- Food / Grocery
      'Swiggy',
      'Zomato',
      'Blinkit',
      'Zepto',
      'BigBasket',
      -- E-Commerce / E-Logistics
      'Amazon',
      'Flipkart',
      'Blue Dart',
      'Delhivery',
      'DTDC',
      'Xpressbees',
      'Shadowfax',
      -- Postal & Govt
      'India Post / Speed Post',
      'Registered Parcel',
      -- Fallback
      'Generic Courier / Parcel'
    )
  );
