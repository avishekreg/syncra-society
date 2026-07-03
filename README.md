# Syncra Society

Modular housing society management platform — **Next.js App Router**, **Supabase**, **Vercel**, zero-code runtime config, and premium feature gating.

## Architecture

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, TypeScript, Tailwind, Shadcn UI |
| Database | Supabase PostgreSQL (`schema.sql`) |
| Config | `system_configs` table (zero-code pipeline) |
| Payments | `PaymentFactory` → Razorpay / Stripe / Chile |
| Automation | Dynamic n8n webhook from `system_configs` |
| Feature gates | `societies.active_addons[]` → 403 on API |

## Setup

1. Run [`schema.sql`](./schema.sql) in Supabase SQL Editor
2. Copy `.env.example` → `.env`
3. `npm install && npm run dev`

## Vercel environment

| Variable | Scope |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + Server |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only |
| `SUPER_ADMIN_SECRET` | Server only (admin API) |

Runtime values (n8n URL, payment gateway, keys) are managed via **Super Admin → `/admin/config`** and stored in `system_configs` — no redeploy needed.

## Premium addons

| Addon | Effect |
|-------|--------|
| `whatsapp_automation` | Enables n8n POST on notices/visitors/payments |
| `payment_gateway` | Enables PaymentFactory order creation |

Societies without addons receive **403 Forbidden** on gated routes and see an **Unlock Premium Module** upsell card in the UI.

## Payment webhook

```
POST /api/payments/webhook
Header: x-razorpay-signature
```

On verified `paid` event → updates `payments.status` → streams n8n WhatsApp alert.

## Deploy

```bash
git add .
git commit -m "Syncra Society v2: modular schema, config pipeline, payment factory"
git push origin main
```
