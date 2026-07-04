import crypto from 'node:crypto'
import type {
  CreateOrderInput,
  CreateOrderResult,
  IPaymentGateway,
  VerifyWebhookInput,
  VerifiedWebhookEvent
} from './IPaymentGateway'

/**
 * Stripe provider boilerplate — wire Stripe SDK + webhook signing secret
 * when expanding to Abu Dhabi / Dubai markets.
 */
export class StripeProvider implements IPaymentGateway {
  readonly provider = 'STRIPE'

  constructor(
    private readonly publicKey: string,
    private readonly secretKey: string,
    private readonly webhookSecret = ''
  ) {}

  async createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
    // TODO: stripe.checkout.sessions.create or paymentIntents.create
    return {
      orderId: `stripe_pending_${input.receipt}`,
      amount: input.amountPaise,
      currency: input.currency ?? 'AED',
      publicKey: this.publicKey,
      provider: this.provider,
      raw: { message: 'Stripe integration stub — configure STRIPE keys in system_configs' }
    }
  }

  async verifyWebhookSignature(input: VerifyWebhookInput): Promise<VerifiedWebhookEvent | null> {
    const signatureHeader = input.headers?.['stripe-signature']
    if (!signatureHeader || !this.webhookSecret) return null

    const rawBody = input.rawBody.toString('utf8')
    const parts = signatureHeader.split(',').reduce<Record<string, string>>((acc, part) => {
      const [key, value] = part.split('=')
      if (key && value) acc[key.trim()] = value.trim()
      return acc
    }, {})

    const timestamp = parts.t
    const signature = parts.v1
    if (!timestamp || !signature) return null

    const signedPayload = `${timestamp}.${rawBody}`
    const expected = crypto.createHmac('sha256', this.webhookSecret).update(signedPayload).digest('hex')

    const expectedBuffer = Buffer.from(expected, 'utf8')
    const signatureBuffer = Buffer.from(signature, 'utf8')
    if (
      expectedBuffer.length !== signatureBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)
    ) {
      return null
    }

    const event = JSON.parse(rawBody) as {
      type?: string
      data?: {
        object?: {
          id?: string
          metadata?: Record<string, string>
          amount?: number
          currency?: string
          status?: string
        }
      }
    }

    const eventType = event.type ?? 'unknown'
    const object = event.data?.object
    const metadata = object?.metadata ?? {}
    const societyId = metadata.societyId ?? metadata.society_id
    const purchasedModule = metadata.purchasedModule ?? metadata.purchased_module

    const paidEvents = new Set([
      'checkout.session.completed',
      'payment_intent.succeeded',
      'invoice.payment_succeeded'
    ])

    if (paidEvents.has(eventType)) {
      return {
        provider: this.provider,
        eventType,
        paymentId: object?.id,
        amount: object?.amount,
        currency: object?.currency,
        status: 'paid',
        societyId,
        purchasedModule,
        metadata,
        raw: event
      }
    }

    return {
      provider: this.provider,
      eventType,
      status: 'unknown',
      societyId,
      purchasedModule,
      metadata,
      raw: event
    }
  }
}
