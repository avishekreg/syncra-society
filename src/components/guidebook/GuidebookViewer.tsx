import React from 'react'
import type { GuidebookAmenity, SocietyRulesGuidebook } from '../../types/db'
import { formatAmenitySummary } from '../../lib/guidebookKnowledge'
import { FACILITY_TYPE_LABELS } from '../../api/rulesGuidebook'
import { ui } from '../../lib/ui'

type Props = {
  guidebook: SocietyRulesGuidebook
  societyName?: string
}

function SectionBlock({ title, body }: { title: string; body: string }) {
  if (!body.trim()) return null
  return (
    <article className={ui.innerItem}>
      <h3 className="text-sm font-semibold text-syncra-primary">{title}</h3>
      <p className={`mt-2 whitespace-pre-wrap ${ui.body}`}>{body}</p>
    </article>
  )
}

export default function GuidebookViewer({ guidebook, societyName }: Props) {
  const amenities = [...guidebook.amenities].sort((a, b) => a.sort_order - b.sort_order)
  const customSections = [...guidebook.custom_sections].sort((a, b) => a.sort_order - b.sort_order)
  const isEmpty =
    !guidebook.security_rules.trim() &&
    !guidebook.community_rules.trim() &&
    !guidebook.visitor_vehicle_policy.trim() &&
    amenities.length === 0 &&
    customSections.length === 0

  if (isEmpty) {
    return (
      <div className={ui.card}>
        <p className={ui.body}>
          {societyName ? `${societyName} has` : 'Your society has'} not published its rules & regulations guidebook
          yet. Management will add security rules, amenity timings, and charges here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SectionBlock title="Security & Access Rules" body={guidebook.security_rules} />
      <SectionBlock title="Community Rules & Regulations" body={guidebook.community_rules} />
      <SectionBlock title="Visitor & Vehicle Policy" body={guidebook.visitor_vehicle_policy} />

      {amenities.length > 0 ? (
        <section className={ui.card}>
          <header className={ui.cardHeader}>
            <p className={ui.eyebrow}>Facilities</p>
            <h2 className={`mt-1 ${ui.heading}`}>Amenities, timings & charges</h2>
          </header>
          <div className={`${ui.cardBody} grid gap-4 lg:grid-cols-2`}>
            {amenities.map((amenity) => (
              <AmenityCard key={amenity.id} amenity={amenity} />
            ))}
          </div>
        </section>
      ) : null}

      {customSections.map((section) => (
        <SectionBlock key={section.id} title={section.title} body={section.body} />
      ))}
    </div>
  )
}

function AmenityCard({ amenity }: { amenity: GuidebookAmenity }) {
  const label = FACILITY_TYPE_LABELS[amenity.facility_type] ?? amenity.facility_type
  return (
    <article className={ui.innerItem}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-syncra-blue">{label}</p>
          <h3 className="mt-1 font-semibold text-syncra-primary">{amenity.name || label}</h3>
        </div>
        {amenity.charges ? (
          <span className={ui.badge}>{amenity.charges}</span>
        ) : (
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">Free</span>
        )}
      </div>
      <dl className="mt-3 space-y-2 text-sm text-slate-600">
        {(amenity.open_time || amenity.close_time) && (
          <div>
            <dt className="font-medium text-slate-500">Timings</dt>
            <dd>
              {amenity.open_time || '—'} – {amenity.close_time || '—'}
              {amenity.operating_days ? ` · ${amenity.operating_days}` : ''}
            </dd>
          </div>
        )}
        {amenity.charge_notes ? (
          <div>
            <dt className="font-medium text-slate-500">Charge notes</dt>
            <dd>{amenity.charge_notes}</dd>
          </div>
        ) : null}
        {amenity.facility_rules ? (
          <div>
            <dt className="font-medium text-slate-500">Facility rules</dt>
            <dd className="whitespace-pre-wrap">{amenity.facility_rules}</dd>
          </div>
        ) : null}
      </dl>
      <p className="mt-3 text-xs text-slate-400">{formatAmenitySummary(amenity)}</p>
    </article>
  )
}
