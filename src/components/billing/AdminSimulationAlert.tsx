import React, { useEffect, useState } from 'react'
import { ADMIN_ALERT_EVENT } from '../../lib/adminAlerts'
import { ui } from '../../lib/ui'

export default function AdminSimulationAlert() {
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    function onAlert(event: Event) {
      const detail = (event as CustomEvent<string>).detail
      if (typeof detail === 'string' && detail.trim()) {
        setMessage(detail)
      }
    }

    window.addEventListener(ADMIN_ALERT_EVENT, onAlert)
    return () => window.removeEventListener(ADMIN_ALERT_EVENT, onAlert)
  }, [])

  useEffect(() => {
    if (!message) return
    const timer = window.setTimeout(() => setMessage(null), 8000)
    return () => window.clearTimeout(timer)
  }, [message])

  if (!message) return null

  return (
    <div className={`${ui.alert} border-emerald-200`} role="status">
      <p className="text-sm font-semibold text-emerald-800">{message}</p>
    </div>
  )
}
