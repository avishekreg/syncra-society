import React, { useState } from 'react'
import { useAuth } from '../providers/AuthProvider'
import { ui } from '../lib/ui'

export default function BankStatementReconciliation() {
  const { showcaseData, setShowcaseData } = useAuth()
  const [fileName, setFileName] = useState('')
  const [processing, setProcessing] = useState(false)
  const [message, setMessage] = useState('Drag or upload a bank statement to reconcile payments.')

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setProcessing(true)
    setMessage('Processing bank statement...')

    await new Promise((resolve) => setTimeout(resolve, 1450))

    if (!showcaseData) {
      setProcessing(false)
      setMessage('Showcase data missing. Please login with a demo credential.')
      return
    }

    const paymentMatchedFlat = '204'
    const paymentAmount = 4500
    const updatedUnits = showcaseData.units.map((unit) => {
      if (unit.flat_number === paymentMatchedFlat) {
        return {
          ...unit,
          balance_status: 'paid',
          balance_due: 0,
          payment_history: [
            ...unit.payment_history,
            { date: new Date().toLocaleDateString('en-IN'), amount: paymentAmount, method: 'Bank statement auto-match' }
          ]
        }
      }
      return unit
    })

    const updatedDefaulters = showcaseData.defaulters.map((defaulter) =>
      defaulter.flat_number === paymentMatchedFlat ? { ...defaulter, status: 'paid', amount_due: 0, penalty: 0 } : defaulter
    )

    const newLedgerEntry = {
      id: `ledger-${Date.now()}`,
      society_id: showcaseData.society.id,
      date: new Date().toLocaleDateString('en-IN'),
      type: 'credit' as const,
      amount: paymentAmount,
      description: 'Auto-reconciled bank statement payment for Flat 204',
      invoice_url: null
    }

    setShowcaseData({
      ...showcaseData,
      units: updatedUnits,
      defaulters: updatedDefaulters,
      ledgerEntries: [newLedgerEntry, ...showcaseData.ledgerEntries]
    })

    setProcessing(false)
    setMessage('Transaction reconciled successfully. Ledger up-to-date.')
  }

  return (
    <section className={ui.card}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={ui.eyebrow}>Automated reconciliation</p>
          <h2 className={`mt-2 ${ui.headingLg}`}>Automated Financial Reconciliation & Bank Statement Parser</h2>
          <p className={`mt-2 ${ui.body}`}>
            Upload a bank statement and let the demo engine automatically offset defaulting unit dues.
          </p>
        </div>
        <div className={ui.badge}>Mock bank parser</div>
      </div>

      <div className={`mt-6 ${ui.innerItem}`}>
        <label className="group relative flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white px-6 py-8 text-center transition hover:border-syncra-accent/40">
          <input
            type="file"
            accept=".xlsx,.csv"
            onChange={handleFileUpload}
            className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
          />
          <div className="space-y-3">
            <p className="text-lg font-semibold text-syncra-primary">Upload Bank Statement (.xlsx / .csv)</p>
            <p className={ui.body}>Drop a statement file or click to select. Demo parser will match Flat 204.</p>
            <p className="text-sm text-slate-500">{fileName || 'No file selected yet'}</p>
          </div>
        </label>
      </div>

      <div className={`mt-4 ${ui.innerItem}`}>
        <p className={ui.body}>Status</p>
        <p className={`mt-2 text-sm ${processing ? 'text-syncra-blue' : 'text-emerald-600'}`}>{message}</p>
      </div>
    </section>
  )
}
