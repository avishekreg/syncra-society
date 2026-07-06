import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import AuthLayout from '../../layouts/AuthLayout'
import SignupDownloadSuccess from '../../components/auth/SignupDownloadSuccess'
import { useAuth } from '../../providers/AuthProvider'
import { clearPendingSignup, loadPendingSignup } from '../../lib/emailVerification'
import { resolvePostLoginPath } from '../../config/devSeed'
import { linkResidentAccount } from '../../api/residentMapping'
import supabase from '../../api/supabaseSdk'
import { ui } from '../../lib/ui'

export default function VerifyEmail() {
  const { verifyEmailOtp, resendVerificationEmail, refreshSocietyProfile } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const flow = searchParams.get('flow') ?? 'standard'
  const isWebFirstFlow = flow === 'web-first'
  const [email, setEmail] = useState(searchParams.get('email') ?? loadPendingSignup()?.email ?? '')
  const [code, setCode] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)
  const [showDownloadSuccess, setShowDownloadSuccess] = useState(false)
  const [verifiedName, setVerifiedName] = useState<string | undefined>()
  const [dashboardPath, setDashboardPath] = useState('/auth/signin')

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.auth.getSession()
      const sessionUser = data.session?.user
      if (sessionUser?.email_confirmed_at) {
        await completeSignupIfNeeded(sessionUser.id, sessionUser.email ?? email)
      }
    })()

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user?.email_confirmed_at) {
        await completeSignupIfNeeded(session.user.id, session.user.email ?? email)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [email])

  async function completeSignupIfNeeded(userId: string, userEmail: string) {
    const pending = loadPendingSignup()
    if (pending && pending.email.toLowerCase() === userEmail.toLowerCase()) {
      if (pending.accountType === 'resident' && pending.societyJoinCode && pending.flatNumber) {
        await linkResidentAccount({
          userId,
          email: userEmail,
          fullName: pending.fullName,
          societyJoinCode: pending.societyJoinCode,
          flatNumber: pending.flatNumber,
          building: pending.building
        })
        await refreshSocietyProfile()
      }
      clearPendingSignup()
      const role = pending.accountType === 'society_admin' ? 'rwa_owner' : 'resident'
      const nextPath = resolvePostLoginPath(
        userEmail,
        role === 'rwa_owner' ? ['rwa_owner'] : ['resident'],
        null,
        role
      )
      setVerifiedName(pending.fullName)
      setDashboardPath(nextPath)

      if (isWebFirstFlow || pending.accountType === 'resident') {
        setShowDownloadSuccess(true)
        return
      }

      navigate(nextPath)
      return
    }

    setStatus('Email verified successfully. You can now sign in.')
    navigate('/auth/signin')
  }

  async function handleVerifyCode(event: React.FormEvent) {
    event.preventDefault()
    if (!email.trim()) {
      setError('Enter the email address you used to register.')
      return
    }
    if (!code.trim()) {
      setError('Enter the verification code from your email.')
      return
    }

    setSubmitting(true)
    setError(null)
    setStatus(null)
    try {
      const result = await verifyEmailOtp(email.trim(), code.trim())
      if (result.user?.email) {
        setStatus('Email verified. Finishing account setup…')
        if (result.user.id) {
          await completeSignupIfNeeded(result.user.id, result.user.email ?? email.trim())
        } else {
          setStatus('Email verified successfully. Sign in to continue.')
          navigate('/auth/signin')
        }
      } else {
        setStatus('Verification accepted. Please sign in to continue.')
        navigate('/auth/signin')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to verify code')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResend() {
    if (!email.trim()) {
      setError('Enter your email address to resend the verification link.')
      return
    }
    setResending(true)
    setError(null)
    try {
      await resendVerificationEmail(email.trim())
      setStatus('Verification email sent. Check your inbox for the link or code.')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to resend verification email')
    } finally {
      setResending(false)
    }
  }

  if (showDownloadSuccess) {
    return (
      <AuthLayout title="You're All Set" compact>
        <SignupDownloadSuccess fullName={verifiedName} dashboardPath={dashboardPath} />
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Verify Your Email" compact={isWebFirstFlow}>
      <div className="mx-auto max-w-xl">
        <div className={`space-y-6 ${ui.card}`}>
          <div>
            <p className={ui.eyebrow}>Account security</p>
            <h2 className={`mt-2 ${ui.heading}`}>Confirm your email to finish signup</h2>
            <p className={`mt-3 ${ui.body}`}>
              {isWebFirstFlow
                ? 'Enter the one-time code we sent to your inbox. Once verified, you can download the Syncra Society app and access your dashboard.'
                : 'We sent a verification link and one-time code to your inbox. Click the link or enter the code below to activate your account.'}
            </p>
          </div>

          <form onSubmit={(e) => void handleVerifyCode(e)} className="space-y-5">
            <div className="space-y-3">
              <label className={ui.label}>Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className={ui.input}
                placeholder="you@company.com"
              />
            </div>

            <div className="space-y-3">
              <label className={ui.label}>Verification code</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\s/g, ''))}
                className={ui.input}
                placeholder="Enter 6-digit code"
                inputMode="numeric"
                autoComplete="one-time-code"
              />
            </div>

            <button type="submit" disabled={submitting} className={`w-full ${ui.btnPrimary} disabled:opacity-70`}>
              {submitting ? 'Verifying…' : 'Verify email'}
            </button>
          </form>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => void handleResend()}
              disabled={resending}
              className={`${ui.btnSecondary} flex-1`}
            >
              {resending ? 'Sending…' : 'Resend verification email'}
            </button>
            <Link to="/auth/signin" className={`${ui.btnGhost} flex-1 text-center`}>
              Back to sign in
            </Link>
          </div>

          {status && <p className="text-sm text-emerald-600">{status}</p>}
          {error && <p className="text-sm text-syncra-action-alt">{error}</p>}
        </div>
      </div>
    </AuthLayout>
  )
}
