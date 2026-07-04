/** Sanitized client-facing copy — hides proprietary infrastructure vendor names. */

export const SMART_AI_UNAVAILABLE_MESSAGE =
  'Smart AI services are currently optimizing. Please contact your system administrator if this persists.'

export const MESSAGE_GATEWAY_UNAVAILABLE =
  'Automated messaging is temporarily unavailable. Your record was saved successfully.'

export function formatGatewayStatusLabel(configured: boolean, reachable: boolean) {
  if (!configured) return 'Initializing'
  if (reachable) return 'Connected'
  return 'Standby'
}

export function sanitizeAutomationStatusMessage(message?: string | null) {
  if (!message) return null
  const lower = message.toLowerCase()
  if (lower.includes('n8n') || lower.includes('webhook') || lower.includes('hugging')) {
    return 'Syncra Core infrastructure is preparing your message gateway.'
  }
  return message
}
