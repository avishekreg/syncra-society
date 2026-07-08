import React, { useEffect, useState } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import { useResolvedSocietyUuid } from '../../hooks/useResolvedSocietyUuid'
import { fetchSocietyBillingRules, upsertSocietyBillingRules } from '../../api/societyBillingRules'
import { MAINTENANCE_DUE_DAY_OPTIONS, ordinalDay } from '../../lib/billing'
import { ui } from '../../lib/ui'

export default function MaintenanceDueDateForm() {
  const { currentSocietyId } = useAuth()
  const { uuid } = useResolvedSocietyUuid()
  const societyId = uuid ?? currentSocietyId

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dueDay, setDueDay] = useState(5)

  useEffect(() => {
    if (!societyId) return
    let cancelled = false
    void (async () => {
      setLoading(true)
      try {
        const rules = await fetchSocietyBillingRules(societyId)
        if (cancelled) return
        setDueDay(rules.maintenance_due_date)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load maintenance due date.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [societyId])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!societyId) return

    setSaving(true)
    setMessage(null)
    setError(null)

    try {
      const existing = await fetchSocietyBillingRules(societyId)
      await upsertSocietyBillingRules(societyId, {
        maintenance_due_date: dueDay,
        late_fee_grace_period_days: existing.late_fee_grace_period_days,
        late_fee_flat_amount: Number(existing.late_fee_flat_amount),
        interest_rate_percentage: Number(existing.interest_rate_percentage)
      })
      setMessage(
        `Maintenance due date saved. Residents will be reminded before the ${ordinalDay(dueDay)} of every month via WhatsApp automation.`
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save maintenance due date.')
    } finally {
      setSaving(false)
    }
  }

  if (!societyId) {
    return (
      <div className={ui.card}>
        <p className={ui.body}>Society context is required to configure the maintenance due date.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={ui.card} aria-busy="true">
        <p className={ui.body}>Loading maintenance due date…</p>
      </div>
    )
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className={`${ui.card} space-y-5`}>
      <div>
        <p className={ui.eyebrow}>Financial console</p>
        <h2 className={`mt-2 ${ui.heading}`}>Set maintenance due date</h2>
        <p className={`mt-2 ${ui.body}`}>
          Choose the monthly deadline for maintenance payments. This value is stored in Supabase and used by n8n
          workflows and Groq AI to alert residents before the due day.
        </p>
      </div>

      <label className="block max-w-xl space-y-2">
        <span className={ui.label}>Monthly due date</span>
        <select
          className={ui.input}
          value={dueDay}
          onChange={(event) => setDueDay(Number(event.target.value))}
        >
          {MAINTENANCE_DUE_DAY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-500">
          Residents must pay maintenance before the {ordinalDay(dueDay)} of each month.
        </p>
      </label>

      {message && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <button type="submit" disabled={saving} className={`${ui.btnPrimary} disabled:opacity-60`}>
        {saving ? 'Saving…' : 'Save maintenance due date'}
      </button>
    </form>
  )
}
