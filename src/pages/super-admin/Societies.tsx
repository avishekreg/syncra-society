import React, { useState } from 'react'
import { updateSociety } from '../../api/societies'
import { flagDefaulter } from '../../api/visitorLogs'
import { ensureSocietyJoinCode, listRegisteredSocieties } from '../../lib/societyRegistry'
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

const initialSocieties: SocietyRow[] = [
  { id: 'soc-1', name: 'Harmony Residences', city: 'Bengaluru', address: 'Indiranagar, Bengaluru', totalFlats: 72, tier: 'tier2' },
  { id: 'soc-2', name: 'Lotus Greens', city: 'Pune', address: 'Koregaon Park, Pune', totalFlats: 48, tier: 'tier1' }
]

const tierLabels: Record<SocietyTier, string> = {
  tier1: 'Tier 1',
  tier2: 'Tier 2',
  tier3: 'Tier 3'
}

const saveBtn = 'rounded-xl bg-syncra-blue px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0047b3]'

type ModalMode = 'create' | 'edit'

export default function SuperAdminSocieties() {
  const [societies, setSocieties] = useState<SocietyRow[]>(initialSocieties)
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

  const joinCodes = Object.fromEntries(listRegisteredSocieties().map((s) => [s.id, s.joinCode]))

  React.useEffect(() => {
    for (const society of societies) {
      ensureSocietyJoinCode(society.id, society.name)
    }
  }, [societies])

  React.useEffect(() => {
    const saved = localStorage.getItem('syncra-societies')
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as SocietyRow[]
        if (parsed.length > 0) setSocieties(parsed)
      } catch {
        // ignore malformed storage
      }
    }
  }, [])

  React.useEffect(() => {
    localStorage.setItem('syncra-societies', JSON.stringify(societies))
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
            : `${name} updated in admin roster (local demo society).`
        )
      } else {
        const newSociety: SocietyRow = {
          id: `soc-${Date.now()}`,
          name,
          city,
          address: fullAddress,
          totalFlats: flats,
          tier
        }

        setSocieties((current) => [newSociety, ...current])
    ensureSocietyJoinCode(newSociety.id, newSociety.name)
        setStatus(`Society ${name} added to the roster.`)
      }

      closeModal()
    } catch {
      setStatus('Unable to save society changes right now.')
    } finally {
      setSaving(false)
    }
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className={ui.eyebrow}>Society operations</p>
              <h2 className={`mt-3 ${ui.headingLg}`}>Manage registered societies</h2>
              <p className={`mt-3 ${ui.body}`}>
                Add or edit society profiles. Changes sync to Supabase for live societies and update local
                roster data used across admin workflows.
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
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm text-slate-800">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="px-4 py-3">Society</th>
                  <th className="px-4 py-3">City</th>
                  <th className="px-4 py-3">Flats</th>
                  <th className="px-4 py-3">Tier</th>
                  <th className="px-4 py-3">Join Code</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {societies.map((society) => (
                  <tr key={society.id} className="hover:bg-syncra-surface-alt">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-syncra-primary">{society.name}</p>
                      {society.address && <p className="mt-1 text-xs text-slate-500">{society.address}</p>}
                    </td>
                    <td className="px-4 py-4 text-slate-600">{society.city}</td>
                    <td className="px-4 py-4 text-slate-600">{society.totalFlats}</td>
                    <td className="px-4 py-4 text-slate-600">{tierLabels[society.tier]}</td>
                    <td className="px-4 py-4 font-mono text-xs text-syncra-blue">{joinCodes[society.id] ?? '—'}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
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

      {modalOpen && (
        <div className={ui.overlay}>
          <div className={`${ui.modal} w-full max-w-2xl`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className={ui.heading}>{modalMode === 'edit' ? 'Edit Society' : 'New Society'}</h3>
                <p className={`mt-2 ${ui.body}`}>
                  {modalMode === 'edit'
                    ? 'Update society details. Live societies are patched in Supabase automatically.'
                    : 'Fill in the society details to seed simulated data for admin workflows.'}
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
