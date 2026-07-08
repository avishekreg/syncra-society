import React, { useRef, useState } from 'react'
import ShowcaseUnitsPanel from '../../../components/ShowcaseUnitsPanel'
import PlanLimitModal from '../../../components/billing/TrialLimitModal'
import { useShowcaseWorkspace } from '../../../hooks/useShowcaseWorkspace'
import { useSaasBilling } from '../../../hooks/useSaasBilling'
import { useResolvedSocietyUuid } from '../../../hooks/useResolvedSocietyUuid'
import type { MockUpgradePlan } from '../../../api/subscriptions'
import {
  buildFlatLimitMessage,
  getNextUpgradePlan,
  getPlanTier,
  getSubscriptionMaxFlats,
  isFlatLimitReached,
  PAID_UPGRADE_PLANS,
  type PaidSaasPlanType
} from '../../../lib/saasBilling'
import { ui } from '../../../lib/ui'
import {
  downloadSocietyImportTemplate,
  parseSocietyCsv,
  persistSocietyImport,
  rowsToDemoUnits
} from '../../../api/societyImport'

export default function WorkspaceFlatsPage() {
  const { workingShowcase, currentSocietyId, setShowcaseData } = useShowcaseWorkspace()
  const { uuid } = useResolvedSocietyUuid()
  const societyId = uuid ?? currentSocietyId
  const { subscription, upgradeMock } = useSaasBilling(societyId)
  const [uploadMessage, setUploadMessage] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [blockName, setBlockName] = useState('')
  const [flatNumberInput, setFlatNumberInput] = useState('')
  const [areaSize, setAreaSize] = useState('')
  const [ownerFullName, setOwnerFullName] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [ownerMobile, setOwnerMobile] = useState('')
  const [showLimitModal, setShowLimitModal] = useState(false)
  const [upgradeMessage, setUpgradeMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  if (!workingShowcase) {
    return (
      <div className={ui.card}>
        <p className={ui.eyebrow}>Society setup required</p>
        <h2 className={ui.heading}>No society linked to this account</h2>
      </div>
    )
  }

  const currentUnits = workingShowcase.units ?? []
  const flatLimitReached =
    subscription != null && isFlatLimitReached(subscription, currentUnits.length)
  const limitMessage = subscription ? buildFlatLimitMessage(subscription) : ''
  const nextUpgradePlan = subscription ? getNextUpgradePlan(subscription.plan_type) : 'medium'
  const upgradeOptions: PaidSaasPlanType[] = nextUpgradePlan
    ? PAID_UPGRADE_PLANS.filter(
        (plan) =>
          PAID_UPGRADE_PLANS.indexOf(plan) >= PAID_UPGRADE_PLANS.indexOf(nextUpgradePlan)
      )
    : []

  const handleTemplateUpload = async (file: File) => {
    try {
      const text = await file.text()
      const rows = parseSocietyCsv(text)
      const result = rowsToDemoUnits(rows)

      if (subscription && isFlatLimitReached(subscription, result.importedCount)) {
        setShowLimitModal(true)
        return
      }

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
        `Successfully imported ${result.importedCount} units. Starting bank balance: ₹${result.societyStartingBankBalance.toLocaleString('en-IN')}.`
      )
    } catch (err: unknown) {
      setUploadMessage(err instanceof Error ? err.message : 'CSV import failed.')
    }
  }

  const openFilePicker = () => fileInputRef.current?.click()

  const addUnitToMatrix = () => {
    if (!setShowcaseData || !workingShowcase) return
    if (flatLimitReached) {
      setShowLimitModal(true)
      return
    }
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

  async function handleSandboxUpgrade(plan: MockUpgradePlan) {
    try {
      const updated = await upgradeMock(plan)
      const tier = getPlanTier(plan)
      setUpgradeMessage(
        `Sandbox upgrade applied: ${tier.label} (up to ${updated?.max_flats ?? tier.max_flats} flats at ₹${tier.price_per_flat_inr}/flat/month).`
      )
      setShowLimitModal(false)
    } catch (err) {
      setUpgradeMessage(err instanceof Error ? err.message : 'Sandbox upgrade failed.')
    }
  }

  return (
    <div className={ui.sectionGap}>
      {subscription ? (
        <div className="rounded-xl border border-slate-200 bg-syncra-surface-alt px-4 py-3 text-sm text-slate-700">
          Active plan: <strong>{getPlanTier(subscription.plan_type).label}</strong> —{' '}
          {currentUnits.length} / {getSubscriptionMaxFlats(subscription)} flats used
        </div>
      ) : null}

      {flatLimitReached ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {limitMessage}
        </div>
      ) : null}

      {upgradeMessage ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {upgradeMessage}
        </div>
      ) : null}

      <section className={ui.grid2}>
        <article className={ui.cardFill}>
          <header className={ui.cardHeader}>
            <p className={ui.eyebrow}>Society fleet onboarding</p>
            <h2 className={`mt-1 ${ui.heading}`}>Download template</h2>
          </header>
          <div className={ui.cardBody}>
            <p className={ui.body}>Bulk onboard flats and residents using the standard import template.</p>
            <button type="button" onClick={downloadSocietyImportTemplate} className={`mt-4 ${ui.btnSecondary}`}>
              Download Excel/CSV Template
            </button>
          </div>
        </article>

        <article
          className={`${ui.cardFill} cursor-pointer border-2 transition ${
            dragActive ? 'border-syncra-accent bg-cyan-50/50' : 'border-dashed border-slate-300'
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
            if (file) void handleTemplateUpload(file)
          }}
          onClick={openFilePicker}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.csv"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void handleTemplateUpload(file)
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

      <section className={ui.card}>
        <header className={ui.cardHeader}>
          <p className={ui.eyebrow}>Manual unit registry</p>
          <h2 className={`mt-1 ${ui.heading}`}>Flat owner matrix</h2>
        </header>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                placeholder: '10-digit phone for WhatsApp automation',
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
          <button
            type="button"
            onClick={addUnitToMatrix}
            disabled={flatLimitReached}
            className={ui.btnPrimary}
          >
            Add Single Unit to Matrix
          </button>
        </div>
      </section>

      <ShowcaseUnitsPanel units={currentUnits} />

      <PlanLimitModal
        open={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        message={limitMessage}
        upgradeOptions={upgradeOptions}
        onUpgrade={(plan) => void handleSandboxUpgrade(plan)}
      />
    </div>
  )
}
