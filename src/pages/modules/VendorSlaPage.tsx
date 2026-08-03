import React, { useEffect, useMemo, useState } from 'react'
import {
  computeMonthlySlaScore,
  listVendorFeedback,
  submitVendorFeedback,
  type VendorCategory,
  type VendorSlaLog
} from '../../api/vendorSla'
import { useAuth } from '../../providers/AuthProvider'
import { ui } from '../../lib/ui'

const CATEGORIES: VendorCategory[] = ['housekeeping', 'security', 'maintenance', 'other']

export default function VendorSlaPage() {
  const { currentSocietyId, user } = useAuth()
  const societyId = currentSocietyId ?? ''
  const month = new Date().toISOString().slice(0, 7)
  const [category, setCategory] = useState<VendorCategory>('housekeeping')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [logs, setLogs] = useState<VendorSlaLog[]>([])
  const [error, setError] = useState<string | null>(null)

  async function reload() {
    if (!societyId) return
    setLogs(await listVendorFeedback(societyId, { month }))
  }

  useEffect(() => {
    void reload().catch((err) => setError(err instanceof Error ? err.message : 'Failed to load SLA logs'))
  }, [societyId, month])

  const scores = useMemo(() => computeMonthlySlaScore(logs, month), [logs, month])
  const overall = scores.find((score) => score.category === 'all')

  return (
    <div className={ui.sectionGap}>
      <section className={ui.card}>
        <p className={ui.eyebrow}>Vendor performance</p>
        <h2 className={`mt-2 ${ui.headingLg}`}>Vendor SLA tracking</h2>
        <p className={`mt-2 ${ui.body}`}>
          Rate housekeeping and security daily. Compliance is the share of ratings at 4★ or above for the
          month.
        </p>
      </section>

      <section className={ui.card}>
        <h3 className={ui.heading}>This month</h3>
        <p className="mt-3 text-3xl font-semibold text-syncra-primary">
          {overall?.compliancePct ?? 0}%
          <span className="ml-2 text-sm font-medium text-slate-500">SLA compliance</span>
        </p>
        <p className={`mt-2 ${ui.body}`}>
          Avg rating {overall?.averageRating ?? 0} · {overall?.entries ?? 0} entries
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {scores
            .filter((score) => score.category !== 'all')
            .map((score) => (
              <div key={score.category} className={ui.innerItem}>
                <p className="text-sm font-semibold capitalize text-syncra-primary">{score.category}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {score.compliancePct}% · ★ {score.averageRating}
                </p>
              </div>
            ))}
        </div>
      </section>

      <section className={ui.card}>
        <h3 className={ui.heading}>Submit today&apos;s feedback</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <label className={ui.label}>Category</label>
            <select className={ui.input} value={category} onChange={(e) => setCategory(e.target.value as VendorCategory)}>
              {CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className={ui.label}>Rating (1–5)</label>
            <input
              type="number"
              min={1}
              max={5}
              className={ui.input}
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
            />
          </div>
        </div>
        <div className="mt-3 space-y-2">
          <label className={ui.label}>Comment</label>
          <textarea
            className={ui.input}
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Optional notes"
          />
        </div>
        <button
          type="button"
          className={`mt-4 ${ui.btnPrimary}`}
          onClick={() => {
            setError(null)
            void submitVendorFeedback({
              societyId,
              category,
              rating,
              comment,
              flatNumber: user?.flatNumber,
              submittedBy: user?.email
            })
              .then(reload)
              .catch((err) => setError(err instanceof Error ? err.message : 'Submit failed'))
          }}
        >
          Save feedback
        </button>
        {error ? <p className="mt-3 text-sm text-syncra-action-alt">{error}</p> : null}
      </section>
    </div>
  )
}
