import React, { useEffect, useState } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import { useResolvedSocietyUuid } from '../../hooks/useResolvedSocietyUuid'
import { fetchSocietyBillingRules, upsertSocietyBillingRules } from '../../api/societyBillingRules'
import type { SocietyBillingRules } from '../../types/db'
import { ui } from '../../lib/ui'

export default function SocietyBillingRulesForm() {
  const { currentSocietyId } = useAuth()
  const { uuid } = useResolvedSocietyUuid()
  const societyId = uuid ?? currentSocietyId

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [dueDate, setDueDate] = useState(5)
  const [graceDays, setGraceDays] = useState(7)
  const [lateFee, setLateFee] = useState(0)
  const [interestRate, setInterestRate] = useState(0)

  useEffect(() => {
    if (!societyId) return
    let cancelled = false
    void (async () => {
      setLoading(true)
      try {
        const rules = await fetchSocietyBillingRules(societyId)
        if (cancelled) return
        setDueDate(rules.maintenance_due_date)
        setGraceDays(rules.late_fee_grace_period_days)
        setLateFee(Number(rules.late_fee_flat_amount))
        setInterestRate(Number(rules.interest_rate_percentage))
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load billing rules.')
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
      const payload: Omit<SocietyBillingRules, 'society_id' | 'created_at' | 'updated_at'> = {
        maintenance_due_date: Math.min(28, Math.max(1, dueDate)),
        late_fee_grace_period_days: Math.max(0, graceDays),
        late_fee_flat_amount: Math.max(0, lateFee),
        interest_rate_percentage: Math.max(0, interestRate)
      }
      await upsertSocietyBillingRules(societyId, payload)
      setMessage('Billing policy saved. WhatsApp reminders will use these rules.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save billing rules.')
    } finally {
      setSaving(false)
    }
  }

  if (!societyId) {
    return (
      <div className={ui.card}>
        <p className={ui.body}>Society context is required to configure billing rules.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={ui.card} aria-busy="true">
        <p className={ui.body}>Loading billing policy…</p>
      </div>
    )
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className={`${ui.card} space-y-5`}>
      <div>
        <p className={ui.eyebrow}>Billing policy engine</p>
        <h2 className={`mt-2 ${ui.heading}`}>Maintenance due dates & penalties</h2>
        <p className={`mt-2 ${ui.body}`}>
          Configure society-wide billing rules. Automated WhatsApp payment reminders and late-fee alerts use these values.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-2">
          <span className={ui.label}>Maintenance due date (day of month)</span>
          <input
            type="number"
            min={1}
            max={28}
            className={ui.input}
            value={dueDate}
            onChange={(event) => setDueDate(Number(event.target.value))}
          />
          <p className="text-xs text-slate-500">Residents must pay by this date each month (1–28).</p>
        </label>

        <label className="block space-y-2">
          <span className={ui.label}>Late fee grace period (days)</span>
          <input
            type="number"
            min={0}
            max={60}
            className={ui.input}
            value={graceDays}
            onChange={(event) => setGraceDays(Number(event.target.value))}
          />
          <p className="text-xs text-slate-500">Days after due date before the flat late fee is applied.</p>
        </label>

        <label className="block space-y-2">
          <span className={ui.label}>Late fee flat amount (₹)</span>
          <input
            type="number"
            min={0}
            step="0.01"
            className={ui.input}
            value={lateFee}
            onChange={(event) => setLateFee(Number(event.target.value))}
          />
        </label>

        <label className="block space-y-2">
          <span className={ui.label}>Interest rate (% per month on overdue)</span>
          <input
            type="number"
            min={0}
            step="0.01"
            className={ui.input}
            value={interestRate}
            onChange={(event) => setInterestRate(Number(event.target.value))}
          />
        </label>
      </div>

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
        {saving ? 'Saving…' : 'Save billing policy'}
      </button>
    </form>
  )
}
