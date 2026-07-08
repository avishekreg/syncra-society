import React, { useEffect, useState } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import { useResolvedSocietyUuid } from '../../hooks/useResolvedSocietyUuid'
import { useSaasBilling } from '../../hooks/useSaasBilling'
import WhatsAppUsageWidget from '../../components/billing/WhatsAppUsageWidget'
import { fetchSocietyBillingRules, upsertSocietyBillingRules } from '../../api/societyBillingRules'
import { MAINTENANCE_DUE_DAY_OPTIONS, ordinalDay } from '../../lib/billing'
import { ui } from '../../lib/ui'

type BillingModel = 'flat' | 'perSqFt'

type SplitRequest = {
  id: string
  title: string
  category: string
  amount: string
  dueDate: string
  notes: string
  status: 'pending' | 'approved' | 'fulfilled'
}

type IncentiveTier = {
  id: string
  label: string
  dueWithinDays: string
  rebatePercent: string
  active: boolean
}

type RwaBillingConfig = {
  billingModel: BillingModel
  monthlyMaintenanceFee: string
  perSqFtRate: string
  expectedSqFt: string
  splitRequests: SplitRequest[]
  incentiveTiers: IncentiveTier[]
}

const DEFAULT_BILLING_CONFIG: RwaBillingConfig = {
  billingModel: 'flat',
  monthlyMaintenanceFee: '3500',
  perSqFtRate: '12',
  expectedSqFt: '850',
  splitRequests: [],
  incentiveTiers: [
    { id: 'tier-1', label: 'Early bird rebate', dueWithinDays: '5', rebatePercent: '3', active: true },
    { id: 'tier-2', label: 'Standard prompt pay', dueWithinDays: '10', rebatePercent: '1.5', active: true }
  ]
}

function getStorageKey(societyId: string) {
  return `syncra-billing-engine-${societyId}`
}

const saveBtn = 'inline-flex min-h-11 items-center justify-center rounded-xl bg-syncra-blue px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0047b3]'

