import React, { useState } from 'react'
import { issueEmailVerification, verifyAppEmailCode } from '../../lib/emailVerification'
import { ui } from '../../lib/ui'

type EmailOtpGateProps = {
  email: string
  onEmailChange: (value: string) => void
  verified: boolean
  onVerified: () => void
  purpose?: 'signup' | 'signin'
}

export default function EmailOtpGate({
  email,
  onEmailChange,
  verified,
  onVerified,
  purpose = 'signup'
}: EmailOtpGateProps) {
  const [otp, setOtp] = useState('')
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  async function handleSendCode() {
    const normalized = email.trim().toLowerCase()
    if (!normalized || !normalized.includes('@')) {
      setError('Enter a valid email address before requesting a verification code.')
      return
    }

    setSending(true)
    setError(null)
    setStatus(null)
    try {
      await issueEmailVerification({ email: normalized })
      setCodeSent(true)
      setStatus('Verification code sent. Check your inbox and enter it below.')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to send verification code.')
    } finally {
      setSending(false)
    }
  }

  async function handleVerifyCode() {
    const normalized = email.trim().toLowerCase()
    if (!otp.trim()) {
      setError('Enter the verification code from your email.')
      return
    }

    setVerifying(true)
    setError(null)
    try {
      verifyAppEmailCode(normalized, otp.trim())
      setStatus('Email verified successfully.')
      onVerified()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid verification code.')
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-gray-200 bg-syncra-surface-alt p-4 shadow-sm sm:p-5">
      <div>
        <p className={ui.eyebrow}>Step 1 · Verify email</p>
        <p className="mt-1 text-sm text-slate-600">
          {purpose === 'signup'
            ? 'Confirm your email before completing account setup.'
            : 'Verify email ownership before signing in.'}
        </p>
      </div>

      <div className="space-y-3">
        <label className={ui.label}>Email</label>
        <input
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          autoComplete="email"
          className={ui.input}
          placeholder="you@company.com"
          disabled={verified}
        />
      </div>

      {!verified && (
        <>
          <button
            type="button"
            onClick={() => void handleSendCode()}
            disabled={sending || !email.trim()}
            className={`w-full ${ui.btnSecondary} disabled:opacity-60`}
          >
            {sending ? 'Sending code…' : codeSent ? 'Resend verification code' : 'Send verification code'}
          </button>

          {codeSent && (
            <div className="space-y-3">
              <label className={ui.label}>Verification code</label>
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\s/g, ''))}
                className={ui.input}
                placeholder="Enter 6-digit code"
                inputMode="numeric"
                autoComplete="one-time-code"
              />
              <button
                type="button"
                onClick={() => void handleVerifyCode()}
                disabled={verifying || !otp.trim()}
                className={`w-full ${ui.btnPrimary} disabled:opacity-60`}
              >
                {verifying ? 'Verifying…' : 'Verify email code'}
              </button>
            </div>
          )}
        </>
      )}

      {verified && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          Email verified — continue with the rest of the form.
        </p>
      )}

      {status && !verified && <p className="text-sm text-emerald-600">{status}</p>}
      {error && <p className="text-sm text-syncra-action-alt">{error}</p>}
    </div>
  )
}
