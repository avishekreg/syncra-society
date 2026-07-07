const COMPLAINTS_TABLE = 'complaints_and_suggestions'
const SOCIETIES_TABLE = 'societies'
const USER_AND_FLATS_TABLE = 'user_and_flats'
const FLATS_TABLE = 'flats'
const SYSTEM_AUTOMATION_USER_ID = 'system-whatsapp-automation'
const EMERGENCY_SOCIETY_ID = '00000000-0000-4000-8000-000000000001'
const DEFAULT_WHATSAPP_DESCRIPTION = 'No description provided via WhatsApp'
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type MessageType = 'ticket' | 'payment_receipt' | 'general' | 'text'

type NormalizedInbound = {
  societyId: string | null
  flatNumber: string | null
  phone: string
  messageType: MessageType
  subject: string | null
  description: string | null
  amount: number | null
  reference: string | null
}

type SupabaseErrorDetails = {
  message: string
  details: string | null
  hint: string | null
  code: string | null
  status: number
  raw: string
}

type HandlerError = Error & {
  statusCode?: number
  supabase?: SupabaseErrorDetails
}

type SupabaseRuntimeConfig = {
  url: string
  apiKey: string
  keySource: 'service_role' | 'anon' | 'none'
}

const SUPABASE_URL_KEYS = [
  'SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'VITE_SUPABASE_URL',
  'SUPABASE_PROJECT_URL'
] as const

const SUPABASE_SERVICE_KEYS = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_SERVICE_KEY',
  'SUPABASE_SECRET_KEY',
  'SERVICE_ROLE_KEY'
] as const

const SUPABASE_ANON_KEYS = [
  'SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'VITE_SUPABASE_ANON_KEY'
] as const

function readEnvVar(...keys: readonly string[]): string {
  for (const key of keys) {
    const raw = process.env[key]
    if (typeof raw !== 'string') continue
    const trimmed = raw.trim()
    if (trimmed) return trimmed
  }
  return ''
}

function normalizeSupabaseUrl(raw: string): string {
  if (!raw) return ''
  let url = raw.trim().replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '')
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`
  }
  return url
}

function buildRestUrl(baseUrl: string, path: string): string {
  const normalizedBase = normalizeSupabaseUrl(baseUrl)
  const normalizedPath = path.replace(/^\//, '')
  return `${normalizedBase}/rest/v1/${normalizedPath}`
}

function normalizeDescription(description: string | null): string {
  if (!description || !description.trim()) {
    return DEFAULT_WHATSAPP_DESCRIPTION
  }
  return description.trim()
}

function supabaseConfig(): SupabaseRuntimeConfig {
  const url = normalizeSupabaseUrl(readEnvVar(...SUPABASE_URL_KEYS))
  const serviceKey = readEnvVar(...SUPABASE_SERVICE_KEYS)
  const anonKey = readEnvVar(...SUPABASE_ANON_KEYS)
  const apiKey = serviceKey || anonKey

  return {
    url,
    apiKey,
    keySource: serviceKey ? 'service_role' : anonKey ? 'anon' : 'none'
  }
}

function supabaseEnvDiagnostics() {
  const flag = (keys: readonly string[]) =>
    Object.fromEntries(keys.map((key) => [key, Boolean(readEnvVar(key))]))

  return {
    url: flag(SUPABASE_URL_KEYS),
    service: flag(SUPABASE_SERVICE_KEYS),
    anon: flag(SUPABASE_ANON_KEYS)
  }
}

function logMissingSupabaseConfig(config: SupabaseRuntimeConfig) {
  console.error('[automation/inbound] Missing Supabase configuration', {
    resolvedUrl: Boolean(config.url),
    resolvedApiKey: Boolean(config.apiKey),
    keySource: config.keySource,
    env: supabaseEnvDiagnostics()
  })
}

function adminHeaders(apiKey: string) {
  return {
    'Content-Type': 'application/json',
    apikey: apiKey,
    Authorization: `Bearer ${apiKey}`,
    Prefer: 'return=representation'
  }
}

function setCors(res: import('@vercel/node').VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-syncra-automation-secret, x-syncra-response-format')
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function buildTwiml(message: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(message)}</Message></Response>`
}

