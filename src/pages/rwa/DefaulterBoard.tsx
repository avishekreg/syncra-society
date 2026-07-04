import React, { useEffect, useState } from 'react'
import { listDefaulters } from '../../api/visitorLogs'
import { useAuth } from '../../providers/AuthProvider'
import { MaintenanceDefaulter } from '../../types/db'
import { ui } from '../../lib/ui'

export default function DefaulterBoard() {
  const { currentSocietyId, showcaseData } = useAuth()
  const [defaulters, setDefaulters] = useState<MaintenanceDefaulter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function loadDefaulters() {
      if (!currentSocietyId && !showcaseData) {
        setError('Select a society to view the defaulter board.')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const entries = showcaseData?.defaulters ?? (await listDefaulters(currentSocietyId!))
        if (mounted) {
          setDefaulters(entries)
        }
      } catch (err) {
        if (mounted) {
          setError('Unable to load defaulter board at this time.')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadDefaulters()
    return () => {
      mounted = false
    }
  }, [currentSocietyId])

  return (
    <section className={ui.card}>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-syncra-action-alt">Defaulter Board</p>
          <h2 className={`mt-3 ${ui.headingLg}`}>Maintenance arrears ledger</h2>
          <p className={`mt-2 ${ui.body}`}>
            Public list of flats with unpaid maintenance balances, interest, and pending follow-up.
          </p>
        </div>
        <div className={ui.badge}>Real-time defaulter feed</div>
      </div>

      {loading ? (
        <div className={`${ui.innerItem} text-slate-600`}>Loading defaulters…</div>
      ) : error ? (
        <div className="rounded-2xl border border-syncra-action-alt/30 bg-syncra-action-alt/10 p-6 text-[#e04545]">{error}</div>
      ) : defaulters.length === 0 ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-800">
          No recorded maintenance defaulters yet. The society ledger is clean.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {(defaulters || []).map((defaulter) => (
            <article key={defaulter.id} className={ui.innerItem}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className={ui.body}>Flat</p>
                  <p className="text-xl font-semibold text-syncra-primary">{defaulter.flat_number}</p>
                </div>
                <span className="rounded-full bg-syncra-action-alt/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-[#e04545]">
                  {defaulter.status}
                </span>
              </div>

              <div className={`mt-4 grid gap-3 text-sm ${ui.body}`}>
                <div>
                  <p className="text-slate-500">Billing month</p>
                  <p>{new Date(defaulter.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
                </div>
                <div>
                  <p className="text-slate-500">Outstanding</p>
                  <p className="font-semibold text-syncra-primary">₹{defaulter.amount_due.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-slate-500">Penalty</p>
                  <p>{defaulter.penalty ? `₹${defaulter.penalty.toFixed(2)}` : '₹0.00'}</p>
                </div>
              </div>

              {defaulter.notes ? (
                <div className={`mt-4 ${ui.innerItem} text-sm`}>
                  <p className="font-medium text-syncra-primary">Notes</p>
                  <p className={`mt-1 ${ui.body}`}>{defaulter.notes}</p>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
