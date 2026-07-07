const SOCIETIES_TABLE = 'societies'
const BILLING_RULES_TABLE = 'society_billing_rules'
const USER_AND_FLATS_TABLE = 'user_and_flats'

const SUPABASE_URL_KEYS = ['SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'VITE_SUPABASE_URL'] as const
const SUPABASE_SERVICE_KEYS = ['SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SERVICE_KEY', 'SERVICE_ROLE_KEY'] as const
const SUPABASE_ANON_KEYS = ['SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY'] as const

type SocietyBillingRules = {
  society_id: string
  maintenance_due_date: number
  late_fee_grace_period_days: number
  late_fee_flat_amount: number
  interest_rate_percentage: number
}

type ResidentProfile = {
  flat_number: string
  name: string
  phone?: string | null
  whatsapp_number?: string | null
  opening_outstanding_balance?: number | null
}

function readEnvVar(...keys: readonly string[]): string {
  for (const key of keys) {
    const raw = process.env[key]
    if (typeof raw === 'string' && raw.trim()) return raw.trim()
  }
  return ''
}

function normalizeSupabaseUrl(raw: string): string {
  if (!raw) return ''
  let url = raw.trim().replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '')
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`
  return url
}

function buildRestUrl(baseUrl: string, path: string): string {
  return `${normalizeSupabaseUrl(baseUrl)}/rest/v1/${path.replace(/^\//, '')}`
}

function adminHeaders(apiKey: string) {
  return {
    'Content-Type': 'application/json',
    apikey: apiKey,
    Authorization: `Bearer ${apiKey}`
  }
}

async function supabaseGet<T>(url: string, apiKey: string, path: string): Promise<T> {
  const response = await fetch(buildRestUrl(url, path), { headers: adminHeaders(apiKey) })
  const text = await response.text()
  if (!response.ok) throw new Error(text || `Supabase GET failed (${response.status})`)
  return text ? (JSON.parse(text) as T) : ([] as T)
}

function computeBill(profile: ResidentProfile, rules: SocietyBillingRules, reference = new Date()) {
  const baseOutstanding = Number(profile.opening_outstanding_balance ?? 0)
  const dueDay = Math.min(Math.max(rules.maintenance_due_date, 1), 28)
  const dueDate = new Date(reference.getFullYear(), reference.getMonth(), dueDay, 23, 59, 59, 999)
  const graceEndsAt = new Date(dueDate)
  graceEndsAt.setDate(graceEndsAt.getDate() + rules.late_fee_grace_period_days)

  const msPerDay = 86400000
  let status: 'paid' | 'due_soon' | 'due' | 'grace' | 'overdue' = 'paid'
  if (baseOutstanding <= 0) status = 'paid'
  else if (reference.getTime() > graceEndsAt.getTime()) status = 'overdue'
  else if (reference.getTime() > dueDate.getTime()) status = 'grace'
  else {
    const daysUntilDue = Math.ceil((dueDate.getTime() - reference.getTime()) / msPerDay)
    status = daysUntilDue <= 3 ? 'due_soon' : 'due'
  }

  const daysPastDue =
    reference.getTime() > graceEndsAt.getTime()
      ? Math.floor((reference.getTime() - graceEndsAt.getTime()) / msPerDay)
      : 0
  const lateFeeApplied =
    baseOutstanding > 0 && reference.getTime() > graceEndsAt.getTime()
      ? Number(rules.late_fee_flat_amount ?? 0)
      : 0
  const monthsOverdue = daysPastDue > 0 ? Math.max(1, Math.ceil(daysPastDue / 30)) : 0
  const interestApplied =
    baseOutstanding > 0 && monthsOverdue > 0
      ? Math.round(baseOutstanding * (Number(rules.interest_rate_percentage) / 100) * monthsOverdue * 100) / 100
      : 0

  return {
    baseOutstanding,
    totalDue: Math.round((baseOutstanding + lateFeeApplied + interestApplied) * 100) / 100,
    lateFeeApplied,
    status,
    dueDate,
    graceEndsAt
  }
}

function shouldSendReminderToday(rules: SocietyBillingRules, reference = new Date()): boolean {
  const day = reference.getDate()
  const dueDay = rules.maintenance_due_date
  if (day === dueDay) return true
  if (day === dueDay - 3) return true
  if (day === dueDay + rules.late_fee_grace_period_days + 1) return true
  return false
}

function buildReminderMessage(societyName: string, profile: ResidentProfile, rules: SocietyBillingRules, bill: ReturnType<typeof computeBill>) {
  if (bill.status === 'overdue') {
    return `*${societyName}* — Late Fee Alert\n\nFlat ${profile.flat_number}: ₹${bill.totalDue.toLocaleString('en-IN')} overdue (incl. ₹${bill.lateFeeApplied.toLocaleString('en-IN')} late fee). Due date was the ${rules.maintenance_due_date}th. Pay via Syncra Society portal.`
  }
  if (bill.status === 'grace') {
    return `*${societyName}* — Grace Period Ending\n\nFlat ${profile.flat_number}: ₹${bill.baseOutstanding.toLocaleString('en-IN')} is in grace until ${bill.graceEndsAt.toLocaleDateString('en-IN')}. Late fee ₹${Number(rules.late_fee_flat_amount).toLocaleString('en-IN')} applies after.`
  }
  return `*${societyName}* — Maintenance Reminder\n\nFlat ${profile.flat_number}: ₹${bill.baseOutstanding.toLocaleString('en-IN')} due by the ${rules.maintenance_due_date}th. Pay on time via Syncra Society portal.`
}

async function dispatchPaymentEvent(input: {
  webhookUrl: string
  societyId: string
  societyName: string
  flatNumber: string
  phone: string
  message: string
  eventType: string
}) {
  const payload = {
    eventId: `pay-${Date.now()}-${input.flatNumber}`,
    type: input.eventType,
    societyId: input.societyId,
    societyName: input.societyName,
    flatNumber: input.flatNumber,
    summary: input.message.split('\n')[0] ?? 'Payment reminder',
    occurredAt: new Date().toISOString(),
    receiver_whatsapp: input.phone,
    message_body: input.message
  }

  const response = await fetch(input.webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  return { ok: response.ok, status: response.status }
}

module.exports = async function handler(
  req: import('@vercel/node').VercelRequest,
  res: import('@vercel/node').VercelResponse
) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-syncra-automation-secret, Authorization')

  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const secret = readEnvVar('SYNCRA_AUTOMATION_SECRET', 'CRON_SECRET') || 'syncra-local-dev-secret'
  const headerSecret =
    typeof req.headers['x-syncra-automation-secret'] === 'string'
      ? req.headers['x-syncra-automation-secret'].trim()
      : ''
  const authHeader =
    typeof req.headers.authorization === 'string'
      ? req.headers.authorization.replace(/^Bearer\s+/i, '').trim()
      : ''
  const provided = headerSecret || authHeader

  if (!provided || provided !== secret) {
    return res.status(401).json({ error: 'Invalid automation secret' })
  }

  const supabaseUrl = normalizeSupabaseUrl(readEnvVar(...SUPABASE_URL_KEYS))
  const apiKey = readEnvVar(...SUPABASE_SERVICE_KEYS) || readEnvVar(...SUPABASE_ANON_KEYS)
  if (!supabaseUrl || !apiKey) {
    return res.status(500).json({ error: 'Supabase is not configured for reminders' })
  }

  const n8nWebhook =
    readEnvVar('N8N_WEBHOOK_URL') || 'https://avishekreg-syncra-society.hf.space/webhook/syncra-society'
  const societyFilter = typeof req.query.societyId === 'string' ? req.query.societyId : null
  const reference = new Date()
  const forceRun = req.query.force === 'true'

  try {
    const rulesPath = societyFilter
      ? `${BILLING_RULES_TABLE}?society_id=eq.${encodeURIComponent(societyFilter)}`
      : `${BILLING_RULES_TABLE}?select=*`
    const rulesRows = await supabaseGet<SocietyBillingRules[]>(supabaseUrl, apiKey, rulesPath)

    const dispatched: Array<{ societyId: string; flatNumber: string; status: string; ok: boolean }> = []

    for (const rules of rulesRows) {
      if (!forceRun && !shouldSendReminderToday(rules, reference)) continue

      const societies = await supabaseGet<Array<{ id: string; name: string }>>(
        supabaseUrl,
        apiKey,
        `${SOCIETIES_TABLE}?id=eq.${encodeURIComponent(rules.society_id)}&select=id,name&limit=1`
      )
      const societyName = societies[0]?.name ?? 'Your Society'

      const residents = await supabaseGet<ResidentProfile[]>(
        supabaseUrl,
        apiKey,
        `${USER_AND_FLATS_TABLE}?society_id=eq.${encodeURIComponent(rules.society_id)}&role=eq.resident&select=flat_number,name,phone,whatsapp_number,opening_outstanding_balance`
      )

      for (const profile of residents) {
        const bill = computeBill(profile, rules, reference)
        if (bill.baseOutstanding <= 0 && bill.status === 'paid') continue
        if (!forceRun && bill.status !== 'due_soon' && bill.status !== 'grace' && bill.status !== 'overdue' && reference.getDate() !== rules.maintenance_due_date) {
          continue
        }

        const phone = profile.whatsapp_number || profile.phone
        if (!phone) continue

        const message = buildReminderMessage(societyName, profile, rules, bill)
        const eventType = bill.status === 'overdue' ? 'payment.late_fee' : 'payment.reminder'
        const result = await dispatchPaymentEvent({
          webhookUrl: n8nWebhook,
          societyId: rules.society_id,
          societyName,
          flatNumber: profile.flat_number,
          phone,
          message,
          eventType
        })

        dispatched.push({
          societyId: rules.society_id,
          flatNumber: profile.flat_number,
          status: bill.status,
          ok: result.ok
        })
      }
    }

    return res.status(200).json({
      success: true,
      action: 'billing_reminders_dispatched',
      referenceDate: reference.toISOString(),
      count: dispatched.length,
      dispatched
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Reminder dispatch failed'
    console.error('[automation/reminders]', message)
    return res.status(500).json({ error: message })
  }
}
