import React, { useRef, useState } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import { useLedger } from '../../hooks/useLedger'
import {
  appendProcessedFingerprints,
  ledgerToFingerprints,
  parseBankStatementFile,
  readProcessedFingerprints,
  reconcileBankTransactions
} from '../../lib/bankStatementParser'
import { ui } from '../../lib/ui'

export default function FinanceBankUploadPage() {
  const { currentSocietyId, showcaseData, setShowcaseData } = useAuth()
  const { entries } = useLedger(currentSocietyId)
  const [dragActive, setDragActive] = useState(false)
  const [fileName, setFileName] = useState('')
  const [message, setMessage] = useState('')
  const [processing, setProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  async function handleFile(file: File) {
    if (!currentSocietyId) {
      setMessage('Select a society before uploading bank statements.')
      return
    }

    setFileName(file.name)
    setProcessing(true)
    setMessage('Parsing bank statement with duplicate protection…')

    try {
      const transactions = await parseBankStatementFile(file)
      const ledgerFingerprints = ledgerToFingerprints(entries ?? [])
      const processed = readProcessedFingerprints(currentSocietyId)
      const existing = [...ledgerFingerprints, ...processed]
      const result = reconcileBankTransactions(transactions, existing, 16)

      if (result.imported.length === 0) {
        setMessage(
          `No new transactions imported. ${result.skippedDuplicates.length} duplicate or already-reconciled rows skipped.`
        )
        setProcessing(false)
        return
      }

      appendProcessedFingerprints(
        currentSocietyId,
        result.imported.map((tx) => ({ reference: tx.reference, date: tx.date, amount: tx.amount }))
      )

      if (showcaseData) {
        const newLedgerEntries = result.imported.map((tx) => ({
          id: `ledger-bank-${tx.reference}-${Date.now()}`,
          society_id: showcaseData.society.id,
          date: tx.date,
          type: tx.type,
          amount: tx.amount,
          description: `Bank import · ${tx.description} · Ref ${tx.reference}`,
          invoice_url: null
        }))
        setShowcaseData({
          ...showcaseData,
          ledgerEntries: [...newLedgerEntries, ...showcaseData.ledgerEntries]
        })
      }

      setMessage(
        `Imported ${result.imported.length} new transaction(s). Skipped ${result.skippedDuplicates.length} duplicate entries (including prior uploads through the 16th).`
      )
    } catch {
      setMessage('Unable to parse the uploaded file. Use CSV with reference, date, amount, and description columns.')
    }

    setProcessing(false)
  }

  return (
    <div className={ui.sectionGap}>
      <section
        className={`${ui.card} border-2 transition ${
          dragActive ? 'border-syncra-accent bg-cyan-50/40' : 'border-dashed border-slate-300'
        }`}
        onDragEnter={(e) => {
          e.preventDefault()
          setDragActive(true)
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setDragActive(true)
        }}
        onDragLeave={(e) => {
          e.preventDefault()
          setDragActive(false)
        }}
        onDrop={(e) => {
          e.preventDefault()
          setDragActive(false)
          const file = e.dataTransfer.files?.[0]
          if (file) void handleFile(file)
        }}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click()
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.csv,.xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void handleFile(file)
          }}
        />
        <header className={ui.cardHeader}>
          <p className={ui.eyebrow}>Secure upload</p>
          <h2 className={`mt-1 ${ui.headingLg}`}>Smart bank statement reconciliation</h2>
          <p className={`mt-2 ${ui.body}`}>
            CSV imports run idempotent duplicate checks against reference numbers, dates, and amounts. Rows already
            recorded through the 16th are skipped to prevent double credits.
          </p>
        </header>
        <div className="rounded-xl border border-slate-200 bg-syncra-surface-alt px-6 py-12 text-center">
          <p className="text-sm font-medium text-syncra-primary">
            {processing ? 'Processing…' : 'Drag and drop your bank statement here'}
          </p>
          <p className={`mt-2 ${ui.body}`}>Accepted formats: CSV (recommended), XLS, XLSX</p>
        </div>
        {fileName ? <p className={`mt-4 text-sm font-medium text-syncra-blue`}>Selected: {fileName}</p> : null}
        {message ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        ) : null}
      </section>
    </div>
  )
}
