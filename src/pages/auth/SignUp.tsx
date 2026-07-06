import React, { useEffect, useState } from 'react'
import AuthLayout from '../../layouts/AuthLayout'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useAuth } from '../../providers/AuthProvider'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { ensureSocietyJoinCode, listRegisteredSocieties } from '../../lib/societyRegistry'
import { savePendingSignup } from '../../lib/emailVerification'
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
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const societies = listRegisteredSocieties()
  const [status, setStatus] = useState<string | null>(null)

  const societyIdFromLink = searchParams.get('society_id')?.trim() ?? ''
  const linkedSociety = societies.find((s) => s.id === societyIdFromLink)
  const linkedJoinCode =
    linkedSociety?.joinCode ??
    (societyIdFromLink ? ensureSocietyJoinCode(societyIdFromLink, linkedSociety?.name ?? 'Society') : '')

  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      accountType: societyIdFromLink ? 'resident' : 'society_admin',
      societyJoinCode: linkedJoinCode || '',
      flatNumber: '',
      building: ''
    }
  })

  useEffect(() => {
    if (!societyIdFromLink) return
    reset({
      accountType: 'resident',
      societyJoinCode: linkedJoinCode || '',
      flatNumber: '',
      building: '',
      fullName: '',
      email: '',
      password: '',
      confirm: ''
    })
  }, [societyIdFromLink, linkedJoinCode, reset])

  const accountType = watch('accountType')

  async function onSubmit(values: Form) {
    try {
      const role = values.accountType === 'society_admin' ? 'rwa_owner' : 'resident'
      const normalizedEmail = values.email.trim().toLowerCase()

      savePendingSignup({
        email: normalizedEmail,
        fullName: values.fullName,
        accountType: values.accountType,
        societyJoinCode: values.societyJoinCode,
        flatNumber: values.flatNumber,
        building: values.building
      })

      await signUp(normalizedEmail, values.password, { fullName: values.fullName, role })

      setStatus('Account created. Verify your email to complete signup.')
      navigate(`/auth/verify-email?email=${encodeURIComponent(normalizedEmail)}`)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Sign up failed')
    }
  }

  return (
    <AuthLayout title="Create Your Account">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.1fr] lg:gap-10">
        <div className={`space-y-6 ${ui.cardSurface}`}>
          <p className={ui.eyebrow}>Premium onboarding</p>
          <h2 className={ui.heading}>Register as a Society Admin or Resident.</h2>
          <p className={`leading-7 ${ui.body}`}>
            Every new account must verify email ownership before accessing the portal. You will receive a clickable
            link and a one-time code. Super Admin accounts are the only exception.
          </p>
          {societyIdFromLink && linkedJoinCode ? (
            <div className={`${ui.innerItem} text-sm text-syncra-blue`}>
              Registration link detected for society{' '}
              <strong>{linkedSociety?.name ?? societyIdFromLink}</strong>. Join code pre-filled — enter your flat
              details to complete resident onboarding.
            </div>
          ) : null}
          {accountType === 'resident' && !societyIdFromLink && (
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

          {status && <p className="mt-4 text-sm text-emerald-600">{status}</p>}

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
