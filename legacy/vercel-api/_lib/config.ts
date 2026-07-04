function supabaseBaseUrl(): string {
  const raw = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? ''
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '')
}

const PRODUCTION_N8N_WEBHOOK_URL =
  'https://avishekreg-syncra-society.hf.space/webhook/syncra-society'

function n8nWebhookUrl(): string {
  return (
    process.env.N8N_WEBHOOK_URL ??
    process.env.VITE_N8N_WEBHOOK_URL ??
    PRODUCTION_N8N_WEBHOOK_URL
  )
}

export const config = {
  razorpayKeyId: process.env.RAZORPAY_KEY_ID ?? '',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET ?? '',
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET ?? '',
  supabaseUrl: supabaseBaseUrl(),
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  get n8nWebhookUrl() {
    return n8nWebhookUrl()
  },
  automationSecret: process.env.SYNCRA_AUTOMATION_SECRET ?? 'syncra-local-dev-secret',
  paymentsConfigured(): boolean {
    return Boolean(this.razorpayKeyId && this.razorpayKeySecret)
  },
  supabaseConfigured(): boolean {
    return Boolean(this.supabaseUrl && this.supabaseServiceRoleKey)
  },
  n8nConfigured(): boolean {
    return Boolean(this.n8nWebhookUrl)
  }
}

export function assertPaymentsConfigured() {
  if (!config.paymentsConfigured()) {
    throw new Error('Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.')
  }
}
