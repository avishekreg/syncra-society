import type { VercelRequest, VercelResponse } from '@vercel/node'

const DEFAULT_APK_URL = 'https://syncra-society.vercel.app/downloads/syncra-society-latest.apk'

function resolveApkUrl() {
  return (
    process.env.SYNCRA_ANDROID_APK_URL ||
    process.env.VITE_SYNCRA_ANDROID_APK_URL ||
    DEFAULT_APK_URL
  )
}

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

  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Location', resolveApkUrl())
  return res.status(302).end()
}