function isTwilioWebhookPayload(raw: Record<string, unknown>): boolean {
  return Boolean(
    raw.Body ||
      raw.From ||
      raw.To ||
      raw.SmsMessageSid ||
      raw.MessageSid ||
      raw.WaId ||
      raw.ProfileName
  )
}

function shouldRespondWithTwiml(req: import('@vercel/node').VercelRequest): boolean {
  const formatHeader = safeString(req.headers['x-syncra-response-format']).toLowerCase()
  if (formatHeader === 'json') return false
  if (formatHeader === 'twiml' || formatHeader === 'xml') return true

  const merged = unwrapRecord(req.body)
  if (isTwilioWebhookPayload(merged)) return true

  const accept = safeString(req.headers.accept).toLowerCase()
  if (accept.includes('application/xml') || accept.includes('text/xml')) return true

  // n8n → portal bridge for WhatsApp inbound defaults to TwiML unless JSON explicitly requested.
  if (safeString(req.headers['x-syncra-automation-secret'])) return true

  return false
}

function sendTwiml(res: import('@vercel/node').VercelResponse, status: number, message: string) {
  res.setHeader('Content-Type', 'text/xml; charset=utf-8')
  return res.status(status).send(buildTwiml(message))
}

function sendHandlerResponse(
  res: import('@vercel/node').VercelResponse,
  req: import('@vercel/node').VercelRequest,
  status: number,
  payload: Record<string, unknown>,
  whatsappMessage?: string
) {
  if (shouldRespondWithTwiml(req)) {
    const message =
      whatsappMessage ||
      safeString(payload.message) ||
      (status >= 400
        ? 'Syncra Society: We could not process your WhatsApp message. Please try again or contact your society office.'
        : 'Syncra Society: Your message has been received.')
    // Twilio webhooks expect HTTP 200 even for handled application errors.
    const twilioStatus = isTwilioWebhookPayload(unwrapRecord(req.body)) ? 200 : status
    return sendTwiml(res, twilioStatus, message)
  }

  return res.status(status).json(payload)
}

async function generateWhatsAppReply(input: {
  messageType: MessageType
  description: string | null
  flatNumber: string | null
  ticketId: string
}): Promise<string> {
  const groqKey = readEnvVar('GROQ_API_KEY')
  const groqModel = readEnvVar('GROQ_MODEL') || 'llama-3.1-8b-instant'

  if (groqKey && input.description) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${groqKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: groqModel,
          temperature: 0.3,
          max_tokens: 140,
          messages: [
            {
              role: 'system',
              content:
                'You are Syncra Society WhatsApp assistant. Reply in at most 2 short sentences confirming the resident request was logged. Plain text only, no markdown.'
            },
            {
              role: 'user',
              content: `Type: ${input.messageType}. Flat: ${input.flatNumber ?? 'unknown'}. Message: ${input.description}`
            }
          ]
        })
      })

      if (response.ok) {
        const payload = (await response.json()) as {
          choices?: Array<{ message?: { content?: string } }>
        }
        const generated = payload.choices?.[0]?.message?.content?.trim()
        if (generated) return generated.slice(0, 1000)
      }
    } catch (err) {
      console.warn('[automation/inbound] Groq reply generation failed', err)
    }
  }

  if (input.messageType === 'payment_receipt') {
    return 'Syncra Society: Your payment receipt has been received. Our accounts team will verify and update your ledger shortly.'
  }

  const flatHint = input.flatNumber ? ` for Flat ${input.flatNumber}` : ''
  return `Syncra Society: Your helpdesk ticket${flatHint} has been registered (Ref ${input.ticketId.slice(0, 8)}). Our team will review it shortly.`
}

function safeString(value: unknown, fallback = ''): string {
  if (value == null) return fallback
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value).trim()
  return fallback
}

function safeNullableString(value: unknown): string | null {
  const valueText = safeString(value)
  return valueText || null
}

