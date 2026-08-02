import React, { useEffect, useState } from 'react'
import { ADMIN_ALERT_EVENT } from '../../lib/adminAlerts'
import { PUSH_BANNER_EVENT } from '../../lib/pushNotifications'
import { ui } from '../../lib/ui'

type BannerState = {
  message: string
  url?: string
}

export default function AdminSimulationAlert() {
  const [banner, setBanner] = useState<BannerState | null>(null)

  useEffect(() => {
    function onAlert(event: Event) {
      const detail = (event as CustomEvent<string>).detail
      if (typeof detail === 'string' && detail.trim()) {
        setBanner({ message: detail })
      }
    }

    function onPush(event: Event) {
      const detail = (event as CustomEvent<{ message?: string; title?: string; body?: string; url?: string }>).detail
      const message =
        detail?.message ||
        (detail?.title && detail?.body ? `${detail.title}: ${detail.body}` : detail?.title || detail?.body || '')
      if (message.trim()) {
        setBanner({ message, url: detail?.url })
      }
    }

    window.addEventListener(ADMIN_ALERT_EVENT, onAlert)
    window.addEventListener(PUSH_BANNER_EVENT, onPush)
    return () => {
      window.removeEventListener(ADMIN_ALERT_EVENT, onAlert)
      window.removeEventListener(PUSH_BANNER_EVENT, onPush)
    }
  }, [])

  useEffect(() => {
    if (!banner) return
    const timer = window.setTimeout(() => setBanner(null), 10000)
    return () => window.clearTimeout(timer)
  }, [banner])

  if (!banner) return null

  return (
    <div className={`${ui.alert} border-emerald-200`} role="status">
      <p className="text-sm font-semibold text-emerald-800">{banner.message}</p>
      {banner.url && (
        <a href={banner.url} className="mt-1 inline-block text-xs font-semibold text-syncra-blue hover:underline">
          Open update →
        </a>
      )}
    </div>
  )
}