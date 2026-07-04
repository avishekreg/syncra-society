import React, { useEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import ContractsList from './ContractsList'
import RolesManager from './RolesManager'
import LedgerManager from './LedgerManager'
import FinancialTransparencyPanel from '../../components/FinancialTransparencyPanel'
import OutstandingRevenueMatrix from '../../components/OutstandingRevenueMatrix'
import ShowcaseUnitsPanel from '../../components/ShowcaseUnitsPanel'
import { useAuth } from '../../providers/AuthProvider'
import { isGlobalSuperAdmin } from '../../lib/roles'
import { ui } from '../../lib/ui'
import {
  downloadSocietyImportTemplate,
  parseSocietyCsv,
  persistSocietyImport,
  rowsToDemoUnits
} from '../../api/societyImport'
import type { ShowcaseData } from '../../providers/AuthProvider'

function emptyShowcase(societyId: string, name = 'My Society'): ShowcaseData {
  return {
    society: {
      id: societyId,
      name,
      subscription: 'Trial',
      totalFlats: 0
    },
    units: [],
    defaulters: [],
    ledgerEntries: []
  }
}

export default function RwaWorkspace() {
  const { showcaseData, user, setShowcaseData, currentSocietyId } = useAuth()
  const [uploadMessage, setUploadMessage] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [blockName, setBlockName] = useState('')
  const [flatNumberInput, setFlatNumberInput] = useState('')
  const [areaSize, setAreaSize] = useState('')
  const [ownerFullName, setOwnerFullName] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [ownerMobile, setOwnerMobile] = useState('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!showcaseData && currentSocietyId && setShowcaseData) {
      setShowcaseData(emptyShowcase(currentSocietyId))
    }
  }, [showcaseData, currentSocietyId, setShowcaseData])

  if (!user) {
    return <div className={ui.loading}>Loading Syncra Workspace Safely...</div>
  }

  if (isGlobalSuperAdmin(user)) {
    return <Navigate to="/super-admin" replace />
  }

  const workingShowcase =
    showcaseData ?? (currentSocietyId ? emptyShowcase(currentSocietyId) : null)

  if (!workingShowcase) {
    return (
      <div className={ui.card}>
        <p className={ui.eyebrow}>Society setup required</p>
        <h2 className={ui.heading}>No society linked to this account</h2>
        <p className={`mt-4 max-w-xl ${ui.body}`}>
          Complete society onboarding to access the RWA dashboard, or contact your platform administrator.
        </p>
      </div>
    )
  }

  const currentUnits = workingShowcase.units ?? []
  const userRole = user.user_metadata?.role ?? user.role ?? 'resident'
  const isOwner = userRole === 'rwa_owner' || user.roles?.includes('rwa_owner')
  const isFinance =
    userRole === 'rwa_owner' ||
    userRole === 'rwa_accountant' ||
    user.roles?.includes('rwa_owner') ||
    user.roles?.includes('rwa_accountant')

  if (!isOwner && !isFinance) {
    return (
      <div className={ui.card}>
        <p className={ui.eyebrow}>Access denied</p>
        <h2 className={ui.heading}>Restricted RWA access</h2>
        <p className={`mt-4 max-w-xl ${ui.body}`}>
          Your current role is not permitted to view society financial and onboarding controls.
        </p>
      </div>
    )
  }

  const handleTemplateUpload = async (file: File) => {
    try {
      const text = await file.text()
      const rows = parseSocietyCsv(text)
      const result = rowsToDemoUnits(rows)

      if (currentSocietyId) {
        await persistSocietyImport(currentSocietyId, result)
      }

      const openingLedger =
        result.societyStartingBankBalance > 0
          ? [
              {
                id: `opening-${Date.now()}`,
                society_id: currentSocietyId ?? workingShowcase.society.id,
                date: new Date().toLocaleDateString('en-IN'),
                type: 'credit' as const,
                amount: result.societyStartingBankBalance,
                description: 'Society starting bank balance (Day 1 migration)',
                invoice_url: null
              }
            ]
          : []

      setShowcaseData?.({
        ...workingShowcase,
        society: {
          ...workingShowcase.society,
          totalFlats: result.importedCount,
          name: workingShowcase.society.name
        },
        units: result.units,
        ledgerEntries: [...openingLedger, ...workingShowcase.ledgerEntries]
      })

      setUploadMessage(
        `Successfully imported ${result.importedCount} units with opening balances. Starting bank balance: ₹${result.societyStartingBankBalance.toLocaleString('en-IN')}.`
      )
    } catch (err: any) {
      setUploadMessage(err.message || 'CSV import failed. Check column headers and try again.')
    }
  }

  const openFilePicker = () => fileInputRef.current?.click()

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setDragActive(true)
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setDragActive(true)
  }

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setDragActive(false)
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setDragActive(false)
    const file = event.dataTransfer.files?.[0]
    if (file) handleTemplateUpload(file)
  }

  const addUnitToMatrix = () => {
    if (!setShowcaseData || !workingShowcase) return
    if (!blockName || !flatNumberInput || !areaSize || !ownerFullName || !ownerEmail || !ownerMobile) return

    const newUnit = {
      flat_number: `${blockName}-${flatNumberInput}`,
      owner_name: ownerFullName,
      owner_email: ownerEmail,
      owner_mobile: ownerMobile,
      balance_status: 'due' as const,
      balance_due: Number(areaSize) * 12 || 0,
      last_payment: 'Pending onboarding',
      payment_history: []
    }

    setShowcaseData({
      ...workingShowcase,
      units: [...workingShowcase.units, newUnit]
    })
    setBlockName('')
    setFlatNumberInput('')
    setAreaSize('')
    setOwnerFullName('')
    setOwnerEmail('')
    setOwnerMobile('')
  }

  const mockEmergencyTickets = [
    {
      id: 'ticket-1',
      flat: '204',
      owner: 'Priya Menon',
      category: 'Electrical',
      issue: 'Power outage in common corridor',
      urgency: 'Critical',
      attachment: 'elevator-panel.jpg',
      status: 'Open',
      time: '2 min ago'
    },
    {
      id: 'ticket-2',
      flat: '501',
      owner: 'Aarti Joshi',
      category: 'Infrastructure',
      issue: 'Water pump noise has increased',
      urgency: 'High',
      attachment: 'pump-audio.png',
      status: 'In Review',
      time: '12 min ago'
    }
  ]

  return (
    <div className={ui.sectionGap}>
        <header>
          <p className={ui.eyebrow}>Society operations</p>
          <h1 className={`mt-2 ${ui.headingLg}`}>Onboarding, finance & access</h1>
          <p className={`mt-2 max-w-2xl ${ui.body}`}>
            Deep operational tools for fleet onboarding, treasury, contracts, and role management.
          </p>
        </header>

        {/* ── KPI row: equal-width columns, height follows content ── */}
        <section className={ui.grid3}>
          <article className={ui.cardFill}>
            <header className={ui.cardHeader}>
              <p className={ui.eyebrow}>Syncra AI Predictive Engine</p>
              <h2 className={`mt-1 ${ui.heading}`}>Cashflow forecast</h2>
            </header>
            <div className={ui.cardBody}>
              <p className={ui.body}>
                Based on a 6-month behavioral analysis of society ledger records, Block B holds a 14.2% default
                risk for the upcoming cycle.
              </p>
              <div className="mt-4 rounded-xl border border-syncra-accent/30 bg-cyan-50 px-4 py-3 text-sm font-medium text-syncra-blue">
                Expected liquid collection: 88.4%
              </div>
            </div>
          </article>

          <article className={ui.cardFill}>
            <OutstandingRevenueMatrix
              baseOutstanding={122400}
              lateFee={3600}
              accumulatedInterest={980}
              splitClaims={12500}
            />
          </article>

          <article className={ui.cardFill}>
            <header className={ui.cardHeader}>
              <p className={ui.eyebrow}>Incoming Emergency Tickets</p>
              <h2 className={`mt-1 ${ui.heading}`}>RWA incident stream</h2>
            </header>
            <div className={`${ui.cardBody} space-y-3`}>
              {mockEmergencyTickets.map((ticket) => (
                <div key={ticket.id} className={ui.innerItem}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                        Flat {ticket.flat}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-syncra-primary">{ticket.issue}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {ticket.category} · {ticket.time}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-amber-700">
                      {ticket.urgency}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5 text-xs text-slate-600">
                    <span>{ticket.owner}</span>
                    <span className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] text-slate-500">
                      {ticket.attachment}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] text-slate-500">
                      {ticket.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>

        {/* ── Onboarding: two equal columns ── */}
        <section className={ui.grid2}>
          <article className={ui.cardFill}>
            <header className={ui.cardHeader}>
              <p className={ui.eyebrow}>Society Fleet & Unit Onboarding</p>
              <h2 className={`mt-1 ${ui.heading}`}>Download template</h2>
            </header>
            <div className={ui.cardBody}>
              <p className={ui.body}>
                Use the standard society import template to bulk onboard flats and residents.
              </p>
              <button type="button" onClick={downloadSocietyImportTemplate} className={`mt-4 ${ui.btnSecondary}`}>
                Download Excel/CSV Template
              </button>
            </div>
          </article>

          <article
            className={`${ui.cardFill} cursor-pointer border-2 transition ${
              dragActive ? 'border-syncra-accent bg-cyan-50/50' : 'border-dashed border-slate-300'
            }`}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={openFilePicker}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.csv"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) handleTemplateUpload(file)
              }}
            />
            <header className={ui.cardHeader}>
              <p className={ui.eyebrow}>Bulk upload</p>
              <h2 className={`mt-1 ${ui.heading}`}>Upload society template</h2>
            </header>
            <div className={ui.cardBody}>
              <p className={ui.body}>Supports bulk-import up to 500 units instantly.</p>
              <div className="mt-4 rounded-xl border border-slate-200 bg-syncra-surface-alt px-4 py-8 text-center">
                <p className="text-sm text-slate-700">Drag and drop file here, or click to select</p>
                <p className="mt-1 text-xs text-slate-400">.xlsx / .csv accepted</p>
              </div>
              {uploadMessage ? (
                <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {uploadMessage}
                </div>
              ) : null}
            </div>
          </article>
        </section>

        {/* ── Manual unit registry ── */}
        {isOwner && (
          <section className={ui.card}>
            <header className={ui.cardHeader}>
              <p className={ui.eyebrow}>Manual Unit Addition Matrix</p>
              <h2 className={`mt-1 ${ui.heading}`}>Manual Unit Registry & Flat Matrix</h2>
              <p className={`mt-2 max-w-2xl ${ui.body}`}>
                Add a single unit directly into the society mock layout state for President-level onboarding.
              </p>
            </header>
            <div className="grid gap-4 sm:grid-cols-2">
              {(
                [
                  { label: 'Block Name', value: blockName, setter: setBlockName, placeholder: 'e.g. Block A', type: 'text' },
                  { label: 'Flat Number', value: flatNumberInput, setter: setFlatNumberInput, placeholder: 'e.g. 301', type: 'text' },
                  { label: 'Super Built-up Area (Sq. Ft.)', value: areaSize, setter: setAreaSize, placeholder: 'e.g. 1230', type: 'text' },
                  { label: 'Owner Full Name', value: ownerFullName, setter: setOwnerFullName, placeholder: 'e.g. Anita Rao', type: 'text' },
                  { label: 'Owner Email', value: ownerEmail, setter: setOwnerEmail, placeholder: 'e.g. owner@example.com', type: 'email' },
                  {
                    label: 'Owner Registered Mobile Number',
                    value: ownerMobile,
                    setter: setOwnerMobile,
                    placeholder: 'Enter 10-digit phone for WhatsApp Automation',
                    type: 'tel'
                  }
                ] as const
              ).map(({ label, value, setter, placeholder, type }) => (
                <label key={label} className="space-y-1.5">
                  <span className={ui.label}>{label}</span>
                  <input
                    type={type}
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    className={ui.input}
                    placeholder={placeholder}
                  />
                </label>
              ))}
            </div>
            <div className="mt-6">
              <button type="button" onClick={addUnitToMatrix} className={ui.btnPrimary}>
                Add Single Unit to Matrix
              </button>
            </div>
          </section>
        )}

        {/* ── Flat showcase ── */}
        <ShowcaseUnitsPanel units={currentUnits} />

        {/* ── Finance: ledger + treasury side-by-side on xl ── */}
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-5">
          <article className={`${ui.cardFill} xl:col-span-2`}>
            <header className={ui.cardHeader}>
              <p className={ui.eyebrow}>Ledger</p>
              <h2 className={`mt-1 ${ui.heading}`}>Financial ledger</h2>
            </header>
            <div className={ui.cardBody}>
              <LedgerManager embedded />
            </div>
          </article>
          <div className="xl:col-span-3">
            <FinancialTransparencyPanel embedded data={workingShowcase} />
          </div>
        </section>

        {/* ── Operations: contracts / roles ── */}
        <section className={`${ui.grid2} items-stretch`}>
          <article className={ui.cardFill}>
            <header className={ui.cardHeader}>
              <p className={ui.eyebrow}>Contracts</p>
              <h2 className={`mt-1 ${ui.heading}`}>Agreement tracker</h2>
            </header>
            <div className={ui.cardBody}>
              <ContractsList embedded />
            </div>
          </article>

          <article className={ui.cardFill}>
            <header className={ui.cardHeader}>
              <p className={ui.eyebrow}>Roles</p>
              <h2 className={`mt-1 ${ui.heading}`}>Access management</h2>
            </header>
            <div className={ui.cardBody}>
              <RolesManager embedded />
            </div>
          </article>
        </section>

        {/* ── Status strip ── */}
        <section className={ui.grid2}>
          <article className={ui.cardFill}>
            <header className={ui.cardHeader}>
              <p className={ui.eyebrow}>Hierarchy overview</p>
              <h2 className={`mt-1 ${ui.heading}`}>RWA status board</h2>
            </header>
            <p className={ui.body}>
              Key society operations, notification counts, and ledger health in a unified surface.
            </p>
          </article>
          <article className={ui.cardFill}>
            <header className={ui.cardHeader}>
              <p className={ui.eyebrow}>Quick actions</p>
              <h2 className={`mt-1 ${ui.heading}`}>Operational controls</h2>
            </header>
            <p className={ui.body}>
              Use the sidebar to manage notices, contracts, roles, and ledgers from dedicated views.
            </p>
          </article>
        </section>
      </div>
  )
}
