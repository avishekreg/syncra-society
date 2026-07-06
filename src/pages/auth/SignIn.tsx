import React, { useState } from 'react'
import AuthLayout from '../../layouts/AuthLayout'
import EmailOtpGate from '../../components/auth/EmailOtpGate'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useAuth } from '../../providers/AuthProvider'
import { useNavigate, Link } from 'react-router-dom'
import { resolvePostLoginPath } from '../../config/devSeed'
import { AUTH_LOGIN_PATH } from '../../components/auth/AuthExistingAccountLink'
import { ui } from '../../lib/ui'

const schema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

type Form = z.infer<typeof schema>

export default function SignIn() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [emailVerified, setEmailVerified] = useState(false)
  const [emailDraft, setEmailDraft] = useState('')
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema)
  })

  const formLocked = !emailVerified

  async function onSubmit(values: Form) {
    if (!emailVerified) {
      alert('Verify your email with the one-time code before signing in.')
      return
    }

    try {
      const normalizedEmail = values.email.trim().toLowerCase()
      const res: any = await signIn(normalizedEmail, values.password)
      const roles = res?.user?.roles ?? []
      const role = res?.user?.role ?? res?.user?.user_metadata?.role
      const nextPath = resolvePostLoginPath(normalizedEmail, roles, res?.societyId ?? null, role)
      navigate(nextPath)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign in failed'
      if (message.toLowerCase().includes('verify your email')) {
        navigate(`/auth/verify-email?email=${encodeURIComponent(values.email.trim().toLowerCase())}`)
        return
      }
      alert(message)
    }
  }

  function handleEmailVerified() {
    setEmailVerified(true)
    setValue('email', emailDraft.trim().toLowerCase(), { shouldValidate: true })
  }

  return (
    <AuthLayout title="Welcome Back">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.1fr] lg:gap-10">
        <div className={`space-y-6 ${ui.cardSurface}`}>
          <p className={ui.eyebrow}>Secure access</p>
          <h2 className={ui.heading}>Sign in with verified email and password.</h2>
          <p className={`leading-7 ${ui.body}`}>
            Society mapping is handled automatically through your user profile. Verify your email, then enter your
            password to access your dashboard.
          </p>
        </div>

        <div className={ui.card}>
          <div className="mb-6 rounded-xl border border-slate-200 bg-syncra-surface-alt px-4 py-3 text-center text-sm text-slate-600">
            Already verified your email?{' '}
            <Link to={AUTH_LOGIN_PATH} className="font-semibold text-syncra-blue hover:text-syncra-accent">
              Log In with password
            </Link>
          </div>

          <EmailOtpGate
            email={emailDraft}
            onEmailChange={setEmailDraft}
            verified={emailVerified}
            onVerified={handleEmailVerified}
            purpose="signin"
          />

          <fieldset disabled={formLocked} className={`mt-6 ${formLocked ? 'opacity-60' : ''}`}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <input type="hidden" {...register('email')} />

              <div className="space-y-3">
                <label className={ui.label}>Password</label>
                <input
                  type="password"
                  {...register('password')}
                  autoComplete="current-password"
                  className={ui.input}
                  placeholder="Enter your password"
                  disabled={formLocked}
                />
                {errors.password && <div className="text-sm text-syncra-action-alt">{errors.password.message}</div>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || formLocked}
                className={`w-full ${ui.btnPrimary} disabled:cursor-not-allowed disabled:opacity-70`}
              >
                {formLocked ? 'Verify email to continue' : 'Sign In'}
              </button>
            </form>
          </fieldset>

          <div className="mt-6 border-t border-slate-200 pt-6 text-center text-sm text-slate-600">
            Don’t have an account?{' '}
            <Link to="/auth/signup" className="font-semibold text-syncra-blue hover:text-syncra-accent">
              Create one
            </Link>
          </div>

          <div className="mt-4 text-center text-sm text-slate-600">
            Need email verification first?{' '}
            <Link to="/auth/signin" className="font-semibold text-syncra-blue hover:text-syncra-accent">
              Sign in with OTP
            </Link>
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}
