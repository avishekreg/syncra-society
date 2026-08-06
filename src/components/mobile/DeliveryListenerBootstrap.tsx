import React, { useEffect, useState } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import { isNativeShell } from '../../lib/capacitorShell'
import { DeliveryListener, isDeliveryListenerAvailable } from '../../plugins/deliveryListener'
import {
  DELIVERY_CONSENT_CHANGED_EVENT,
  getDeliverySmsConsent,
  startBackgroundDeliveryInterceptor,
  stopBackgroundDeliveryInterceptor
} from '../../services/backgroundDeliveryInterceptor'
import SMSConsentModal from '../delivery/SMSConsentModal'

/**
 * Resident-shell bootstrap for Android delivery SMS / notification auto pre-approval.
 * Shows consent once on native Android; starts the interceptor when granted.
 */
export default function DeliveryListenerBootstrap() {
  const { user, currentSocietyId } = useAuth()
  const [consentOpen, setConsentOpen] = useState(false)
  const [consent, setConsent] = useState(getDeliverySmsConsent)

  const societyId = currentSocietyId
  const flatNumber = user?.flatNumber
  const userId = user?.id

  useEffect(() => {
    const sync = () => setConsent(getDeliverySmsConsent())
    sync()
    window.addEventListener(DELIVERY_CONSENT_CHANGED_EVENT, sync)
    return () => window.removeEventListener(DELIVERY_CONSENT_CHANGED_EVENT, sync)
  }, [])

  useEffect(() => {
    if (!isNativeShell() || !isDeliveryListenerAvailable()) return
    if (!societyId || !flatNumber) return
    if (consent === 'unknown') setConsentOpen(true)
  }, [societyId, flatNumber, consent])

  useEffect(() => {
    if (!societyId || !flatNumber) return

    if (consent !== 'granted') {
      stopBackgroundDeliveryInterceptor()
      void DeliveryListener.setConsent({ consent: 'denied' }).catch(() => undefined)
      return
    }

    let disposed = false
    let stop: (() => void) | undefined

    void startBackgroundDeliveryInterceptor({
      societyId,
      flatNumber,
      userId
    }).then((dispose) => {
      if (disposed) dispose()
      else stop = dispose
    })

    return () => {
      disposed = true
      stop?.()
      stopBackgroundDeliveryInterceptor()
    }
  }, [societyId, flatNumber, userId, consent])

  if (!isNativeShell() || !isDeliveryListenerAvailable()) return null

  return (
    <SMSConsentModal
      open={consentOpen}
      onClose={() => setConsentOpen(false)}
      onGranted={() => setConsent('granted')}
      onDenied={() => setConsent('denied')}
    />
  )
}
