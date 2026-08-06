import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../providers/AuthProvider'
import {
  LOST_FOUND_CATEGORIES,
  claimLostFoundPost,
  createLostFoundPost,
  fileToDataUrl,
  listLostFoundPosts,
  listPairedDevices
} from '../../api/pairedAssetsService'
import type { LostFoundCategory, LostFoundPost, PairedBluetoothDevice } from '../../types/db'
import { ui } from '../../lib/ui'

/**
 * mAI Find hub — honest dual track:
 * 1) Paired Bluetooth accessories (owner's own devices)
 * 2) Community Lost & Found photos for non-electronic items (claim at Gate 1)
 */
export default function ResidentFindAssetPage() {
  const { currentSocietyId, user } = useAuth()
  const [devices, setDevices] = useState<PairedBluetoothDevice[]>([])
  const [posts, setPosts] = useState<LostFoundPost[]>([])
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<LostFoundCategory>('KEYS')
  const [description, setDescription] = useState('')
  const [photo, setPhoto] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    if (!currentSocietyId || !user?.id) return
    const [d, p] = await Promise.all([
      listPairedDevices(currentSocietyId, user.id),
      listLostFoundPosts(currentSocietyId, 'OPEN')
    ])
    setDevices(d)
    setPosts(p)
  }

  useEffect(() => {
    void refresh().catch((err) => setError(err instanceof Error ? err.message : 'Load failed'))
  }, [currentSocietyId, user?.id])

  if (!currentSocietyId || !user?.id) {
    return (
      <section className={ui.card}>
        <p className={ui.body}>Sign in with a mapped flat to use mAI Find.</p>
      </section>
    )
  }

  return (
    <div className="space-y-6">
      <section className={ui.card}>
        <p className={ui.eyebrow}>mAI Find</p>
        <h2 className={`mt-2 ${ui.headingLg}`}>Paired devices + Lost &amp; Found</h2>
        <p className={`mt-2 ${ui.body}`}>
          Track accessories already paired to your phone (watch, earbuds, secondary phone) via disconnect / RSSI from
          your handset. For keys, wallets, and bags, use the photo board — physical claim at Gate 1. We do not run a
          background community mesh for non-electronic items.
        </p>
        <Link to="/resident/paired-assets" className={`mt-4 inline-flex ${ui.btnPrimary}`}>
          Open paired devices
        </Link>
      </section>

      <section className={ui.card}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className={ui.heading}>Your paired accessories</h3>
          <Link to="/resident/paired-assets" className={ui.btnGhost}>
            Manage / ping
          </Link>
        </div>
        {devices.length === 0 ? (
          <p className={`mt-3 ${ui.body}`}>No devices registered yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {devices.slice(0, 4).map((d) => (
              <li key={d.id} className={ui.innerItem}>
                <p className="font-medium text-syncra-primary">
                  {d.device_name} · {d.device_type}
                </p>
                <p className="text-xs text-slate-500">
                  {d.last_seen_zone || '—'}
                  {d.last_seen_at ? ` · ${new Date(d.last_seen_at).toLocaleString()}` : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={ui.card} id="lost-found">
        <h3 className={ui.heading}>Community Lost &amp; Found</h3>
        <p className={`mt-2 text-sm ${ui.body}`}>
          Guards and neighbors post photos of non-electronic finds. Claimants collect at the desk listed below — usually
          Gate 1.
        </p>
        <form
          className="mt-4 grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault()
            setError(null)
            void createLostFoundPost({
              societyId: currentSocietyId,
              postedByUserId: user.id,
              postedByFlatNumber: user.flatNumber || undefined,
              category,
              title,
              description,
              photoDataUrl: photo
            })
              .then(() => {
                setTitle('')
                setDescription('')
                setPhoto(null)
                setMessage('Posted to Lost & Found — item held for claim at Gate 1.')
                return refresh()
              })
              .catch((err) => setError(err instanceof Error ? err.message : 'Post failed'))
          }}
        >
          <div className="space-y-2">
            <label className={ui.label}>Title</label>
            <input
              className={ui.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Black leather wallet"
              required
            />
          </div>
          <div className="space-y-2">
            <label className={ui.label}>Category</label>
            <select
              className={ui.input}
              value={category}
              onChange={(e) => setCategory(e.target.value as LostFoundCategory)}
            >
              {LOST_FOUND_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className={ui.label}>Description</label>
            <input
              className={ui.input}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Found near clubhouse steps"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className={ui.label}>Photo</label>
            <input
              className={ui.input}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) {
                  setPhoto(null)
                  return
                }
                void fileToDataUrl(file)
                  .then(setPhoto)
                  .catch(() => setError('Could not read photo'))
              }}
            />
            {photo ? (
              <img src={photo} alt="Lost item preview" className="mt-2 h-32 w-auto rounded-xl object-cover" />
            ) : null}
          </div>
          <button type="submit" className={`sm:col-span-2 ${ui.btnSecondary}`}>
            Post to Lost &amp; Found
          </button>
        </form>
        {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
      </section>

      <div className="space-y-3">
        {posts.map((post) => (
          <article key={post.id} className={ui.card}>
            <div className="flex flex-col gap-4 sm:flex-row">
              {post.photo_url ? (
                <img
                  src={post.photo_url}
                  alt={post.title}
                  className="h-28 w-28 shrink-0 rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs text-slate-500">
                  No photo
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-syncra-primary">{post.title}</h4>
                <p className={`mt-1 text-sm ${ui.body}`}>
                  {post.item_category} · Claim at {post.claim_desk}
                  {post.posted_by_flat_number ? ` · posted by Flat ${post.posted_by_flat_number}` : ''}
                </p>
                {post.description ? <p className={`mt-1 text-sm ${ui.body}`}>{post.description}</p> : null}
                <button
                  type="button"
                  className={`mt-3 ${ui.btnGhost}`}
                  onClick={() =>
                    void claimLostFoundPost({ postId: post.id, claimedByUserId: user.id })
                      .then(() => {
                        setMessage(`Marked claimed — collect at ${post.claim_desk}.`)
                        return refresh()
                      })
                      .catch((err) => setError(err instanceof Error ? err.message : 'Claim failed'))
                  }
                >
                  I claimed this at {post.claim_desk}
                </button>
              </div>
            </div>
          </article>
        ))}
        {posts.length === 0 ? <p className={`text-center ${ui.body}`}>No open Lost &amp; Found posts.</p> : null}
      </div>
    </div>
  )
}
