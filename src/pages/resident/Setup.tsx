import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../providers/AuthProvider'
import { linkResidentAccount } from '../../api/residentMapping'
import { validateJoinCode, type JoinCodeValidationResult } from '../../lib/joinCodeValidation'
import { ui } from '../../lib/ui'

export default function ResidentSetup() {
  const { user, refreshSocietyProfile, setCurrentSocietyId } = useAuth()
  const navigate = useNavigate()
  const [joinCode, setJoinCode] = useState('')
  const [flatNumber, setFlatNumber] = useState('')
  const [building, setBuilding] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [joinValidation, setJoinValidation] = useState<JoinCodeValidationResult | null>(null)
  const [joinValidating, setJoinValidating] = useState(false)

  useEffect(() => {
    const code = joinCode.trim()
    if (code.length < 4) {
      setJoinValidation(null)
      return
    }
    const timer = window.setTimeout(() => {
      setJoinValidating(true)
      void validateJoinCode(code)
        .then((result) => setJoinValidation(result))
        .finally(() => setJoinValidating(false))
    }, 400)
    return () => window.clearTimeout(timer)
  }, [joinCode])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!user) return

    const validation = joinValidation ?? (await validateJoinCode(joinCode))
    if (!validation.valid) {
      setError(validation.message)
      return
    }

    setSaving(true)
    setError(null)

    try {
      const profile = await linkResidentAccount({
        userId: user.id,
        email: user.email,
        fullName: user.email.split('@')[0],
        societyJoinCode: joinCode,
        flatNumber,
        building: building || undefined
      })
      setCurrentSocietyId(profile.societyId)
      await refreshSocietyProfile()
      navigate('/resident', { replace: true })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to link your account')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={`${ui.page} flex min-h-[60vh] items-center justify-center px-4 py-12`}>
      <div className={`${ui.card} w-full max-w-lg`}>
        <p className={ui.eyebrow}>Resident onboarding</p>
        <h1 className={`mt-2 ${ui.headingLg}`}>Link your flat to a society</h1>
        <p className={`mt-3 ${ui.body}`}>
          Enter the joining code from your society admin and your flat details to complete registration.
        </p>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-4">
          <label className="block space-y-2">
            <span className={ui.label}>Society Joining Code</span>
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className={ui.input}
              placeholder="Enter society joining code"
              required
            />
            {joinValidating && <p className="text-xs text-slate-500">Validating join code…</p>}
            {joinValidation && (
              <p className={`text-sm ${joinValidation.valid ? 'text-emerald-600' : 'text-syncra-action-alt'}`}>
                {joinValidation.message}
              </p>
            )}
          </label>
          <label className="block space-y-2">
            <span className={ui.label}>Flat Number</span>
            <input value={flatNumber} onChange={(e) => setFlatNumber(e.target.value)} className={ui.input} placeholder="e.g. 402" required />
          </label>
          <label className="block space-y-2">
            <span className={ui.label}>Building (optional)</span>
            <input value={building} onChange={(e) => setBuilding(e.target.value)} className={ui.input} placeholder="e.g. Tower A" />
          </label>
          {error && <p className="text-sm text-syncra-action-alt">{error}</p>}
          <button type="submit" disabled={saving} className={`w-full ${ui.btnPrimary} disabled:opacity-70`}>
            {saving ? 'Linking…' : 'Complete Registration'}
          </button>
        </form>
      </div>
    </div>
  )
}
