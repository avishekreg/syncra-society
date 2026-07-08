import React, { useEffect, useState } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import {
  assignDownwardRole,
  canManageDownwardTree,
  clearDownwardRole,
  readGovernanceTree,
  type SocietyGovernanceTree
} from '../../lib/governanceRoles'
import { ui } from '../../lib/ui'

export default function PresidentGovernanceTree() {
  const { user, currentSocietyId } = useAuth()
  const [tree, setTree] = useState<SocietyGovernanceTree | null>(null)
  const [secretaryEmail, setSecretaryEmail] = useState('')
  const [accountantEmail, setAccountantEmail] = useState('')
  const [committeeEmail, setCommitteeEmail] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    if (!currentSocietyId) return
    const existing = readGovernanceTree(currentSocietyId)
    setTree(existing)
    setSecretaryEmail(existing?.secretaryEmail ?? '')
    setAccountantEmail(existing?.accountantEmail ?? '')
  }, [currentSocietyId])

  if (!canManageDownwardTree(user)) {
    return null
  }

  function saveRole(role: 'secretary' | 'accountant') {
    if (!currentSocietyId) return
    const email = role === 'secretary' ? secretaryEmail : accountantEmail
    const result = assignDownwardRole(currentSocietyId, role, email, user)
    if (!result.ok) {
      setStatus(result.error)
      return
    }
    setTree(result.tree)
    setStatus(`${role === 'secretary' ? 'Secretary' : 'Accountant'} appointment saved.`)
  }

  function addCommitteeMember() {
    if (!currentSocietyId || !committeeEmail.trim()) return
    const result = assignDownwardRole(currentSocietyId, 'committee', committeeEmail.trim(), user)
    if (!result.ok) {
      setStatus(result.error)
      return
    }
    setTree(result.tree)
    setCommitteeEmail('')
    setStatus('Committee member added.')
  }

  function removeCommitteeMember(email: string) {
    if (!currentSocietyId) return
    const result = clearDownwardRole(currentSocietyId, 'committee', user, email)
    if (!result.ok) {
      setStatus(result.error)
      return
    }
    setTree(result.tree)
    setStatus(`Removed ${email} from committee roster.`)
  }

  function clearRole(role: 'secretary' | 'accountant') {
    if (!currentSocietyId) return
    const result = clearDownwardRole(currentSocietyId, role, user)
    if (!result.ok) {
      setStatus(result.error)
      return
    }
    setTree(result.tree)
    if (role === 'secretary') setSecretaryEmail('')
    if (role === 'accountant') setAccountantEmail('')
    setStatus(`${role === 'secretary' ? 'Secretary' : 'Accountant'} role cleared.`)
  }

  return (
    <section className={ui.card}>
      <header className={ui.cardHeader}>
        <p className={ui.eyebrow}>Localized governance</p>
        <h2 className={`mt-1 ${ui.heading}`}>Appoint your downward tree</h2>
        <p className={`mt-2 max-w-2xl ${ui.body}`}>
          As Society President, appoint Secretary, Accountant/Treasurer, and committee members. Founding presidents are
          assigned automatically at registration; Super Admin handles president transfers during elections only.
        </p>
      </header>

      {status ? (
        <div className="mx-5 mb-4 rounded-xl border border-syncra-accent/30 bg-cyan-50 px-4 py-3 text-sm text-syncra-blue">
          {status}
        </div>
      ) : null}

      <div className={`${ui.cardBody} grid gap-6 lg:grid-cols-2`}>
        <div className={ui.innerItem}>
          <label className="block space-y-2">
            <span className={ui.label}>Secretary email</span>
            <input
              value={secretaryEmail}
              onChange={(event) => setSecretaryEmail(event.target.value)}
              className={ui.input}
              placeholder="secretary@example.com"
            />
          </label>
          <div className="mt-3 flex gap-2">
            <button type="button" className={ui.btnPrimary} onClick={() => saveRole('secretary')}>
              Appoint secretary
            </button>
            <button type="button" className={ui.btnSecondary} onClick={() => clearRole('secretary')}>
              Clear
            </button>
          </div>
        </div>

        <div className={ui.innerItem}>
          <label className="block space-y-2">
            <span className={ui.label}>Accountant / Treasurer email</span>
            <input
              value={accountantEmail}
              onChange={(event) => setAccountantEmail(event.target.value)}
              className={ui.input}
              placeholder="accountant@example.com"
            />
          </label>
          <div className="mt-3 flex gap-2">
            <button type="button" className={ui.btnPrimary} onClick={() => saveRole('accountant')}>
              Appoint accountant
            </button>
            <button type="button" className={ui.btnSecondary} onClick={() => clearRole('accountant')}>
              Clear
            </button>
          </div>
        </div>

        <div className={`${ui.innerItem} lg:col-span-2`}>
          <label className="block space-y-2">
            <span className={ui.label}>Committee member email</span>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={committeeEmail}
                onChange={(event) => setCommitteeEmail(event.target.value)}
                className={ui.input}
                placeholder="member@example.com"
              />
              <button type="button" className={ui.btnPrimary} onClick={addCommitteeMember}>
                Add member
              </button>
            </div>
          </label>
          {tree?.committeeMembers.length ? (
            <ul className="mt-4 space-y-2">
              {tree.committeeMembers.map((email) => (
                <li key={email} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm">
                  <span>{email}</span>
                  <button type="button" className={ui.btnGhost} onClick={() => removeCommitteeMember(email)}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className={`mt-3 ${ui.body}`}>No committee members appointed yet.</p>
          )}
        </div>
      </div>
    </section>
  )
}
