import React, { useEffect, useState } from 'react'
import SocietyModuleConfigSheet, {
  type SocietyModuleTarget
} from '../../components/super-admin/SocietyModuleConfigSheet'
import CopySocietyIdButton from '../../components/society/CopySocietyIdButton'
import { insertSociety, listSocieties, updateSociety } from '../../api/societies'
import type { Society } from '../../types/db'
import { flagDefaulter } from '../../api/visitorLogs'
import { ensureSocietyJoinCode, listRegisteredSocieties } from '../../lib/societyRegistry'
import { isSocietyUuid } from '../../lib/resolveSocietyContext'
import { ui } from '../../lib/ui'

type SocietyTier = 'tier1' | 'tier2' | 'tier3'

type SocietyRow = {
  id: string
  name: string
  city: string
  address?: string
  totalFlats: number
  tier: SocietyTier
}

const tierLabels: Record<SocietyTier, string> = {
  tier1: 'Tier 1',
  tier2: 'Tier 2',
  tier3: 'Tier 3'
}

const saveBtn = 'inline-flex min-h-11 items-center justify-center rounded-xl bg-syncra-blue px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0047b3]'

type ModalMode = 'create' | 'edit'

function deriveCity(address?: string | null) {
  if (!address?.trim()) return '—'
  const parts = address.split(',').map((part) => part.trim()).filter(Boolean)
  return parts.length > 1 ? parts[parts.length - 1] : parts[0]
}

function mapSocietyToRow(society: Society): SocietyRow {
  const tierRaw = society.pricing_slab_id?.toLowerCase() ?? ''
  const normalizedTier: SocietyTier =
    tierRaw === 'tier1' || tierRaw === 'tier2' || tierRaw === 'tier3' ? (tierRaw as SocietyTier) : 'tier2'

  return {
    id: String(society.id).trim(),
    name: society.name,
    city: deriveCity(society.address),
    address: society.address ?? undefined,
    totalFlats: society.total_flats ?? 0,
    tier: normalizedTier
  }
}

