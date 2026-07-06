import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import AuthLayout from '../../layouts/AuthLayout'
import { useAuth } from '../../providers/AuthProvider'
import supabase from '../../api/supabaseSdk'
import { restPatch } from '../../api/supabaseClient'
import { resolvePostLoginPath } from '../../config/devSeed'
import { ui } from '../../lib/ui'

export default function ChangePasswordRequired() {
  const { user, setUser, currentSocietyId } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError

      if (user?.id && !user.id.startsWith('demo-')) {
        try {
          await restPatch(`user_and_flats?user_id=eq.${encodeURIComponent(user.id)}`, {
            requires_password_change: false,
            updated_at: new Date().toISOString()
          })
        } catch {
          // Demo / offline paths may not have a row yet.
        }
      }

      setUser((prev) => (prev ? { ...prev, requiresPasswordChange: false } : prev))

      const nextPath =
        from ??
        resolvePostLoginPath(user?.email ?? '', user?.roles ?? [], currentSocietyId, user?.role)
      navigate(nextPath, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Reset Your Password">
      <div className="mx-auto max-w-md space-y-6">
        <p className={ui.body}>
          Your account is using a temporary password. Choose a new password before continuing to your dashboard.
        </p>

        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-5">
          <label className="block space-y-2">
            <span className={ui.label}>New password</span>
            <input
              type="password"
              autoComplete="new-password"
              className={ui.input}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          <label className="block space-y-2">
            <span className={ui.label}>Confirm password</span>
            <input
              type="password"
              autoComplete="new-password"
              className={ui.input}
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              required
            />
          </label>

          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}

          <button type="submit" disabled={submitting} className={`w-full ${ui.btnPrimary} disabled:opacity-60`}>
            {submitting ? 'Updating…' : 'Save new password'}
          </button>
        </form>
      </div>
    </AuthLayout>
  )
}
