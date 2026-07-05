import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../providers/AuthProvider'
import { useRazorpayCheckout } from '../../hooks/useRazorpay'
import {
  createRecurringSubscription,
  fetchBillingStatusWithFallback,
  verifySubscriptionAuthorization,
  writeLocalBillingStatus
} from '../../api/payments'
import { calculateMonthlyDues } from '../../lib/pricing'
import { ui } from '../../lib/ui'

export default function FlatConfigurationPage() {
  const { user, currentSocietyId, setShowcaseData, showcaseData } = useAuth()
  const navigate = useNavigate()
  const { ready, error: scriptError, openCheckout } = useRazorpayCheckout()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [totalFlats, setTotalFlats] = useState('')
  const [monthlyRatePerFlat, setMonthlyRatePerFlat] = useState(75)
  const [societyName, setSocietyName] = useState('Your Society')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  const dues = useMemo(() => {
    const flats = Number(totalFlats) || 0
    return calculateMonthlyDues(flats, monthlyRatePerFlat)
  }, [totalFlats, monthlyRatePerFlat])

  useEffect(() => {
    if (!currentSocietyId) {
      navigate('/onboarding', { replace: true })
      return
    }

    void (async () => {
      try {
        const status = await fetchBillingStatusWithFallback(currentSocietyId)
        setSocietyName(status.societyName)
        setMonthlyRatePerFlat(status.monthlyRatePerFlat)

        if (status.activationStatus === 'pending') {
          navigate('/onboarding/activation', { replace: true })
          return
        }
        if (status.activationStatus === 'active_subscription') {
          navigate('/admin/dashboard', { replace: true })
          return
        }

        if (status.totalFlats) {
          setTotalFlats(String(status.totalFlats))
        }
      } catch (err: any) {
        setError(err.message ?? 'Unable to load billing configuration')
      } finally {
        setLoading(false)
      }
    })()
  }, [currentSocietyId, navigate])

  async function handleSubscribe() {
    if (!currentSocietyId || !totalFlats || Number(totalFlats) < 1) {
      setError('Enter a valid total flat count (minimum 1).')
      return
    }

    setSubmitting(true)
    setError(null)
    setMessage('')

    try {
      const result = await createRecurringSubscription({
        societyId: currentSocietyId,
        totalFlats: Number(totalFlats),
        customerEmail: user?.email,
        customerName: user?.email?.split('@')[0]
      })

      if (result.demoMode || result.alreadyActive) {
        writeLocalBillingStatus(currentSocietyId, {
          activationStatus: result.activationStatus ?? 'active_subscription',
          totalFlats: Number(totalFlats),
          monthlyRatePerFlat,
          monthlyTotalInr: dues.monthlyTotalInr,
          societyName
        })
        setShowcaseData?.({
          ...(showcaseData ?? {
            society: { id: currentSocietyId, name: societyName, subscription: 'trial', totalFlats: 0 },
            units: [],
            defaulters: [],
            ledgerEntries: []
          }),
          society: {
            ...(showcaseData?.society ?? {
              id: currentSocietyId,
              name: societyName,
              subscription: 'trial',
              totalFlats: 0
            }),
            totalFlats: Number(totalFlats)
          }
        })
        setMessage(result.message ?? 'Subscription active. Redirecting to RWA Dashboard…')
        navigate('/admin/dashboard', { replace: true })
        return
      }

      if (!result.subscriptionId || !result.keyId) {
        throw new Error('Payment server did not return a valid Razorpay subscription')
      }

      await openCheckout({
        key: result.keyId,
        subscription_id: result.subscriptionId,
        name: 'Syncra Society Subscription',
        description: `Monthly recurring billing for ${totalFlats} flats`,
        prefill: {
          email: user?.email ?? '',
          name: user?.email?.split('@')[0] ?? 'Society Admin'
        },
        theme: { color: '#0052CC' },
        handler: async (response: {
          razorpay_subscription_id?: string
          razorpay_payment_id?: string
          razorpay_signature?: string
        }) => {
          try {
            const verified = await verifySubscriptionAuthorization({
              societyId: currentSocietyId,
              razorpay_subscription_id: response.razorpay_subscription_id ?? result.subscriptionId!,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })
            writeLocalBillingStatus(currentSocietyId, {
              activationStatus: verified.activationStatus,
              totalFlats: Number(totalFlats),
              monthlyRatePerFlat,
              monthlyTotalInr: dues.monthlyTotalInr,
              activeUntil: verified.activeUntil,
              societyName
            })
            setShowcaseData?.({
              ...(showcaseData ?? {
                society: { id: currentSocietyId, name: societyName },
                units: [],
                defaulters: [],
                ledgerEntries: []
              }),
              society: {
                ...(showcaseData?.society ?? { id: currentSocietyId, name: societyName }),
                totalFlats: Number(totalFlats),
                subscription: 'Active'
              }
            })
            navigate('/admin/dashboard', { replace: true })
          } catch (verifyErr: any) {
            setError(verifyErr.message ?? 'Subscription authorization failed')
          } finally {
            setSubmitting(false)
          }
        },
        modal: {
          ondismiss: () => setSubmitting(false)
        }
      })
    } catch (err: any) {
      setError(err.message ?? 'Unable to start subscription checkout')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className={`${ui.page} flex min-h-screen items-center justify-center`}>
        <p className={ui.loading}>Loading flat configuration…</p>
      </div>
    )
  }

  return (
    <div className={`${ui.page} flex min-h-screen items-center justify-center px-4 py-12`}>
      <div className="w-full max-w-lg">
        <div className={ui.card}>
          <header className={ui.cardHeader}>
            <p className={ui.eyebrow}>Phase 2 · Recurring subscription</p>
            <h1 className={`mt-1 ${ui.headingLg}`}>Flat Configuration</h1>
            <p className={`mt-2 ${ui.body}`}>
              Enter the total flats for <strong>{societyName}</strong>. Syncra calculates your tier-based
              monthly dues and sets up Razorpay recurring billing.
            </p>
          </header>

          <label className="block space-y-1.5">
            <span className={ui.label}>Total Number of Flats</span>
            <input
              type="number"
              min={1}
              value={totalFlats}
              onChange={(e) => setTotalFlats(e.target.value)}
              className={ui.input}
              placeholder="e.g. 120"
            />
          </label>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-syncra-surface-alt px-5 py-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between text-sm">
              <span className="text-slate-600">Per-flat monthly rate</span>
              <span className="font-semibold text-syncra-primary">₹{monthlyRatePerFlat}/flat</span>
            </div>
            <div className="mt-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm text-slate-600">Total monthly recurring dues</span>
              <span className="text-xl font-semibold text-syncra-blue sm:text-2xl">
                ₹{dues.monthlyTotalInr.toLocaleString('en-IN')}
              </span>
            </div>
            <p className={`mt-3 text-xs ${ui.body}`}>
              {dues.totalFlats} flats × ₹{dues.monthlyRatePerFlat} = ₹{dues.monthlyTotalInr.toLocaleString('en-IN')} / month
            </p>
          </div>

          <button
            type="button"
            disabled={submitting || !ready || !totalFlats}
            onClick={() => void handleSubscribe()}
            className={`mt-6 w-full ${ui.btnPrimary} disabled:opacity-70`}
          >
            {submitting ? 'Authorizing recurring mandate…' : 'Authorize Monthly Subscription'}
          </button>

          {!ready && !scriptError && (
            <p className={`mt-3 text-sm ${ui.body}`}>Loading Razorpay subscription checkout…</p>
          )}
          {scriptError && <p className="mt-3 text-sm text-syncra-action-alt">{scriptError}</p>}
          {error && <p className="mt-3 text-sm text-syncra-action-alt">{error}</p>}
          {message && <p className="mt-3 text-sm text-emerald-600">{message}</p>}
        </div>
      </div>
    </div>
  )
}
