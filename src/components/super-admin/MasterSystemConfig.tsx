import React, { useEffect, useState } from 'react'
import { ui } from '../../lib/ui'
import { usePlatformConfig } from '../../providers/PlatformConfigProvider'
import { listRegisteredSocieties } from '../../lib/societyRegistry'
import {
  N8N_PRODUCTION_WEBHOOK_URL,
  NOTICE_ENHANCER_MODEL_OPTIONS,
  SIDEBAR_MODULE_LABELS,
  SOCIETY_ADDON_LABELS,
  VOICE_MODEL_OPTIONS,
  type SidebarModuleKey,
  type SocietyAddonKey
} from '../../types/platformConfig'

const saveBtn =
  'rounded-xl bg-syncra-blue px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0047b3]'

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
  type = 'text'
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
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
  const { config, updateConfig, setSidebarModule, setSocietyAddon, isSocietyAddonEnabled, supabaseSynced } =
    usePlatformConfig()
  const [status, setStatus] = useState('')
  const [selectedSocietyId, setSelectedSocietyId] = useState('')
  const societies = listRegisteredSocieties()

  useEffect(() => {
    if (!selectedSocietyId && societies[0]?.id) {
      setSelectedSocietyId(societies[0].id)
    }
  }, [societies, selectedSocietyId])

  function flashSaved(message: string) {
    setStatus(message)
    window.setTimeout(() => setStatus(''), 4000)
  }

  function handleSave(event: React.FormEvent) {
    event.preventDefault()
    flashSaved('Master configuration saved — integrations and sidebar visibility update instantly.')
  }

  const sidebarKeys = Object.keys(SIDEBAR_MODULE_LABELS) as SidebarModuleKey[]
  const addonKeys = Object.keys(SOCIETY_ADDON_LABELS) as SocietyAddonKey[]
  const selectedSociety = societies.find((society) => society.id === selectedSocietyId)

  return (
    <div className="space-y-6">
      <header className={ui.card}>
        <p className={ui.eyebrow}>Master Configuration Menu</p>
        <h1 className={`mt-2 ${ui.headingLg}`}>System integrations & feature control plane</h1>
        <p className={`mt-3 max-w-3xl ${ui.body}`}>
          Single surface for AI engines, communication gateways, paid add-ons, and per-society feature gating.
          All values persist in localStorage with optional Supabase mirror.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Storage: local · Supabase mirror: {supabaseSynced ? 'synced' : 'local-only fallback'}
        </p>
      </header>

      <form onSubmit={handleSave} className="space-y-4">
        <CollapsibleSection
          title="AI & Voice Utilities"
          subtitle="Speech-to-text and AI notice enhancer models via Hugging Face"
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
          <div className="grid gap-4 md:grid-cols-2">
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
          title="Gateways & Communications"
          subtitle="Production n8n webhook and Twilio/BSP live sender routing"
          defaultOpen
        >
          <TextField
            label="n8n Production Webhook URL"
            value={config.communications.n8nWebhookUrl}
            onChange={(n8nWebhookUrl) =>
              updateConfig({ communications: { ...config.communications, n8nWebhookUrl } })
            }
            placeholder={N8N_PRODUCTION_WEBHOOK_URL}
          />
          <TextField
            label="Twilio / BSP Live Sender Phone"
            value={config.communications.twilioSenderPhone}
            onChange={(twilioSenderPhone) =>
              updateConfig({ communications: { ...config.communications, twilioSenderPhone } })
            }
            placeholder="+14155238886"
          />
        </CollapsibleSection>

        <CollapsibleSection
          title="SaaS Monetization & Feature Gating"
          subtitle="Per-society paid add-on toggles — instantly hides UI across Resident and RWA paths"
          defaultOpen
        >
          <label className="block max-w-md">
            <span className={`mb-2 block ${ui.label}`}>Target society</span>
            <select
              value={selectedSocietyId}
              onChange={(event) => setSelectedSocietyId(event.target.value)}
              className={ui.input}
            >
              {societies.map((society) => (
                <option key={society.id} value={society.id}>
                  {society.name} · {society.city}
                </option>
              ))}
            </select>
          </label>

          {selectedSociety && (
            <p className="text-xs text-slate-500">
              Gating applies to <strong>{selectedSociety.name}</strong> — disabled modules disappear from sidebar
              navigation immediately for that society.
            </p>
          )}

          <div className="grid gap-2 sm:grid-cols-2">
            {addonKeys.map((addon) => {
              const meta = SOCIETY_ADDON_LABELS[addon]
              return (
                <ToggleRow
                  key={addon}
                  label={meta.label}
                  description={meta.description}
                  checked={isSocietyAddonEnabled(selectedSocietyId, addon)}
                  onChange={(enabled) => setSocietyAddon(selectedSocietyId, addon, enabled)}
                />
              )
            })}
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Global Sidebar Modules"
          subtitle="Platform-wide navigation toggles (combined with per-society gating above)"
        >
          <div className="grid gap-2 sm:grid-cols-2">
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
          <div className="grid gap-4 sm:grid-cols-3">
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
          <div className="grid gap-4 sm:grid-cols-2">
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

        <button type="submit" className={saveBtn}>
          Save Master Configuration
        </button>
        {status && <p className={ui.body}>{status}</p>}
      </form>
    </div>
  )
}
