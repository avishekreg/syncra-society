import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { SYNCRA_ANDROID_APP_ORIGIN, SYNCRA_APP_VERSION_MANIFEST } from './androidApp'

const OTA_BUILD_SHA_KEY = 'syncra_ota_build_sha'

export function isNativeShell(): boolean {
  return Capacitor.isNativePlatform()
}

export const NATIVE_LOGIN_PATH = '/auth/login'

type AppVersionManifest = {
  buildSha?: string
  builtAt?: string
  appVersion?: string
}

function productionOrigin(): string {
  return isNativeShell() ? SYNCRA_ANDROID_APP_ORIGIN : window.location.origin
}

/** Compare deployed manifest against cached build SHA; reload when production moved ahead. */
export async function validateRemoteDeployment(forceReloadOnChange = true): Promise<boolean> {
  if (!navigator.onLine) return false

  const manifestUrl = `${productionOrigin()}${SYNCRA_APP_VERSION_MANIFEST}?t=${Date.now()}`

  try {
    const response = await fetch(manifestUrl, {
      cache: 'no-store',
      headers: { Accept: 'application/json' }
    })
    if (!response.ok) return false

    const manifest = (await response.json()) as AppVersionManifest
    const remoteSha = manifest.buildSha?.trim()
    if (!remoteSha) return false

    const cachedSha = sessionStorage.getItem(OTA_BUILD_SHA_KEY)
    sessionStorage.setItem(OTA_BUILD_SHA_KEY, remoteSha)

    if (cachedSha && cachedSha !== remoteSha && forceReloadOnChange) {
      window.location.reload()
      return true
    }

    return false
  } catch {
    return false
  }
}

/** Native-only foreground OTA sync: validate deployment when app resumes. */
export function startNativeShellLifecycle(): () => void {
  if (!isNativeShell()) return () => undefined

  const teardown: Array<() => void> = []

  void validateRemoteDeployment(false)

  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      void validateRemoteDeployment(true)
    }
  }

  document.addEventListener('visibilitychange', onVisibilityChange)
  teardown.push(() => document.removeEventListener('visibilitychange', onVisibilityChange))

  void App.addListener('appStateChange', ({ isActive }) => {
    if (isActive) {
      void validateRemoteDeployment(true)
    }
  }).then((listener) => {
    teardown.push(() => {
      void listener.remove()
    })
  })

  return () => {
    teardown.forEach((dispose) => dispose())
  }
}
