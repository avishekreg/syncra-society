import { useCallback, useEffect, useState } from 'react'
import {
  fetchSocietySubscription,
  fetchUsageCounter,
  mockActivateWhatsAppAddon,
  mockUpgradeSubscription,
  type MockUpgradePlan
} from '../api/subscriptions'
import type { SaasSubscription, UsageCounter } from '../types/db'

export function useSaasBilling(societyId: string | null | undefined) {
  const [subscription, setSubscription] = useState<SaasSubscription | null>(null)
  const [usage, setUsage] = useState<UsageCounter | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!societyId) {
      setSubscription(null)
      setUsage(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const [sub, counter] = await Promise.all([
        fetchSocietySubscription(societyId),
        fetchUsageCounter(societyId)
      ])
      setSubscription(sub)
      setUsage(counter)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load subscription telemetry.')
    } finally {
      setLoading(false)
    }
  }, [societyId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const upgradeMock = useCallback(
    async (planType: MockUpgradePlan) => {
      if (!societyId) return null
      const updated = await mockUpgradeSubscription(societyId, planType)
      setSubscription(updated)
      return updated
    },
    [societyId]
  )

  const activateWhatsAppAddonMock = useCallback(async () => {
    if (!societyId) return null
    const updated = await mockActivateWhatsAppAddon(societyId)
    setUsage(updated)
    return updated
  }, [societyId])

  return {
    subscription,
    usage,
    loading,
    error,
    refresh,
    upgradeMock,
    activateWhatsAppAddonMock
  }
}
