import React, { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import {
  pendingVerificationQueue,
  reviewPendingPayment,
  type PendingOfflinePayment
} from '../../lib/paymentVerification'
import { ui } from '../../lib/ui'

export default function PendingVerificationsPanel() {
  const { user, currentSocietyId, showcaseData, setShowcaseData } = useAuth()
  const [queue, setQueue] = useState<PendingOfflinePayment[]>([])
  const [status, setStatus] = useState('')

  const refresh = useCallback(() => {
    setQueue(pendingVerificationQueue(currentSocietyId))
  }, [currentSocietyId])

  useEffect(() => {
    refresh()
  }, [refresh])

  function settleUnitDues(flatNumber: string, amount: number) {
    if (!showcaseData) return
    const updatedUnits = showcaseData.units.map((unit) => {
      if (unit.flat_number !== flatNumber) return unit
      return {
        ...unit,
        balance_status: 'paid' as const,
        balance_due: 0,
        payment_history: [
          ...unit.payment_history,
          { date: new Date().toLocaleDateString('en-IN'), amount, method: 'Offline verification' }
        ]
      }
    })
    const updatedDefaulters = showcaseData.defaulters.map((d) =>
      d.flat_number === flatNumber ? { ...d, status: 'paid' as const, amount_due: 0, penalty: 0 } : d
    )
    const ledgerEntry = {
      id: `ledger-verify-${Date.now()}`,
      society_id: showcaseData.society.id,
      date: new Date().toLocaleDateString('en-IN'),
      type: 'credit' as const,
      amount,
      description: `Verified offline payment — Flat ${flatNumber}`,
      invoice_url: null
    }
    setShowcaseData({
      ...showcaseData,
      units: updatedUnits,
      defaulters: updatedDefaulters,
      ledgerEntries: [ledgerEntry, ...showcaseData.ledgerEntries]
    })
  }

  function handleReview(paymentId: string, decision: 'approved' | 'rejected') {
    if (!currentSocietyId || !user?.email) return
    const result = reviewPendingPayment(currentSocietyId, paymentId, decision, user.email)
    if (!result) return
    if (decision === 'approved') {
      settleUnitDues(result.flatNumber, result.amount)
      setStatus(`Approved ₹${result.amount.toLocaleString('en-IN')} for Flat ${result.flatNumber}. Dues settled.`)
    } else {
      setStatus(`Rejected offline payment reference ${result.referenceNumber}.`)
    }
    refresh()
  }

  return (
    <section className={ui.card}>
      <header className={ui.cardHeader}>
        <p className={ui.eyebrow}>Offline payment approvals</p>
        <h2 className={`mt-1 ${ui.heading}`}>Pending verifications</h2>
        <p className={`mt-2 ${ui.body}`}>
          Residents who paid manually to the society bank account appear here until you approve or reject the credit.
        </p>
      </header>

      {status ? (
        <div className="mx-5 mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {status}
        </div>
      ) : null}

      <div className={`${ui.cardBody} space-y-3`}>
        {queue.length === 0 ? (
          <p className={ui.body}>No offline payments awaiting verification.</p>
        ) : (
          queue.map((payment) => (
            <article key={payment.id} className={ui.innerItem}>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="font-semibold text-syncra-primary">
                    Flat {payment.flatNumber} · ₹{payment.amount.toLocaleString('en-IN')}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {payment.residentName} · {payment.method.replace('_', ' ')} · Ref {payment.referenceNumber}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Paid on {payment.paymentDate}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button type="button" className={ui.btnPrimary} onClick={() => handleReview(payment.id, 'approved')}>
                    Approve
                  </button>
                  <button
                    type="button"
                    className={ui.btnSecondary}
                    onClick={() => handleReview(payment.id, 'rejected')}
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
