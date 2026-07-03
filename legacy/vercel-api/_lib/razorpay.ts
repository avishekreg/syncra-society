import crypto from 'node:crypto'
import Razorpay from 'razorpay'
import { config } from './config'

let client: Razorpay | null = null

export function getRazorpayClient(): Razorpay {
  if (!client) {
    client = new Razorpay({
      key_id: config.razorpayKeyId,
      key_secret: config.razorpayKeySecret
    })
  }
  return client
}

export function verifyPaymentSignature(input: { orderId: string; paymentId: string; signature: string }) {
  const body = `${input.orderId}|${input.paymentId}`
  const expected = crypto.createHmac('sha256', config.razorpayKeySecret).update(body).digest('hex')
  return expected === input.signature
}

export function verifyWebhookSignature(rawBody: Buffer, signature: string | undefined) {
  if (!signature || !config.razorpayWebhookSecret) return false
  const expected = crypto.createHmac('sha256', config.razorpayWebhookSecret).update(rawBody).digest('hex')
  return expected === signature
}

export async function createActivationOrder(input: { societyId: string; amountPaise: number; receipt: string }) {
  const razorpay = getRazorpayClient()
  return razorpay.orders.create({
    amount: input.amountPaise,
    currency: 'INR',
    receipt: input.receipt,
    notes: { society_id: input.societyId, purpose: 'platform_activation' }
  })
}

export async function createMonthlyPlan(input: {
  societyId: string
  societyName: string
  amountPaise: number
  totalFlats: number
}) {
  const razorpay = getRazorpayClient()
  return razorpay.plans.create({
    period: 'monthly',
    interval: 1,
    item: {
      name: `Syncra Society — ${input.societyName}`,
      amount: input.amountPaise,
      currency: 'INR',
      description: `Monthly subscription for ${input.totalFlats} flats`
    },
    notes: { society_id: input.societyId, total_flats: String(input.totalFlats) }
  })
}

export async function createSocietySubscription(input: {
  planId: string
  societyId: string
  customerEmail?: string
  customerName?: string
  totalCount?: number
}) {
  const razorpay = getRazorpayClient()
  return razorpay.subscriptions.create({
    plan_id: input.planId,
    total_count: input.totalCount ?? 120,
    customer_notify: 1,
    notes: { society_id: input.societyId },
    notify_info: input.customerEmail ? { notify_email: input.customerEmail } : undefined
  })
}
