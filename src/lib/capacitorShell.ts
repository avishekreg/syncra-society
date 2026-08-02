import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { startOtaLiveUpdateController, syncOtaLiveUpdate } from './otaLiveUpdate'

export function isNativeShell(): boolean {
  return Capacitor.isNativePlatform()
}

export const NATIVE_LOGIN_PATH = '/auth/login'

const DOUBLE_BACK_MS = 2000
const EXIT_HINT_TOAST_ID = 'mai-android-exit-hint'

function showExitHintToast(message: string) {
  if (typeof document === 'undefined') return

  const existing = document.getElementById(EXIT_HINT_TOAST_ID)
  if (existing) existing.remove()

  const toast = document.createElement('div')
  toast.id = EXIT_HINT_TOAST_ID
  toast.setAttribute('role', 'status')
  toast.setAttribute('aria-live', 'polite')
  toast.textContent = message
  Object.assign(toast.style, {
    position: 'fixed',
    left: '50%',
    bottom: '28px',
    transform: 'translateX(-50%)',
    zIndex: '99999',
    maxWidth: '90vw',
    padding: '10px 16px',
    borderRadius: '10px',
    background: 'rgba(15, 23, 42, 0.92)',
    color: '#f8fafc',
    fontSize: '14px',
    fontWeight: '600',
    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.28)',
    pointerEvents: 'none'
  })
  document.body.appendChild(toast)
  window.setTimeout(() => {
    toast.remove()
  }, DOUBLE_BACK_MS)
}

/**
 * Android hardware back:
 * - Navigate back when history allows.
 * - At root: first press shows a hint; second press within 2s sends the app to the background.
 */
function startAndroidDoubleBackToBackground(): () => void {
  if (Capacitor.getPlatform() !== 'android') return () => undefined

  let lastRootBackAt = 0

  const handle = App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      lastRootBackAt = 0
      window.history.back()
      return
    }

    const now = Date.now()
    if (now - lastRootBackAt <= DOUBLE_BACK_MS) {
      lastRootBackAt = 0
      document.getElementById(EXIT_HINT_TOAST_ID)?.remove()
      void App.minimizeApp()
      return
    }

    lastRootBackAt = now
    showExitHintToast('Press back again to exit')
  })

  return () => {
    void handle.then((listener) => listener.remove())
  }
}

/**
 * Native shell lifecycle:
 * - Silent OTA live updates on launch / resume / visibility (maiRide-style)
 * - Double-back minimizes the Android task
 */
export function startNativeShellLifecycle(): () => void {
  if (!isNativeShell()) return () => undefined

  const teardown: Array<() => void> = []

  teardown.push(startOtaLiveUpdateController())
  teardown.push(startAndroidDoubleBackToBackground())

  void App.addListener('appStateChange', ({ isActive }) => {
    if (isActive) {
      void syncOtaLiveUpdate({ allowReload: true })
    }
  }).then((listener) => {
    teardown.push(() => {
      void listener.remove()
    })
  })

  void App.addListener('resume', () => {
    void syncOtaLiveUpdate({ allowReload: true })
  }).then((listener) => {
    teardown.push(() => {
      void listener.remove()
    })
  })

  return () => {
    teardown.forEach((dispose) => dispose())
  }
}

/** @deprecated Use syncOtaLiveUpdate — kept for any residual imports. */
export async function validateRemoteDeployment(forceReloadOnChange = true): Promise<boolean> {
  return syncOtaLiveUpdate({ allowReload: forceReloadOnChange })
}
