import type { PlatformConfig } from '../types/platformConfig'

export const SYSTEM_CONFIG_MIRROR_KEY = 'syncra-system-config-mirror'
export const SYSTEM_CONFIG_MIRROR_EVENT = 'syncra-system-config-mirror-changed'

export type SystemConfigMirror = Record<string, string>

const INFRASTRUCTURE_KEY_MAP: Array<{
  configKey: keyof PlatformConfig | 'nested'
  systemKey: string
  resolve: (config: PlatformConfig) => string
}> = [
  {
    configKey: 'nested',
    systemKey: 'N8N_WEBHOOK_URL',
    resolve: (config) => config.communications.n8nWebhookUrl
  },
  {
    configKey: 'nested',
    systemKey: 'TWILIO_DEFAULT_FROM',
    resolve: (config) => config.communications.twilioSenderPhone
  },
  {
    configKey: 'nested',
    systemKey: 'PAYMENT_GATEWAY_PUBLIC_KEY',
    resolve: (config) => config.paymentGateways.razorpayKeyId
  },
  {
    configKey: 'nested',
    systemKey: 'PAYMENT_GATEWAY_SECRET_KEY',
    resolve: (config) => config.paymentGateways.razorpayKeySecret
  },
  {
    configKey: 'nested',
    systemKey: 'RAZORPAY_WEBHOOK_SECRET',
    resolve: (config) => config.paymentGateways.razorpayWebhookSecret
  },
  {
    configKey: 'nested',
    systemKey: 'STRIPE_WEBHOOK_SECRET',
    resolve: (config) => config.paymentGateways.stripeWebhookSecret
  },
  {
    configKey: 'nested',
    systemKey: 'PLATFORM_PAYMENTS_WEBHOOK_URL',
    resolve: (config) => config.platformWebhooks.paymentsReceptionUrl
  }
]

export function buildSystemConfigMirror(config: PlatformConfig): SystemConfigMirror {
  return Object.fromEntries(
    INFRASTRUCTURE_KEY_MAP.map(({ systemKey, resolve }) => [systemKey, resolve(config).trim()])
  )
}

export function writeSystemConfigMirror(config: PlatformConfig) {
  const mirror = buildSystemConfigMirror(config)
  localStorage.setItem(SYSTEM_CONFIG_MIRROR_KEY, JSON.stringify(mirror))
  window.dispatchEvent(new CustomEvent(SYSTEM_CONFIG_MIRROR_EVENT, { detail: mirror }))
  return mirror
}

export function readSystemConfigMirror(): SystemConfigMirror {
  try {
    const raw = localStorage.getItem(SYSTEM_CONFIG_MIRROR_KEY)
    return raw ? (JSON.parse(raw) as SystemConfigMirror) : {}
  } catch {
    return {}
  }
}

/** Migrate legacy Razorpay keys stored outside platform config. */
export function migrateLegacyRazorpayKeys(config: PlatformConfig): PlatformConfig {
  if (config.paymentGateways.razorpayKeyId || config.paymentGateways.razorpayKeySecret) {
    return config
  }

  try {
    const raw = localStorage.getItem('syncra-razorpay-keys')
    if (!raw) return config
    const parsed = JSON.parse(raw) as { keyId?: string; keySecret?: string }
    return {
      ...config,
      paymentGateways: {
        ...config.paymentGateways,
        razorpayKeyId: parsed.keyId ?? '',
        razorpayKeySecret: parsed.keySecret ?? ''
      }
    }
  } catch {
    return config
  }
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

/**
 * Persists infrastructure keys to the local mirror and optionally mirrors to Next.js system_configs.
 * Falls back gracefully when the admin API is offline (mock/local-only mode).
 */
export async function syncInfrastructureFromPlatformConfig(
  config: PlatformConfig
): Promise<{ mirror: SystemConfigMirror; remoteSynced: boolean }> {
  const mirror = writeSystemConfigMirror(config)
  let remoteSynced = false

  const adminKey =
    import.meta.env.VITE_SUPER_ADMIN_SECRET?.trim() ||
    import.meta.env.NEXT_PUBLIC_SUPER_ADMIN_SECRET?.trim() ||
    ''

  if (!adminKey) {
    return { mirror, remoteSynced }
  }

  for (const { systemKey, resolve } of INFRASTRUCTURE_KEY_MAP) {
    const value = resolve(config).trim()
    if (!value) continue

    try {
      const res = await fetch(`${API_BASE}/api/admin/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-super-admin-key': adminKey
        },
        body: JSON.stringify({ key: systemKey, value })
      })
      if (res.ok) remoteSynced = true
    } catch {
      // Local mirror already saved — API sync is best-effort.
    }
  }

  return { mirror, remoteSynced }
}

export function getMirroredSystemConfig(key: string): string | undefined {
  return readSystemConfigMirror()[key]
}
