import type { VercelRequest, VercelResponse } from '@vercel/node'
import { config, assertPaymentsConfigured } from '../config'
import { activationFeePaise, calculateMonthlyDues, resolveMonthlyRatePerFlat } from '../pricing'
import { getActivationFeeInr } from '../platformPricingStore'
import {
  createSocietySubscription as createSubscriptionRow,
  extendActiveUntil,
  getSocietyById,
  getSocietySubscription,
  getSubscriptionByRazorpayId,
  patchSociety,
  patchSocietySubscription,
  recordWebhookEvent,
  webhookEventExists
} from '../supabaseAdmin'
import { forwardEventToN8n } from '../n8nBridge'
import {
  createActivationOrder,
  createMonthlyPlan,
  createSocietySubscription,
  verifyPaymentSignature,
  verifyWebhookSignature
} from '../razorpay'
import { json, readJsonBody, readRawBody } from '../http'

function ensureDbConfigured(res: VercelResponse) {
  if (!config.supabaseConfigured()) {
    json(res, 503, { error: 'Supabase service role is not configured on the API.' })
    return false
  }
  return true
}

export async function handlePaymentsRoute(req: VercelRequest, res: VercelResponse, subPath: string) {
  if (subPath === 'status' && req.method === 'GET') {
    const societyId = Array.isArray(req.query.societyId) ? req.query.societyId[0] : req.query.societyId
    if (!societyId) return json(res, 400, { error: 'societyId is required' })
    if (!ensureDbConfigured(res)) return

    try {
      const society = await getSocietyById(societyId)
      if (!society) return json(res, 404, { error: 'Society not found' })

      let subscription = await getSocietySubscription(societyId)
      if (!subscription) subscription = await createSubscriptionRow(societyId)

      const ratePerFlat = await resolveMonthlyRatePerFlat(society.pricing_slab_id)
      const flats = subscription.total_flats ?? society.total_flats ?? 0
      const dues = calculateMonthlyDues(flats, subscription.monthly_rate_per_flat ?? ratePerFlat)

      return json(res, 200, {
        societyId,
        societyName: society.name,
        activationStatus: subscription.activation_status,
        totalFlats: subscription.total_flats,
        monthlyRatePerFlat: subscription.monthly_rate_per_flat ?? ratePerFlat,
        monthlyTotalInr: dues.monthlyTotalInr,
        activationFeeInr: await getActivationFeeInr(),
        activeUntil: subscription.active_until,
        razorpayKeyId: config.razorpayKeyId || null,
        paymentsConfigured: config.paymentsConfigured()
      })
    } catch (err: any) {
      return json(res, 500, { error: err.message ?? 'Failed to load billing status' })
    }
  }

  if (subPath === 'activate' && req.method === 'POST') {
    if (!ensureDbConfigured(res)) return
    try {
      const { societyId } = readJsonBody<{ societyId?: string }>(req)
      if (!societyId) return json(res, 400, { error: 'societyId is required' })

      const society = await getSocietyById(societyId)
      if (!society) return json(res, 404, { error: 'Society not found' })

      let subscription = await getSocietySubscription(societyId)
      if (!subscription) subscription = await createSubscriptionRow(societyId)

      if (subscription.activation_status !== 'pending') {
        return json(res, 200, {
          alreadyPaid: true,
          activationStatus: subscription.activation_status,
          keyId: config.razorpayKeyId
        })
      }

      if (!config.paymentsConfigured()) {
        await patchSocietySubscription(societyId, {
          activation_status: 'activation_paid',
          billing_cycle_anchor: new Date().toISOString()
        })
        return json(res, 200, {
          demoMode: true,
          activationStatus: 'activation_paid',
          message: 'Activation marked paid in demo mode (Razorpay keys not configured).'
        })
      }

      assertPaymentsConfigured()
      const amountPaise = await activationFeePaise()
      const order = await createActivationOrder({
        societyId,
        amountPaise,
        receipt: `activation_${societyId}_${Date.now()}`
      })

      await patchSocietySubscription(societyId, { razorpay_order_id: order.id })

      return json(res, 200, {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: config.razorpayKeyId,
        societyName: society.name,
        activationFeeInr: await getActivationFeeInr()
      })
    } catch (err: any) {
      return json(res, 500, { error: err.message ?? 'Failed to create activation order' })
    }
  }

  if (subPath === 'activate/verify' && req.method === 'POST') {
    if (!ensureDbConfigured(res)) return
    try {
      const body = readJsonBody<{
        societyId?: string
        razorpay_order_id?: string
        razorpay_payment_id?: string
        razorpay_signature?: string
      }>(req)

      if (!body.societyId || !body.razorpay_order_id || !body.razorpay_payment_id || !body.razorpay_signature) {
        return json(res, 400, { error: 'Missing payment verification fields' })
      }

      if (!config.paymentsConfigured()) {
        return json(res, 400, { error: 'Razorpay is not configured' })
      }

      const valid = verifyPaymentSignature({
        orderId: body.razorpay_order_id,
        paymentId: body.razorpay_payment_id,
        signature: body.razorpay_signature
      })

      if (!valid) return json(res, 400, { error: 'Invalid payment signature' })

      const subscription = await patchSocietySubscription(body.societyId, {
        activation_status: 'activation_paid',
        razorpay_order_id: body.razorpay_order_id,
        billing_cycle_anchor: new Date().toISOString()
      })

      await patchSociety(body.societyId, { subscription_status: 'trial' })

      return json(res, 200, { success: true, activationStatus: subscription.activation_status })
    } catch (err: any) {
      return json(res, 500, { error: err.message ?? 'Activation verification failed' })
    }
  }

  if (subPath === 'subscribe' && req.method === 'POST') {
    if (!ensureDbConfigured(res)) return
    try {
      const body = readJsonBody<{
        societyId?: string
        totalFlats?: number
        customerEmail?: string
        customerName?: string
      }>(req)

      if (!body.societyId || !body.totalFlats || body.totalFlats < 1) {
        return json(res, 400, { error: 'societyId and totalFlats (>= 1) are required' })
      }

      const society = await getSocietyById(body.societyId)
      if (!society) return json(res, 404, { error: 'Society not found' })

      let subscription = await getSocietySubscription(body.societyId)
      if (!subscription) subscription = await createSubscriptionRow(body.societyId)

      if (subscription.activation_status === 'pending') {
        return json(res, 403, { error: 'Activation fee must be paid before subscribing.' })
      }

      if (subscription.activation_status === 'active_subscription' && subscription.razorpay_subscription_id) {
        return json(res, 200, {
          alreadyActive: true,
          subscriptionId: subscription.razorpay_subscription_id,
          keyId: config.razorpayKeyId,
          activationStatus: subscription.activation_status
        })
      }

      const ratePerFlat = await resolveMonthlyRatePerFlat(society.pricing_slab_id)
      const dues = calculateMonthlyDues(body.totalFlats, ratePerFlat)

      await patchSociety(body.societyId, { total_flats: dues.totalFlats })
      await patchSocietySubscription(body.societyId, {
        total_flats: dues.totalFlats,
        monthly_rate_per_flat: dues.monthlyRatePerFlat
      })

      if (!config.paymentsConfigured()) {
        const activeUntil = extendActiveUntil(null, 30)
        await patchSocietySubscription(body.societyId, {
          activation_status: 'active_subscription',
          billing_cycle_anchor: new Date().toISOString(),
          active_until: activeUntil
        })
        await patchSociety(body.societyId, { subscription_status: 'active' })
        return json(res, 200, {
          demoMode: true,
          activationStatus: 'active_subscription',
          monthlyTotalInr: dues.monthlyTotalInr,
          message: 'Subscription activated in demo mode (Razorpay keys not configured).'
        })
      }

      assertPaymentsConfigured()

      const plan = await createMonthlyPlan({
        societyId: body.societyId,
        societyName: society.name,
        amountPaise: dues.monthlyTotalPaise,
        totalFlats: dues.totalFlats
      })

      const razorpaySubscription = await createSocietySubscription({
        planId: plan.id,
        societyId: body.societyId,
        customerEmail: body.customerEmail,
        customerName: body.customerName
      })

      await patchSocietySubscription(body.societyId, {
        razorpay_plan_id: plan.id,
        razorpay_subscription_id: razorpaySubscription.id
      })

      return json(res, 200, {
        subscriptionId: razorpaySubscription.id,
        planId: plan.id,
        keyId: config.razorpayKeyId,
        monthlyTotalInr: dues.monthlyTotalInr,
        monthlyRatePerFlat: dues.monthlyRatePerFlat,
        totalFlats: dues.totalFlats,
        shortUrl: razorpaySubscription.short_url
      })
    } catch (err: any) {
      return json(res, 500, { error: err.message ?? 'Failed to create subscription' })
    }
  }

  if (subPath === 'subscribe/verify' && req.method === 'POST') {
    if (!ensureDbConfigured(res)) return
    try {
      const body = readJsonBody<{
        societyId?: string
        razorpay_subscription_id?: string
        razorpay_payment_id?: string
        razorpay_signature?: string
      }>(req)

      if (!body.societyId || !body.razorpay_subscription_id) {
        return json(res, 400, { error: 'societyId and razorpay_subscription_id are required' })
      }

      const activeUntil = extendActiveUntil(null, 30)
      const subscription = await patchSocietySubscription(body.societyId, {
        activation_status: 'active_subscription',
        razorpay_subscription_id: body.razorpay_subscription_id,
        billing_cycle_anchor: new Date().toISOString(),
        active_until: activeUntil
      })

      await patchSociety(body.societyId, { subscription_status: 'active' })

      return json(res, 200, {
        success: true,
        activationStatus: subscription.activation_status,
        activeUntil: subscription.active_until,
        verifiedPaymentId: body.razorpay_payment_id ?? null,
        verifiedSignature: Boolean(body.razorpay_signature)
      })
    } catch (err: any) {
      return json(res, 500, { error: err.message ?? 'Subscription verification failed' })
    }
  }

  return false
}

