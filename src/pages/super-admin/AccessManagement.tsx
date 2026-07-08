import React, { useMemo, useState } from 'react'
import { DEMO_LOGINS } from '../../config/devSeed'
import { useAuth } from '../../providers/AuthProvider'
import {
  canReassignPresident,
  initializeFoundingPresident,
  readGovernanceTree,
  societyHasPresident,
  transferPresidentRole,
  type SocietyGovernanceTree
} from '../../lib/governanceRoles'
import { DEMO_SOCIETY_ID, DEMO_SOCIETY_UUID } from '../../config/devSeed'
import { ui } from '../../lib/ui'

type StaffRow = {
  email: string
  role: string
  label: string
  scope: 'platform' | 'society'
  flatNumber?: string | null
}

const PLATFORM_STAFF: StaffRow[] = [
  { email: 'superadmin@syncra.com', role: 'super_admin', label: 'Global Super Admin', scope: 'platform' }
]

export default function SuperAdminAccessManagement() {
  const { user, currentSocietyId } = useAuth()
  const [filter, setFilter] = useState('')
  const [status, setStatus] = useState('')
  const [presidentEmail, setPresidentEmail] = useState('')
  const [tree, setTree] = useState<SocietyGovernanceTree | null>(null)

  const societyStaff = useMemo<StaffRow[]>(() =>
    Object.entries(DEMO_LOGINS).map(([email, config]) => ({
      email,
      role: config.role,
      label: config.label,
      scope: 'society' as const,
      flatNumber: config.flatNumber ?? null
    }))
  , [])

  const residentCandidates = useMemo(
    () => societyStaff.filter((row) => row.role === 'resident' || row.flatNumber),
    [societyStaff]
  )

  React.useEffect(() => {
    if (!currentSocietyId) return
    const isDemoSociety =
      currentSocietyId === DEMO_SOCIETY_ID || currentSocietyId === DEMO_SOCIETY_UUID
    if (isDemoSociety && !societyHasPresident(currentSocietyId)) {
      initializeFoundingPresident(currentSocietyId, 'president@syncrademo.com')
    }
    setTree(readGovernanceTree(currentSocietyId))
  }, [currentSocietyId])

  const rows = useMemo(() => {
    const all = [...PLATFORM_STAFF, ...societyStaff]
    const query = filter.trim().toLowerCase()
    if (!query) return all
    return all.filter(
      (row) =>
        row.email.toLowerCase().includes(query) ||
        row.role.toLowerCase().includes(query) ||
        row.label.toLowerCase().includes(query)
    )
  }, [filter, societyStaff])

  function handleTransferPresident() {
    if (!currentSocietyId) {
      setStatus('Select a society context before transferring the president role.')
      return
    }
    if (!canReassignPresident(user, currentSocietyId)) {
      if (!societyHasPresident(currentSocietyId)) {
        setStatus(
          'This society has no established president yet. New registrations automatically receive the President role during first-time onboarding.'
        )
        return
      }
      setStatus('Only Syncra Super Admin can transfer the Society President role during elections or restructuring.')
      return
    }
    if (!presidentEmail.trim()) {
      setStatus('Select a resident email for the incoming president.')
      return
    }
    const result = transferPresidentRole(currentSocietyId, presidentEmail.trim(), user)
    if (!result.ok) {
      setStatus(result.error)
      return
    }
    setTree(result.tree)
    const demotionNote = result.demotedPresident
      ? ` Outgoing president ${result.demotedPresident} has been demoted.`
      : ''
    setStatus(
      `President role transferred to ${presidentEmail.trim()}. The incoming president can now appoint their downward tree.${demotionNote}`
    )
    setPresidentEmail('')
  }

  return (
    <div className={ui.sectionGap}>
      <section className={ui.card}>
        <p className={ui.eyebrow}>Identity & access</p>
        <p className={`mt-2 max-w-2xl ${ui.body}`}>
          New society registrations automatically assign the founding admin as President — no Super Admin action needed.
          President transfers apply only to existing societies during elections or management restructuring.
        </p>
        <label className="mt-4 block max-w-md space-y-2">
          <span className={ui.label}>Search staff</span>
          <input
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className={ui.input}
            placeholder="Filter by email, role, or label"
          />
        </label>
      </section>

      {canReassignPresident(user, currentSocietyId) ? (
        <section className={ui.card}>
          <header className={ui.cardHeader}>
            <p className={ui.eyebrow}>Election & restructure mode</p>
            <h2 className={`mt-1 ${ui.heading}`}>Transfer president role</h2>
            <p className={`mt-2 ${ui.body}`}>
              Super Admin override for existing societies only. The outgoing president is demoted; the incoming resident
              gains full tree-appointment capabilities.
            </p>
          </header>
          <div className={`${ui.cardBody} flex flex-col gap-3 sm:flex-row sm:items-end`}>
            <label className="block flex-1 space-y-2">
              <span className={ui.label}>Incoming president (resident email)</span>
              <select
                value={presidentEmail}
                onChange={(event) => setPresidentEmail(event.target.value)}
                className={ui.input}
              >
                <option value="">Select resident…</option>
                {residentCandidates.map((row) => (
                  <option key={row.email} value={row.email}>
                    {row.label} ({row.email})
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className={ui.btnPrimary} onClick={handleTransferPresident}>
              Transfer president
            </button>
          </div>
          {tree?.presidentEmail ? (
            <p className="px-5 pb-5 text-sm text-syncra-blue">
              Active president: <strong>{tree.presidentEmail}</strong>
              {tree.foundingPresidentEmail && tree.foundingPresidentEmail !== tree.presidentEmail ? (
                <> · Founding president: {tree.foundingPresidentEmail}</>
              ) : null}
              {tree.previousPresidentEmail ? <> · Last transfer demoted: {tree.previousPresidentEmail}</> : null}
            </p>
          ) : null}
        </section>
      ) : null}

      {status ? (
        <div className={`${ui.innerItem} text-sm text-syncra-blue`} role="status">
          {status}
        </div>
      ) : null}

      <section className={ui.card}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-3 py-3 font-semibold">User</th>
                <th className="px-3 py-3 font-semibold">Role</th>
                <th className="px-3 py-3 font-semibold">Scope</th>
                <th className="px-3 py-3 font-semibold">Governance</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.email} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 py-4">
                    <p className="font-medium text-syncra-primary">{row.label}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{row.email}</p>
                  </td>
                  <td className="px-3 py-4 font-mono text-xs text-slate-700">{row.role}</td>
                  <td className="px-3 py-4 capitalize text-slate-600">{row.scope}</td>
                  <td className="px-3 py-4 text-xs text-slate-500">
                    {row.scope === 'platform'
                      ? 'Platform operator'
                      : row.role === 'rwa_owner'
                        ? 'President (founding or transferred)'
                        : row.role === 'resident'
                          ? 'Eligible for president transfer'
                          : 'Appointed by president'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
