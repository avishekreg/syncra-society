/**
 * Runtime deployment stamp for Capacitor OTA live updates.
 * Mirrors maiRide `/api/health?action=build-stamp`.
 */
module.exports = async function handler(
  req: import('@vercel/node').VercelRequest,
  res: import('@vercel/node').VercelResponse
) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    return res.status(204).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const commitSha = String(process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || '').trim()
  const deployId = String(process.env.VERCEL_DEPLOYMENT_ID || '').trim()
  const appVersion = String(process.env.VITE_APP_VERSION || process.env.npm_package_version || 'v1.0.0').trim()

  const payload = {
    ok: true,
    appVersion,
    buildSha: commitSha || deployId || 'unknown',
    commitSha,
    commitRef: String(process.env.VERCEL_GIT_COMMIT_REF || '').trim(),
    commitMessage: String(process.env.VERCEL_GIT_COMMIT_MESSAGE || '').trim(),
    deployId,
    env: String(process.env.VERCEL_ENV || process.env.NODE_ENV || '').trim(),
    vercelUrl: String(process.env.VERCEL_URL || '').trim(),
    builtAt: new Date().toISOString()
  }

  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')
  res.setHeader('Access-Control-Allow-Origin', '*')
  return res.status(200).json(payload)
}
