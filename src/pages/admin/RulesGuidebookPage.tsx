import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import {
  createEmptyAmenity,
  createEmptyCustomSection,
  FACILITY_TYPE_LABELS,
  fetchSocietyRulesGuidebook,
  queryGuidebookForWhatsApp,
  upsertSocietyRulesGuidebook
} from '../../api/rulesGuidebook'
import type { GuidebookAmenity, GuidebookCustomSection, SocietyRulesGuidebook } from '../../types/db'
import GuidebookViewer from '../../components/guidebook/GuidebookViewer'
import { ui } from '../../lib/ui'

const SAMPLE_QUERIES = ['swimming pool timing', 'gym charges', 'visitor rules', 'community hall booking']

export default function RulesGuidebookPage() {
  const { currentSocietyId, user, showcaseData } = useAuth()
  const societyName = showcaseData?.society.name ?? 'Your Society'
  const [guidebook, setGuidebook] = useState<SocietyRulesGuidebook | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [previewQuery, setPreviewQuery] = useState('swimming pool timing')
  const [previewReply, setPreviewReply] = useState('')

  useEffect(() => {
    if (!currentSocietyId) {
      setGuidebook(null)
      setLoading(false)
      return
    }
    setLoading(true)
    void fetchSocietyRulesGuidebook(currentSocietyId)
      .then(setGuidebook)
      .finally(() => setLoading(false))
  }, [currentSocietyId])

  const amenityCount = guidebook?.amenities.length ?? 0

  async function handleSave(event: React.FormEvent) {
    event.preventDefault()
    if (!currentSocietyId || !guidebook) return
    setSaving(true)
    setStatus(null)
    try {
      const saved = await upsertSocietyRulesGuidebook(
        currentSocietyId,
        {
          security_rules: guidebook.security_rules,
          community_rules: guidebook.community_rules,
          visitor_vehicle_policy: guidebook.visitor_vehicle_policy,
          amenities: guidebook.amenities,
          custom_sections: guidebook.custom_sections
        },
        user?.email ?? user?.id ?? null
      )
      setGuidebook(saved)
      setStatus('Rules & regulations guidebook saved. WhatsApp automation will use this as the knowledge base.')
    } catch {
      setStatus('Unable to save the guidebook. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function runPreview(query: string) {
    if (!currentSocietyId || !query.trim()) return
    const result = await queryGuidebookForWhatsApp(currentSocietyId, query, societyName)
    setPreviewReply(result.reply)
  }

  useEffect(() => {
    if (!currentSocietyId || !guidebook) return
    void runPreview(previewQuery)
  }, [currentSocietyId, guidebook?.updated_at])

  const lastUpdated = useMemo(() => {
    if (!guidebook?.updated_at) return null
    return new Date(guidebook.updated_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
  }, [guidebook?.updated_at])

  function patchGuidebook(patch: Partial<SocietyRulesGuidebook>) {
    setGuidebook((current) => (current ? { ...current, ...patch } : current))
  }

  function updateAmenity(id: string, patch: Partial<GuidebookAmenity>) {
    if (!guidebook) return
    patchGuidebook({
      amenities: guidebook.amenities.map((row) => (row.id === id ? { ...row, ...patch } : row))
    })
  }

  function removeAmenity(id: string) {
    if (!guidebook) return
    patchGuidebook({ amenities: guidebook.amenities.filter((row) => row.id !== id) })
  }

  function addAmenity() {
    if (!guidebook) return
    patchGuidebook({ amenities: [...guidebook.amenities, createEmptyAmenity(guidebook.amenities.length)] })
  }

  function updateCustomSection(id: string, patch: Partial<GuidebookCustomSection>) {
    if (!guidebook) return
    patchGuidebook({
      custom_sections: guidebook.custom_sections.map((row) => (row.id === id ? { ...row, ...patch } : row))
    })
  }

  function removeCustomSection(id: string) {
    if (!guidebook) return
    patchGuidebook({ custom_sections: guidebook.custom_sections.filter((row) => row.id !== id) })
  }

  function addCustomSection() {
    if (!guidebook) return
    patchGuidebook({
      custom_sections: [...guidebook.custom_sections, createEmptyCustomSection(guidebook.custom_sections.length)]
    })
  }

  if (loading || !guidebook) {
    return <div className={ui.loading}>Loading society guidebook…</div>
  }

  return (
    <div className={ui.sectionGap}>
      <header>
        <p className={ui.eyebrow}>Management guidebook</p>
        <h1 className={`mt-2 ${ui.headingLg}`}>Rules & Regulations</h1>
        <p className={`mt-2 max-w-3xl ${ui.body}`}>
          Prepare your society&apos;s operational rulebook — security policies, amenity timings, facility charges, and
          custom guidelines. This content powers resident self-service and will feed WhatsApp automation inquiries.
        </p>
        {lastUpdated ? <p className="mt-2 text-xs text-slate-500">Last updated {lastUpdated}</p> : null}
      </header>

      <form onSubmit={handleSave} className="space-y-6">
        <section className={ui.card}>
          <header className={ui.cardHeader}>
            <p className={ui.eyebrow}>Security</p>
            <h2 className={`mt-1 ${ui.heading}`}>Security & access rules</h2>
            <p className={`mt-2 ${ui.body}`}>
              Gate protocols, CCTV policy, staff access, contractor rules, and emergency procedures.
            </p>
          </header>
          <div className={ui.cardBody}>
            <textarea
              value={guidebook.security_rules}
              onChange={(event) => patchGuidebook({ security_rules: event.target.value })}
              rows={6}
              className={`${ui.input} min-h-[8rem] resize-y`}
              placeholder="Example: All visitors must be pre-registered. Delivery personnel allowed only until 8 PM…"
            />
          </div>
        </section>

        <section className={ui.card}>
          <header className={ui.cardHeader}>
            <p className={ui.eyebrow}>Community</p>
            <h2 className={`mt-1 ${ui.heading}`}>Rules & regulations</h2>
            <p className={`mt-2 ${ui.body}`}>
              Noise limits, pet policy, renovation guidelines, waste disposal, and society bylaws summary.
            </p>
          </header>
          <div className={ui.cardBody}>
            <textarea
              value={guidebook.community_rules}
              onChange={(event) => patchGuidebook({ community_rules: event.target.value })}
              rows={6}
              className={`${ui.input} min-h-[8rem] resize-y`}
              placeholder="Example: Quiet hours 10 PM – 7 AM. Pets must be leashed in common areas…"
            />
          </div>
        </section>

        <section className={ui.card}>
          <header className={ui.cardHeader}>
            <p className={ui.eyebrow}>Visitors</p>
            <h2 className={`mt-1 ${ui.heading}`}>Visitor & vehicle policy</h2>
          </header>
          <div className={ui.cardBody}>
            <textarea
              value={guidebook.visitor_vehicle_policy}
              onChange={(event) => patchGuidebook({ visitor_vehicle_policy: event.target.value })}
              rows={5}
              className={`${ui.input} min-h-[7rem] resize-y`}
              placeholder="Example: Maximum 2 visitor vehicles per flat. Overnight parking requires prior approval…"
            />
          </div>
        </section>

        <section className={ui.card}>
          <header className={`${ui.cardHeader} flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between`}>
            <div>
              <p className={ui.eyebrow}>Facilities</p>
              <h2 className={`mt-1 ${ui.heading}`}>Amenities — timings & charges</h2>
              <p className={`mt-2 ${ui.body}`}>
                Add every facility your society operates. Each entry becomes searchable for WhatsApp inquiries.
              </p>
            </div>
            <button type="button" className={ui.btnSecondary} onClick={addAmenity}>
              + Add facility
            </button>
          </header>
          <div className={`${ui.cardBody} space-y-4`}>
            {guidebook.amenities.length === 0 ? (
              <p className={ui.body}>No amenities added yet. Start with swimming pool, gym, or community hall.</p>
            ) : (
              guidebook.amenities.map((amenity, index) => (
                <article key={amenity.id} className={ui.innerItem}>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-syncra-primary">Facility {index + 1}</p>
                    <button type="button" className={ui.btnGhost} onClick={() => removeAmenity(amenity.id)}>
                      Remove
                    </button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block space-y-1.5 sm:col-span-2">
                      <span className={ui.label}>Display name</span>
                      <input
                        value={amenity.name}
                        onChange={(event) => updateAmenity(amenity.id, { name: event.target.value })}
                        className={ui.input}
                        placeholder="Rooftop Swimming Pool"
                      />
                    </label>
                    <label className="block space-y-1.5">
                      <span className={ui.label}>Facility type</span>
                      <select
                        value={amenity.facility_type}
                        onChange={(event) =>
                          updateAmenity(amenity.id, {
                            facility_type: event.target.value as GuidebookAmenity['facility_type']
                          })
                        }
                        className={ui.input}
                      >
                        {Object.entries(FACILITY_TYPE_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block space-y-1.5">
                      <span className={ui.label}>Operating days</span>
                      <input
                        value={amenity.operating_days}
                        onChange={(event) => updateAmenity(amenity.id, { operating_days: event.target.value })}
                        className={ui.input}
                        placeholder="Mon – Sun"
                      />
                    </label>
                    <label className="block space-y-1.5">
                      <span className={ui.label}>Opens at</span>
                      <input
                        type="time"
                        value={amenity.open_time}
                        onChange={(event) => updateAmenity(amenity.id, { open_time: event.target.value })}
                        className={ui.input}
                      />
                    </label>
                    <label className="block space-y-1.5">
                      <span className={ui.label}>Closes at</span>
                      <input
                        type="time"
                        value={amenity.close_time}
                        onChange={(event) => updateAmenity(amenity.id, { close_time: event.target.value })}
                        className={ui.input}
                      />
                    </label>
                    <label className="block space-y-1.5">
                      <span className={ui.label}>Charges</span>
                      <input
                        value={amenity.charges}
                        onChange={(event) => updateAmenity(amenity.id, { charges: event.target.value })}
                        className={ui.input}
                        placeholder="₹200 / hour or Free for residents"
                      />
                    </label>
                    <label className="block space-y-1.5 sm:col-span-2">
                      <span className={ui.label}>Charge notes</span>
                      <input
                        value={amenity.charge_notes}
                        onChange={(event) => updateAmenity(amenity.id, { charge_notes: event.target.value })}
                        className={ui.input}
                        placeholder="Guest fee applies on weekends"
                      />
                    </label>
                    <label className="block space-y-1.5 sm:col-span-2">
                      <span className={ui.label}>Facility-specific rules</span>
                      <textarea
                        value={amenity.facility_rules}
                        onChange={(event) => updateAmenity(amenity.id, { facility_rules: event.target.value })}
                        rows={3}
                        className={`${ui.input} resize-y`}
                        placeholder="Children under 12 must be accompanied. Proper swimwear required."
                      />
                    </label>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className={ui.card}>
          <header className={`${ui.cardHeader} flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between`}>
            <div>
              <p className={ui.eyebrow}>Custom</p>
              <h2 className={`mt-1 ${ui.heading}`}>Additional sections</h2>
              <p className={`mt-2 ${ui.body}`}>Add society-specific topics — rainwater harvesting, solar rules, etc.</p>
            </div>
            <button type="button" className={ui.btnSecondary} onClick={addCustomSection}>
              + Add section
            </button>
          </header>
          <div className={`${ui.cardBody} space-y-4`}>
            {guidebook.custom_sections.map((section) => (
              <article key={section.id} className={ui.innerItem}>
                <div className="mb-3 flex justify-end">
                  <button type="button" className={ui.btnGhost} onClick={() => removeCustomSection(section.id)}>
                    Remove
                  </button>
                </div>
                <label className="block space-y-1.5">
                  <span className={ui.label}>Section title</span>
                  <input
                    value={section.title}
                    onChange={(event) => updateCustomSection(section.id, { title: event.target.value })}
                    className={ui.input}
                  />
                </label>
                <label className="mt-3 block space-y-1.5">
                  <span className={ui.label}>Content</span>
                  <textarea
                    value={section.body}
                    onChange={(event) => updateCustomSection(section.id, { body: event.target.value })}
                    rows={4}
                    className={`${ui.input} resize-y`}
                  />
                </label>
              </article>
            ))}
          </div>
        </section>

        <section className={ui.card}>
          <header className={ui.cardHeader}>
            <p className={ui.eyebrow}>WhatsApp knowledge base</p>
            <h2 className={`mt-1 ${ui.heading}`}>Inquiry preview</h2>
            <p className={`mt-2 ${ui.body}`}>
              Test how resident questions will be answered once WhatsApp automation is live ({amenityCount} facilities
              indexed).
            </p>
          </header>
          <div className={`${ui.cardBody} space-y-4`}>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={previewQuery}
                onChange={(event) => setPreviewQuery(event.target.value)}
                className={ui.input}
                placeholder="Ask about pool timing, gym fee…"
              />
              <button type="button" className={ui.btnSecondary} onClick={() => void runPreview(previewQuery)}>
                Preview reply
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_QUERIES.map((sample) => (
                <button
                  key={sample}
                  type="button"
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 hover:border-syncra-accent/40"
                  onClick={() => {
                    setPreviewQuery(sample)
                    void runPreview(sample)
                  }}
                >
                  {sample}
                </button>
              ))}
            </div>
            {previewReply ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 whitespace-pre-wrap">
                {previewReply}
              </div>
            ) : null}
          </div>
        </section>

        {status ? (
          <div className="rounded-xl border border-syncra-accent/30 bg-cyan-50 px-4 py-3 text-sm text-syncra-blue">
            {status}
          </div>
        ) : null}

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className={`${ui.btnPrimary} disabled:opacity-70`}>
            {saving ? 'Saving…' : 'Save guidebook'}
          </button>
        </div>
      </form>

      <section>
        <header className="mb-4">
          <p className={ui.eyebrow}>Resident preview</p>
          <h2 className={`mt-1 ${ui.heading}`}>Published view</h2>
        </header>
        <GuidebookViewer guidebook={guidebook} societyName={societyName} />
      </section>
    </div>
  )
}
