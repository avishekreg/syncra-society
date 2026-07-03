import { useEffect, useState } from 'react'
import {
  fetchPlatformPricing,
  getPlatformPricing,
  PRICING_UPDATED_EVENT,
  type PlatformPricingConfig
} from '../lib/platformPricing'

export function usePlatformPricing() {
  const [pricing, setPricing] = useState<PlatformPricingConfig>(() => getPlatformPricing())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    void fetchPlatformPricing().then((config) => {
      if (active) setPricing(config)
      if (active) setLoading(false)
    })

    function refresh() {
      setPricing(getPlatformPricing())
    }

    window.addEventListener(PRICING_UPDATED_EVENT, refresh)
    window.addEventListener('storage', refresh)

    return () => {
      active = false
      window.removeEventListener(PRICING_UPDATED_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  return { pricing, loading }
}
