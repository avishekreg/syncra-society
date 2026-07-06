import React, { useMemo, useState } from 'react'
import { DEMO_LOGINS } from '../../config/devSeed'
import { ui } from '../../lib/ui'

type StaffRow = {
  email: string
  role: string
  label: string
  scope: 'platform' | 'society'
}

const PLATFORM_STAFF: StaffRow[] = [
  { email: 'superadmin@syncra.com', role: 'super_admin', label: 'Global Super Admin', scope: 'platform' }
]

export default function SuperAdminAccessManagement() {
  const [filter, setFilter] = useState('')
  const [status, setStatus] = useState('')

  const societyStaff = useMemo<StaffRow[]>(() =>
    Object.entries(DEMO_LOGINS).map(([email, config]) => ({
      email,
      role: config.role,
      label: config.label,
      scope: 'society' as const
    }))
  , [])

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

  function handleAssign(email: string, role: string) {
    setStatus(`Role assignment queued for ${email} → ${role}. Connect Supabase Auth admin API for live provisioning.`)
  }

  return (
    <div className={ui.sectionGap}>
      <section className={ui.card}>
        <p className={ui.eyebrow}>Identity & access</p>
        <p className={`mt-2 max-w-2xl ${ui.body}`}>
          Assign platform operators and society staff roles. Production deployments should wire this surface to Supabase
          Auth metadata and `user_and_flats` provisioning.
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
                <th className="px-3 py-3 font-semibold">Actions</th>
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
                  <td className="px-3 py-4">
                    {row.scope === 'platform' ? (
                      <span className="text-xs text-slate-400">Protected</span>
                    ) : (
                      <button
                        type="button"
                        className={ui.btnSecondary}
                        onClick={() => handleAssign(row.email, row.role)}
                      >
                        Confirm role
                      </button>
                    )}
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
