import type { VercelRequest, VercelResponse } from '@vercel/node'

const COMPLAINTS_TABLE = 'complaints_and_suggestions'
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type MessageType = 'ticket' | 'payment_receipt' | 'general' | 'text'

type NormalizedInbound = {
  societyId: string
  flatNumber: string | null
  phone: string
  messageType: MessageType
  subject: string | null
  description: string | null
  amount: number | null
  reference: string | null
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

function setCors(res: VercelResponse) {
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
  const nestedCandidates = [
    record.portalPayload,
    record.payload,
    record.data,
    record.body
  ]

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

function parseInboundBody(req: VercelRequest): { ok: true; body: NormalizedInbound } | { ok: false; error: string } {
  const merged = unwrapRecord(req.body)

  const societyId = safeString(merged.societyId ?? merged.society_id ?? merged.societyID)
  if (!societyId) {
    return { ok: false, error: 'societyId is required' }
  }
  if (!UUID_RE.test(societyId)) {
    return { ok: false, error: 'societyId must be a valid UUID' }
  }

  const description =
    safeString(
      merged.description ??
        merged.text ??
        merged.Body ??
        merged.message ??
        merged.message_body ??
        merged.messageBody
    ) || null

  return {
    ok: true,
    body: {
      societyId,
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
}

function mapInsertError(status: number, rawText: string): { status: number; message: string } {
  const text = rawText.trim()
  if (status === 409) {
    return { status: 409, message: 'Complaint record conflicts with an existing row' }
  }
  if (status === 404 || /could not find the table/i.test(text)) {
    return {
      status: 503,
      message: `${COMPLAINTS_TABLE} is not available in Supabase. Run migrations and redeploy.`
    }
  }
  if (status === 400 || /foreign key constraint/i.test(text) || /invalid input syntax for type uuid/i.test(text)) {
    return { status: 422, message: text || 'Invalid complaint payload for complaints_and_suggestions' }
  }
  return { status: 502, message: text || `Supabase insert failed (${status})` }
}

async function insertComplaint(input: {
  societyId: string
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
    raised_by_user_id: input.phone.slice(0, 500),
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
    const error = new Error(mapped.message)
    ;(error as Error & { statusCode?: number }).statusCode = mapped.status
    throw error
  }

  if (!text) return payload
  try {
    return JSON.parse(text)
  } catch {
    return payload
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

    const parsed = parseInboundBody(req)
    if (!parsed.ok) {
      return res.status(400).json({ error: parsed.error })
    }

    const body = parsed.body
    const { url, serviceKey } = supabaseConfig()
    if (!url || !serviceKey) {
      console.error('[automation/inbound] Missing Supabase configuration')
      return res.status(503).json({ error: 'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured' })
    }

    if (body.messageType === 'payment_receipt') {
      return res.status(200).json({
        success: true,
        action: 'receipt_logged',
        receiptId: `wa-receipt-${Date.now()}`,
        flatNumber: body.flatNumber,
        amount: body.amount,
        reference: body.reference,
        message: 'Payment receipt recorded for admin review'
      })
    }

    const subject =
      body.subject ||
      (body.flatNumber ? `WhatsApp helpdesk — Flat ${body.flatNumber}` : 'WhatsApp helpdesk ticket')

    try {
      const ticket = await insertComplaint({
        societyId: body.societyId,
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
        message: 'Ticket stored in complaints_and_suggestions'
      })
    } catch (err) {
      const statusCode = (err as Error & { statusCode?: number }).statusCode ?? 500
      const message = err instanceof Error ? err.message : 'Failed to insert complaint'
      console.error('[automation/inbound] Insert failed:', message)
      return res.status(statusCode).json({ error: message })
    }
  } catch (error) {
    console.error('[automation/inbound] Unhandled error:', error)
    return res.status(500).json({ error: 'Failed to process inbound WhatsApp message' })
  }
}
