import React, { useState } from 'react'
import { ui } from '../../lib/ui'
import { usePlatformConfig } from '../../providers/PlatformConfigProvider'
import {
  DEFAULT_PAYMENTS_WEBHOOK_RECEPTION_URL,
  N8N_PRODUCTION_WEBHOOK_URL,
  NOTICE_ENHANCER_MODEL_OPTIONS,
  SIDEBAR_MODULE_LABELS,
  VOICE_MODEL_OPTIONS,
  type SidebarModuleKey
} from '../../types/platformConfig'

const saveBtn =
  'inline-flex min-h-11 items-center justify-center rounded-xl bg-syncra-blue px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0047b3]'

function CollapsibleSection({
  title,
  subtitle,
  defaultOpen = false,
  children
}: {
  title: string
  subtitle: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left transition hover:bg-syncra-surface-alt"
      >
        <span>
          <span className="block text-sm font-semibold text-syncra-primary">{title}</span>
          <span className="mt-1 block text-xs text-slate-500">{subtitle}</span>
        </span>
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`mt-0.5 h-5 w-5 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {open && <div className="space-y-4 border-t border-slate-100 px-5 py-5">{children}</div>}
    </section>
  )
}

function ToggleRow({
  label,
  description,
  checked,
  onChange
}: {
  label: string
  description: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-slate-200 bg-syncra-surface-alt px-4 py-3 transition hover:border-syncra-accent/30">
      <span>
        <span className="block text-sm font-medium text-slate-800">{label}</span>
        <span className="mt-0.5 block text-xs text-slate-500">{description}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-syncra-blue focus:ring-syncra-accent/30"
      />
    </label>
  )
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  hint
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
  hint?: string
}) {
  return (
    <label className="block">
      <span className={`mb-2 block ${ui.label}`}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={ui.input}
        placeholder={placeholder}
      />
      {hint && <span className="mt-1.5 block text-xs text-slate-500">{hint}</span>}
    </label>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: ReadonlyArray<{ value: string; label: string }>
}) {
  return (
    <label className="block">
      <span className={`mb-2 block ${ui.label}`}>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className={ui.input}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export default function MasterSystemConfig() {
  const { config, updateConfig, setSidebarModule, saveGlobalSettings, supabaseSynced, systemConfigSynced } =
    usePlatformConfig()
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)

  function flashSaved(message: string) {
    setStatus(message)
    window.setTimeout(() => setStatus(''), 5000)
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    try {
      const { remoteSynced } = await saveGlobalSettings()
      flashSaved(
        remoteSynced
          ? 'Global platform settings saved — local mirror, Supabase, and system_configs updated.'
          : 'Global platform settings saved — local mirror active (API sync when SUPER_ADMIN_SECRET is configured).'
      )
    } finally {
      setSaving(false)
    }
  }

  const sidebarKeys = Object.keys(SIDEBAR_MODULE_LABELS) as SidebarModuleKey[]
  const gateways = config.paymentGateways
  const webhooks = config.platformWebhooks

  return (
    <div className="space-y-6">
      <header className={ui.card}>
        <p className={ui.eyebrow}>Infrastructure control plane</p>
        <p className={`mt-3 max-w-3xl ${ui.body}`}>
          Configure payment gateway secrets, platform webhook endpoints, AI engines, and default automation
          gateways from one surface — no manual env edits required. Per-society module toggles live in
          Societies Manager.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Platform config: {supabaseSynced ? 'Supabase synced' : 'local-only'} · System configs:{' '}
          {systemConfigSynced ? 'API mirrored' : 'local mirror only'}
        </p>
      </header>

      <form onSubmit={(event) => void handleSave(event)} className="space-y-4">
        <CollapsibleSection
          title="AI Integrations"
          subtitle="Hugging Face token and default speech / notice enhancer models"
          defaultOpen
        >
          <TextField
            label="Hugging Face API Token"
            value={config.aiUtilities.huggingFaceToken}
            onChange={(huggingFaceToken) =>
              updateConfig({ aiUtilities: { ...config.aiUtilities, huggingFaceToken } })
            }
            placeholder="hf_..."
            type="password"
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SelectField
              label="Voice / Complaints model"
              value={config.aiUtilities.voiceModel}
              onChange={(voiceModel) => updateConfig({ aiUtilities: { ...config.aiUtilities, voiceModel } })}
              options={VOICE_MODEL_OPTIONS}
            />
            <SelectField
              label="Notice enhancer model"
              value={config.aiUtilities.noticeEnhancerModel}
              onChange={(noticeEnhancerModel) =>
                updateConfig({ aiUtilities: { ...config.aiUtilities, noticeEnhancerModel } })
              }
              options={NOTICE_ENHANCER_MODEL_OPTIONS}
            />
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Default n8n Gateway"
          subtitle="Global fallback webhook for notice broadcasts and automation relays"
          defaultOpen
        >
          <TextField
            label="Production n8n Webhook URL"
            value={config.communications.n8nWebhookUrl}
            onChange={(n8nWebhookUrl) =>
              updateConfig({ communications: { ...config.communications, n8nWebhookUrl } })
            }
            placeholder={N8N_PRODUCTION_WEBHOOK_URL}
            hint="Maps to system_configs.N8N_WEBHOOK_URL on save."
          />
          <TextField
            label="Default Twilio / BSP Sender Phone"
            value={config.communications.twilioSenderPhone}
            onChange={(twilioSenderPhone) =>
              updateConfig({ communications: { ...config.communications, twilioSenderPhone } })
            }
            placeholder="+14155238886"
            hint="Maps to system_configs.TWILIO_DEFAULT_FROM on save."
          />
        </CollapsibleSection>

        <CollapsibleSection
          title="Global Payment Gateways"
          subtitle="Razorpay settlement keys and verified webhook signing secrets"
          defaultOpen
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TextField
              label="Razorpay Key ID"
              value={gateways.razorpayKeyId}
              onChange={(razorpayKeyId) =>
                updateConfig({ paymentGateways: { ...gateways, razorpayKeyId } })
              }
              placeholder="rzp_live_..."
            />
            <TextField
              label="Razorpay Key Secret"
              value={gateways.razorpayKeySecret}
              onChange={(razorpayKeySecret) =>
                updateConfig({ paymentGateways: { ...gateways, razorpayKeySecret } })
              }
              placeholder="Your Razorpay secret"
              type="password"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TextField
              label="RAZORPAY_WEBHOOK_SECRET"
              value={gateways.razorpayWebhookSecret}
              onChange={(razorpayWebhookSecret) =>
                updateConfig({ paymentGateways: { ...gateways, razorpayWebhookSecret } })
              }
              placeholder="whsec_razorpay_..."
              type="password"
              hint="Used to verify payment.captured events at /api/webhooks/payments."
            />
            <TextField
              label="STRIPE_WEBHOOK_SECRET"
              value={gateways.stripeWebhookSecret}
              onChange={(stripeWebhookSecret) =>
                updateConfig({ paymentGateways: { ...gateways, stripeWebhookSecret } })
              }
              placeholder="whsec_stripe_..."
              type="password"
              hint="Stripe signing secret for checkout.session.completed events."
            />
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Platform Core Webhooks"
          subtitle="Public URLs payment providers should POST module-purchase events to"
          defaultOpen
        >
          <TextField
            label="Payments Webhook Reception URL"
            value={webhooks.paymentsReceptionUrl}
            onChange={(paymentsReceptionUrl) =>
              updateConfig({ platformWebhooks: { ...webhooks, paymentsReceptionUrl } })
            }
            placeholder={DEFAULT_PAYMENTS_WEBHOOK_RECEPTION_URL}
            hint="Register this URL in Razorpay / Stripe dashboards for automated module activation."
          />
        </CollapsibleSection>

        <CollapsibleSection
          title="Global Sidebar Modules"
          subtitle="Platform-wide navigation toggles combined with per-society gating in Societies Manager"
        >
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {sidebarKeys.map((key) => {
              const meta = SIDEBAR_MODULE_LABELS[key]
              return (
                <ToggleRow
                  key={key}
                  label={meta.label}
                  description={`${meta.description} · ${meta.scope}`}
                  checked={config.sidebarModules[key]}
                  onChange={(enabled) => setSidebarModule(key, enabled)}
                />
              )
            })}
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="Survey Engine" subtitle="Multi-question survey limits and defaults">
          <ToggleRow
            label="Survey engine enabled"
            description="Allow RWA to launch multi-question surveys"
            checked={config.surveyEngine.enabled}
            onChange={(enabled) =>
              updateConfig({ surveyEngine: { ...config.surveyEngine, enabled } })
            }
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <TextField
              label="Max questions"
              value={String(config.surveyEngine.maxQuestionsPerSurvey)}
              onChange={(raw) =>
                updateConfig({
                  surveyEngine: {
                    ...config.surveyEngine,
                    maxQuestionsPerSurvey: Number(raw) || 1
                  }
                })
              }
            />
            <TextField
              label="Max options per question"
              value={String(config.surveyEngine.maxOptionsPerQuestion)}
              onChange={(raw) =>
                updateConfig({
                  surveyEngine: {
                    ...config.surveyEngine,
                    maxOptionsPerQuestion: Number(raw) || 2
                  }
                })
              }
            />
            <TextField
              label="Default closing days"
              value={String(config.surveyEngine.defaultClosingDays)}
              onChange={(raw) =>
                updateConfig({
                  surveyEngine: {
                    ...config.surveyEngine,
                    defaultClosingDays: Number(raw) || 1
                  }
                })
              }
            />
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="Election Module" subtitle="Dynamic election positions and ballot limits">
          <ToggleRow
            label="Election module enabled"
            description="Allow encrypted multi-position resident elections"
            checked={config.electionModule.enabled}
            onChange={(enabled) =>
              updateConfig({ electionModule: { ...config.electionModule, enabled } })
            }
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField
              label="Max positions per election"
              value={String(config.electionModule.maxPositionsPerElection)}
              onChange={(raw) =>
                updateConfig({
                  electionModule: {
                    ...config.electionModule,
                    maxPositionsPerElection: Number(raw) || 1
                  }
                })
              }
            />
            <TextField
              label="Max candidates per position"
              value={String(config.electionModule.maxCandidatesPerPosition)}
              onChange={(raw) =>
                updateConfig({
                  electionModule: {
                    ...config.electionModule,
                    maxCandidatesPerPosition: Number(raw) || 2
                  }
                })
              }
            />
          </div>
        </CollapsibleSection>

        <button type="submit" disabled={saving} className={saveBtn}>
          {saving ? 'Saving…' : 'Save Global Platform Settings'}
        </button>
        {status && <p className={ui.body}>{status}</p>}
      </form>
    </div>
  )
}
