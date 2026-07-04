import { getMirroredSystemConfig } from './systemConfigSync'
import { getPlatformConfig, getSocietyGatewayConfig } from './platformConfig'
import { N8N_PRODUCTION_WEBHOOK_URL } from '../../lib/n8n-config'

export { N8N_PRODUCTION_WEBHOOK_URL }

/** Client-side resolver — society override → master config → env → production default. */
export function resolveClientN8nWebhookUrl(societyId?: string | null) {
  const societyOverride = getSocietyGatewayConfig(societyId).n8nWebhookUrl?.trim()
  if (societyOverride) return societyOverride

  const fromMaster = getPlatformConfig().communications.n8nWebhookUrl?.trim()
  if (fromMaster) return fromMaster

  const fromEnv =
    import.meta.env.VITE_N8N_WEBHOOK_URL ?? import.meta.env.NEXT_PUBLIC_N8N_WEBHOOK_URL
  const trimmed = typeof fromEnv === 'string' ? fromEnv.trim() : ''
  return trimmed || N8N_PRODUCTION_WEBHOOK_URL
}

export function resolveTwilioSenderPhone(societyId?: string | null) {
  const societyOverride = getSocietyGatewayConfig(societyId).twilioSenderPhone?.trim()
  if (societyOverride) return societyOverride

  const fromMaster = getPlatformConfig().communications.twilioSenderPhone?.trim()
  if (fromMaster) return fromMaster

  return (
    import.meta.env.VITE_SOCIETY_WHATSAPP_SENDER?.trim() ||
    import.meta.env.NEXT_PUBLIC_SOCIETY_WHATSAPP_SENDER?.trim() ||
    '+14155238886'
  )
}

export function resolveHuggingFaceToken() {
  return (
    getPlatformConfig().aiUtilities.huggingFaceToken?.trim() ||
    getMirroredSystemConfig('HUGGING_FACE_API_TOKEN')?.trim() ||
    ''
  )
}

export function resolveVoiceModel() {
  return getPlatformConfig().aiUtilities.voiceModel || 'openai/whisper-large-v3'
}

export function resolveNoticeEnhancerModel() {
  return getPlatformConfig().aiUtilities.noticeEnhancerModel || 'meta-llama/Meta-Llama-3-8B-Instruct'
}
