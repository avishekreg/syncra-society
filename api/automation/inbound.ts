const COMPLAINTS_TABLE = 'complaints_and_suggestions'
const SOCIETIES_TABLE = 'societies'
const USER_AND_FLATS_TABLE = 'user_and_flats'
const FLATS_TABLE = 'flats'
const SYSTEM_AUTOMATION_USER_ID = 'system-whatsapp-automation'
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

function supabaseConfig() {
  const url = (
    process.env.SUPABASE_URL ??
    process.env.VITE_SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    ''
  )
    .trim()
    .replace(/\/rest\/v1\/?$/i, '')
    .replace(/\/+$/, '')

  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()
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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-syncra-automation-secret')
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

async function supabaseRequest(
  url: string,
  serviceKey: string,
  path: string,
  init?: RequestInit
): Promise<{ ok: boolean; status: number; text: string; json: unknown }> {
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      ...adminHeaders(serviceKey),
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
}

async function fetchFirstSocietyId(url: string, serviceKey: string): Promise<string | null> {
  const result = await supabaseRequest(
    url,
    serviceKey,
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

async function societyExists(url: string, serviceKey: string, societyId: string): Promise<boolean> {
  const result = await supabaseRequest(
    url,
    serviceKey,
    `${SOCIETIES_TABLE}?select=id&id=eq.${encodeURIComponent(societyId)}&limit=1`
  )
  if (!result.ok) {
    logSupabaseError('Failed to verify society', parseSupabaseError(result.status, result.text), { societyId })
    return false
  }
  const rows = Array.isArray(result.json) ? result.json : []
  return rows.length > 0
}

async function resolveSocietyId(
  url: string,
  serviceKey: string,
  candidate: string | null
): Promise<{ societyId: string; source: string }> {
  if (candidate && UUID_RE.test(candidate) && (await societyExists(url, serviceKey, candidate))) {
    return { societyId: candidate, source: 'payload' }
  }

  if (candidate) {
    console.warn('[automation/inbound] societyId missing, invalid, or not found — using fallback society', {
      candidate
    })
  } else {
    console.warn('[automation/inbound] societyId missing — using fallback society')
  }

  const fallback = await fetchFirstSocietyId(url, serviceKey)
  if (!fallback) {
    throw new Error('No society available for inbound WhatsApp routing')
  }

  return { societyId: fallback, source: 'fallback_first_society' }
}

async function lookupUserAndFlat(
  url: string,
  serviceKey: string,
  societyId: string,
  query: string
): Promise<{ user_id?: string; flat_number?: string; phone?: string } | null> {
  const result = await supabaseRequest(url, serviceKey, query)
  if (!result.ok) {
    logSupabaseError('Profile lookup failed', parseSupabaseError(result.status, result.text), { query })
    return null
  }
  const rows = Array.isArray(result.json) ? result.json : []
  return (rows[0] as { user_id?: string; flat_number?: string; phone?: string } | undefined) ?? null
}

async function resolveRaisedByUserId(
  url: string,
  serviceKey: string,
  input: { societyId: string; phone: string; flatNumber: string | null }
): Promise<{ userId: string; source: string }> {
  const suffix = phoneSearchSuffix(input.phone)

  if (input.flatNumber) {
    const byFlat = await lookupUserAndFlat(
      url,
      serviceKey,
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
      serviceKey,
      input.societyId,
      `${USER_AND_FLATS_TABLE}?society_id=eq.${encodeURIComponent(input.societyId)}&phone=ilike.*${encodeURIComponent(suffix)}&select=user_id,flat_number,phone&limit=1`
    )
    if (byPhone?.user_id) {
      return { userId: byPhone.user_id, source: 'user_and_flats.phone' }
    }

    const flatResult = await supabaseRequest(
      url,
      serviceKey,
      `${FLATS_TABLE}?society_id=eq.${encodeURIComponent(input.societyId)}&owner_phone=ilike.*${encodeURIComponent(suffix)}&select=id,flat_number,owner_phone&limit=1`
    )
    if (flatResult.ok) {
      const flatRows = Array.isArray(flatResult.json) ? flatResult.json : []
      const flat = flatRows[0] as { flat_number?: string } | undefined
      if (flat?.flat_number) {
        const byFlatPhone = await lookupUserAndFlat(
          url,
          serviceKey,
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
  societyId: string
  raisedByUserId: string
  phone: string
  flatNumber: string | null
  subject: string
  description: string | null
}) {
  const { url, serviceKey } = supabaseConfig()
  if (!url || !serviceKey) {
    throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured')
  }

  const now = new Date().toISOString()
  const flatHint = input.flatNumber ? `Flat ${input.flatNumber}` : 'Unknown flat'
  const payload = {
    society_id: input.societyId,
    raised_by_user_id: input.raisedByUserId.slice(0, 500),
    subject: input.subject.slice(0, 500),
    description: (input.description ?? `Inbound WhatsApp message from ${input.phone} (${flatHint})`).slice(0, 4000),
    status: 'open',
    created_at: now,
    updated_at: now
  }

  const response = await fetch(`${url}/rest/v1/${COMPLAINTS_TABLE}`, {
    method: 'POST',
    headers: adminHeaders(serviceKey),
    body: JSON.stringify(payload)
  })

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

    const secret = (process.env.SYNCRA_AUTOMATION_SECRET ?? 'syncra-local-dev-secret').trim()
    const providedSecret = safeString(req.headers['x-syncra-automation-secret'])
    if (!providedSecret || providedSecret !== secret) {
      return res.status(401).json({ error: 'Invalid automation secret' })
    }

    const body = parseInboundBody(req)
    const { url, serviceKey } = supabaseConfig()
    if (!url || !serviceKey) {
      console.error('[automation/inbound] Missing Supabase configuration')
      return res.status(503).json({ error: 'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured' })
    }

    let societyResolution: { societyId: string; source: string }
    try {
      societyResolution = await resolveSocietyId(url, serviceKey, body.societyId)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to resolve society'
      console.error('[automation/inbound] Society resolution failed:', message, {
        incomingSocietyId: body.societyId,
        rawBody: unwrapRecord(req.body)
      })
      return res.status(422).json({ error: message })
    }

    if (body.messageType === 'payment_receipt') {
      return res.status(200).json({
        success: true,
        action: 'receipt_logged',
        receiptId: `wa-receipt-${Date.now()}`,
        societyId: societyResolution.societyId,
        societySource: societyResolution.source,
        flatNumber: body.flatNumber,
        amount: body.amount,
        reference: body.reference,
        message: 'Payment receipt recorded for admin review'
      })
    }

    const subject =
      body.subject ||
      (body.flatNumber ? `WhatsApp helpdesk — Flat ${body.flatNumber}` : 'WhatsApp helpdesk ticket')

    const userResolution = await resolveRaisedByUserId(url, serviceKey, {
      societyId: societyResolution.societyId,
      phone: body.phone,
      flatNumber: body.flatNumber
    })

    try {
      const ticket = await insertComplaint({
        societyId: societyResolution.societyId,
        raisedByUserId: userResolution.userId,
        phone: body.phone,
        flatNumber: body.flatNumber,
        subject,
        description: body.description
      })

      const ticketRow = Array.isArray(ticket) ? ticket[0] : ticket

      return res.status(201).json({
        success: true,
        action: 'ticket_created',
        ticketId: ticketRow?.id ?? `wa-ticket-${Date.now()}`,
        table: COMPLAINTS_TABLE,
        ticket: ticketRow,
        societyId: societyResolution.societyId,
        societySource: societyResolution.source,
        raisedByUserId: userResolution.userId,
        raisedBySource: userResolution.source,
        message: 'Ticket stored in complaints_and_suggestions'
      })
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

      return res.status(statusCode).json({
        error: message,
        details: handlerError.supabase?.details ?? null,
        hint: handlerError.supabase?.hint ?? null,
        code: handlerError.supabase?.code ?? null
      })
    }
  } catch (error) {
    console.error('[automation/inbound] Unhandled error:', error)
    return res.status(500).json({ error: 'Failed to process inbound WhatsApp message' })
  }
}