export default function RwaBillingEngine() {
  const { currentSocietyId } = useAuth()
  const { uuid } = useResolvedSocietyUuid()
  const societyId = uuid ?? currentSocietyId
  const {
    subscription,
    usage,
    loading: saasLoading,
    upgradeMock,
    activateWhatsAppAddonMock
  } = useSaasBilling(societyId)
  const [billingModel, setBillingModel] = useState<BillingModel>(DEFAULT_BILLING_CONFIG.billingModel)
  const [monthlyMaintenanceFee, setMonthlyMaintenanceFee] = useState(DEFAULT_BILLING_CONFIG.monthlyMaintenanceFee)
  const [perSqFtRate, setPerSqFtRate] = useState(DEFAULT_BILLING_CONFIG.perSqFtRate)
  const [expectedSqFt, setExpectedSqFt] = useState(DEFAULT_BILLING_CONFIG.expectedSqFt)
  const [splitRequests, setSplitRequests] = useState<SplitRequest[]>(DEFAULT_BILLING_CONFIG.splitRequests)
  const [incentiveTiers, setIncentiveTiers] = useState<IncentiveTier[]>(DEFAULT_BILLING_CONFIG.incentiveTiers)
  const [requestTitle, setRequestTitle] = useState('Emergency plumbing repair')
  const [requestCategory, setRequestCategory] = useState('maintenance')
  const [requestAmount, setRequestAmount] = useState('12500')
  const [requestDueDate, setRequestDueDate] = useState('2026-07-25')
  const [requestNotes, setRequestNotes] = useState('Split cost across premium flats for urgent pump replacement.')
  const [status, setStatus] = useState('')
  const [dueDay, setDueDay] = useState(5)
  const [dueDayLoading, setDueDayLoading] = useState(true)

  useEffect(() => {
    if (!currentSocietyId) return
    const stored = localStorage.getItem(getStorageKey(currentSocietyId))
    if (!stored) return

    try {
      const parsed = JSON.parse(stored) as Partial<RwaBillingConfig>
      setBillingModel(parsed.billingModel ?? DEFAULT_BILLING_CONFIG.billingModel)
      setMonthlyMaintenanceFee(parsed.monthlyMaintenanceFee ?? DEFAULT_BILLING_CONFIG.monthlyMaintenanceFee)
      setPerSqFtRate(parsed.perSqFtRate ?? DEFAULT_BILLING_CONFIG.perSqFtRate)
      setExpectedSqFt(parsed.expectedSqFt ?? DEFAULT_BILLING_CONFIG.expectedSqFt)
      setSplitRequests(parsed.splitRequests ?? DEFAULT_BILLING_CONFIG.splitRequests)
      setIncentiveTiers(parsed.incentiveTiers ?? DEFAULT_BILLING_CONFIG.incentiveTiers)
    } catch {
      setStatus('Unable to restore saved billing settings.')
    }
  }, [currentSocietyId])

  useEffect(() => {
    if (!societyId) {
      setDueDayLoading(false)
      return
    }
    let cancelled = false
    void (async () => {
      setDueDayLoading(true)
      try {
        const rules = await fetchSocietyBillingRules(societyId)
        if (!cancelled) setDueDay(rules.maintenance_due_date)
      } catch {
        if (!cancelled) setStatus('Unable to load maintenance due date from Supabase.')
      } finally {
        if (!cancelled) setDueDayLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [societyId])

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!currentSocietyId) {
      setStatus('Select a society before saving billing settings.')
      return
    }

    const payload: RwaBillingConfig = {
      billingModel,
      monthlyMaintenanceFee,
      perSqFtRate,
      expectedSqFt,
      splitRequests,
      incentiveTiers
    }

    localStorage.setItem(getStorageKey(currentSocietyId), JSON.stringify(payload))

    if (societyId) {
      try {
        const existing = await fetchSocietyBillingRules(societyId)
        await upsertSocietyBillingRules(societyId, {
          maintenance_due_date: dueDay,
          late_fee_grace_period_days: existing.late_fee_grace_period_days,
          late_fee_flat_amount: Number(existing.late_fee_flat_amount),
          interest_rate_percentage: Number(existing.interest_rate_percentage)
        })
        setStatus(
          `Maintenance billing saved. Due date set to before the ${ordinalDay(dueDay)} of every month — synced to Supabase for WhatsApp reminders.`
        )
      } catch {
        setStatus('Local billing settings saved, but the maintenance due date could not be synced to Supabase.')
      }
    } else {
      setStatus('RWA billing configuration saved successfully.')
    }
  }

  function createSplitRequest() {
    if (!requestTitle || !requestAmount || !requestDueDate) {
      setStatus('Please enter a title, amount, and due date for the split request.')
      return
    }

    const nextRequest: SplitRequest = {
      id: `split-${Date.now()}`,
      title: requestTitle,
      category: requestCategory,
      amount: requestAmount,
      dueDate: requestDueDate,
      notes: requestNotes,
      status: 'pending'
    }

    setSplitRequests((current) => [nextRequest, ...current])
    setStatus('Cost split request added. Save to persist configuration.')
  }

  function updateIncentiveTier(id: string, update: Partial<IncentiveTier>) {
    setIncentiveTiers((current) => current.map((tier) => (tier.id === id ? { ...tier, ...update } : tier)))
  }

  function toggleSplitRequestStatus(id: string) {
    setSplitRequests((current) =>
      current.map((request) => {
        if (request.id !== id) return request
        const nextStatus = request.status === 'pending' ? 'approved' : request.status === 'approved' ? 'fulfilled' : 'fulfilled'
        return { ...request, status: nextStatus }
      })
    )
  }

  const calculatedMaintenance =
    billingModel === 'perSqFt'
      ? `${(Number(perSqFtRate) * Number(expectedSqFt || '0')).toFixed(0)} INR`
      : `₹${monthlyMaintenanceFee}`

  return (
    <section className={ui.card}>
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={ui.eyebrow}>Billing & incentives</p>
          <h2 className={`mt-3 ${ui.heading}`}>Flexible maintenance billing</h2>
          <p className={`mt-2 ${ui.body}`}>
            Define RWA maintenance fees, split cost requests, and early payment incentives for your society.
          </p>
        </div>
        <div className={ui.badge}>Split charge workflow</div>
      </div>

      <div className="mt-8">
        <WhatsAppUsageWidget
          subscription={subscription}
          usage={usage}
          loading={saasLoading}
          onUpgrade={(plan) => upgradeMock(plan)}
          onActivateAddon={() => activateWhatsAppAddonMock()}
        />
      </div>

      <form onSubmit={(event) => void handleSave(event)} className="mt-8 space-y-8">
        <div className={ui.innerItem}>
          <p className="text-lg font-semibold text-syncra-primary">Maintenance due date</p>
          <p className={`mt-2 ${ui.body}`}>
            Set the monthly deadline for maintenance payments. This syncs to Supabase and powers n8n and Groq AI resident
            reminders before the selected day.
          </p>
          <label className="mt-5 block max-w-xl space-y-2">
            <span className={ui.label}>Monthly due date</span>
            <select
              className={ui.input}
              value={dueDay}
              disabled={dueDayLoading}
              onChange={(event) => setDueDay(Number(event.target.value))}
            >
              {MAINTENANCE_DUE_DAY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500">
              {dueDayLoading
                ? 'Loading saved due date…'
                : `Residents must pay maintenance before the ${ordinalDay(dueDay)} of each month.`}
            </p>
          </label>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className={ui.innerItem}>
            <p className="text-lg font-semibold text-syncra-primary">Billing model</p>
            <div className="mt-5 space-y-4">
              <label className={`flex items-center gap-3 ${ui.innerItem}`}>
                <input
                  type="radio"
                  name="billingModel"
                  value="flat"
                  checked={billingModel === 'flat'}
                  onChange={() => setBillingModel('flat')}
                  className="h-4 w-4 accent-syncra-accent"
                />
                <div>
                  <p className="font-semibold text-syncra-primary">Flat monthly maintenance</p>
                  <p className={ui.body}>One fixed amount for every unit regardless of actual area.</p>
                </div>
              </label>
              <label className={`flex items-center gap-3 ${ui.innerItem}`}>
                <input
                  type="radio"
                  name="billingModel"
                  value="perSqFt"
                  checked={billingModel === 'perSqFt'}
                  onChange={() => setBillingModel('perSqFt')}
                  className="h-4 w-4 accent-syncra-accent"
                />
                <div>
                  <p className="font-semibold text-syncra-primary">Per sq. ft. rate</p>
                  <p className={ui.body}>Dynamic billing by area for premium and variable-size units.</p>
                </div>
              </label>
            </div>

            <div className="mt-6 space-y-4">
              {billingModel === 'flat' ? (
                <label className="space-y-2">
                  <span className={ui.label}>Monthly maintenance fee</span>
                  <div className={`flex items-center gap-2 ${ui.input}`}>
                    <span className="text-slate-500">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={monthlyMaintenanceFee}
                      onChange={(event) => setMonthlyMaintenanceFee(event.target.value)}
                      className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
                      placeholder="Flat monthly amount"
                    />
                  </div>
                </label>
              ) : (
                <>
                  <label className="space-y-2">
                    <span className={ui.label}>Rate per sq. ft.</span>
                    <div className={`flex items-center gap-2 ${ui.input}`}>
                      <input
                        type="number"
                        min="0"
                        value={perSqFtRate}
                        onChange={(event) => setPerSqFtRate(event.target.value)}
                        className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
                        placeholder="Rate per sq. ft."
                      />
                      <span className="text-slate-500">₹/sq.ft</span>
                    </div>
                  </label>
                  <label className="space-y-2">
                    <span className={ui.label}>Typical unit area</span>
                    <input
                      type="number"
                      min="0"
                      value={expectedSqFt}
                      onChange={(event) => setExpectedSqFt(event.target.value)}
                      className={ui.input}
                      placeholder="Area in sq. ft."
                    />
                  </label>
                </>
              )}
            </div>

            <div className={`mt-6 ${ui.innerItem} text-sm`}>
              <p className="font-semibold text-syncra-primary">Projected collection</p>
              <p className="text-slate-600">{calculatedMaintenance}</p>
            </div>
          </div>

          <div className={ui.innerItem}>
            <p className="text-lg font-semibold text-syncra-primary">Early payment incentives</p>
            <p className={`mt-2 ${ui.body}`}>Configure discounts that reward prompt contributions and help reduce overdue risk.</p>

            <div className="mt-5 space-y-4">
              {incentiveTiers.map((tier) => (
                <div key={tier.id} className={ui.innerItem}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-semibold text-syncra-primary">{tier.label}</p>
                    <label className={`inline-flex items-center gap-2 text-sm ${ui.body}`}>
                      <input
                        type="checkbox"
                        checked={tier.active}
                        onChange={(event) => updateIncentiveTier(tier.id, { active: event.target.checked })}
                        className="h-4 w-4 accent-syncra-accent"
                      />
                      Active
                    </label>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-xs uppercase tracking-[0.25em] text-slate-500">Due window</span>
                      <input
                        type="number"
                        min="0"
                        value={tier.dueWithinDays}
                        onChange={(event) => updateIncentiveTier(tier.id, { dueWithinDays: event.target.value })}
                        className={ui.input}
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs uppercase tracking-[0.25em] text-slate-500">Rebate percent</span>
                      <div className={`flex items-center gap-2 ${ui.input}`}>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={tier.rebatePercent}
                          onChange={(event) => updateIncentiveTier(tier.id, { rebatePercent: event.target.value })}
                          className="w-full bg-transparent text-slate-900 outline-none"
                        />
                        <span className="text-slate-500">%</span>
                      </div>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={ui.innerItem}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-lg font-semibold text-syncra-primary">Create split cost request</p>
              <p className={`mt-2 ${ui.body}`}>Raise one-off or ad-hoc maintenance cost requests for shared approval.</p>
            </div>
            <button type="button" onClick={createSplitRequest} className={ui.btnSecondary}>
              Add request
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="space-y-2">
              <span className={ui.label}>Request title</span>
              <input value={requestTitle} onChange={(event) => setRequestTitle(event.target.value)} className={ui.input} placeholder="Title for split cost" />
            </label>
            <label className="space-y-2">
              <span className={ui.label}>Category</span>
              <select value={requestCategory} onChange={(event) => setRequestCategory(event.target.value)} className={ui.input}>
                <option value="maintenance">Maintenance</option>
                <option value="utility">Utility</option>
                <option value="security">Security</option>
                <option value="compliance">Compliance</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className={ui.label}>Amount</span>
              <input type="number" min="0" value={requestAmount} onChange={(event) => setRequestAmount(event.target.value)} className={ui.input} placeholder="One-off amount" />
            </label>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <label className="space-y-2">
              <span className={ui.label}>Due date</span>
              <input type="date" value={requestDueDate} onChange={(event) => setRequestDueDate(event.target.value)} className={ui.input} />
            </label>
            <label className="space-y-2">
              <span className={ui.label}>Notes</span>
              <input value={requestNotes} onChange={(event) => setRequestNotes(event.target.value)} className={ui.input} placeholder="Optional description" />
            </label>
          </div>

          <div className={`mt-6 ${ui.innerItem} text-sm`}>
            <p className="font-semibold text-syncra-primary">Open requests</p>
            {splitRequests.length === 0 ? (
              <p className={`mt-3 ${ui.body}`}>No split requests created yet.</p>
            ) : (
              <div className="space-y-3">
                {splitRequests.map((request) => (
                  <div key={request.id} className={ui.innerItem}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-syncra-primary">{request.title}</p>
                        <p className={ui.body}>{request.category} • Due {request.dueDate}</p>
                      </div>
                      <span className={ui.badge}>{request.status}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
                      <p>₹{request.amount}</p>
                      <button type="button" onClick={() => toggleSplitRequestStatus(request.id)} className={ui.btnSecondary}>
                        Advance status
                      </button>
                    </div>
                    <p className={`mt-3 ${ui.body}`}>{request.notes}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <button type="submit" className={saveBtn}>
            Save Billing Configuration
          </button>
          {status && <p className={ui.body}>{status}</p>}
        </div>
      </form>
    </section>
  )
}
