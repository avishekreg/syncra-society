import React, { useEffect, useState } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import { ui } from '../../lib/ui'

const initialDirectSettlement = {
  bankName: '',
  accountNumber: '',
  ifscCode: '',
  upiId: '',
  qrCodeUrl: ''
}

const saveBtn = 'rounded-xl bg-syncra-blue px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0047b3]'

export default function PaymentSettlement() {
  const { currentSocietyId } = useAuth()
  const [directSettlement, setDirectSettlement] = useState(initialDirectSettlement)
  const [useSyncraRail, setUseSyncraRail] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!currentSocietyId) return
    const stored = localStorage.getItem(`syncra-payment-settlement-${currentSocietyId}`)
    if (!stored) return
    try {
      const parsed = JSON.parse(stored)
      setDirectSettlement(parsed.directSettlement ?? initialDirectSettlement)
      setUseSyncraRail(parsed.useSyncraRail ?? false)
    } catch {
      // ignore invalid storage
    }
  }, [currentSocietyId])

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!currentSocietyId) {
      setMessage('Select a society before saving payment settlement settings.')
      return
    }

    localStorage.setItem(
      `syncra-payment-settlement-${currentSocietyId}`,
      JSON.stringify({ directSettlement, useSyncraRail })
    )
    setMessage('Payment settlement settings saved successfully.')
  }

  async function handleQrUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setDirectSettlement((current) => ({ ...current, qrCodeUrl: reader.result as string }))
    }
    reader.readAsDataURL(file)
  }

  return (
    <section className={ui.card}>
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={ui.eyebrow}>Financial Settlements</p>
          <h2 className={`mt-3 ${ui.headingLg}`}>Payment collection infrastructure</h2>
          <p className={`mt-2 ${ui.body}`}>
            Choose between direct member settlement or Syncra’s Razorpay-managed payment rail.
          </p>
        </div>
        <div className={ui.badge}>Dual-route payment engine</div>
      </div>

      <form onSubmit={handleSave} className="mt-8 space-y-6">
        <div className={ui.innerItem}>
          <p className="text-lg font-semibold text-syncra-primary">Route 1: Direct Member Settlement</p>
          <p className={`mt-2 ${ui.body}`}>Self-managed bank/UPI details for society-level settlements.</p>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {[
              { label: 'Society Bank Name', key: 'bankName' as const, placeholder: 'Example Bank' },
              { label: 'Account Number', key: 'accountNumber' as const, placeholder: '000012345678' },
              { label: 'IFSC Code', key: 'ifscCode' as const, placeholder: 'ABCD0123456' },
              { label: 'UPI ID', key: 'upiId' as const, placeholder: 'society@bank' }
            ].map((field) => (
              <label key={field.key} className="space-y-2">
                <span className={ui.label}>{field.label}</span>
                <input
                  value={directSettlement[field.key]}
                  onChange={(event) => setDirectSettlement((current) => ({ ...current, [field.key]: event.target.value }))}
                  className={ui.input}
                  placeholder={field.placeholder}
                />
              </label>
            ))}
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <label className="space-y-2">
              <span className={ui.label}>Society QR Code</span>
              <input type="file" accept="image/*" onChange={handleQrUpload} className={ui.input} />
            </label>

            {directSettlement.qrCodeUrl && (
              <div className={ui.innerItem}>
                <p className="text-sm font-semibold text-syncra-primary">Preview QR Code</p>
                <img src={directSettlement.qrCodeUrl} alt="QR Code preview" className="mt-3 h-36 w-36 rounded-2xl object-contain" />
              </div>
            )}
          </div>
        </div>

        <div className={ui.innerItem}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-lg font-semibold text-syncra-primary">Route 2: Syncra Managed Processing</p>
              <p className={`mt-2 ${ui.body}`}>
                Activate the Syncra payment rail and route transactions through the Razorpay pipeline.
              </p>
            </div>
            <label className={`inline-flex items-center gap-3 ${ui.innerItem}`}>
              <input
                type="checkbox"
                checked={useSyncraRail}
                onChange={(event) => setUseSyncraRail(event.target.checked)}
                className="h-5 w-5 rounded border-slate-300 text-syncra-accent focus:ring-syncra-accent"
              />
              <span className={ui.label}>Activate Syncra Payment Rail</span>
            </label>
          </div>
          <p className={`mt-4 ${ui.body}`}>
            When enabled, transactions are flagged for our core gateway pipeline and subject to processing costs.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button type="submit" className={saveBtn}>
            Save Settlement Settings
          </button>
          {message && <p className={ui.body}>{message}</p>}
        </div>
      </form>
    </section>
  )
}
