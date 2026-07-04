import { fetchAutomationSettings, fetchWhatsAppContacts } from './societyEvents'
import { resolveTwilioSenderPhone } from './n8nConfig'

function readCachedSettings(societyId: string): { whatsappNumber?: string | null } | null {
  try {
    const raw = localStorage.getItem(`syncra-wa-settings-${societyId}`)
    return raw ? (JSON.parse(raw) as { whatsappNumber?: string | null }) : null
  } catch {
    return null
  }
}

function readCachedContacts(societyId: string): Array<{ phone: string; optedIn: boolean }> {
  try {
    const raw = localStorage.getItem(`syncra-wa-contacts-${societyId}`)
    return raw ? (JSON.parse(raw) as Array<{ phone: string; optedIn: boolean }>) : []
  } catch {
    return []
  }
}

export async function resolveSocietySenderWhatsapp(societyId: string): Promise<string> {
  try {
    const settings = await fetchAutomationSettings(societyId)
    if (settings?.whatsappNumber?.trim()) return settings.whatsappNumber.trim()
  } catch {
    // fall through to cached / env defaults
  }

  const cached = readCachedSettings(societyId)
  if (cached?.whatsappNumber?.trim()) return cached.whatsappNumber.trim()

  return resolveTwilioSenderPhone()
}

export async function resolveNoticeReceiverPhones(societyId: string): Promise<string[]> {
  try {
    const contacts = await fetchWhatsAppContacts(societyId)
    const phones = contacts
      .filter((contact) => contact.optedIn && contact.phone?.trim())
      .map((contact) => contact.phone.trim())
    if (phones.length > 0) return [...new Set(phones)]
  } catch {
    // fall through
  }

  const cachedPhones = readCachedContacts(societyId)
    .filter((contact) => contact.optedIn && contact.phone?.trim())
    .map((contact) => contact.phone.trim())
  if (cachedPhones.length > 0) return [...new Set(cachedPhones)]

  const demoReceiver =
    import.meta.env.VITE_DEMO_RESIDENT_WHATSAPP?.trim() ||
    import.meta.env.NEXT_PUBLIC_DEMO_RESIDENT_WHATSAPP?.trim()

  return demoReceiver ? [demoReceiver] : []
}

export function cacheAutomationSettings(
  societyId: string,
  settings: { whatsappNumber?: string | null }
) {
  localStorage.setItem(`syncra-wa-settings-${societyId}`, JSON.stringify(settings))
}

export function cacheWhatsAppContacts(
  societyId: string,
  contacts: Array<{ phone: string; optedIn: boolean }>
) {
  localStorage.setItem(`syncra-wa-contacts-${societyId}`, JSON.stringify(contacts))
}
