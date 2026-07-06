/** Syncra Society Android app — download paths and Capacitor shell config. */

export const SYNCRA_ANDROID_APP_ORIGIN =
  import.meta.env.VITE_SYNCRA_APP_ORIGIN || 'https://syncra-society.vercel.app'

export const SYNCRA_ANDROID_APK_FILENAME = 'syncra-society-latest.apk'

export const SYNCRA_ANDROID_APK_PATH = `/downloads/${SYNCRA_ANDROID_APK_FILENAME}`

export const SYNCRA_ANDROID_APK_URL = `${SYNCRA_ANDROID_APP_ORIGIN}${SYNCRA_ANDROID_APK_PATH}`

export const SYNCRA_ANDROID_LANDING_PATH = '/downloads/android.html'

export const SYNCRA_ANDROID_DOWNLOAD_API = '/api/android-download'

export const SYNCRA_ANDROID_UPDATE_PATH = '/downloads/android-update.json'

export const SYNCRA_CAPACITOR_APP_ID = 'in.syncrasystems.society'

export const SYNCRA_CAPACITOR_APP_NAME = 'Syncra Society'
