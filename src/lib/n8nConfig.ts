import { N8N_PRODUCTION_WEBHOOK_URL } from '../../lib/n8n-config'

export { N8N_PRODUCTION_WEBHOOK_URL }

/** Client-side resolver — env override for staging, otherwise production URL. */
export function resolveClientN8nWebhookUrl() {
  const fromEnv =
    import.meta.env.VITE_N8N_WEBHOOK_URL ?? import.meta.env.NEXT_PUBLIC_N8N_WEBHOOK_URL
  const trimmed = typeof fromEnv === 'string' ? fromEnv.trim() : ''
  return trimmed || N8N_PRODUCTION_WEBHOOK_URL
}
