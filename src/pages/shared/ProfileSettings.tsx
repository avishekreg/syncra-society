import React, { useEffect, useState } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import { restGet, restPatch } from '../../api/supabaseClient'
import type { UserAndFlat } from '../../types/db'
import { ui } from '../../lib/ui'

export default function ProfileSettings() {
  const { user, setUser, currentSocietyId, refreshSocietyProfile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [profileId, setProfileId] = useState<string | null>(null)
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')

  useEffect(() => {
    if (!user?.id) return

    let cancelled = false
    void (async () => {
      setLoading(true)
      try {
        if (user.id.startsWith('demo-')) {
          if (!cancelled) {
            setUsername(user.username ?? '')
            setDisplayName(user.displayName ?? user.email.split('@')[0])
            setEmail(user.email)
            setPhone(user.phone ?? '')
            setWhatsapp(user.whatsappNumber ?? '')
            setAvatarUrl(user.avatarUrl ?? '')
          }
          return
        }

        const query = currentSocietyId
          ? `user_and_flats?user_id=eq.${encodeURIComponent(user.id)}&society_id=eq.${encodeURIComponent(currentSocietyId)}&limit=1`
          : `user_and_flats?user_id=eq.${encodeURIComponent(user.id)}&limit=1`
        const rows = await restGet<UserAndFlat[]>(query)
        const profile = rows?.[0]
        if (cancelled || !profile) return

        setProfileId(profile.id)
        setUsername(profile.username ?? '')
        setDisplayName(profile.name ?? '')
        setEmail(profile.email ?? user.email)
        setPhone(profile.phone ?? '')
        setWhatsapp(profile.whatsapp_number ?? '')
        setAvatarUrl(profile.avatar_url ?? '')
      } catch {
        if (!cancelled) {
          setEmail(user.email)
          setDisplayName(user.displayName ?? user.email.split('@')[0])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [user, currentSocietyId])

  async function handleSave(event: React.FormEvent) {
    event.preventDefault()
    if (!user) return

    setSaving(true)
    setMessage(null)
    setError(null)

    try {
      const payload = {
        name: displayName.trim() || user.email,
        email: email.trim().toLowerCase(),
        phone: phone.trim() || null,
        whatsapp_number: whatsapp.trim() || null,
        avatar_url: avatarUrl.trim() || null,
        updated_at: new Date().toISOString()
      }

      if (profileId && !user.id.startsWith('demo-')) {
        await restPatch(`user_and_flats?id=eq.${profileId}`, payload)
      }

      setUser((prev) =>
        prev
          ? {
              ...prev,
              email: payload.email,
              displayName: payload.name,
              phone: payload.phone ?? undefined,
              whatsappNumber: payload.whatsapp_number ?? undefined,
              avatarUrl: payload.avatar_url ?? undefined
            }
          : prev
      )

      await refreshSocietyProfile()
      setMessage('Profile updated successfully.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save profile.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className={ui.card} aria-busy="true">
        <p className={ui.body}>Loading profile…</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className={ui.card}>
        <p className={ui.eyebrow}>Account</p>
        <h2 className={`mt-2 ${ui.headingLg}`}>Profile & settings</h2>
        <p className={`mt-2 ${ui.body}`}>
          Update your contact details and avatar. Your username is used for sign-in across multiple flats in the same society.
        </p>
      </section>

      <form onSubmit={(event) => void handleSave(event)} className={`${ui.card} space-y-5`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-syncra-surface-alt">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-2xl font-semibold text-syncra-blue">
                {(displayName || user?.email || '?').charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <label className="min-w-0 flex-1 space-y-2">
            <span className={ui.label}>Profile photo URL</span>
            <input
              type="url"
              className={ui.input}
              placeholder="https://…"
              value={avatarUrl}
              onChange={(event) => setAvatarUrl(event.target.value)}
            />
          </label>
        </div>

        <label className="block space-y-2">
          <span className={ui.label}>Username</span>
          <input type="text" className={`${ui.input} bg-slate-50`} value={username} readOnly aria-readonly />
          <p className="text-xs text-slate-500">Contact your society admin to change your username.</p>
        </label>

        <label className="block space-y-2">
          <span className={ui.label}>Display name</span>
          <input
            type="text"
            className={ui.input}
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
          />
        </label>

        <label className="block space-y-2">
          <span className={ui.label}>Email</span>
          <input
            type="email"
            autoComplete="email"
            className={ui.input}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className={ui.label}>Phone</span>
            <input
              type="tel"
              className={ui.input}
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </label>
          <label className="block space-y-2">
            <span className={ui.label}>WhatsApp</span>
            <input
              type="tel"
              className={ui.input}
              value={whatsapp}
              onChange={(event) => setWhatsapp(event.target.value)}
            />
          </label>
        </div>

        {message && (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">
            {message}
          </p>
        )}
        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        <button type="submit" disabled={saving} className={`${ui.btnPrimary} disabled:opacity-60`}>
          {saving ? 'Saving…' : 'Save profile'}
        </button>
      </form>
    </div>
  )
}