export default function SuperAdminSocieties() {
  const [societies, setSocieties] = useState<SocietyRow[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<ModalMode>('create')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')
  const [totalFlats, setTotalFlats] = useState('')
  const [tier, setTier] = useState<SocietyTier>('tier1')
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)
  const [moduleConfigSociety, setModuleConfigSociety] = useState<SocietyModuleTarget | null>(null)
  const [moduleConfigOpen, setModuleConfigOpen] = useState(false)

  const joinCodes = Object.fromEntries(listRegisteredSocieties().map((s) => [s.id, s.joinCode]))

  useEffect(() => {
    let active = true

    void (async () => {
      setLoading(true)
      try {
        const remote = await listSocieties()
        if (!active) return
        setSocieties(remote.map(mapSocietyToRow))
      } catch {
        if (!active) return
        setSocieties([])
        setStatus('Unable to load societies — check Supabase connectivity.')
      } finally {
        if (active) setLoading(false)
      }
    })()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    for (const society of societies) {
      if (isSocietyUuid(society.id)) {
        ensureSocietyJoinCode(society.id, society.name)
      }
    }
  }, [societies])

  useEffect(() => {
    const uuidRows = societies.filter((row) => isSocietyUuid(row.id))
    if (uuidRows.length > 0) {
      localStorage.setItem('syncra-societies', JSON.stringify(uuidRows))
    }
  }, [societies])

  function resetForm() {
    setName('')
    setCity('')
    setAddress('')
    setTotalFlats('')
    setTier('tier1')
    setEditingId(null)
    setModalMode('create')
  }

  function openCreateModal() {
    resetForm()
    setModalMode('create')
    setModalOpen(true)
  }

  function openEditModal(society: SocietyRow) {
    setModalMode('edit')
    setEditingId(society.id)
    setName(society.name)
    setCity(society.city)
    setAddress(society.address ?? '')
    setTotalFlats(String(society.totalFlats))
    setTier(society.tier)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    resetForm()
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!name || !city || !totalFlats) {
      setStatus('Name, city, and total flats are required.')
      return
    }

    setSaving(true)
    setStatus('')

    const flats = Number(totalFlats)
    const fullAddress = address.trim() || `${city}`

    try {
      if (modalMode === 'edit' && editingId) {
        const updated: SocietyRow = {
          id: editingId,
          name,
          city,
          address: fullAddress,
          totalFlats: flats,
          tier
        }

        setSocieties((current) => current.map((item) => (item.id === editingId ? updated : item)))

        const remote = await updateSociety(editingId, {
          name,
          address: fullAddress,
          total_flats: flats,
          pricing_slab_id: tier
        })

        setStatus(
          remote
            ? `${name} updated in admin roster and Supabase.`
            : `${name} updated locally (UUID not found in Supabase).`
        )
      } else {
        const created = await insertSociety({
          name,
          address: fullAddress,
          total_flats: flats,
          pricing_slab_id: tier
        })

        if (created?.id) {
          const row = mapSocietyToRow(created)
          setSocieties((current) => [row, ...current])
          ensureSocietyJoinCode(row.id, row.name)
          setStatus(`Society ${name} created with UUID ${created.id}.`)
        } else {
          setStatus('Unable to create society in Supabase — check database connectivity.')
        }
      }

      closeModal()
    } catch {
      setStatus('Unable to save society changes right now.')
    } finally {
      setSaving(false)
    }
  }

  function openModuleConfig(society: SocietyRow) {
    setModuleConfigSociety({ id: society.id, name: society.name, city: society.city })
    setModuleConfigOpen(true)
  }

  function closeModuleConfig() {
    setModuleConfigOpen(false)
    setModuleConfigSociety(null)
  }

  async function handleFlagDefaulter(society: SocietyRow) {
    try {
      await flagDefaulter({
        society_id: society.id,
        society_name: society.name,
        building: 'A',
        flat_number: '101',
        tenant_name: 'Sunita Rao',
        amount_due: 1850,
        overdue_days: 18,
        status: 'unpaid'
      })
      setStatus(`Defaulter flagged for ${society.name}.`)
    } catch {
      setStatus('Unable to flag defaulter at this time.')
    }
  }

  return (
    <div className="space-y-6">
        <section className={ui.card}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className={ui.eyebrow}>Society operations</p>
              <h2 className={`mt-3 ${ui.headingLg}`}>Manage registered societies</h2>
              <p className={`mt-3 ${ui.body}`}>
                Society IDs are loaded from <code className="font-mono text-xs">public.societies.id</code> (PostgreSQL
                UUID). Use Copy ID for WhatsApp gateway and helpdesk integrations.
              </p>
            </div>
            <button type="button" onClick={openCreateModal} className={saveBtn}>
              Add New Society
            </button>
          </div>
        </section>

        {status && (
          <div className={`${ui.innerItem} text-sm text-slate-700`}>
            {status}
          </div>
        )}

        <section className={ui.card}>
          <div className="w-full overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
            <table className="min-w-[640px] w-full divide-y divide-slate-200 text-sm text-slate-800">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="px-4 py-3">Society</th>
                  <th className="px-4 py-3">Society ID</th>
                  <th className="px-4 py-3">City</th>
                  <th className="px-4 py-3">Flats</th>
                  <th className="px-4 py-3">Tier</th>
                  <th className="px-4 py-3">Join Code</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      Loading societies from Supabase…
                    </td>
                  </tr>
                )}
                {!loading && societies.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      No societies found in the database.
                    </td>
                  </tr>
                )}
                {!loading &&
                  societies.map((society) => (
                  <tr key={society.id} className="hover:bg-syncra-surface-alt">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-syncra-primary">{society.name}</p>
                      {society.address && <p className="mt-1 text-xs text-slate-500">{society.address}</p>}
                    </td>
                    <td className="px-4 py-4">
                      <CopySocietyIdButton societyId={society.id} compact label={`Copy ${society.name} society ID`} />
                    </td>
                    <td className="px-4 py-4 text-slate-600">{society.city}</td>
                    <td className="px-4 py-4 text-slate-600">{society.totalFlats}</td>
                    <td className="px-4 py-4 text-slate-600">{tierLabels[society.tier]}</td>
                    <td className="px-4 py-4 font-mono text-xs text-syncra-blue">{joinCodes[society.id] ?? '—'}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => openModuleConfig(society)} className={ui.btnSecondary}>
                          Configure Modules
                        </button>
                        <button type="button" onClick={() => openEditModal(society)} className={ui.btnSecondary}>
                          Edit
                        </button>
                        <button type="button" onClick={() => void handleFlagDefaulter(society)} className={ui.btnGhost}>
                          Flag Defaulter
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      <SocietyModuleConfigSheet
        society={moduleConfigSociety}
        open={moduleConfigOpen}
        onClose={closeModuleConfig}
      />

      {modalOpen && (
        <div className={ui.overlay}>
          <div className={`${ui.modal} w-full max-w-2xl`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className={ui.heading}>{modalMode === 'edit' ? 'Edit Society' : 'New Society'}</h3>
                <p className={`mt-2 ${ui.body}`}>
                  {modalMode === 'edit'
                    ? 'Update society details. Live societies are patched in Supabase automatically.'
                    : 'Creates a row in public.societies and returns the generated PostgreSQL UUID.'}
                </p>
              </div>
              <button type="button" onClick={closeModal} className={ui.btnGhost}>
                Close
              </button>
            </div>

            <form onSubmit={(event) => void handleSubmit(event)} className="mt-8 grid gap-4">
              <label className="space-y-2">
                <span className={ui.label}>Society Name</span>
                <input value={name} onChange={(event) => setName(event.target.value)} className={ui.input} placeholder="Example Apartments" />
              </label>
              <label className="space-y-2">
                <span className={ui.label}>City</span>
                <input value={city} onChange={(event) => setCity(event.target.value)} className={ui.input} placeholder="Mumbai" />
              </label>
              <label className="space-y-2">
                <span className={ui.label}>Address</span>
                <input value={address} onChange={(event) => setAddress(event.target.value)} className={ui.input} placeholder="Street, locality" />
              </label>
              <label className="space-y-2">
                <span className={ui.label}>Total Flats</span>
                <input value={totalFlats} onChange={(event) => setTotalFlats(event.target.value)} type="number" min="1" className={ui.input} placeholder="120" />
              </label>
              <label className="space-y-2">
                <span className={ui.label}>Subscription Tier</span>
                <select value={tier} onChange={(event) => setTier(event.target.value as SocietyTier)} className={ui.input}>
                  <option value="tier1">Tier 1</option>
                  <option value="tier2">Tier 2</option>
                  <option value="tier3">Tier 3</option>
                </select>
              </label>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button type="button" onClick={closeModal} className={ui.btnGhost}>
                  Cancel
                </button>
                <button type="submit" disabled={saving} className={saveBtn}>
                  {saving ? 'Saving…' : modalMode === 'edit' ? 'Save Changes' : 'Save Society'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
