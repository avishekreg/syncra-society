/**
 * Silent OTA live-update controller for the Capacitor Android shell.
 * Pattern aligned with maiRide: compare remote build identity on launch/resume,
 * prefetch fresh HTML, then soft-reload without clearing auth storage.
 */

import { Capacitor } from '@capacitor/core'
import { SYNCRA_ANDROID_APP_ORIGIN, SYNCRA_APP_VERSION_MANIFEST, SYNCRA_APP_VERSION_API } from './androidApp'

const OTA_IDENTITY_KEY = 'mai_ota_build_identity'
const OTA_CHECK_MIN_INTERVAL_MS = 4_000
const OTA_RELOAD_GUARD_KEY = 'mai_ota_reload_guard'

type RemoteBuildStamp = {
  appVersion?: string
  buildSha?: string
  commitSha?: string
  deployId?: string
  builtAt?: string
}

let checkInFlight: Promise<boolean> | null = null
let lastCheckAt = 0
let memoryIdentity: string | null = null
let reloadScheduled = false

function isNativeShellRuntime(): boolean {
  return Capacitor.isNativePlatform()
}

function productionOrigin(): string {
  return isNativeShellRuntime() ? SYNCRA_ANDROID_APP_ORIGIN : window.location.origin
}

function readStoredIdentity(): string | null {
  try {
    return localStorage.getItem(OTA_IDENTITY_KEY)?.trim() || null
  } catch {
    return null
  }
}

function writeStoredIdentity(identity: string) {
  memoryIdentity = identity
  try {
    localStorage.setItem(OTA_IDENTITY_KEY, identity)
  } catch {
    /* ignore quota / private mode */
  }
}

function resolveIdentity(stamp: RemoteBuildStamp): string | null {
  const identity = String(
    stamp.commitSha || stamp.deployId || stamp.buildSha || stamp.appVersion || stamp.builtAt || ''
  ).trim()
  return identity || null
}

async function fetchJsonNoStore(url: string): Promise<RemoteBuildStamp | null> {
  const response = await fetch(url, {
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      'Cache-Control': 'no-cache'
    }
  })
  if (!response.ok) return null
  return (await response.json()) as RemoteBuildStamp
}

/** Prefer live Vercel stamp; fall back to build-time app-version.json. */
async function fetchRemoteBuildStamp(): Promise<RemoteBuildStamp | null> {
  const origin = productionOrigin()
  const bust = Date.now()

  try {
    const live = await fetchJsonNoStore(`${origin}${SYNCRA_APP_VERSION_API}?t=${bust}`)
    if (live && resolveIdentity(live)) return live
  } catch {
    /* fall through */
  }

  try {
    return await fetchJsonNoStore(`${origin}${SYNCRA_APP_VERSION_MANIFEST}?t=${bust}`)
  } catch {
    return null
  }
}

/**
 * Warm the WebView HTTP cache for the document entrypoint, then reload.
 * Auth tokens in localStorage survive across the reload.
 */
async function softReloadLiveBundle() {
  if (reloadScheduled) return
  reloadScheduled = true

  const origin = productionOrigin()

  try {
    sessionStorage.setItem(OTA_RELOAD_GUARD_KEY, String(Date.now()))
  } catch {
    /* ignore */
  }

  try {
    await Promise.allSettled([
      fetch(`${origin}/?ota=${Date.now()}`, {
        cache: 'reload',
        credentials: 'same-origin',
        headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' }
      }),
      fetch(`${origin}/index.html?ota=${Date.now()}`, {
        cache: 'reload',
        credentials: 'same-origin',
        headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' }
      })
    ])
  } catch {
    /* continue to reload even if prefetch fails */
  }

  window.location.reload()
}

/**
 * Compare local vs remote deployment identity.
 * @returns true when a reload was triggered
 */
export async function syncOtaLiveUpdate(options?: { allowReload?: boolean }): Promise<boolean> {
  const allowReload = options?.allowReload !== false

  if (typeof window === 'undefined') return false
  if (!navigator.onLine) return false

  const now = Date.now()
  if (checkInFlight) return checkInFlight
  if (now - lastCheckAt < OTA_CHECK_MIN_INTERVAL_MS) return false

  lastCheckAt = now

  checkInFlight = (async () => {
    try {
      // Skip immediate re-check after we just applied an OTA reload.
      try {
        const guard = sessionStorage.getItem(OTA_RELOAD_GUARD_KEY)
        if (guard) {
          const age = now - Number(guard)
          if (Number.isFinite(age) && age >= 0 && age < 8_000) {
            sessionStorage.removeItem(OTA_RELOAD_GUARD_KEY)
            const stamp = await fetchRemoteBuildStamp()
            const identity = stamp ? resolveIdentity(stamp) : null
            if (identity) writeStoredIdentity(identity)
            return false
          }
          sessionStorage.removeItem(OTA_RELOAD_GUARD_KEY)
        }
      } catch {
        /* ignore */
      }

      const stamp = await fetchRemoteBuildStamp()
      if (!stamp) return false

      const remoteIdentity = resolveIdentity(stamp)
      if (!remoteIdentity) return false

      const cachedIdentity = memoryIdentity || readStoredIdentity()

      if (!cachedIdentity) {
        writeStoredIdentity(remoteIdentity)
        return false
      }

      if (cachedIdentity === remoteIdentity) {
        memoryIdentity = remoteIdentity
        return false
      }

      writeStoredIdentity(remoteIdentity)

      if (!allowReload) return false

      await softReloadLiveBundle()
      return true
    } catch {
      return false
    } finally {
      checkInFlight = null
    }
  })()

  return checkInFlight
}

/** Launch + resume OTA watcher (native shell only). */
export function startOtaLiveUpdateController(): () => void {
  if (!isNativeShellRuntime()) return () => undefined

  const teardown: Array<() => void> = []

  // Cold start: seed identity, or soft-reload if a newer deployment is already live.
  void syncOtaLiveUpdate({ allowReload: true })

  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      void syncOtaLiveUpdate({ allowReload: true })
    }
  }
  document.addEventListener('visibilitychange', onVisibilityChange)
  teardown.push(() => document.removeEventListener('visibilitychange', onVisibilityChange))

  const onPageShow = (event: PageTransitionEvent) => {
    if (event.persisted) {
      void syncOtaLiveUpdate({ allowReload: true })
    }
  }
  window.addEventListener('pageshow', onPageShow)
  teardown.push(() => window.removeEventListener('pageshow', onPageShow))

  return () => {
    teardown.forEach((dispose) => dispose())
  }
}
