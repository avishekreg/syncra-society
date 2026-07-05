import React from 'react'
import AuthLayout from '../../layouts/AuthLayout'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useAuth } from '../../providers/AuthProvider'
import { useNavigate, Link } from 'react-router-dom'
import { resolvePostLoginPath, DEMO_CREDENTIALS } from '../../config/devSeed'
import { ui } from '../../lib/ui'

const schema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

type Form = z.infer<typeof schema>

export default function SignIn() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema) })

  async function onSubmit(values: Form) {
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

  return (
    <AuthLayout title="Welcome Back">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.1fr] lg:gap-10">
        <div className={`space-y-6 ${ui.cardSurface}`}>
          <p className={ui.eyebrow}>Premium access</p>
          <h2 className={ui.heading}>Sign in with your email and password.</h2>
          <p className={`leading-7 ${ui.body}`}>
            Society mapping is handled automatically through your user profile, so you can log in simply and securely.
          </p>
          <div className={`space-y-4 ${ui.innerItem}`}>
            <p className="text-sm font-semibold text-syncra-primary">Secure by design</p>
            <p className={ui.body}>Two-step verification support and encrypted session management keep your dashboard protected.</p>
          </div>
        </div>

        <div className={ui.card}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-3">
              <label className={ui.label}>Email</label>
              <input
                {...register('email')}
                autoComplete="email"
                className={ui.input}
                placeholder="you@company.com"
              />
              {errors.email && <div className="text-sm text-syncra-action-alt">{errors.email.message}</div>}
            </div>

            <div className="space-y-3">
              <label className={ui.label}>Password</label>
              <input
                type="password"
                {...register('password')}
                autoComplete="current-password"
                className={ui.input}
                placeholder="Enter your password"
              />
              {errors.password && <div className="text-sm text-syncra-action-alt">{errors.password.message}</div>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full ${ui.btnPrimary} disabled:cursor-not-allowed disabled:opacity-70`}
            >
              Sign In
            </button>
          </form>

          <div className="mt-6 border-t border-slate-200 pt-6 text-center text-sm text-slate-600">
            Don’t have an account?{' '}
            <Link to="/auth/signup" className="font-semibold text-syncra-blue hover:text-syncra-accent">
              Create one
            </Link>
          </div>

          <div className="mt-4 text-center text-sm text-slate-600">
            Need to verify your email?{' '}
            <Link to="/auth/verify-email" className="font-semibold text-syncra-blue hover:text-syncra-accent">
              Enter verification code
            </Link>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-syncra-surface-alt p-4 text-left">
            <p className={ui.eyebrow}>Demo credentials</p>
            <ul className="mt-3 space-y-2 text-xs text-slate-600">
              {DEMO_CREDENTIALS.map((cred) => (
                <li key={cred.email} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <p className="font-semibold text-syncra-primary">{cred.label}</p>
                  <p className="mt-1 font-mono">{cred.email}</p>
                  <p className="font-mono text-slate-500">{cred.password}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}