export async function handlePaymentsWebhook(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })
  if (!ensureDbConfigured(res)) return

  try {
    const signature = req.headers['x-razorpay-signature'] as string | undefined
    const rawBody = await readRawBody(req)

    if (config.razorpayWebhookSecret && !verifyWebhookSignature(rawBody, signature)) {
      return json(res, 400, { error: 'Invalid webhook signature' })
    }

    const event = JSON.parse(rawBody.toString('utf8'))
    const eventId = event?.id as string | undefined
    const eventType = event?.event as string | undefined

    if (!eventId || !eventType) return json(res, 400, { error: 'Malformed webhook payload' })

    if (await webhookEventExists(eventId)) {
      return json(res, 200, { received: true, duplicate: true })
    }

    if (eventType === 'subscription.charged') {
      const subscriptionEntity = event?.payload?.subscription?.entity
      const razorpaySubscriptionId = subscriptionEntity?.id as string | undefined
      const notesSocietyId = subscriptionEntity?.notes?.society_id as string | undefined

      let row = razorpaySubscriptionId ? await getSubscriptionByRazorpayId(razorpaySubscriptionId) : null
      if (!row && notesSocietyId) row = await getSocietySubscription(notesSocietyId)

      if (row) {
        const activeUntil = extendActiveUntil(row.active_until, 30)
        await patchSocietySubscription(row.society_id, {
          activation_status: 'active_subscription',
          active_until: activeUntil,
          billing_cycle_anchor: row.billing_cycle_anchor ?? new Date().toISOString()
        })
        await patchSociety(row.society_id, { subscription_status: 'active' })

        await recordWebhookEvent({
          razorpayEventId: eventId,
          eventType,
          societyId: row.society_id,
          payload: event
        })

        const society = await getSocietyById(row.society_id)
        const paymentEntity = event?.payload?.payment?.entity
        await forwardEventToN8n({
          eventId: `pay-${eventId}`,
          type: 'payment.received',
          societyId: row.society_id,
          societyName: society?.name,
          summary: `Monthly subscription charged for ${society?.name ?? row.society_id}`,
          occurredAt: new Date().toISOString(),
          metadata: {
            source: 'razorpay.webhook',
            razorpayEventId: eventId,
            eventType,
            amount: paymentEntity?.amount,
            currency: paymentEntity?.currency,
            razorpaySubscriptionId
          }
        })
      }
    } else {
      await recordWebhookEvent({
        razorpayEventId: eventId,
        eventType,
        societyId: null,
        payload: event
      })
    }

    return json(res, 200, { received: true })
  } catch (err: any) {
    return json(res, 500, { error: err.message ?? 'Webhook processing failed' })
  }
}
