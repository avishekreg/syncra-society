import React, { useState } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import { ui } from '../../lib/ui'

type GatekeeperCredential = {
  guard: string
  location: string
  token: string
  issuedAt: string
}

const saveBtn = 'inline-flex min-h-11 items-center justify-center rounded-xl bg-syncra-blue py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0047b3]'

export default function GatekeeperProvisioning() {
  const { currentSocietyId } = useAuth()
  const [shiftName, setShiftName] = useState('')
  const [location, setLocation] = useState('Main Entrance')
  const [message, setMessage] = useState('')
  const [credential, setCredential] = useState<GatekeeperCredential | null>(() => {
    const stored = sessionStorage.getItem('syncra-gatekeeper-credential')
    return stored ? JSON.parse(stored) as GatekeeperCredential : null
  })

  function handleProvision(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!currentSocietyId) {
      setMessage('Select a society before creating gatekeeper credentials.')
      return
    }

    const credentialToken = `GK-${currentSocietyId}-${Date.now()}`
    const payload: GatekeeperCredential = {
      guard: shiftName || 'Gatekeeper',
      location,
      token: credentialToken,
      issuedAt: new Date().toISOString()
    }

    sessionStorage.setItem('syncra-gatekeeper-credential', JSON.stringify(payload))
    setCredential(payload)
    setMessage(`Gatekeeper credentials generated for ${location}.`)
  }

  return (
    <section className={ui.card}>
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={ui.eyebrow}>Security infrastructure</p>
          <h2 className={`mt-3 ${ui.heading}`}>Gatekeeper provisioning</h2>
          <p className={`mt-2 ${ui.body}`}>Generate secure guard credentials and preview the login token before deployment.</p>
        </div>
      </div>

      <form onSubmit={handleProvision} className="mt-8 space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className={ui.label}>Gatekeeper name / shift</span>
            <input
              value={shiftName}
              onChange={(event) => setShiftName(event.target.value)}
              placeholder="E.g. Morning - Arun"
              className={ui.input}
            />
          </label>

          <label className="space-y-2">
            <span className={ui.label}>Gate location</span>
            <select value={location} onChange={(event) => setLocation(event.target.value)} className={ui.input}>
              <option>Main Entrance</option>
              <option>Gate 1</option>
              <option>Service Gate</option>
              <option>Visitor Lane</option>
            </select>
          </label>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <button type="submit" className={saveBtn}>
            Generate Gatekeeper Login
          </button>
          <div className={`${ui.innerItem} text-sm`}>
            <p className="font-semibold text-syncra-primary">Credential note</p>
            <p className={ui.body}>Generated credentials remain stored in session storage and are visible in the preview below.</p>
          </div>
        </div>

        {message && <p className={ui.body}>{message}</p>}
      </form>

      {credential && (
        <div className={`mt-8 ${ui.innerItem}`}>
          <p className={ui.eyebrow}>Generated credentials</p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              { label: 'Guard / Shift', value: credential.guard },
              { label: 'Location', value: credential.location },
              { label: 'Access token', value: credential.token },
              { label: 'Issued at', value: new Date(credential.issuedAt).toLocaleString() }
            ].map((field) => (
              <div key={field.label} className={ui.innerItem}>
                <p className="text-sm font-semibold text-syncra-primary">{field.label}</p>
                <p className={`mt-2 break-all ${ui.body}`}>{field.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
