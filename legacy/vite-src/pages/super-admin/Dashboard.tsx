import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ui } from '../../lib/ui'

const dashboardCards = [
  {
    title: 'Societies Manager',
    description: 'View, approve, and onboard registered societies across the platform.',
    to: '/super-admin/societies',
    button: 'Manage Societies'
  },
  {
    title: 'Pricing Engine',
    description: 'Configure pricing tiers, slabs, and subscription pricing rules.',
    to: '/super-admin/pricing',
    button: 'Edit Pricing'
  },
  {
    title: 'Global Subscriptions',
    description: 'Monitor active subscriptions, renewal status, and SaaS platform revenue.',
    to: '/super-admin/subscriptions',
    button: 'Review Subscriptions'
  }
]

const saveBtn = 'w-full rounded-xl bg-syncra-blue py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0047b3]'

export default function SuperAdminDashboard() {
  const [keyId, setKeyId] = useState('')
  const [keySecret, setKeySecret] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('syncra-razorpay-keys')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setKeyId(parsed.keyId ?? '')
        setKeySecret(parsed.keySecret ?? '')
      } catch {
        // ignore malformed storage
      }
    }
  }, [])

  function handleSaveKeys(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    localStorage.setItem('syncra-razorpay-keys', JSON.stringify({ keyId, keySecret }))
    setStatus('Global payment settlement keys saved locally.')
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3 xl:grid-cols-4">
        {dashboardCards.map((card) => (
          <div key={card.title} className={`flex flex-col justify-between transition hover:-translate-y-0.5 ${ui.card}`}>
            <div>
              <p className={ui.eyebrow}>Super Admin</p>
              <h3 className={`mt-4 ${ui.heading}`}>{card.title}</h3>
              <p className={`mt-3 ${ui.body}`}>{card.description}</p>
            </div>
            <Link to={card.to} className={`mt-6 inline-flex w-full items-center justify-center ${saveBtn}`}>
              {card.button}
            </Link>
          </div>
        ))}

        <div className={ui.card}>
          <div>
            <p className={ui.eyebrow}>Global Payment Settlement Engine</p>
            <h3 className={`mt-4 ${ui.heading}`}>Razorpay API Keys</h3>
            <p className={`mt-3 ${ui.body}`}>
              Configure the parent Razorpay gateway credentials used by Syncra managed payment routing.
            </p>
          </div>

          <form onSubmit={handleSaveKeys} className="mt-6 space-y-4">
            <label className="block">
              <span className={`mb-2 block ${ui.label}`}>Key ID</span>
              <input value={keyId} onChange={(event) => setKeyId(event.target.value)} className={ui.input} placeholder="rzp_test_..." />
            </label>
            <label className="block">
              <span className={`mb-2 block ${ui.label}`}>Key Secret</span>
              <input value={keySecret} onChange={(event) => setKeySecret(event.target.value)} className={ui.input} placeholder="Your Razorpay secret" />
            </label>
            <button type="submit" className={saveBtn}>
              Save Payment Engine Config
            </button>
            {status && <p className={ui.body}>{status}</p>}
          </form>
        </div>
      </div>
  )
}