function safeNumber(value: unknown): number | null {
  if (value == null || value === '') return null
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizePhoneDigits(phone: string): string {
  return phone.replace(/^whatsapp:/i, '').replace(/\D/g, '')
}

function phoneSearchSuffix(phone: string): string {
  const digits = normalizePhoneDigits(phone)
  if (digits.length >= 10) return digits.slice(-10)
  return digits
}

function unwrapRecord(raw: unknown): Record<string, unknown> {
  if (raw == null) return {}

  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    if (!trimmed) return {}
    try {
      return unwrapRecord(JSON.parse(trimmed))
    } catch {
      return {}
    }
  }

  if (Buffer.isBuffer(raw)) {
    return unwrapRecord(raw.toString('utf8'))
  }

  if (typeof raw !== 'object' || Array.isArray(raw)) return {}

  const record = raw as Record<string, unknown>
  const nestedCandidates = [record.portalPayload, record.payload, record.data, record.body]

  for (const candidate of nestedCandidates) {
    if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
      return { ...record, ...(candidate as Record<string, unknown>) }
    }
    if (typeof candidate === 'string' && candidate.trim()) {
      try {
        const parsed = JSON.parse(candidate)
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return { ...record, ...(parsed as Record<string, unknown>) }
        }
      } catch {
        // Ignore nested JSON parse failures and continue flattening.
      }
    }
  }

  return record
}

function normalizeMessageType(value: unknown): MessageType {
  const normalized = safeString(value).toLowerCase()
  if (normalized === 'payment_receipt' || normalized === 'payment') return 'payment_receipt'
  if (normalized === 'general' || normalized === 'text') return normalized as MessageType
  return 'ticket'
}

function parseInboundBody(req: import('@vercel/node').VercelRequest): NormalizedInbound {
  const merged = unwrapRecord(req.body)

  const description =
    safeString(
      merged.description ??
        merged.text ??
        merged.Body ??
        merged.message ??
        merged.message_body ??
        merged.messageBody
    ) || null

  const societyIdRaw = safeNullableString(merged.societyId ?? merged.society_id ?? merged.societyID)

  return {
    societyId: societyIdRaw,
    flatNumber: safeNullableString(merged.flatNumber ?? merged.flat_number),
    phone:
      safeString(merged.phone ?? merged.From ?? merged.from ?? merged.sender_whatsapp, 'whatsapp-unknown') ||
      'whatsapp-unknown',
    messageType: normalizeMessageType(merged.messageType ?? merged.message_type),
    subject: safeNullableString(merged.subject ?? merged.Subject),
    description,
    amount: safeNumber(merged.amount),
    reference: safeNullableString(merged.reference)
  }
}

function parseSupabaseError(status: number, rawText: string): SupabaseErrorDetails {
  const raw = rawText.trim()
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    return {
      message: safeString(parsed.message, raw || `Supabase request failed (${status})`),
      details: safeNullableString(parsed.details),
      hint: safeNullableString(parsed.hint),
      code: safeNullableString(parsed.code),
      status,
      raw
    }
  } catch {
    return {
      message: raw || `Supabase request failed (${status})`,
      details: null,
      hint: null,
      code: null,
      status,
      raw
    }
  }
}

function logSupabaseError(context: string, error: SupabaseErrorDetails, extra?: Record<string, unknown>) {
  console.error(`[automation/inbound] ${context}`, {
    message: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code,
    status: error.status,
    raw: error.raw,
    ...extra
  })
}

type SupabaseRequestResult = {
  ok: boolean
  status: number
  text: string
  json: unknown
  networkError?: boolean
}

async function supabaseRequest(
  url: string,
  apiKey: string,
  path: string,
  init?: RequestInit
): Promise<SupabaseRequestResult> {
  const restUrl = buildRestUrl(url, path)

  try {
    const response = await fetch(restUrl, {
      ...init,
      headers: {
        ...adminHeaders(apiKey),
        ...(init?.headers ?? {})
      }
    })
    const text = await response.text()
    let json: unknown = null
    if (text) {
      try {
        json = JSON.parse(text)
      } catch {
        json = text
      }
    }
    return { ok: response.ok, status: response.status, text, json }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'fetch failed'
    console.error('[automation/inbound] Supabase fetch failed', {
      message,
      restUrl,
      path
    })
    return {
      ok: false,
      status: 0,
      text: message,
      json: null,
      networkError: true
    }
  }
}

async function fetchFirstSocietyId(url: string, apiKey: string): Promise<string | null> {
  const result = await supabaseRequest(
    url,
    apiKey,
    `${SOCIETIES_TABLE}?select=id&order=created_at.asc&limit=1`
  )
  if (!result.ok) {
    logSupabaseError('Failed to fetch fallback society', parseSupabaseError(result.status, result.text))
    return null
  }
  const rows = Array.isArray(result.json) ? result.json : []
  const first = rows[0] as { id?: string } | undefined
  return first?.id ?? null
}

