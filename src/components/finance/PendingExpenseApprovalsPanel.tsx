import React, { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import { restPost } from '../../api/supabaseClient'
import {
  pendingIncidentalExpenses,
  reviewExpense,
  type SocietyExpenseEntry
} from '../../lib/expenseApproval'
import { ui } from '../../lib/ui'

export default function PendingExpenseApprovalsPanel() {
  const { user, currentSocietyId } = useAuth()
  const [queue, setQueue] = useState<SocietyExpenseEntry[]>([])
  const [status, setStatus] = useState('')

  const refresh = useCallback(() => {
    setQueue(pendingIncidentalExpenses(currentSocietyId))
  }, [currentSocietyId])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function handleReview(expenseId: string, decision: 'approved' | 'rejected') {
    if (!currentSocietyId || !user?.email) return
    const result = reviewExpense(currentSocietyId, expenseId, decision, user.email)
    if (!result) return
    if (decision === 'approved') {
      await restPost('society_ledger', {
        society_id: currentSocietyId,
        date: result.date,
        type: result.type,
        amount: result.amount,
        description: result.description,
        invoice_url: result.invoiceUrl ?? undefined
      })
      setStatus(`Approved incidental expense "${result.description}" — now reflected in cashbook.`)
    } else {
      setStatus(`Rejected incidental expense "${result.description}".`)
    }
    refresh()
  }

  return (
    <section className={ui.card}>
      <header className={ui.cardHeader}>
        <p className={ui.eyebrow}>Incidental expense gate</p>
        <h2 className={`mt-1 ${ui.heading}`}>Awaiting accountant approval</h2>
        <p className={`mt-2 ${ui.body}`}>
          Repairs, vendor purchases, and custom spends stay pending until you approve. Fixed expenses (guard salary,
          utilities) post automatically.
        </p>
      </header>

      {status ? (
        <div className="mx-5 mb-4 rounded-xl border border-syncra-accent/30 bg-cyan-50 px-4 py-3 text-sm text-syncra-blue">
          {status}
        </div>
      ) : null}

      <div className={`${ui.cardBody} space-y-3`}>
        {queue.length === 0 ? (
          <p className={ui.body}>No incidental expenses pending approval.</p>
        ) : (
          queue.map((expense) => (
            <article key={expense.id} className={ui.innerItem}>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="font-semibold text-syncra-primary">{expense.description}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {expense.type === 'debit' ? 'Debit' : 'Credit'} · ₹{expense.amount.toLocaleString('en-IN')} ·{' '}
                    {new Date(expense.date).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button type="button" className={ui.btnPrimary} onClick={() => handleReview(expense.id, 'approved')}>
                    Approve
                  </button>
                  <button
                    type="button"
                    className={ui.btnSecondary}
                    onClick={() => handleReview(expense.id, 'rejected')}
                  >
                    Reject
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  )
}
