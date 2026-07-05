import React, { useEffect, useState } from 'react'
import { CustomRole } from '../../types/db'
import { listRoles, createRole, deleteRole } from '../../api/roles'
import { useAuth } from '../../providers/AuthProvider'
import { ui } from '../../lib/ui'

type Props = {
  embedded?: boolean
}

export default function RolesManager({ embedded = false }: Props) {
  const { currentSocietyId } = useAuth()
  const [roles, setRoles] = useState<CustomRole[]>([])
  const [name, setName] = useState('')

  useEffect(() => {
    fetchRoles()
  }, [currentSocietyId])

  async function fetchRoles() {
    if (!currentSocietyId) return
    const data = await listRoles(currentSocietyId)
    setRoles(data)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!currentSocietyId) return
    if (!name) return alert('Role name required')
    await createRole({ society_id: currentSocietyId, name, permissions: [] })
    setName('')
    fetchRoles()
  }

  async function handleDelete(id?: string) {
    if (!id) return
    await deleteRole(id)
    fetchRoles()
  }

  return (
    <div className="flex h-full flex-col">
      {!embedded && <h2 className={`mb-4 ${ui.heading}`}>Custom Roles</h2>}

      <form onSubmit={handleCreate} className="mb-4 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Role name"
          className={`min-w-0 flex-1 ${ui.input}`}
        />
        <button type="submit" className={`shrink-0 ${ui.btnPrimary}`}>
          Add
        </button>
      </form>

      <ul className="space-y-2">
        {roles.map((r) => (
          <li key={r.id} className={`flex items-center justify-between gap-3 ${ui.innerItem}`}>
            <div className="min-w-0">
              <div className="font-medium text-syncra-primary">{r.name}</div>
              {r.permissions?.length ? (
                <div className="truncate text-xs text-slate-500">{r.permissions.join(', ')}</div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => handleDelete(r.id)}
              className="shrink-0 text-xs text-syncra-action-alt hover:text-[#e04545]"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
