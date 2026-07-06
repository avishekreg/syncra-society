import React, { useRef, useState } from 'react'
import { ui } from '../../lib/ui'

export default function FinanceBankUploadPage() {
  const [dragActive, setDragActive] = useState(false)
  const [fileName, setFileName] = useState('')
  const [message, setMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  function handleFile(file: File) {
    setFileName(file.name)
    setMessage(
      `Bank statement "${file.name}" queued for secure processing. Reconciliation will update the ledger once parsing completes.`
    )
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
          if (file) handleFile(file)
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
            if (file) handleFile(file)
          }}
        />
        <header className={ui.cardHeader}>
          <p className={ui.eyebrow}>Secure upload</p>
          <h2 className={`mt-1 ${ui.headingLg}`}>Bank statement processing</h2>
        </header>
        <div className="rounded-xl border border-slate-200 bg-syncra-surface-alt px-6 py-12 text-center">
          <p className="text-sm font-medium text-syncra-primary">Drag and drop your bank statement here</p>
          <p className={`mt-2 ${ui.body}`}>Accepted formats: PDF, CSV, XLS, XLSX</p>
          <p className="mt-4 text-xs text-slate-500">Files are encrypted in transit and processed only for reconciliation.</p>
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
