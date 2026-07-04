import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../providers/AuthProvider'
import { useRazorpayCheckout } from '../../hooks/useRazorpay'
import {
  createActivationOrder,
  fetchBillingStatusWithFallback,
  verifyActivationPayment,
  writeLocalBillingStatus
} from '../../api/payments'
import { ui } from '../../lib/ui'

export default function ActivationPage() {
  const { user, currentSocietyId } = useAuth()
  const navigate = useNavigate()
  const { ready, error: scriptError, openCheckout } = useRazorpayCheckout()
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [activationFeeInr, setActivationFeeInr] = useState(999)
  const [societyName, setSocietyName] = useState('Your Society')
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!currentSocietyId) {
      navigate('/onboarding', { replace: true })
      return
    }

    void (async () => {
      try {
        const status = await fetchBillingStatusWithFallback(currentSocietyId)
        setActivationFeeInr(status.activationFeeInr)
        setSocietyName(status.societyName)

        if (status.activationStatus === 'activation_paid') {
          navigate('/onboarding/flats', { replace: true })
          return
        }
        if (status.activationStatus === 'active_subscription') {
          navigate('/admin/dashboard', { replace: true })
        }
      } catch (err: any) {
        setError(err.message ?? 'Unable to load activation status')
      } finally {
        setLoading(false)
      }
    })()
  }, [currentSocietyId, navigate])

  async function handlePayActivation() {
    if (!currentSocietyId) return
    setPaying(true)
    setError(null)
    setMessage('')

    try {
      const order = await createActivationOrder(currentSocietyId)

      if (order.demoMode || order.alreadyPaid) {
        writeLocalBillingStatus(currentSocietyId, {
          activationStatus: order.activationStatus ?? 'activation_paid',
          societyName
        })
        setMessage(order.message ?? 'Activation complete. Proceeding to flat configuration…')
        navigate('/onboarding/flats', { replace: true })
        return
      }

      if (!order.orderId || !order.keyId) {
        throw new Error('Payment server did not return a valid Razorpay order')
      }

      await openCheckout({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency ?? 'INR',
        name: 'Syncra Platform Activation',
        description: `One-time activation for ${societyName}`,
        order_id: order.orderId,
        prefill: {
          email: user?.email ?? '',
          name: user?.email?.split('@')[0] ?? 'Society Admin'
        },
        theme: { color: '#0052CC' },
        handler: async (response: {
          razorpay_order_id: string
          razorpay_payment_id: string
          razorpay_signature: string
        }) => {
          try {
            const verified = await verifyActivationPayment({
              societyId: currentSocietyId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })
            writeLocalBillingStatus(currentSocietyId, {
              activationStatus: verified.activationStatus,
              societyName
            })
            navigate('/onboarding/flats', { replace: true })
          } catch (verifyErr: any) {
            setError(verifyErr.message ?? 'Payment verification failed')
          } finally {
            setPaying(false)
          }
        },
        modal: {
          ondismiss: () => setPaying(false)
        }
      })
    } catch (err: any) {
      setError(err.message ?? 'Unable to start activation payment')
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div className={`${ui.page} flex min-h-screen items-center justify-center`}>
        <p className={ui.loading}>Preparing Syncra Platform Activation…</p>
      </div>
    )
  }

  return (
    <div className={`${ui.page} flex min-h-screen items-center justify-center px-4 py-12`}>
      <div className="w-full max-w-lg">
        <div className={ui.card}>
          <header className={ui.cardHeader}>
            <p className={ui.eyebrow}>Phase 1 · Platform activation</p>
            <h1 className={`mt-1 ${ui.headingLg}`}>Syncra Platform Activation</h1>
            <p className={`mt-2 ${ui.body}`}>
              Complete the one-time activation fee for <strong>{societyName}</strong> to unlock flat
              configuration and recurring billing setup.
            </p>
          </header>

          <div className="rounded-2xl border border-syncra-accent/30 bg-cyan-50 px-5 py-4">
            <p className="text-sm font-semibold text-syncra-blue">Activation fee (one-time)</p>
            <p className="mt-2 text-2xl font-semibold text-syncra-primary sm:text-3xl">
              ₹{activationFeeInr.toLocaleString('en-IN')}
            </p>
            <p className={`mt-2 text-sm ${ui.body}`}>
              Secure checkout powered by Razorpay. This fee is independent of your monthly per-flat subscription.
            </p>
          </div>

          <button
            type="button"
            disabled={paying || !ready}
            onClick={() => void handlePayActivation()}
            className={`mt-6 w-full ${ui.btnPrimary} disabled:opacity-70`}
          >
            {paying ? 'Opening Razorpay Checkout…' : 'Pay Activation Fee & Continue'}
          </button>

          {!ready && !scriptError && (
            <p className={`mt-3 text-sm ${ui.body}`}>Loading Razorpay checkout…</p>
          )}
          {scriptError && <p className="mt-3 text-sm text-syncra-action-alt">{scriptError}</p>}
          {error && <p className="mt-3 text-sm text-syncra-action-alt">{error}</p>}
          {message && <p className="mt-3 text-sm text-emerald-600">{message}</p>}
        </div>
      </div>
    </div>
  )
}
