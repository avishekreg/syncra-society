import React, { useEffect, useState } from 'react'
import { ui } from '../../lib/ui'

const saveBtn = 'rounded-xl bg-syncra-blue px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0047b3]'

export default function SuperAdminPayments() {
  const [keyId, setKeyId] = useState('')
  const [keySecret, setKeySecret] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('syncra-razorpay-keys')
    if (!saved) return
    try {
      const parsed = JSON.parse(saved)
      setKeyId(parsed.keyId ?? '')
      setKeySecret(parsed.keySecret ?? '')
    } catch {
      // ignore malformed storage
    }
  }, [])

  function handleSaveKeys(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    localStorage.setItem('syncra-razorpay-keys', JSON.stringify({ keyId, keySecret }))
    setStatus('Global payment settlement keys saved locally.')
  }

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-6">
        <p className={ui.eyebrow}>Global Payment Settlement Engine</p>
        <h1 className={`mt-2 ${ui.headingLg}`}>Razorpay API Keys</h1>
        <p className={`mt-2 ${ui.body}`}>
          Configure the parent Razorpay gateway credentials used by Syncra managed payment routing.
        </p>
      </header>

      <div className={ui.card}>
        <form onSubmit={handleSaveKeys} className="space-y-4">
          <label className="block">
            <span className={`mb-2 block ${ui.label}`}>Key ID</span>
            <input
              value={keyId}
              onChange={(event) => setKeyId(event.target.value)}
              className={ui.input}
              placeholder="rzp_test_..."
            />
          </label>
          <label className="block">
            <span className={`mb-2 block ${ui.label}`}>Key Secret</span>
            <input
              value={keySecret}
              onChange={(event) => setKeySecret(event.target.value)}
              className={ui.input}
              placeholder="Your Razorpay secret"
            />
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
