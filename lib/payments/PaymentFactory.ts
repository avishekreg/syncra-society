import { getActivePaymentGateway, getPaymentGatewayKeys } from '@/lib/config/system-config'
import type { IPaymentGateway } from './IPaymentGateway'
import { RazorpayProvider } from './RazorpayProvider'
import { StripeProvider } from './StripeProvider'

export async function createPaymentGateway(): Promise<IPaymentGateway> {
  const provider = await getActivePaymentGateway()
  const keys = await getPaymentGatewayKeys()

  switch (provider) {
    case 'STRIPE':
      return new StripeProvider(keys.publicKey, keys.secretKey, keys.webhookSecret)
    case 'CHILE_LOCAL':
      // Placeholder — extend with Transbank / local Chile provider
      return new StripeProvider(keys.publicKey, keys.secretKey, keys.webhookSecret)
    case 'RAZORPAY':
    default:
      return new RazorpayProvider(keys.publicKey, keys.secretKey, keys.webhookSecret)
  }
}

export async function getPublicPaymentConfig() {
  const gateway = await createPaymentGateway()
  const keys = await getPaymentGatewayKeys()
  return {
    provider: gateway.provider,
    publicKey: keys.publicKey
  }
}
