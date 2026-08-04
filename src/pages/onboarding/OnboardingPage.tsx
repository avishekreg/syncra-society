import React, { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../providers/AuthProvider'
import { createSociety } from '../../api/societies'
import { writeLocalBillingStatus } from '../../api/payments'
import { activateSocietyAddons } from '../../api/featureToggles'
import { initializeFoundingPresident } from '../../lib/governanceRoles'
import {
  LANDING_ADDONS,
  clearLandingCheckoutIntent,
  readLandingCheckoutIntent
} from '../../lib/landingAddons'
import { ui } from '../../lib/ui'

export default function OnboardingPage() {
  const { user, setCurrentSocietyId, setUser, setShowcaseData } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [societyName, setSocietyName] = useState('')
  const [address, setAddress] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkoutIntent = useMemo(() => {
    const stored = readLandingCheckoutIntent()
    if (stored) return stored
    const addonsParam = searchParams.get('addons')
    if (!addonsParam) return null
    return {
      flats: Number(searchParams.get('flats') || 48),
      billing: (searchParams.get('billing') === 'annual' ? 'annual' : 'monthly') as 'monthly' | 'annual',
      tierId: searchParams.get('tier') || 'tier1',
      addons: addonsParam.split(',').filter(Boolean) as Array<(typeof LANDING_ADDONS)[number]['id']>,
      createdAt: new Date().toISOString()
    }
  }, [searchParams])

  const selectedAddonLabels = useMemo(() => {
    if (!checkoutIntent?.addons?.length) return []
    return LANDING_ADDONS.filter((addon) => checkoutIntent.addons.includes(addon.id)).map(
      (addon) => addon.shortLabel
    )
  }, [checkoutIntent])

  if (!user) {
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!societyName.trim() || !address.trim()) {
      setError('Society name and address are required.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const { society, profile } = await createSociety({
        name: societyName.trim(),
        address: address.trim(),
        admin_user_id: user!.id,
        admin_email: user!.email,
        admin_name: user!.email.split('@')[0]
      })

      setCurrentSocietyId(society.id)
      setShowcaseData({
        society: {
          id: society.id,
          name: society.name,
          subscription: 'Pending Activation',
          totalFlats: 0
        },
        units: [],
        defaulters: [],
        ledgerEntries: []
      })
      setUser({
        ...user!,
        roles: ['rwa_owner'],
        role: 'rwa_owner',
        flatNumber: profile.flat_number,
        user_metadata: { role: 'rwa_owner', tier: 'tier2' },
        tier: 'tier2'
      })

      writeLocalBillingStatus(society.id, {
        societyName: society.name,
        activationStatus: 'pending'
      })

      if (checkoutIntent?.addons?.length) {
        try {
          await activateSocietyAddons(society.id, checkoutIntent.addons)
        } catch {
          /* Super Admin can still enable modules later */
        }
      }
      clearLandingCheckoutIntent()

      navigate('/onboarding/activation', { replace: true })
    } catch {
      const societyId = `society-${Date.now()}`
      initializeFoundingPresident(societyId, user!.email ?? '')
      setCurrentSocietyId(societyId)
      setShowcaseData({
        society: {
          id: societyId,
          name: societyName.trim(),
          subscription: 'Pending Activation',
          totalFlats: 0
        },
        units: [],
        defaulters: [],
        ledgerEntries: []
      })
      setUser({
        ...user!,
        roles: ['rwa_owner'],
        role: 'rwa_owner',
        user_metadata: { role: 'rwa_owner', tier: 'tier2' },
        tier: 'tier2'
      })
      localStorage.setItem(
        'syncra-pending-society',
        JSON.stringify({
          id: societyId,
          name: societyName.trim(),
          address: address.trim()
        })
      )
      writeLocalBillingStatus(societyId, {
        societyName: societyName.trim(),
        activationStatus: 'pending'
      })
      if (checkoutIntent?.addons?.length) {
        try {
          await activateSocietyAddons(societyId, checkoutIntent.addons)
        } catch {
          /* local fallback society — toggles seed on next sync */
        }
      }
      clearLandingCheckoutIntent()
      navigate('/onboarding/activation', { replace: true })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={`${ui.page} flex min-h-screen items-center justify-center px-4 py-12`}>
      <div className="w-full max-w-lg">
        <div className={ui.card}>
          <header className={ui.cardHeader}>
            <p className={ui.eyebrow}>Society onboarding</p>
            <h1 className={`mt-1 ${ui.headingLg}`}>Set up your society</h1>
            <p className={`mt-2 ${ui.body}`}>
              Register your society profile first. You will complete platform activation and flat billing
              setup in the next steps.
            </p>
            {selectedAddonLabels.length > 0 ? (
              <p className="mt-3 rounded-xl border border-syncra-accent/30 bg-syncra-accent/10 px-3 py-2 text-sm text-syncra-blue">
                Landing plan add-ons ready to activate:{' '}
                <span className="font-semibold">{selectedAddonLabels.join(', ')}</span>
              </p>
            ) : null}
          </header>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block space-y-1.5">
              <span className={ui.label}>Society Name</span>
              <input
                value={societyName}
                onChange={(e) => setSocietyName(e.target.value)}
                className={ui.input}
                placeholder="e.g. Syncra Windsor Castle"
                required
              />
            </label>

            <label className="block space-y-1.5">
              <span className={ui.label}>Address</span>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                className={`resize-none ${ui.input}`}
                placeholder="Full society address"
                required
              />
            </label>

            {error && <p className="text-sm text-syncra-action-alt">{error}</p>}

            <button type="submit" disabled={submitting} className={`w-full ${ui.btnPrimary} disabled:opacity-70`}>
              {submitting ? 'Creating society…' : 'Continue to Platform Activation'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
