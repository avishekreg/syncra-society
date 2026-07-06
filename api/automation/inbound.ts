import type { VercelRequest, VercelResponse } from '@vercel/node'

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

function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-syncra-automation-secret')
}

const COMPLAINTS_TABLE = 'complaints_and_suggestions'

type InboundBody = {
  societyId?: string
  flatNumber?: string | null
  phone?: string | null
  messageType?: 'ticket' | 'payment_receipt' | 'general' | 'text'
  subject?: string | null
  description?: string | null
  amount?: number | null
  reference?: string | null
}

async function insertComplaint(input: {
  societyId: string
  phone: string
  flatNumber?: string | null
  subject: string
  description?: string | null
}) {
  const { url, serviceKey } = supabaseConfig()
  if (!url || !serviceKey) {
    throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured')
  }

  const now = new Date().toISOString()
  const flatHint = input.flatNumber ? `Flat ${input.flatNumber}` : 'Unknown flat'
  const payload = {
    society_id: input.societyId,
    raised_by_user_id: input.phone,
    subject: input.subject,
    description: input.description ?? `Inbound WhatsApp message from ${input.phone} (${flatHint})`,
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
    throw new Error(text || `Supabase insert failed (${response.status})`)
  }

  return text ? JSON.parse(text) : payload
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res)
  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const secret = process.env.SYNCRA_AUTOMATION_SECRET ?? 'syncra-local-dev-secret'
  if (req.headers['x-syncra-automation-secret'] !== secret) {
    return res.status(401).json({ error: 'Invalid automation secret' })
  }

  const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) as InboundBody
  if (!body?.societyId) {
    return res.status(400).json({ error: 'societyId is required' })
  }

  const messageType = body.messageType ?? 'ticket'
  const phone = (body.phone ?? 'whatsapp-unknown').trim()
  const flatNumber = body.flatNumber?.trim() || null

  try {
    if (messageType === 'payment_receipt') {
      return res.status(200).json({
        success: true,
        action: 'receipt_logged',
        receiptId: `wa-receipt-${Date.now()}`,
        flatNumber,
        amount: body.amount ?? null,
        reference: body.reference ?? null,
        message: 'Payment receipt recorded for admin review'
      })
    }

    const subject =
      body.subject?.trim() ||
      (flatNumber ? `WhatsApp helpdesk — Flat ${flatNumber}` : 'WhatsApp helpdesk ticket')

    const ticket = await insertComplaint({
      societyId: body.societyId,
      phone,
      flatNumber,
      subject,
      description: body.description?.trim() || null
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
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to process inbound WhatsApp message'
    })
  }
}