async function societyExists(url: string, apiKey: string, societyId: string): Promise<boolean | null> {
  const result = await supabaseRequest(
    url,
    apiKey,
    `${SOCIETIES_TABLE}?select=id&id=eq.${encodeURIComponent(societyId)}&limit=1`
  )
  if (result.networkError) {
    return null
  }
  if (!result.ok) {
    logSupabaseError('Failed to verify society', parseSupabaseError(result.status, result.text), { societyId })
    return false
  }
  const rows = Array.isArray(result.json) ? result.json : []
  return rows.length > 0
}

async function resolveSocietyId(
  url: string,
  apiKey: string,
  candidate: string | null
): Promise<{ societyId: string; source: string }> {
  if (candidate && UUID_RE.test(candidate)) {
    const exists = await societyExists(url, apiKey, candidate)
    if (exists === true) {
      return { societyId: candidate, source: 'payload' }
    }
    if (exists === null) {
      console.warn('[automation/inbound] Society lookup unavailable — using payload UUID', { candidate })
      return { societyId: candidate, source: 'payload_network_fallback' }
    }
    console.warn('[automation/inbound] Payload societyId not found in DB — continuing with payload UUID', {
      candidate
    })
    return { societyId: candidate, source: 'payload_unverified' }
  }

  if (candidate) {
    console.warn('[automation/inbound] societyId invalid — attempting DB fallback society', { candidate })
  } else {
    console.warn('[automation/inbound] societyId missing — attempting DB fallback society')
  }

  const fallback = await fetchFirstSocietyId(url, apiKey)
  if (fallback) {
    return { societyId: fallback, source: 'fallback_first_society' }
  }

  const envFallback = readEnvVar('SYNCRA_INBOUND_FALLBACK_SOCIETY_ID')
  if (envFallback && UUID_RE.test(envFallback)) {
    console.warn('[automation/inbound] Using SYNCRA_INBOUND_FALLBACK_SOCIETY_ID emergency fallback')
    return { societyId: envFallback, source: 'emergency_env' }
  }

  if (candidate && UUID_RE.test(candidate)) {
    return { societyId: candidate, source: 'emergency_payload' }
  }

  console.warn('[automation/inbound] Using hardcoded emergency society UUID — proceeding to insert phase')
  return { societyId: EMERGENCY_SOCIETY_ID, source: 'emergency_hardcoded' }
}

async function lookupUserAndFlat(
  url: string,
  apiKey: string,
  societyId: string,
  query: string
): Promise<{ user_id?: string; flat_number?: string; phone?: string } | null> {
  const result = await supabaseRequest(url, apiKey, query)
  if (!result.ok) {
    logSupabaseError('Profile lookup failed', parseSupabaseError(result.status, result.text), { query })
    return null
  }
  const rows = Array.isArray(result.json) ? result.json : []
  return (rows[0] as { user_id?: string; flat_number?: string; phone?: string } | undefined) ?? null
}

