import { useEffect, useState } from 'react'
import { useAuth } from '../providers/AuthProvider'
import {
  isSocietyUuid,
  resolveActiveSocietyKey,
  resolveSocietyName,
  resolveSocietyUuid
} from '../lib/resolveSocietyContext'
import { resolveSocietyUuidFromRemote } from '../api/societies'

/** Resolves the active society to a PostgreSQL UUID for integrations and FK inserts. */
export function useResolvedSocietyUuid() {
  const { currentSocietyId, showcaseData } = useAuth()
  const societyKey = resolveActiveSocietyKey(currentSocietyId, showcaseData?.society.id)
  const societyName = showcaseData?.society.name ?? null

  const [uuid, setUuid] = useState<string | null>(() => {
    if (!societyKey) return null
    const mapped = resolveSocietyUuid(societyKey)
    if (mapped && isSocietyUuid(mapped)) return mapped
    if (isSocietyUuid(societyKey)) return societyKey
    return null
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true

    if (!societyKey) {
      setUuid(null)
      setLoading(false)
      return
    }

    const mapped = resolveSocietyUuid(societyKey)
    if (mapped && isSocietyUuid(mapped)) {
      setUuid(mapped)
      setLoading(false)
      return
    }

    if (isSocietyUuid(societyKey)) {
      setUuid(societyKey)
      setLoading(false)
      return
    }

    setLoading(true)
    void resolveSocietyUuidFromRemote(societyKey, societyName).then((remote) => {
      if (!active) return
      setUuid(remote && isSocietyUuid(remote) ? remote : mapped)
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [societyKey, societyName])

  const displayName = resolveSocietyName(societyKey, societyName)

  return { uuid, loading, displayName, societyKey }
}
