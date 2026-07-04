-- Syncra Society: update production n8n webhook URL in runtime config
-- Run in Supabase SQL Editor (no database trigger exists on notices → n8n;
-- notices are relayed from the Vite client / Next.js API layer instead).

insert into system_configs (key, value, description, updated_at)
values (
  'N8N_WEBHOOK_URL',
  'https://avishekreg-syncra-society.hf.space/webhook/syncra-society',
  'Live communication bridge webhook target',
  now()
)
on conflict (key) do update
set
  value = excluded.value,
  description = excluded.description,
  updated_at = now();

-- Verify
select key, value, updated_at from system_configs where key = 'N8N_WEBHOOK_URL';
