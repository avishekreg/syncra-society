import React, { useState } from 'react'
import AuthLayout from '../../layouts/AuthLayout'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useAuth } from '../../providers/AuthProvider'
import { useNavigate, Link } from 'react-router-dom'
import { resolvePostLoginPath } from '../../config/devSeed'
import { linkResidentAccount } from '../../api/residentMapping'
import { listRegisteredSocieties } from '../../lib/societyRegistry'
import { ui } from '../../lib/ui'

const schema = z
  .object({
    fullName: z.string().min(2, 'Full name is required'),
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirm: z.string().min(6),
    accountType: z.enum(['society_admin', 'resident']),
    societyJoinCode: z.string().optional(),
    flatNumber: z.string().optional(),
    building: z.string().optional()
  })
  .refine((data) => data.password === data.confirm, { message: 'Passwords do not match', path: ['confirm'] })
  .refine(
    (data) =>
      data.accountType !== 'resident' ||
      (Boolean(data.societyJoinCode?.trim()) && Boolean(data.flatNumber?.trim())),
    { message: 'Society join code and flat number are required for residents', path: ['societyJoinCode'] }
  )

type Form = z.infer<typeof schema>

export default function SignUp() {
  const { signUp, signIn, refreshSocietyProfile } = useAuth()
  const navigate = useNavigate()
  const societies = listRegisteredSocieties()
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { accountType: 'society_admin' }
  })

  const accountType = watch('accountType')

  async function onSubmit(values: Form) {
    try {
      const role = values.accountType === 'society_admin' ? 'rwa_owner' : 'resident'
      const signUpRes = await signUp(values.email, values.password, { fullName: values.fullName, role })
      const userId = signUpRes.data?.user?.id

      try {
        const res: any = await signIn(values.email, values.password)

        if (values.accountType === 'resident' && userId && values.societyJoinCode && values.flatNumber) {
          await linkResidentAccount({
            userId,
            email: values.email,
            fullName: values.fullName,
            societyJoinCode: values.societyJoinCode,
            flatNumber: values.flatNumber,
            building: values.building
          })
          await refreshSocietyProfile()
        }

        const nextPath = resolvePostLoginPath(
          values.email,
          res?.user?.roles ?? (role === 'rwa_owner' ? ['rwa_owner'] : ['resident']),
          res?.societyId ?? null,
          role
        )
        navigate(nextPath)
      } catch {
        alert('Account created. Please sign in to continue.')
        navigate('/auth/signin')
      }
    } catch (err: any) {
      alert(err.message || 'Sign up failed')
    }
  }

  return (
    <AuthLayout title="Create Your Account">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr]">
        <div className={`space-y-6 ${ui.cardSurface}`}>
          <p className={ui.eyebrow}>Premium onboarding</p>
          <h2 className={ui.heading}>Register as a Society Admin or Resident.</h2>
          <p className={`leading-7 ${ui.body}`}>
            Society Admins complete one-time setup after signup. Residents link to their society using the join code
            from their RWA admin plus flat details.
          </p>
          {accountType === 'resident' && (
            <div className={`${ui.innerItem} text-sm`}>
              <p className="font-semibold text-syncra-primary">Demo society codes</p>
              <ul className="mt-2 space-y-1 text-slate-600">
                {societies.map((s) => (
                  <li key={s.id}>
                    {s.name}: <strong>{s.joinCode}</strong>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className={ui.card}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-3">
              <label className={ui.label}>Full Name</label>
              <input {...register('fullName')} className={ui.input} placeholder="Your full name" />
              {errors.fullName && <div className="text-sm text-syncra-action-alt">{errors.fullName.message}</div>}
            </div>

            <div className="space-y-3">
              <label className={ui.label}>Account Type</label>
              <select {...register('accountType')} className={ui.input}>
                <option value="society_admin">Society Admin (RWA President / Manager)</option>
                <option value="resident">Resident</option>
              </select>
            </div>

            {accountType === 'resident' && (
              <>
                <div className="space-y-3">
                  <label className={ui.label}>Society Join Code</label>
                  <input {...register('societyJoinCode')} className={ui.input} placeholder="e.g. WINDSOR2026" />
                  {errors.societyJoinCode && (
                    <div className="text-sm text-syncra-action-alt">{errors.societyJoinCode.message}</div>
                  )}
                </div>
                <div className="space-y-3">
                  <label className={ui.label}>Flat Number</label>
                  <input {...register('flatNumber')} className={ui.input} placeholder="e.g. 402" />
                </div>
                <div className="space-y-3">
                  <label className={ui.label}>Building (optional)</label>
                  <input {...register('building')} className={ui.input} placeholder="e.g. Tower B" />
                </div>
              </>
            )}

            <div className="space-y-3">
              <label className={ui.label}>Email</label>
              <input {...register('email')} autoComplete="email" className={ui.input} placeholder="you@company.com" />
              {errors.email && <div className="text-sm text-syncra-action-alt">{errors.email.message}</div>}
            </div>

            <div className="space-y-3">
              <label className={ui.label}>Password</label>
              <input type="password" {...register('password')} autoComplete="new-password" className={ui.input} />
              {errors.password && <div className="text-sm text-syncra-action-alt">{errors.password.message}</div>}
            </div>

            <div className="space-y-3">
              <label className={ui.label}>Confirm Password</label>
              <input type="password" {...register('confirm')} autoComplete="new-password" className={ui.input} />
              {errors.confirm && <div className="text-sm text-syncra-action-alt">{errors.confirm.message}</div>}
            </div>

            <button type="submit" disabled={isSubmitting} className={`w-full ${ui.btnPrimary} disabled:opacity-70`}>
              Create Account
            </button>
          </form>

          <div className="mt-6 border-t border-slate-200 pt-6 text-center text-sm text-slate-600">
            Already registered?{' '}
            <Link to="/auth/signin" className="font-semibold text-syncra-blue hover:text-syncra-accent">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}
