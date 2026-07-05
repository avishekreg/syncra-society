import React, { useEffect, useState } from 'react'
import GatekeeperConsole from '../../components/GatekeeperConsole'
import { useAuth } from '../../providers/AuthProvider'
import { useResolvedSocietyUuid } from '../../hooks/useResolvedSocietyUuid'
import { ui } from '../../lib/ui'

export default function GatekeeperGuard() {
  const { currentSocietyId } = useAuth()
  const { uuid, loading } = useResolvedSocietyUuid()
  const [credentialPayload, setCredentialPayload] = useState(null)

  useEffect(() => {
    const stored = sessionStorage.getItem('syncra-gatekeeper-credential')
    if (!stored) return
    try {
      setCredentialPayload(JSON.parse(stored))
    } catch {
      setCredentialPayload(null)
    }
  }, [])

  const societyId = uuid ?? currentSocietyId

  return (
    <div className="space-y-6">
      {credentialPayload ? (
        <div className="rounded-2xl border border-syncra-accent/30 bg-syncra-accent/10 p-4 shadow-card sm:p-6">
          <p className={ui.eyebrow}>Gatekeeper credential</p>
          <h2 className={`mt-2 ${ui.heading}`}>Secure credential token generated</h2>
          <p className={`mt-2 ${ui.body}`}>Guard: {credentialPayload.guard}</p>
          <p className={ui.body}>Location: {credentialPayload.location}</p>
          <p className={ui.body}>
            Token: <span className="font-mono text-syncra-primary">{credentialPayload.token}</span>
          </p>
          <p className="text-sm text-slate-500">Issued: {new Date(credentialPayload.issuedAt).toLocaleString()}</p>
        </div>
      ) : null}

      {loading ? (
        <div className={ui.card} aria-busy="true">
          <p className={ui.body}>Resolving society UUID for flat mapping…</p>
        </div>
      ) : (
        <GatekeeperConsole societyId={societyId} />
      )}
    </div>
  )
}
