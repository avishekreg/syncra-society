import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../providers/AuthProvider'
import { useLedger } from '../../hooks/useLedger'
import { useComplaints, formatComplaintStatus } from '../../hooks/useComplaints'
import NoticesList from '../../components/NoticesList'
import ResidentAccountsOverview, { ResidentGateApprovals } from '../../components/ResidentAccountsOverview'
import type { VisitorLog } from '../../types/db'
import { listPendingVisitorLogs } from '../../api/visitorLogs'
import { ui } from '../../lib/ui'

const DEFAULT_EMERGENCY_DIRECTORY = [
  { label: 'Nearest Hospital', phone: '108' },
  { label: 'Ambulance Rail', phone: '109' },
  { label: 'Local Police Station', phone: '100' },
  { label: 'On-Call Plumber', phone: '+91 98765 43210' },
  { label: 'On-Call Electrician', phone: '+91 91234 56789' },
  { label: 'Elevator Maintenance Agency', phone: '+91 99887 76655' }
]

export default function ResidentDashboard() {
  const { currentSocietyId, user, showcaseData } = useAuth()
  const { entries } = useLedger(currentSocietyId)
  const { complaints, loading: complaintsLoading } = useComplaints(currentSocietyId, user?.id ?? null)
  const [alertVisitors, setAlertVisitors] = useState<VisitorLog[]>([])
  const [emergencyContacts, setEmergencyContacts] = useState(DEFAULT_EMERGENCY_DIRECTORY)
  const [speedDialOpen, setSpeedDialOpen] = useState(false)
  const flatNumber = user?.flatNumber
  const isLoading = entries === null

  const myUnit = useMemo(() => {
    if (!showcaseData || !flatNumber) return null
    return showcaseData.units.find(
      (u) => u.flat_number === flatNumber || u.flat_number.endsWith(`-${flatNumber}`)
    ) ?? null
  }, [showcaseData, flatNumber])

  const accountSummary = useMemo(() => {
    if (myUnit) {
      const totalPaid = myUnit.payment_history.reduce((sum, p) => sum + p.amount, 0)
      return {
        totalPaid,
        outstanding: myUnit.balance_due,
        paymentStatus: myUnit.balance_status as 'paid' | 'due' | 'defaulter'
      }
    }
    return { totalPaid: 0, outstanding: 0, paymentStatus: 'unknown' as const }
  }, [myUnit])

  const myLedgerEntries = useMemo(() => {
    if (!entries || !flatNumber) return entries ?? []
    const flatToken = flatNumber.toLowerCase()
    return entries.filter((e) => (e.description ?? '').toLowerCase().includes(flatToken))
  }, [entries, flatNumber])

  useEffect(() => {
    async function refreshPending() {
      if (!currentSocietyId || !flatNumber) {
        setAlertVisitors([])
        return
      }
      try {
        const pending = await listPendingVisitorLogs(currentSocietyId, flatNumber)
        setAlertVisitors(pending)
      } catch {
        setAlertVisitors([])
      }
    }

    refreshPending()
    const interval = setInterval(refreshPending, 15000)
    return () => clearInterval(interval)
  }, [currentSocietyId, flatNumber])

  useEffect(() => {
    if (!currentSocietyId) return
    const stored = localStorage.getItem(`syncra-emergency-directory-${currentSocietyId}`)
    if (!stored) {
      setEmergencyContacts(DEFAULT_EMERGENCY_DIRECTORY)
      return
    }
    try {
      const parsed = JSON.parse(stored) as Array<{ label: string; phone: string }>
      setEmergencyContacts(parsed.length ? parsed : DEFAULT_EMERGENCY_DIRECTORY)
    } catch {
      setEmergencyContacts(DEFAULT_EMERGENCY_DIRECTORY)
    }
  }, [currentSocietyId])

  if (isLoading) {
    return <div className={ui.loading}>Loading Resident Dashboard…</div>
  }

  return (
    <div className={ui.sectionGap}>
      <ResidentAccountsOverview
        totalPaid={accountSummary.totalPaid}
        outstanding={accountSummary.outstanding}
        paymentStatus={accountSummary.paymentStatus}
        flatNumber={flatNumber}
      />

      <section className={ui.card}>
        <header className={`${ui.cardHeader} flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`}>
          <div>
            <p className={ui.eyebrow}>Support tickets</p>
            <h2 className={`mt-1 ${ui.heading}`}>My helpdesk requests</h2>
          </div>
          <Link to="/resident/helpdesk" className={ui.btnSecondary}>
            Raise new ticket
          </Link>
        </header>
        {complaintsLoading && <p className={ui.body}>Loading your tickets…</p>}
        {!complaintsLoading && complaints.length === 0 && (
          <p className={ui.body}>You have not raised any support tickets yet.</p>
        )}
        <ul className="space-y-2">
          {complaints.slice(0, 5).map((ticket) => (
            <li key={ticket.id} className={ui.innerItem}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                <div>
                  <p className="font-medium text-syncra-primary">{ticket.subject}</p>
                  {ticket.description && <p className={`mt-0.5 line-clamp-2 ${ui.body}`}>{ticket.description}</p>}
                  {ticket.created_at && (
                    <p className="mt-1 text-xs text-slate-500">{new Date(ticket.created_at).toLocaleString()}</p>
                  )}
                </div>
                <span className="shrink-0 rounded-full border border-syncra-accent/30 bg-syncra-accent/10 px-2.5 py-0.5 text-xs font-semibold text-syncra-blue">
                  {formatComplaintStatus(ticket.status)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <ResidentGateApprovals />

      <section className={ui.card}>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-syncra-action-alt">
              Emergency Speed Dial
            </p>
            <h2 className={`mt-2 ${ui.heading}`}>Local emergency contacts</h2>
            <p className={`mt-2 max-w-xl ${ui.body}`}>
              Access critical society phone numbers from one click-to-call tray.
            </p>
          </div>
          <button type="button" onClick={() => setSpeedDialOpen(true)} className={`shrink-0 ${ui.btnDanger}`}>
            Open speed dial
          </button>
        </div>
      </section>

      {speedDialOpen && (
        <div className={ui.overlay}>
          <div className={ui.modal}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-syncra-action-alt">
                  Emergency Speed Dial
                </p>
                <h2 className={`mt-2 ${ui.headingLg}`}>Instant call tray</h2>
              </div>
              <button type="button" onClick={() => setSpeedDialOpen(false)} className={ui.btnGhost}>
                Close
              </button>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {emergencyContacts.map((contact) => (
                <div key={contact.label} className={ui.innerItem}>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {contact.label}
                  </p>
                  <p className="mt-3 text-xl font-semibold tracking-tight text-syncra-primary">{contact.phone}</p>
                  <a href={`tel:${contact.phone}`} className={`mt-4 inline-flex ${ui.btnDanger}`}>
                    Call now
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {alertVisitors.length > 0 && (
        <div className={ui.alert}>
          <p className={ui.eyebrow}>Gate Alert</p>
          <p className="mt-2 text-lg font-semibold text-syncra-primary">Visitor waiting at the gate</p>
          <p className={`mt-1 ${ui.body}`}>Use the pending requests panel above to approve or deny.</p>
        </div>
      )}

      <div className={ui.grid2}>
        <section className={ui.card}>
          <h2 className={`mb-6 ${ui.heading}`}>My ledger entries</h2>
          {myLedgerEntries.length === 0 ? (
            <p className={ui.body}>No ledger entries linked to your flat yet.</p>
          ) : (
            <ul className="space-y-3">
              {myLedgerEntries.map((e) => (
                <li key={e.id} className={ui.innerItem}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <div>
                      <div className="font-medium text-slate-800">{e.description}</div>
                      <div className="mt-0.5 text-sm text-slate-500">{e.date}</div>
                    </div>
                    <div
                      className={`text-sm font-semibold tabular-nums ${
                        e.type === 'credit' ? 'text-emerald-600' : 'text-syncra-action-alt'
                      }`}
                    >
                      ₹{Number(e.amount).toLocaleString('en-IN')}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className={ui.card}>
          <NoticesList />
        </div>
      </div>
    </div>
  )
}
