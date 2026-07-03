import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../providers/AuthProvider'
import { listPendingVisitorLogs, updateVisitorLogStatus } from '../api/visitorLogs'
import type { VisitorLog } from '../types/db'

type GatekeeperPanelProps = {
  onPending?: (pending: VisitorLog[]) => void
}

export default function GatekeeperPanel({ onPending }: GatekeeperPanelProps) {
  const { user, currentSocietyId } = useAuth()
  const [pending, setPending] = useState<VisitorLog[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const flatNumber = user?.flatNumber
  const audioElementRef = useRef<HTMLAudioElement | null>(null)
  const audioIntervalRef = useRef<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const notificationAudioUrl = '/notification.mp3'

  const stopNotificationSound = useCallback(() => {
    if (audioElementRef.current) {
      audioElementRef.current.pause()
      audioElementRef.current.currentTime = 0
      audioElementRef.current = null
    }

    if (audioIntervalRef.current !== null) {
      window.clearInterval(audioIntervalRef.current)
      audioIntervalRef.current = null
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {})
      audioContextRef.current = null
    }
  }, [])

  const playFallbackToneSequence = useCallback(() => {
    if (typeof window === 'undefined') return
    const AudioConstructor = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioConstructor) return

    const context = audioContextRef.current ?? new AudioConstructor()
    audioContextRef.current = context

    if (context.state === 'suspended') {
      context.resume().catch(() => {})
    }

    const playPulse = () => {
      if (!audioContextRef.current) return
      const oscillator = audioContextRef.current.createOscillator()
      const gain = audioContextRef.current.createGain()
      oscillator.type = 'square'
      oscillator.frequency.value = 800
      gain.gain.setValueAtTime(0.0001, audioContextRef.current.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.15, audioContextRef.current.currentTime + 0.01)
      gain.gain.setTargetAtTime(0.0001, audioContextRef.current.currentTime + 0.18, 0.02)
      oscillator.connect(gain)
      gain.connect(audioContextRef.current.destination)
      oscillator.start()
      oscillator.stop(audioContextRef.current.currentTime + 0.25)
    }

    playPulse()
    if (audioIntervalRef.current === null) {
      audioIntervalRef.current = window.setInterval(playPulse, 1000)
    }
  }, [])

  const startNotificationSound = useCallback(async () => {
    stopNotificationSound()
    if (typeof window === 'undefined') return

    try {
      const audio = new Audio(notificationAudioUrl)
      audio.loop = true
      audio.preload = 'auto'
      audio.volume = 0.45
      await audio.play()
      audioElementRef.current = audio
    } catch {
      playFallbackToneSequence()
    }
  }, [playFallbackToneSequence, stopNotificationSound])

  const fetchPending = useCallback(async () => {
    if (!currentSocietyId || !flatNumber) {
      setPending([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await listPendingVisitorLogs(currentSocietyId, flatNumber)
      setPending(data ?? [])
    } catch (err: any) {
      setError(err.message || 'Failed to load gate requests')
      setPending([])
    } finally {
      setLoading(false)
    }
  }, [currentSocietyId, flatNumber])

  useEffect(() => {
    fetchPending()
    const interval = setInterval(fetchPending, 15000)
    return () => clearInterval(interval)
  }, [fetchPending])

  useEffect(() => {
    if (pending.length > 0) {
      startNotificationSound()
    } else {
      stopNotificationSound()
    }

    if (onPending) {
      onPending(pending)
    }

    return () => {
      stopNotificationSound()
    }
  }, [pending, onPending, startNotificationSound, stopNotificationSound])

  async function handleAction(id: string, action: 'approved' | 'denied') {
    if (!user) return
    try {
      await updateVisitorLogStatus(id, action, user.id)
      fetchPending()
    } catch (err: any) {
      alert(err.message || 'Action failed')
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-syncra-primary">Syncra Gatekeeper</h3>
        {loading && <span className="text-xs font-medium text-syncra-accent">Live</span>}
      </div>
      <p className="mt-1 text-xs text-slate-500">Real-time visitor approvals for your flat.</p>
      {error && <p className="mt-2 text-sm text-syncra-action-alt">{error}</p>}
      {!flatNumber && (
        <p className="mt-3 text-sm text-slate-500">Flat mapping pending — gate actions unavailable.</p>
      )}
      <ul className="mt-4 space-y-3">
        {pending.map((log) => (
          <li key={log.id} className="rounded-xl border border-syncra-action/30 bg-orange-50 p-4">
            <p className="font-medium text-syncra-primary">{log.visitor_name}</p>
            <p className="text-sm text-slate-600">{log.purpose}</p>
            <p className="mt-1 text-xs text-slate-500">
              {log.target_building} · Flat {log.target_flat_number}
              {log.vehicle_number ? ` · ${log.vehicle_number}` : ''}
            </p>
            <p className="mt-1 text-xs text-syncra-action">
              Requested {new Date(log.requested_at).toLocaleString()}
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => handleAction(log.id, 'approved')}
                className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
              >
                Allow Entry
              </button>
              <button
                onClick={() => handleAction(log.id, 'denied')}
                className="flex-1 rounded-lg border border-syncra-action-alt/40 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
              >
                Deny Entry
              </button>
            </div>
          </li>
        ))}
        {!loading && flatNumber && pending.length === 0 && !error && (
          <li className="text-sm text-slate-500">No pending visitor requests.</li>
        )}
      </ul>
    </div>
  )
}