async function resolveRaisedByUserId(
  url: string,
  apiKey: string,
  input: { societyId: string; phone: string; flatNumber: string | null }
): Promise<{ userId: string; source: string }> {
  const suffix = phoneSearchSuffix(input.phone)

  if (input.flatNumber) {
    const byFlat = await lookupUserAndFlat(
      url,
      apiKey,
      input.societyId,
      `${USER_AND_FLATS_TABLE}?society_id=eq.${encodeURIComponent(input.societyId)}&flat_number=eq.${encodeURIComponent(input.flatNumber)}&select=user_id,flat_number,phone&limit=1`
    )
    if (byFlat?.user_id) {
      return { userId: byFlat.user_id, source: 'user_and_flats.flat_number' }
    }
  }

  if (suffix) {
    const byPhone = await lookupUserAndFlat(
      url,
      apiKey,
      input.societyId,
      `${USER_AND_FLATS_TABLE}?society_id=eq.${encodeURIComponent(input.societyId)}&phone=ilike.*${encodeURIComponent(suffix)}&select=user_id,flat_number,phone&limit=1`
    )
    if (byPhone?.user_id) {
      return { userId: byPhone.user_id, source: 'user_and_flats.phone' }
    }

    const flatResult = await supabaseRequest(
      url,
      apiKey,
      `${FLATS_TABLE}?society_id=eq.${encodeURIComponent(input.societyId)}&owner_phone=ilike.*${encodeURIComponent(suffix)}&select=id,flat_number,owner_phone&limit=1`
    )
    if (flatResult.ok) {
      const flatRows = Array.isArray(flatResult.json) ? flatResult.json : []
      const flat = flatRows[0] as { flat_number?: string } | undefined
      if (flat?.flat_number) {
        const byFlatPhone = await lookupUserAndFlat(
          url,
          apiKey,
          input.societyId,
          `${USER_AND_FLATS_TABLE}?society_id=eq.${encodeURIComponent(input.societyId)}&flat_number=eq.${encodeURIComponent(flat.flat_number)}&select=user_id,flat_number,phone&limit=1`
        )
        if (byFlatPhone?.user_id) {
          return { userId: byFlatPhone.user_id, source: 'flats.owner_phone→user_and_flats' }
        }
      }
    }
  }

  if (suffix) {
    return { userId: `wa:${suffix}`, source: 'sandbox_phone_fallback' }
  }

  return { userId: SYSTEM_AUTOMATION_USER_ID, source: 'system_automation' }
}

function mapInsertError(status: number, rawText: string): { status: number; message: string; supabase: SupabaseErrorDetails } {
  const supabase = parseSupabaseError(status, rawText)
  const text = supabase.message

  if (status === 409) {
    return { status: 409, message: 'Complaint record conflicts with an existing row', supabase }
  }
  if (status === 404 || /could not find the table/i.test(text)) {
    return {
      status: 503,
      message: `${COMPLAINTS_TABLE} is not available in Supabase. Run migrations and redeploy.`,
      supabase
    }
  }
  if (status === 400 || /foreign key constraint/i.test(text) || /invalid input syntax for type uuid/i.test(text)) {
    return {
      status: 422,
      message: text || 'Invalid complaint payload for complaints_and_suggestions',
      supabase
    }
  }
  return { status: 502, message: text || `Supabase insert failed (${status})`, supabase }
}

