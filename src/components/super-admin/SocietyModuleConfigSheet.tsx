import React, { useEffect, useId, useRef, useState } from 'react'
import { usePlatformConfig } from '../../providers/PlatformConfigProvider'
import { ui } from '../../lib/ui'
import {
  N8N_PRODUCTION_WEBHOOK_URL,
  SOCIETY_ADDON_LABELS,
  type SocietyAddonKey
} from '../../types/platformConfig'

export type SocietyModuleTarget = {
  id: string
  name: string
  city?: string
}

type Props = {
  society: SocietyModuleTarget | null
  open: boolean
  onClose: () => void
}

const saveBtn =
  'rounded-xl bg-syncra-blue px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0047b3]'

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

export default function SocietyModuleConfigSheet({ society, open, onClose }: Props) {
  const titleId = useId()
  const panelRef = useRef<HTMLElement>(null)
  const { config, setSocietyAddon, setSocietyGateway, isSocietyAddonEnabled } = usePlatformConfig()
  const [n8nUrl, setN8nUrl] = useState('')
  const [twilioPhone, setTwilioPhone] = useState('')
  const [status, setStatus] = useState('')

  const societyId = society?.id ?? ''
  const gateway = societyId ? (config.societyGateways[societyId] ?? {}) : {}
  const addonKeys = Object.keys(SOCIETY_ADDON_LABELS) as SocietyAddonKey[]

  useEffect(() => {
    if (!open || !societyId) return
    setN8nUrl(gateway.n8nWebhookUrl ?? '')
    setTwilioPhone(gateway.twilioSenderPhone ?? '')
    setStatus('')
  }, [open, societyId, gateway.n8nWebhookUrl, gateway.twilioSenderPhone])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  useEffect(() => {
    if (open) panelRef.current?.querySelector<HTMLElement>('input, button')?.focus()
  }, [open])

  function flashSaved(message: string) {
    setStatus(message)
    window.setTimeout(() => setStatus(''), 4000)
  }

  function handleSave(event: React.FormEvent) {
    event.preventDefault()
    if (!societyId) return

    setSocietyGateway(societyId, {
      n8nWebhookUrl: n8nUrl.trim() || undefined,
      twilioSenderPhone: twilioPhone.trim() || undefined
    })
    flashSaved(`Module configuration saved for ${society?.name ?? 'society'}.`)
  }

  if (!open || !society) return null

  const globalN8n = config.communications.n8nWebhookUrl.trim() || N8N_PRODUCTION_WEBHOOK_URL
  const globalTwilio = config.communications.twilioSenderPhone.trim() || '+14155238886'

  return (
    <div className={ui.overlay} role="presentation" onClick={onClose}>
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="ml-auto flex h-full w-full max-w-lg flex-col border-l border-slate-200 bg-white shadow-card-hover"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <p className={ui.eyebrow}>Society modules</p>
            <h2 id={titleId} className={`mt-1 ${ui.heading}`}>
              Configure Modules
            </h2>
            <p className={`mt-1 text-sm ${ui.body}`}>
              {society.name}
              {society.city ? ` · ${society.city}` : ''}
            </p>
          </div>
          <button type="button" onClick={onClose} className={ui.btnGhost} aria-label="Close">
            Close
          </button>
        </header>

        <form onSubmit={handleSave} className="flex flex-1 flex-col overflow-y-auto px-6 py-5">
          <div className="space-y-6">
            <section>
              <h3 className="text-sm font-semibold text-syncra-primary">Feature gating</h3>
              <p className="mt-1 text-xs text-slate-500">
                Disabled modules disappear from sidebar navigation for this society only.
              </p>
              <div className="mt-3 grid gap-2">
                {addonKeys.map((addon) => {
                  const meta = SOCIETY_ADDON_LABELS[addon]
                  return (
                    <ToggleRow
                      key={addon}
                      label={meta.label}
                      description={meta.description}
                      checked={isSocietyAddonEnabled(societyId, addon)}
                      onChange={(enabled) => setSocietyAddon(societyId, addon, enabled)}
                    />
                  )
                })}
              </div>
            </section>

            <section>
              <h3 className="text-sm font-semibold text-syncra-primary">Gateway overrides</h3>
              <p className="mt-1 text-xs text-slate-500">
                Leave blank to inherit platform defaults configured in Global Platform Settings.
              </p>
              <div className="mt-3 space-y-4">
                <label className="block">
                  <span className={`mb-2 block ${ui.label}`}>n8n Webhook URL</span>
                  <input
                    value={n8nUrl}
                    onChange={(event) => setN8nUrl(event.target.value)}
                    className={ui.input}
                    placeholder={globalN8n}
                  />
                </label>
                <label className="block">
                  <span className={`mb-2 block ${ui.label}`}>Twilio / BSP Sender Phone</span>
                  <input
                    value={twilioPhone}
                    onChange={(event) => setTwilioPhone(event.target.value)}
                    className={ui.input}
                    placeholder={globalTwilio}
                  />
                </label>
              </div>
            </section>
          </div>

          <div className="mt-auto flex flex-col gap-3 border-t border-slate-100 pt-5">
            {status && <p className="text-sm text-slate-600">{status}</p>}
            <div className="flex justify-end gap-3">
              <button type="button" onClick={onClose} className={ui.btnGhost}>
                Cancel
              </button>
              <button type="submit" className={saveBtn}>
                Save configuration
              </button>
            </div>
          </div>
        </form>
      </aside>
    </div>
  )
}
