import React, { useEffect, useMemo, useState } from 'react'
import AuthLayout from '../../layouts/AuthLayout'
import AuthExistingAccountLink from '../../components/auth/AuthExistingAccountLink'
import EmailOtpGate from '../../components/auth/EmailOtpGate'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useAuth } from '../../providers/AuthProvider'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { savePendingSignup } from '../../lib/emailVerification'
import { resolveInviteContext, validateJoinCode, type JoinCodeValidationResult } from '../../lib/joinCodeValidation'
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
  const [emailVerified, setEmailVerified] = useState(false)
  const [emailDraft, setEmailDraft] = useState('')
  const [inviteLoading, setInviteLoading] = useState(true)
  const [inviteSocietyName, setInviteSocietyName] = useState<string | null>(null)
  const [joinCodeLocked, setJoinCodeLocked] = useState(false)
  const [joinValidation, setJoinValidation] = useState<JoinCodeValidationResult | null>(null)
  const [joinValidating, setJoinValidating] = useState(false)

  const societyIdFromLink = searchParams.get('society_id')?.trim() ?? ''
  const joinCodeFromLink = searchParams.get('join_code')?.trim() ?? ''
  const isInviteFlow = Boolean(societyIdFromLink || joinCodeFromLink)

  const { register, handleSubmit, watch, reset, setValue, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      accountType: isInviteFlow ? 'resident' : 'society_admin',
      societyJoinCode: '',
      flatNumber: '',
      building: '',
      fullName: '',
      email: '',
      password: '',
      confirm: ''
    }
  })

  const accountType = watch('accountType')
  const societyJoinCode = watch('societyJoinCode') ?? ''
  const formLocked = !emailVerified

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setInviteLoading(true)
      const invite = await resolveInviteContext({
        societyId: societyIdFromLink || null,
        joinCode: joinCodeFromLink || null
      })
      if (cancelled) return

      if (invite.society) {
        setInviteSocietyName(invite.society.name)
        setJoinCodeLocked(Boolean(invite.source))
        reset({
          accountType: 'resident',
          societyJoinCode: invite.joinCode,
          flatNumber: '',
          building: '',
          fullName: '',
          email: '',
          password: '',
          confirm: ''
        })
        setJoinValidation({
          valid: true,
          society: invite.society,
          layout: { blocks: [], wings: [], sampleFlats: [] },
          message: `Invite verified for ${invite.society.name}.`
        })
      }
      setInviteLoading(false)
    })()

    return () => {
      cancelled = true
    }
  }, [societyIdFromLink, joinCodeFromLink, reset])

  useEffect(() => {
    if (joinCodeLocked || accountType !== 'resident') return
    const code = societyJoinCode.trim()
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
  }, [societyJoinCode, joinCodeLocked, accountType])

  const buildingOptions = useMemo(() => joinValidation?.layout.blocks ?? [], [joinValidation])

  async function onSubmit(values: Form) {
    if (!emailVerified) {
      alert('Verify your email with the one-time code before creating your account.')
      return
    }

    if (values.accountType === 'resident') {
      const validation = joinValidation ?? (await validateJoinCode(values.societyJoinCode ?? ''))
      if (!validation.valid) {
        alert(validation.message)
        return
      }
    }

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

      const verifyParams = new URLSearchParams({
        email: normalizedEmail,
        flow: isInviteFlow || values.accountType === 'resident' ? 'web-first' : 'standard'
      })
      navigate(`/auth/verify-email?${verifyParams.toString()}`)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Sign up failed')
    }
  }

  function handleEmailVerified() {
    setEmailVerified(true)
    setValue('email', emailDraft.trim().toLowerCase(), { shouldValidate: true })
  }

  return (
    <AuthLayout title={isInviteFlow ? 'Join Your Society' : 'Create Your Account'} compact={isInviteFlow}>
      <div className={isInviteFlow ? 'mx-auto max-w-lg space-y-6' : 'grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.1fr] lg:gap-10'}>
        {!isInviteFlow && (
          <div className={`space-y-6 ${ui.cardSurface}`}>
            <p className={ui.eyebrow}>Web-first onboarding</p>
            <h2 className={ui.heading}>Register as a Society Admin or Resident.</h2>
            <p className={`leading-7 ${ui.body}`}>
              Verify your email, complete signup in the mobile browser, then download the Syncra Society app for
              gatekeeper logs and your resident dashboard.
            </p>
          </div>
        )}

        <div className={ui.card}>
          {isInviteFlow && (
            <div className="mb-5 space-y-2">
              <p className={ui.eyebrow}>WhatsApp invite</p>
              <h2 className="text-xl font-semibold text-syncra-primary">Instant resident signup</h2>
              <p className={`text-sm ${ui.body}`}>
                Complete verification here in your mobile browser — no app install required to get started.
              </p>
            </div>
          )}

          {inviteLoading ? (
            <p className="text-sm text-slate-500">Validating your society invite…</p>
          ) : inviteSocietyName ? (
            <div className="mb-5 rounded-xl border border-syncra-accent/30 bg-syncra-accent/10 px-4 py-3 text-sm text-syncra-blue">
              <strong>{inviteSocietyName}</strong> invite detected — your joining code is pre-filled and locked.
            </div>
          ) : null}

          <AuthExistingAccountLink />

          <EmailOtpGate
            email={emailDraft}
            onEmailChange={setEmailDraft}
            verified={emailVerified}
            onVerified={handleEmailVerified}
            purpose="signup"
          />

          <fieldset disabled={formLocked} className={`mt-6 space-y-5 ${formLocked ? 'opacity-60' : ''}`}>
            <legend className="sr-only">Account details</legend>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <input type="hidden" {...register('email')} />

              <div className="space-y-3">
                <label className={ui.label}>Full Name</label>
                <input {...register('fullName')} className={ui.input} placeholder="Your full name" disabled={formLocked} />
                {errors.fullName && <div className="text-sm text-syncra-action-alt">{errors.fullName.message}</div>}
              </div>

              {!isInviteFlow && (
                <div className="space-y-3">
                  <label className={ui.label}>Account Type</label>
                  <select {...register('accountType')} className={ui.input} disabled={formLocked}>
                    <option value="society_admin">Society Admin (RWA President / Manager)</option>
                    <option value="resident">Resident</option>
                  </select>
                </div>
              )}

              {accountType === 'resident' && (
                <>
                  <div className="space-y-3">
                    <label className={ui.label}>Society Joining Code</label>
                    <input
                      {...register('societyJoinCode')}
                      className={ui.input}
                      placeholder="Enter society joining code"
                      readOnly={joinCodeLocked}
                      disabled={formLocked}
                    />
                    {joinValidating && <p className="text-xs text-slate-500">Validating join code…</p>}
                    {joinValidation && (
                      <p
                        className={`text-sm ${joinValidation.valid ? 'text-emerald-600' : 'text-syncra-action-alt'}`}
                      >
                        {joinValidation.message}
                      </p>
                    )}
                    {errors.societyJoinCode && (
                      <div className="text-sm text-syncra-action-alt">{errors.societyJoinCode.message}</div>
                    )}
                  </div>

                  {buildingOptions.length > 0 && (
                    <div className="space-y-3">
                      <label className={ui.label}>Block / Wing</label>
                      <select {...register('building')} className={ui.input} disabled={formLocked}>
                        <option value="">Select block or wing</option>
                        {buildingOptions.map((block) => (
                          <option key={block} value={block}>
                            {block}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="space-y-3">
                    <label className={ui.label}>Flat Number</label>
                    <input {...register('flatNumber')} className={ui.input} placeholder="e.g. 402" disabled={formLocked} />
                  </div>

                  {buildingOptions.length === 0 && (
                    <div className="space-y-3">
                      <label className={ui.label}>Building (optional)</label>
                      <input {...register('building')} className={ui.input} placeholder="e.g. Tower B" disabled={formLocked} />
                    </div>
                  )}
                </>
              )}

              <div className="space-y-3">
                <label className={ui.label}>Password</label>
                <input
                  type="password"
                  {...register('password')}
                  autoComplete="new-password"
                  className={ui.input}
                  disabled={formLocked}
                />
                {errors.password && <div className="text-sm text-syncra-action-alt">{errors.password.message}</div>}
              </div>

              <div className="space-y-3">
                <label className={ui.label}>Confirm Password</label>
                <input
                  type="password"
                  {...register('confirm')}
                  autoComplete="new-password"
                  className={ui.input}
                  disabled={formLocked}
                />
                {errors.confirm && <div className="text-sm text-syncra-action-alt">{errors.confirm.message}</div>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || formLocked}
                className={`w-full ${ui.btnPrimary} disabled:opacity-70`}
              >
                {formLocked ? 'Verify email to continue' : 'Create Account'}
              </button>
            </form>
          </fieldset>

          <AuthExistingAccountLink variant="footer" />
        </div>
      </div>
    </AuthLayout>
  )
}
