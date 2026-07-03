import React, { useEffect, useState } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import { ui } from '../../lib/ui'

type InterestType = 'simple' | 'compound'

type LateFeeConfig = {
  enabled: boolean
  fixedAmount: string
  interestRate: string
  interestType: InterestType
  gracePeriod: string
  updatedAt: string
}

const DEFAULT_CONFIG: LateFeeConfig = {
  enabled: true,
  fixedAmount: '500',
  interestRate: '2',
  interestType: 'simple',
  gracePeriod: '3',
  updatedAt: ''
}

function getStorageKey(societyId: string) {
  return `syncra-late-fee-config-${societyId}`
}

const saveBtn = 'rounded-xl bg-syncra-blue py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0047b3]'

export default function LateFeeSettings() {
  const { currentSocietyId } = useAuth()
  const [enabled, setEnabled] = useState(DEFAULT_CONFIG.enabled)
  const [fixedAmount, setFixedAmount] = useState(DEFAULT_CONFIG.fixedAmount)
  const [interestRate, setInterestRate] = useState(DEFAULT_CONFIG.interestRate)
  const [interestType, setInterestType] = useState<InterestType>(DEFAULT_CONFIG.interestType)
  const [gracePeriod, setGracePeriod] = useState(DEFAULT_CONFIG.gracePeriod)
  const [status, setStatus] = useState('')

  useEffect(() => {
    if (!currentSocietyId) return
    const stored = localStorage.getItem(getStorageKey(currentSocietyId))
    if (!stored) return

    try {
      const parsed = JSON.parse(stored) as LateFeeConfig
      setEnabled(parsed.enabled ?? DEFAULT_CONFIG.enabled)
      setFixedAmount(parsed.fixedAmount ?? DEFAULT_CONFIG.fixedAmount)
      setInterestRate(parsed.interestRate ?? DEFAULT_CONFIG.interestRate)
      setInterestType(parsed.interestType ?? DEFAULT_CONFIG.interestType)
      setGracePeriod(parsed.gracePeriod ?? DEFAULT_CONFIG.gracePeriod)
    } catch {
      setStatus('Unable to load saved configuration.')
    }
  }, [currentSocietyId])

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!currentSocietyId) {
      setStatus('Select a society before saving configuration.')
      return
    }

    const payload: LateFeeConfig = {
      enabled,
      fixedAmount,
      interestRate,
      interestType,
      gracePeriod,
      updatedAt: new Date().toISOString()
    }

    localStorage.setItem(getStorageKey(currentSocietyId), JSON.stringify(payload))
    setStatus('Late fee settings saved for current society.')
  }

  return (
    <section className={ui.card}>
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={ui.eyebrow}>Fee configuration</p>
          <h2 className={`mt-3 ${ui.heading}`}>Late fee & grace period</h2>
          <p className={`mt-2 ${ui.body}`}>Enable penalty rules and configure fixed charges, interest, and post-due grace windows.</p>
        </div>
        <div className={ui.badge}>Premium penalty engine</div>
      </div>

      <form onSubmit={handleSave} className="mt-8 space-y-6">
        <div className={`flex items-center justify-between gap-4 ${ui.innerItem}`}>
          <div>
            <p className="text-sm font-semibold text-syncra-primary">Enable Late Fee Penalties</p>
            <p className={ui.body}>Turn on the combined late fee and interest rules for overdue amounts.</p>
          </div>
          <label className={`inline-flex items-center gap-3 ${ui.innerItem}`}>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(event) => setEnabled(event.target.checked)}
              className="h-5 w-5 rounded border-slate-300 text-syncra-accent focus:ring-syncra-accent"
            />
            <span className={ui.label}>{enabled ? 'Enabled' : 'Disabled'}</span>
          </label>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <label className="space-y-2">
            <span className={ui.label}>Fixed Penalty Amount</span>
            <div className={`flex items-center gap-2 ${ui.input}`}>
              <span className="text-slate-500">₹</span>
              <input
                type="number"
                min="0"
                value={fixedAmount}
                onChange={(event) => setFixedAmount(event.target.value)}
                disabled={!enabled}
                className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400 disabled:opacity-50"
                placeholder="Amount per late invoice"
              />
            </div>
          </label>

          <label className="space-y-2">
            <span className={ui.label}>Interest Rate</span>
            <div className={`flex items-center gap-2 ${ui.input}`}>
              <input
                type="number"
                min="0"
                max="100"
                value={interestRate}
                onChange={(event) => setInterestRate(event.target.value)}
                disabled={!enabled}
                className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400 disabled:opacity-50"
                placeholder="Rate per period"
              />
              <span className="text-slate-500">%</span>
            </div>
          </label>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <label className="space-y-2">
            <span className={ui.label}>Interest calculation mode</span>
            <select
              value={interestType}
              onChange={(event) => setInterestType(event.target.value as InterestType)}
              disabled={!enabled}
              className={`${ui.input} disabled:opacity-50`}
            >
              <option value="simple">Simple Interest</option>
              <option value="compound">Compound Interest</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className={ui.label}>Grace period (days)</span>
            <input
              type="number"
              min="0"
              value={gracePeriod}
              onChange={(event) => setGracePeriod(event.target.value)}
              disabled={!enabled}
              className={`${ui.input} disabled:opacity-50`}
            />
          </label>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <button type="submit" className={saveBtn}>
            Save Settings
          </button>
          <div className={`${ui.innerItem} text-sm`}>
            <p className="font-semibold text-syncra-primary">Penalty rule summary</p>
            <p className={ui.body}>
              {enabled
                ? `₹${fixedAmount} + ${interestType === 'compound' ? 'compound' : 'simple'} ${interestRate}% after ${gracePeriod} day(s).`
                : 'Late fee penalties are currently disabled.'}
            </p>
          </div>
        </div>

        {status ? <p className={ui.body}>{status}</p> : null}
      </form>
    </section>
  )
}
