import { createAdminClient } from '@/lib/supabase/admin'
import type { PaymentGatewayProvider } from '@/types/database'
import { N8N_PRODUCTION_WEBHOOK_URL } from '@/lib/n8n-config'

const ENV_FALLBACKS: Record<string, string> = {
  N8N_WEBHOOK_URL: process.env.N8N_WEBHOOK_URL ?? N8N_PRODUCTION_WEBHOOK_URL,
  TWILIO_DEFAULT_FROM: process.env.TWILIO_DEFAULT_FROM ?? '+14155238886',
  ACTIVE_PAYMENT_GATEWAY: process.env.ACTIVE_PAYMENT_GATEWAY ?? 'RAZORPAY',
  PAYMENT_GATEWAY_PUBLIC_KEY:
    process.env.PAYMENT_GATEWAY_PUBLIC_KEY ?? process.env.RAZORPAY_KEY_ID ?? 'rzp_test_placeholder',
  PAYMENT_GATEWAY_SECRET_KEY:
    process.env.PAYMENT_GATEWAY_SECRET_KEY ?? process.env.RAZORPAY_KEY_SECRET ?? 'rzp_secret_placeholder',
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET ?? ''
}

let cache: Map<string, string> | null = null
let cacheAt = 0
const CACHE_TTL_MS = 30_000

async function loadAllConfigs(): Promise<Map<string, string>> {
  const now = Date.now()
  if (cache && now - cacheAt < CACHE_TTL_MS) return cache

  const map = new Map<string, string>(Object.entries(ENV_FALLBACKS))

  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase.from('system_configs').select('key, value')
    if (!error && data) {
      for (const row of data) {
        if (row.value) map.set(row.key, row.value)
      }
    }
  } catch {
    // Database unavailable — env fallbacks only
  }

  cache = map
  cacheAt = now
  return map
}

export function invalidateConfigCache() {
  cache = null
  cacheAt = 0
}

export async function getSystemConfig(key: string): Promise<string> {
  const configs = await loadAllConfigs()
  return configs.get(key) ?? ENV_FALLBACKS[key] ?? ''
}

export async function getAllSystemConfigs() {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from('system_configs').select('*').order('key')
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function upsertSystemConfig(key: string, value: string, description?: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('system_configs')
    .upsert({ key, value, description, updated_at: new Date().toISOString() }, { onConflict: 'key' })
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  invalidateConfigCache()
  return data
}

export async function getActivePaymentGateway(): Promise<PaymentGatewayProvider> {
  const raw = (await getSystemConfig('ACTIVE_PAYMENT_GATEWAY')).toUpperCase()
  if (raw === 'STRIPE' || raw === 'CHILE_LOCAL') return raw
  return 'RAZORPAY'
}

export async function getPaymentGatewayKeys() {
  return {
    publicKey: await getSystemConfig('PAYMENT_GATEWAY_PUBLIC_KEY'),
    secretKey: await getSystemConfig('PAYMENT_GATEWAY_SECRET_KEY'),
    webhookSecret: await getSystemConfig('RAZORPAY_WEBHOOK_SECRET')
  }
}

export async function getN8nWebhookUrl() {
  return getSystemConfig('N8N_WEBHOOK_URL')
}

export async function getTwilioDefaultFrom() {
  return getSystemConfig('TWILIO_DEFAULT_FROM')
}