async function insertComplaint(input: {
  url: string
  apiKey: string
  societyId: string
  raisedByUserId: string
  phone: string
  flatNumber: string | null
  subject: string
  description: string | null
}) {
  const now = new Date().toISOString()
  const flatHint = input.flatNumber ? `Flat ${input.flatNumber}` : 'Unknown flat'
  const description =
    normalizeDescription(input.description) ||
    `Inbound WhatsApp message from ${input.phone} (${flatHint})`
  const payload = {
    society_id: input.societyId,
    raised_by_user_id: input.raisedByUserId.slice(0, 500),
    subject: input.subject.slice(0, 500),
    description: description.slice(0, 4000),
    status: 'open',
    created_at: now,
    updated_at: now
  }

  let response: Response
  try {
    response = await fetch(buildRestUrl(input.url, COMPLAINTS_TABLE), {
      method: 'POST',
      headers: adminHeaders(input.apiKey),
      body: JSON.stringify(payload)
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'fetch failed'
    console.error('[automation/inbound] Complaint insert fetch failed', {
      message,
      societyId: input.societyId
    })
    const error = new Error(message) as HandlerError
    error.statusCode = 502
    throw error
  }

  const text = await response.text()
  if (!response.ok) {
    const mapped = mapInsertError(response.status, text)
    logSupabaseError('Complaint insert rejected', mapped.supabase, { payload })
    const error = new Error(mapped.message) as HandlerError
    error.statusCode = mapped.status
    error.supabase = mapped.supabase
    throw error
  }

  if (!text) return payload
  try {
    return JSON.parse(text)
  } catch {
    return payload
  }
}

module.exports = async function handler(
  req: import('@vercel/node').VercelRequest,
  res: import('@vercel/node').VercelResponse
) {
  try {
    setCors(res)

    if (req.method === 'OPTIONS') {
      return res.status(204).end()
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const secret = readEnvVar('SYNCRA_AUTOMATION_SECRET') || 'syncra-local-dev-secret'
    const providedSecret = safeString(req.headers['x-syncra-automation-secret'])
    if (!providedSecret || providedSecret !== secret) {
      return res.status(401).json({ error: 'Invalid automation secret' })
    }

    const body = parseInboundBody(req)
    const supabase = supabaseConfig()

    if (!supabase.url || !supabase.apiKey) {
      logMissingSupabaseConfig(supabase)
      return res.status(500).json({
        error: 'Supabase is not fully configured for inbound automation',
        hint: !supabase.url
          ? 'Set SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL in Vercel Production environment variables.'
          : 'Set SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel Production environment variables.',
        keySource: supabase.keySource
      })
    }

    let societyResolution: { societyId: string; source: string }
    societyResolution = await resolveSocietyId(supabase.url, supabase.apiKey, body.societyId)

    if (body.messageType === 'payment_receipt') {
      const receiptId = `wa-receipt-${Date.now()}`
      const whatsappMessage = await generateWhatsAppReply({
        messageType: 'payment_receipt',
        description: normalizeDescription(body.description),
        flatNumber: body.flatNumber,
        ticketId: receiptId
      })

      return sendHandlerResponse(
        res,
        req,
        200,
        {
          success: true,
          action: 'receipt_logged',
          receiptId,
          societyId: societyResolution.societyId,
          societySource: societyResolution.source,
          flatNumber: body.flatNumber,
          amount: body.amount,
          reference: body.reference,
          message: whatsappMessage
        },
        whatsappMessage
      )
    }

    const subject =
      body.subject ||
      (body.flatNumber ? `WhatsApp helpdesk — Flat ${body.flatNumber}` : 'WhatsApp helpdesk ticket')

    const userResolution = await resolveRaisedByUserId(supabase.url, supabase.apiKey, {
      societyId: societyResolution.societyId,
      phone: body.phone,
      flatNumber: body.flatNumber
    })

    try {
      const ticket = await insertComplaint({
        url: supabase.url,
        apiKey: supabase.apiKey,
        societyId: societyResolution.societyId,
        raisedByUserId: userResolution.userId,
        phone: body.phone,
        flatNumber: body.flatNumber,
        subject,
        description: normalizeDescription(body.description)
      })

      const ticketRow = Array.isArray(ticket) ? ticket[0] : ticket
      const ticketId = String(ticketRow?.id ?? `wa-ticket-${Date.now()}`)
      const whatsappMessage = await generateWhatsAppReply({
        messageType: body.messageType,
        description: normalizeDescription(body.description),
        flatNumber: body.flatNumber,
        ticketId
      })

      return sendHandlerResponse(
        res,
        req,
        201,
        {
          success: true,
          action: 'ticket_created',
          ticketId,
          table: COMPLAINTS_TABLE,
          ticket: ticketRow,
          societyId: societyResolution.societyId,
          societySource: societyResolution.source,
          raisedByUserId: userResolution.userId,
          raisedBySource: userResolution.source,
          supabaseKeySource: supabase.keySource,
          message: whatsappMessage
        },
        whatsappMessage
      )
    } catch (err) {
      const handlerError = err as HandlerError
      const statusCode = handlerError.statusCode ?? 500
      const message = handlerError instanceof Error ? handlerError.message : 'Failed to insert complaint'

      if (handlerError.supabase) {
        logSupabaseError('Insert failed', handlerError.supabase, {
          societyId: societyResolution.societyId,
          raisedByUserId: userResolution.userId,
          phone: body.phone
        })
      } else {
        console.error('[automation/inbound] Insert failed:', message, {
          societyId: societyResolution.societyId,
          raisedByUserId: userResolution.userId,
          phone: body.phone
        })
      }

      return sendHandlerResponse(
        res,
        req,
        statusCode,
        {
          error: message,
          details: handlerError.supabase?.details ?? null,
          hint: handlerError.supabase?.hint ?? null,
          code: handlerError.supabase?.code ?? null,
          message
        },
        `Syncra Society: ${message}`
      )
    }
  } catch (error) {
    console.error('[automation/inbound] Unhandled error:', error)
    return sendHandlerResponse(
      res,
      req,
      500,
      { error: 'Failed to process inbound WhatsApp message' },
      'Syncra Society: We could not process your WhatsApp message right now. Please try again shortly.'
    )
  }
}
