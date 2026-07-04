export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getPaymentGatewayKeys, getSystemConfig } from '@/lib/config/system-config'
import { activateSocietyModule } from '@/lib/features/society-modules'
import { RazorpayProvider } from '@/lib/payments/RazorpayProvider'
import { StripeProvider } from '@/lib/payments/StripeProvider'
import type { VerifiedWebhookEvent } from '@/lib/payments/IPaymentGateway'

function logWebhook(event: string, details: Record<string, unknown>) {
  console.info(`[webhooks/payments] ${event}`, details)
}

function logWebhookError(event: string, details: Record<string, unknown>) {
  console.error(`[webhooks/payments] ${event}`, details)
}

async function verifyIncomingPaymentWebhook(
  rawBody: Buffer,
  request: Request
): Promise<VerifiedWebhookEvent | null> {
  const razorpaySignature = request.headers.get('x-razorpay-signature')
  const stripeSignature = request.headers.get('stripe-signature')
  const keys = await getPaymentGatewayKeys()

  if (razorpaySignature) {
    const razorpay = new RazorpayProvider(keys.publicKey, keys.secretKey, keys.webhookSecret)
    return razorpay.verifyWebhookSignature({
      rawBody,
      signature: razorpaySignature,
      headers: { 'x-razorpay-signature': razorpaySignature }
    })
  }

  if (stripeSignature) {
    const stripeWebhookSecret = await getSystemConfig('STRIPE_WEBHOOK_SECRET')
    const stripe = new StripeProvider(keys.publicKey, keys.secretKey, stripeWebhookSecret)
    return stripe.verifyWebhookSignature({
      rawBody,
      headers: { 'stripe-signature': stripeSignature }
    })
  }

  return null
}

export async function POST(request: Request) {
  const rawBody = Buffer.from(await request.arrayBuffer())

  try {
    const event = await verifyIncomingPaymentWebhook(rawBody, request)

    if (!event) {
      logWebhookError('signature_verification_failed', {
        hasRazorpayHeader: Boolean(request.headers.get('x-razorpay-signature')),
        hasStripeHeader: Boolean(request.headers.get('stripe-signature'))
      })
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 })
    }

    logWebhook('received', {
      provider: event.provider,
      eventType: event.eventType,
      status: event.status
    })

    if (event.status !== 'paid') {
      return NextResponse.json({ received: true, processed: false, reason: 'non-paid event' })
    }

    const societyId = event.societyId ?? event.metadata?.societyId ?? event.metadata?.society_id
    const purchasedModule =
      event.purchasedModule ?? event.metadata?.purchasedModule ?? event.metadata?.purchased_module

    if (!societyId || !purchasedModule) {
      logWebhook('missing_module_metadata', {
        provider: event.provider,
        eventType: event.eventType,
        societyId: societyId ?? null,
        purchasedModule: purchasedModule ?? null
      })
      return NextResponse.json({
        received: true,
        processed: false,
        reason: 'missing societyId or purchasedModule metadata'
      })
    }

    const { activated, config } = await activateSocietyModule(societyId, purchasedModule)

    if (!activated) {
      return NextResponse.json({
        received: true,
        processed: false,
        reason: 'unrecognized purchasedModule'
      })
    }

    logWebhook('module_activated', {
      societyId,
      purchasedModule,
      activated,
      provider: event.provider
    })

    return NextResponse.json({
      received: true,
      processed: true,
      societyId,
      activatedModule: activated,
      config
    })
  } catch (err) {
    logWebhookError('processing_failed', {
      message: err instanceof Error ? err.message : 'unknown error'
    })
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
