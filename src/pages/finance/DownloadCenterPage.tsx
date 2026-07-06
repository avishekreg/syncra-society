import React from 'react'
import { useAuth } from '../../providers/AuthProvider'
import { useLedger } from '../../hooks/useLedger'
import { useShowcaseWorkspace } from '../../hooks/useShowcaseWorkspace'
import { ui } from '../../lib/ui'

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export default function FinanceDownloadCenterPage() {
  const { currentSocietyId } = useAuth()
  const { entries } = useLedger(currentSocietyId)
  const { workingShowcase } = useShowcaseWorkspace()

  function exportLedgerCsv() {
    const rows = entries ?? []
    const header = 'Date,Type,Description,Amount (INR)\n'
    const body = rows
      .map((entry) =>
        [entry.date, entry.type, `"${entry.description.replace(/"/g, '""')}"`, entry.amount].join(',')
      )
      .join('\n')
    downloadTextFile(`syncra-ledger-${currentSocietyId ?? 'society'}.csv`, header + body)
  }

  function exportStatementSummary() {
    const credits = (entries ?? []).filter((e) => e.type === 'credit')
    const debits = (entries ?? []).filter((e) => e.type === 'debit')
    const totalIn = credits.reduce((sum, e) => sum + e.amount, 0)
    const totalOut = debits.reduce((sum, e) => sum + e.amount, 0)
    const lines = [
      'Syncra Society Financial Statement',
      `Society: ${workingShowcase?.society.name ?? currentSocietyId ?? 'N/A'}`,
      `Generated: ${new Date().toLocaleString('en-IN')}`,
      '',
      `Total Collections,${totalIn}`,
      `Total Expenditures,${totalOut}`,
      `Net Balance,${totalIn - totalOut}`,
      '',
      '--- Transaction Detail ---',
      'Date,Type,Description,Amount',
      ...(entries ?? []).map((e) => `${e.date},${e.type},"${e.description}",${e.amount}`)
    ]
    downloadTextFile(`syncra-financial-statement-${currentSocietyId ?? 'society'}.csv`, lines.join('\n'))
  }

  return (
    <div className={ui.sectionGap}>
      <section className={ui.grid2}>
        <article className={ui.cardFill}>
          <header className={ui.cardHeader}>
            <p className={ui.eyebrow}>Export</p>
            <h2 className={`mt-1 ${ui.heading}`}>Full ledger download</h2>
          </header>
          <p className={ui.body}>Download every recorded credit and debit as a structured CSV for audit or reconciliation.</p>
          <button type="button" onClick={exportLedgerCsv} className={`mt-4 ${ui.btnPrimary}`}>
            Download ledger CSV
          </button>
        </article>

        <article className={ui.cardFill}>
          <header className={ui.cardHeader}>
            <p className={ui.eyebrow}>Statements</p>
            <h2 className={`mt-1 ${ui.heading}`}>Financial statement pack</h2>
          </header>
          <p className={ui.body}>
            Summary totals plus line-item detail suitable for treasurer review and external accountant handoff.
          </p>
          <button type="button" onClick={exportStatementSummary} className={`mt-4 ${ui.btnSecondary}`}>
            Download statement CSV
          </button>
        </article>
      </section>
    </div>
  )
}
