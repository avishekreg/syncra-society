import React from 'react'
import AuthLayout from '../layouts/AuthLayout'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useAuth } from '../providers/AuthProvider'
import { useNavigate, Link } from 'react-router-dom'
import { resolvePostLoginPath } from '../config/devSeed'
import { ui } from '../lib/ui'

const schema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

type Form = z.infer<typeof schema>

export default function AuthPage() {
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
    } catch (err: any) {
      alert(err.message || 'Sign in failed')
    }
  }

  return (
    <AuthLayout title="Welcome Back">
      <div className="mx-auto max-w-md">
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
          Don&apos;t have an account?{' '}
          <Link to="/auth/signup" className="font-semibold text-syncra-blue hover:text-syncra-accent">
            Create one
          </Link>
        </div>
      </div>
    </AuthLayout>
  )
}
