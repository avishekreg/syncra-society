import React, { useEffect, useState } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import {
  fetchAutomationSettings,
  fetchAutomationStatus,
  fetchWhatsAppContacts,
  saveAutomationSettings,
  saveWhatsAppContacts,
  sendAutomationTest
} from '../../lib/societyEvents'
import { cacheAutomationSettings, cacheWhatsAppContacts } from '../../lib/whatsappRouting'
import { ui } from '../../lib/ui'

type Contact = { flatNumber: string; phone: string; name?: string; optedIn: boolean }

export default function WhatsAppAutomation() {
  const { currentSocietyId, showcaseData } = useAuth()
  const societyName = showcaseData?.society.name ?? 'Your Society'
  const [status, setStatus] = useState<string>('')
  const [n8nStatus, setN8nStatus] = useState<{ n8nConfigured: boolean; n8nReachable: boolean; message: string } | null>(null)
  const [settings, setSettings] = useState({
    enabled: true,
    whatsappNumber: '',
    notifyNotice: true,
    notifyVisitor: true,
    notifyPaymentReminder: true,
    notifySurvey: true,
    notifyElection: true,
    notifyHelpdesk: true
  })
  const [contacts, setContacts] = useState<Contact[]>([])
  const [newFlat, setNewFlat] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newName, setNewName] = useState('')

  useEffect(() => {
    void fetchAutomationStatus().then(setN8nStatus)
    if (!currentSocietyId) return
    void fetchAutomationSettings(currentSocietyId).then((s) => setSettings((prev) => ({ ...prev, ...s })))
    void fetchWhatsAppContacts(currentSocietyId).then(setContacts)
  }, [currentSocietyId])

  async function handleSaveSettings() {
    if (!currentSocietyId) return
    await saveAutomationSettings(currentSocietyId, { ...settings, societyId: currentSocietyId, societyName })
    cacheAutomationSettings(currentSocietyId, { whatsappNumber: settings.whatsappNumber })
    setStatus('WhatsApp automation settings saved.')
  }

  async function handleSaveContacts() {
    if (!currentSocietyId) return
    await saveWhatsAppContacts(currentSocietyId, contacts)
    cacheWhatsAppContacts(currentSocietyId, contacts)
    setStatus('Resident WhatsApp contacts saved.')
  }

  async function handleTest() {
    if (!currentSocietyId) return
    const result = await sendAutomationTest(currentSocietyId, societyName)
    setStatus(result.forwarded ? 'Test event sent to n8n.' : `Test failed: ${result.reason ?? 'unknown'}`)
  }

  function addContact() {
    if (!newFlat || !newPhone) return
    setContacts((c) => [...c, { flatNumber: newFlat, phone: newPhone, name: newName, optedIn: true }])
    setNewFlat('')
    setNewPhone('')
    setNewName('')
  }

  return (
    <div className="space-y-6">
      <section className={ui.card}>
        <p className={ui.eyebrow}>WhatsApp automation</p>
        <h2 className={`mt-2 ${ui.headingLg}`}>n8n notification bridge</h2>
        <p className={`mt-2 ${ui.body}`}>
          Portal events are relayed to your local n8n instance, which sends WhatsApp messages via your BSP
          (Twilio, Gupshup, Wati, etc.). Inbound WhatsApp messages can create tickets and log receipts.
        </p>
        <div className={`mt-4 ${ui.innerItem} text-sm`}>
          <p>
            n8n status:{' '}
            <strong className={n8nStatus?.n8nReachable ? 'text-emerald-600' : 'text-syncra-action-alt'}>
              {n8nStatus?.n8nConfigured ? (n8nStatus.n8nReachable ? 'Connected' : 'Configured but unreachable') : 'Not configured'}
            </strong>
          </p>
          {n8nStatus?.message && <p className="mt-1 text-slate-500">{n8nStatus.message}</p>}
        </div>
      </section>

      <section className={ui.card}>
        <h3 className={ui.heading}>Society WhatsApp number</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className={ui.label}>Dedicated WhatsApp Business number</span>
            <input
              value={settings.whatsappNumber ?? ''}
              onChange={(e) => setSettings((s) => ({ ...s, whatsappNumber: e.target.value }))}
              className={ui.input}
              placeholder="+91 98765 43210"
            />
          </label>
          <label className="flex items-center gap-3 pt-8">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => setSettings((s) => ({ ...s, enabled: e.target.checked }))}
            />
            <span className="text-sm text-slate-700">Enable WhatsApp notifications</span>
          </label>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(
            [
              ['notifyNotice', 'Notices'],
              ['notifyVisitor', 'Visitors'],
              ['notifyPaymentReminder', 'Payment reminders'],
              ['notifySurvey', 'Surveys'],
              ['notifyElection', 'Elections'],
              ['notifyHelpdesk', 'Helpdesk updates']
            ] as const
          ).map(([key, label]) => (
            <label key={key} className={`flex items-center gap-2 ${ui.innerItem} text-sm`}>
              <input
                type="checkbox"
                checked={settings[key]}
                onChange={(e) => setSettings((s) => ({ ...s, [key]: e.target.checked }))}
              />
              {label}
            </label>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={() => void handleSaveSettings()} className={ui.btnPrimary}>
            Save Settings
          </button>
          <button type="button" onClick={() => void handleTest()} className={ui.btnSecondary}>
            Send Test to n8n
          </button>
        </div>
      </section>

      <section className={ui.card}>
        <h3 className={ui.heading}>Resident WhatsApp contacts</h3>
        <p className={`mt-2 ${ui.body}`}>Residents must opt in. One phone per flat for targeted alerts.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <input value={newFlat} onChange={(e) => setNewFlat(e.target.value)} className={ui.input} placeholder="Flat" />
          <input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} className={ui.input} placeholder="+91..." />
          <input value={newName} onChange={(e) => setNewName(e.target.value)} className={ui.input} placeholder="Name" />
          <button type="button" onClick={addContact} className={ui.btnSecondary}>
            Add
          </button>
        </div>
        <ul className="mt-4 space-y-2">
          {contacts.map((c, i) => (
            <li key={`${c.flatNumber}-${i}`} className={`flex items-center justify-between ${ui.innerItem} text-sm`}>
              <span>
                Flat {c.flatNumber} — {c.name ?? 'Resident'} — {c.phone}
              </span>
              <button type="button" onClick={() => setContacts((list) => list.filter((_, idx) => idx !== i))} className="text-xs text-syncra-action-alt">
                Remove
              </button>
            </li>
          ))}
        </ul>
        <button type="button" onClick={() => void handleSaveContacts()} className={`mt-4 ${ui.btnPrimary}`}>
          Save Contacts
        </button>
      </section>

      {status && <div className={`${ui.innerItem} text-sm`}>{status}</div>}

      <section className={`${ui.innerItem} text-sm ${ui.body}`}>
        <p className="font-semibold text-syncra-primary">Local setup</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>Run <code className="text-xs">docker compose up n8n</code> in the project root</li>
          <li>Import workflow from <code className="text-xs">n8n/workflows/syncra-society-whatsapp.json</code></li>
          <li>
            Production n8n: set <code className="text-xs">N8N_WEBHOOK_URL</code> to{' '}
            <code className="text-xs">https://avishekreg-syncra-society.hf.space/webhook/syncra-society</code> in Vercel env
          </li>
          <li>Connect your WhatsApp BSP credentials inside n8n</li>
        </ol>
      </section>
    </div>
  )
}
