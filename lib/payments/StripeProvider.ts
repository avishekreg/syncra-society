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
    // TODO: stripe.webhooks.constructEvent(input.rawBody, signature, this.webhookSecret)
    void input
    void this.webhookSecret
    return {
      provider: this.provider,
      eventType: 'stripe.stub',
      status: 'unknown',
      raw: { message: 'Stripe webhook stub' }
    }
  }
}
