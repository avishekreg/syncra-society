function supabaseConfig() {
  const url = (process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '')
    .replace(/\/rest\/v1\/?$/i, '')
    .replace(/\/+$/, '')
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  return { url, serviceKey }
}

function adminHeaders(serviceKey: string) {
  return {
    'Content-Type': 'application/json',
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    Prefer: 'return=representation'
  }
}

function setCors(res: import('@vercel/node').VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey, x-super-admin-key')
}

module.exports = async function handler(
  req: import('@vercel/node').VercelRequest,
  res: import('@vercel/node').VercelResponse
) {
  setCors(res)
  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  const { url, serviceKey } = supabaseConfig()
  if (!url || !serviceKey) {
    return res.status(503).json({ error: 'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured' })
  }

  const restBase = `${url}/rest/v1/societies`
  const select =
    'id,name,address,created_at,subscription_tier,subscription_status,pricing_slab_id,total_flats,opening_bank_balance'

  try {
    if (req.method === 'GET') {
      const response = await fetch(`${restBase}?select=${select}&order=created_at.desc`, {
        headers: adminHeaders(serviceKey)
      })
      const text = await response.text()
      if (!response.ok) {
        return res.status(response.status).json({ error: text || response.statusText })
      }
      return res.status(200).json(text ? JSON.parse(text) : [])
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const response = await fetch(restBase, {
        method: 'POST',
        headers: adminHeaders(serviceKey),
        body: JSON.stringify({
          name: body.name,
          address: body.address,
          subscription_tier: body.subscription_tier ?? 'basic',
          total_flats: body.total_flats ?? null,
          pricing_slab_id: body.pricing_slab_id ?? 'tier2'
        })
      })
      const text = await response.text()
      if (!response.ok) {
        return res.status(response.status).json({ error: text || response.statusText })
      }
      const rows = text ? JSON.parse(text) : []
      const row = Array.isArray(rows) ? rows[0] : rows
      return res.status(201).json(row)
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Societies API failed'
    })
  }
}
