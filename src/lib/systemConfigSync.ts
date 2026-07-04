import type { PlatformConfig } from '../types/platformConfig'
import {
  DEFAULT_PAYMENTS_WEBHOOK_RECEPTION_URL,
  N8N_PRODUCTION_WEBHOOK_URL
} from '../types/platformConfig'

const DEFAULT_VOICE_MODEL = 'openai/whisper-large-v3'
const DEFAULT_NOTICE_MODEL = 'meta-llama/Meta-Llama-3-8B-Instruct'
const DEFAULT_TWILIO = '+14155238886'

export const SYSTEM_CONFIG_MIRROR_KEY = 'syncra-system-config-mirror'
export const SYSTEM_CONFIG_MIRROR_EVENT = 'syncra-system-config-mirror-changed'

export type SystemConfigMirror = Record<string, string>

const INFRASTRUCTURE_KEY_MAP: Array<{
  systemKey: string
  resolve: (config: PlatformConfig) => string
}> = [
  {
    systemKey: 'HUGGING_FACE_API_TOKEN',
    resolve: (config) => config.aiUtilities.huggingFaceToken
  },
  {
    systemKey: 'AI_VOICE_MODEL',
    resolve: (config) => config.aiUtilities.voiceModel
  },
  {
    systemKey: 'AI_NOTICE_ENHANCER_MODEL',
    resolve: (config) => config.aiUtilities.noticeEnhancerModel
  },
  {
    systemKey: 'N8N_WEBHOOK_URL',
    resolve: (config) => config.communications.n8nWebhookUrl
  },
  {
    systemKey: 'TWILIO_DEFAULT_FROM',
    resolve: (config) => config.communications.twilioSenderPhone
  },
  {
    systemKey: 'PAYMENT_GATEWAY_PUBLIC_KEY',
    resolve: (config) => config.paymentGateways.razorpayKeyId
  },
  {
    systemKey: 'PAYMENT_GATEWAY_SECRET_KEY',
    resolve: (config) => config.paymentGateways.razorpayKeySecret
  },
  {
    systemKey: 'RAZORPAY_WEBHOOK_SECRET',
    resolve: (config) => config.paymentGateways.razorpayWebhookSecret
  },
  {
    systemKey: 'STRIPE_WEBHOOK_SECRET',
    resolve: (config) => config.paymentGateways.stripeWebhookSecret
  },
  {
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
  if (typeof window === 'undefined') return buildSystemConfigMirror(config)

  const existing = readSystemConfigMirror()
  const next = {
    ...existing,
    ...buildSystemConfigMirror(config)
  }

  localStorage.setItem(SYSTEM_CONFIG_MIRROR_KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent(SYSTEM_CONFIG_MIRROR_EVENT, { detail: next }))
  return next
}

export function readSystemConfigMirror(): SystemConfigMirror {
  if (typeof window === 'undefined') return {}

  try {
    const raw = localStorage.getItem(SYSTEM_CONFIG_MIRROR_KEY)
    return raw ? (JSON.parse(raw) as SystemConfigMirror) : {}
  } catch {
    return {}
  }
}

/** Restore platform config secrets from the local mirror after hard refresh. */
export function hydratePlatformConfigFromMirror(config: PlatformConfig): PlatformConfig {
  const mirror = readSystemConfigMirror()
  if (!Object.keys(mirror).length) return config

  return {
    ...config,
    aiUtilities: {
      ...config.aiUtilities,
      huggingFaceToken:
        config.aiUtilities.huggingFaceToken.trim() ||
        mirror.HUGGING_FACE_API_TOKEN?.trim() ||
        '',
      voiceModel:
        config.aiUtilities.voiceModel ||
        mirror.AI_VOICE_MODEL?.trim() ||
        DEFAULT_VOICE_MODEL,
      noticeEnhancerModel:
        config.aiUtilities.noticeEnhancerModel ||
        mirror.AI_NOTICE_ENHANCER_MODEL?.trim() ||
        DEFAULT_NOTICE_MODEL
    },
    communications: {
      ...config.communications,
      n8nWebhookUrl:
        config.communications.n8nWebhookUrl.trim() ||
        mirror.N8N_WEBHOOK_URL?.trim() ||
        N8N_PRODUCTION_WEBHOOK_URL,
      twilioSenderPhone:
        config.communications.twilioSenderPhone.trim() ||
        mirror.TWILIO_DEFAULT_FROM?.trim() ||
        DEFAULT_TWILIO
    },
    paymentGateways: {
      ...config.paymentGateways,
      razorpayKeyId:
        config.paymentGateways.razorpayKeyId.trim() ||
        mirror.PAYMENT_GATEWAY_PUBLIC_KEY?.trim() ||
        '',
      razorpayKeySecret:
        config.paymentGateways.razorpayKeySecret.trim() ||
        mirror.PAYMENT_GATEWAY_SECRET_KEY?.trim() ||
        '',
      razorpayWebhookSecret:
        config.paymentGateways.razorpayWebhookSecret.trim() ||
        mirror.RAZORPAY_WEBHOOK_SECRET?.trim() ||
        '',
      stripeWebhookSecret:
        config.paymentGateways.stripeWebhookSecret.trim() ||
        mirror.STRIPE_WEBHOOK_SECRET?.trim() ||
        ''
    },
    platformWebhooks: {
      ...config.platformWebhooks,
      paymentsReceptionUrl:
        config.platformWebhooks.paymentsReceptionUrl.trim() ||
        mirror.PLATFORM_PAYMENTS_WEBHOOK_URL?.trim() ||
        DEFAULT_PAYMENTS_WEBHOOK_RECEPTION_URL
    }
  }
}

/** Prefer locally persisted secrets when remote Supabase payload is empty. */
export function mergePlatformConfigPreferLocalSecrets(
  local: PlatformConfig,
  remote: PlatformConfig
): PlatformConfig {
  const pick = (remoteValue: string, localValue: string) => remoteValue.trim() || localValue.trim()

  return hydratePlatformConfigFromMirror({
    ...remote,
    aiUtilities: {
      ...remote.aiUtilities,
      huggingFaceToken: pick(remote.aiUtilities.huggingFaceToken, local.aiUtilities.huggingFaceToken),
      voiceModel: pick(remote.aiUtilities.voiceModel, local.aiUtilities.voiceModel),
      noticeEnhancerModel: pick(
        remote.aiUtilities.noticeEnhancerModel,
        local.aiUtilities.noticeEnhancerModel
      )
    },
    communications: {
      ...remote.communications,
      n8nWebhookUrl: pick(remote.communications.n8nWebhookUrl, local.communications.n8nWebhookUrl),
      twilioSenderPhone: pick(
        remote.communications.twilioSenderPhone,
        local.communications.twilioSenderPhone
      )
    },
    paymentGateways: {
      ...remote.paymentGateways,
      razorpayKeyId: pick(remote.paymentGateways.razorpayKeyId, local.paymentGateways.razorpayKeyId),
      razorpayKeySecret: pick(
        remote.paymentGateways.razorpayKeySecret,
        local.paymentGateways.razorpayKeySecret
      ),
      razorpayWebhookSecret: pick(
        remote.paymentGateways.razorpayWebhookSecret,
        local.paymentGateways.razorpayWebhookSecret
      ),
      stripeWebhookSecret: pick(
        remote.paymentGateways.stripeWebhookSecret,
        local.paymentGateways.stripeWebhookSecret
      )
    },
    platformWebhooks: {
      ...remote.platformWebhooks,
      paymentsReceptionUrl: pick(
        remote.platformWebhooks.paymentsReceptionUrl,
        local.platformWebhooks.paymentsReceptionUrl
      )
    },
    societyAddons: { ...local.societyAddons, ...remote.societyAddons },
    societyGateways: { ...local.societyGateways, ...remote.societyGateways }
  })
}

/** Migrate legacy Razorpay keys stored outside platform config. */
export function migrateLegacyRazorpayKeys(config: PlatformConfig): PlatformConfig {
  if (config.paymentGateways.razorpayKeyId || config.paymentGateways.razorpayKeySecret) {
    return config
  }

  if (typeof window === 'undefined') return config

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
