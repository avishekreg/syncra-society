import type { VercelRequest, VercelResponse } from '@vercel/node'

const DEFAULT_APK_PATH = '/downloads/syncra-society-latest.apk'

function resolveApkPath() {
  const fromEnv = process.env.SYNCRA_ANDROID_APK_URL || process.env.VITE_SYNCRA_ANDROID_APK_URL
  if (fromEnv) {
    try {
      return new URL(fromEnv).pathname
    } catch {
      if (fromEnv.startsWith('/')) return fromEnv
    }
  }
  return DEFAULT_APK_PATH
}

/** Redirect to the static APK asset (attachment headers applied in vercel.json). */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    return res.status(204).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apkPath = resolveApkPath()

  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Location', apkPath)
  return res.status(307).end()
}
