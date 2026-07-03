import { useEffect, useState } from 'react'

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void
      on: (event: string, handler: (response: unknown) => void) => void
    }
  }
}

const CHECKOUT_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js'

let scriptPromise: Promise<void> | null = null

function loadRazorpayScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve()
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${CHECKOUT_SCRIPT}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Failed to load Razorpay checkout')))
      return
    }

    const script = document.createElement('script')
    script.src = CHECKOUT_SCRIPT
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Razorpay checkout'))
    document.body.appendChild(script)
  })

  return scriptPromise
}

export function useRazorpayCheckout() {
  const [ready, setReady] = useState(Boolean(window.Razorpay))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadRazorpayScript()
      .then(() => setReady(true))
      .catch((err: Error) => setError(err.message))
  }, [])

  async function openCheckout(options: Record<string, unknown>) {
    await loadRazorpayScript()
    if (!window.Razorpay) {
      throw new Error('Razorpay checkout is unavailable')
    }
    const instance = new window.Razorpay(options)
    instance.open()
    return instance
  }

  return { ready, error, openCheckout }
}
