import { N8N_PRODUCTION_WEBHOOK_URL } from '../../lib/n8n-config'

export type SidebarModuleKey =
  | 'helpdesk'
  | 'visitorLogs'
  | 'surveys'
  | 'gallery'
  | 'elections'
  | 'rewards'
  | 'gatekeeper'
  | 'notices'
  | 'whatsappAutomation'

export type SocietyAddonKey =
  | 'whatsappAlerts'
  | 'electionModule'
  | 'voiceTicketing'
  | 'smartHelpdesk'

export type AiUtilitiesConfig = {
  huggingFaceToken: string
  voiceModel: string
  noticeEnhancerModel: string
}

export type CommunicationsConfig = {
  n8nWebhookUrl: string
  twilioSenderPhone: string
}

export type PaymentGatewaysConfig = {
  razorpayKeyId: string
  razorpayKeySecret: string
  razorpayWebhookSecret: string
  stripeWebhookSecret: string
}

export type PlatformWebhooksConfig = {
  /** Public endpoint for Razorpay/Stripe module-purchase webhooks */
  paymentsReceptionUrl: string
}

/** Per-society gateway overrides — empty fields inherit global defaults. */
export type SocietyGatewayConfig = {
  n8nWebhookUrl?: string
  twilioSenderPhone?: string
}

export type SurveyEngineConfig = {
  enabled: boolean
  maxQuestionsPerSurvey: number
  maxOptionsPerQuestion: number
  allowMultipleResponses: boolean
  defaultClosingDays: number
}

export type ElectionModuleConfig = {
  enabled: boolean
  maxPositionsPerElection: number
  maxCandidatesPerPosition: number
  defaultPositionTemplates: string[]
  allowAnonymousVoting: boolean
}

export type PlatformConfig = {
  sidebarModules: Record<SidebarModuleKey, boolean>
  aiUtilities: AiUtilitiesConfig
  communications: CommunicationsConfig
  paymentGateways: PaymentGatewaysConfig
  platformWebhooks: PlatformWebhooksConfig
  societyAddons: Record<string, Partial<Record<SocietyAddonKey, boolean>>>
  societyGateways: Record<string, SocietyGatewayConfig>
  surveyEngine: SurveyEngineConfig
  electionModule: ElectionModuleConfig
  updatedAt: string
}

export const DEFAULT_PAYMENTS_WEBHOOK_RECEPTION_URL =
  'https://syncra-society.vercel.app/api/webhooks/payments'

export const VOICE_MODEL_OPTIONS = [
  { value: 'openai/whisper-large-v3', label: 'openai/whisper-large-v3 (default)' },
  { value: 'openai/whisper-large-v2', label: 'openai/whisper-large-v2' },
  { value: 'openai/whisper-medium', label: 'openai/whisper-medium' }
] as const

export const NOTICE_ENHANCER_MODEL_OPTIONS = [
  {
    value: 'meta-llama/Meta-Llama-3-8B-Instruct',
    label: 'meta-llama/Meta-Llama-3-8B-Instruct (default)'
  },
  { value: 'meta-llama/Meta-Llama-3-70B-Instruct', label: 'meta-llama/Meta-Llama-3-70B-Instruct' },
  { value: 'mistralai/Mistral-7B-Instruct-v0.2', label: 'mistralai/Mistral-7B-Instruct-v0.2' }
] as const

export const SOCIETY_ADDON_LABELS: Record<
  SocietyAddonKey,
  { label: string; description: string; sidebarKeys: SidebarModuleKey[] }
> = {
  whatsappAlerts: {
    label: 'WhatsApp Alerts',
    description: 'n8n notice broadcasts and WhatsApp automation',
    sidebarKeys: ['whatsappAutomation', 'notices']
  },
  electionModule: {
    label: 'Election Module',
    description: 'Encrypted multi-position resident elections',
    sidebarKeys: ['elections']
  },
  voiceTicketing: {
    label: 'Voice Ticketing',
    description: 'Speech-to-text on Smart Helpdesk tickets',
    sidebarKeys: ['helpdesk']
  },
  smartHelpdesk: {
    label: 'Smart Helpdesk',
    description: 'Resident complaint and ticket portal',
    sidebarKeys: ['helpdesk']
  }
}

export const SIDEBAR_MODULE_LABELS: Record<
  SidebarModuleKey,
  { label: string; description: string; scope: 'resident' | 'rwa' | 'both' }
> = {
  helpdesk: { label: 'Smart Helpdesk', description: 'Resident ticket portal', scope: 'resident' },
  visitorLogs: { label: 'Visitor Logs', description: 'Resident visitor history', scope: 'resident' },
  surveys: { label: 'Surveys', description: 'Community polls & feedback', scope: 'both' },
  gallery: { label: 'Photo Gallery', description: 'Society media library', scope: 'both' },
  elections: { label: 'Elections', description: 'Encrypted resident voting', scope: 'both' },
  rewards: { label: 'Rewards & Recognition', description: 'Governance scoring badges', scope: 'both' },
  gatekeeper: { label: 'Guard Console', description: 'Gate entry management', scope: 'rwa' },
  notices: { label: 'Notices', description: 'Society announcements', scope: 'rwa' },
  whatsappAutomation: { label: 'WhatsApp Automation', description: 'n8n broadcast routing', scope: 'rwa' }
}

export { N8N_PRODUCTION_WEBHOOK_URL }
