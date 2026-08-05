import type { DeliveryPreApproval, DeliveryServiceProvider } from '../types/db'
import { restGet, restPatch, restPost, supabaseRestUrl, getSupabaseRestHeaders } from './supabaseClient'
import { shouldUseLocalFallback } from './apiErrors'
import { ensureSocietyFlatId } from './flatRegistry'

export type DeliveryProviderCategory = 'food_grocery' | 'ecommerce_logistics' | 'postal_govt' | 'generic'

export type DeliveryProviderOption = {
  id: DeliveryServiceProvider
  category: DeliveryProviderCategory
  label: string
  shortLabel: string
}

/** Canonical universal vendor catalog. */
export const DELIVERY_PROVIDER_OPTIONS: DeliveryProviderOption[] = [
  { id: 'Swiggy', category: 'food_grocery', label: 'Swiggy', shortLabel: 'Swiggy' },
  { id: 'Zomato', category: 'food_grocery', label: 'Zomato', shortLabel: 'Zomato' },
  { id: 'Blinkit', category: 'food_grocery', label: 'Blinkit', shortLabel: 'Blinkit' },
  { id: 'Zepto', category: 'food_grocery', label: 'Zepto', shortLabel: 'Zepto' },
  { id: 'BigBasket', category: 'food_grocery', label: 'BigBasket', shortLabel: 'BigBasket' },
  { id: 'Amazon', category: 'ecommerce_logistics', label: 'Amazon', shortLabel: 'Amazon' },
  { id: 'Flipkart', category: 'ecommerce_logistics', label: 'Flipkart', shortLabel: 'Flipkart' },
  { id: 'Blue Dart', category: 'ecommerce_logistics', label: 'Blue Dart', shortLabel: 'Blue Dart' },
  { id: 'Delhivery', category: 'ecommerce_logistics', label: 'Delhivery', shortLabel: 'Delhivery' },
  { id: 'DTDC', category: 'ecommerce_logistics', label: 'DTDC', shortLabel: 'DTDC' },
  { id: 'Xpressbees', category: 'ecommerce_logistics', label: 'Xpressbees', shortLabel: 'Xpressbees' },
  { id: 'Shadowfax', category: 'ecommerce_logistics', label: 'Shadowfax', shortLabel: 'Shadowfax' },
  {
    id: 'India Post / Speed Post',
    category: 'postal_govt',
    label: 'India Post / Speed Post',
    shortLabel: 'India Post'
  },
  {
    id: 'Registered Parcel',
    category: 'postal_govt',
    label: 'Registered Parcel',
    shortLabel: 'Registered Parcel'
  },
  {
    id: 'Generic Courier / Parcel',
    category: 'generic',
    label: 'Generic Courier / Parcel',
    shortLabel: 'Local Courier'
  }
]

export const ALL_DELIVERY_PROVIDERS: DeliveryServiceProvider[] = DELIVERY_PROVIDER_OPTIONS.map(
  (item) => item.id
)

/** Resident FAB / one-tap defaults (food + postal fallback). */
export const QUICK_DELIVERY_PROVIDERS: DeliveryServiceProvider[] = [
  'Swiggy',
  'Zomato',
  'Blinkit',
  'Amazon',
  'India Post / Speed Post',
  'Generic Courier / Parcel'
]

/** Guard desk 1-tap clearance chips (branded + postal/local). */
export const GUARD_QUICK_CLEAR_PROVIDERS: DeliveryServiceProvider[] = [
  'Swiggy',
  'Zomato',
  'Blinkit',
  'Amazon',
  'Flipkart',
  'Delhivery',
  'Blue Dart',
  'India Post / Speed Post',
  'Generic Courier / Parcel'
]

export const DELIVERY_CATEGORY_LABELS: Record<DeliveryProviderCategory, string> = {
  food_grocery: 'Food / Grocery',
  ecommerce_logistics: 'E-Commerce / E-Logistics',
  postal_govt: 'Postal & Govt',
  generic: 'Fallback'
}

export const FOOD_QUICK_WINDOW_HOURS = 2
export const COURIER_POSTAL_WINDOW_HOURS = 12

const GENERIC_DELIVERY_TRIGGERS = [
  /out\s+for\s+delivery/i,
  /arriving\s+today/i,
  /\bcourier\b/i,
  /speed\s*post/i,
  /delivery\s+agent/i,
  /\bshipment\b/i,
  /\bparcel\b/i,
  /your\s+order\s+is\s+on\s+the\s+way/i,
  /package\s+has\s+been\s+dispatched/i,
  /expected\s+delivery/i
]

type BrandPattern = { provider: DeliveryServiceProvider; pattern: RegExp }

const BRAND_PATTERNS: BrandPattern[] = [
  { provider: 'Swiggy', pattern: /\bswiggy\b/i },
  { provider: 'Zomato', pattern: /\bzomato\b/i },
  { provider: 'Blinkit', pattern: /\bblinkit\b|\bgrofers\b/i },
  { provider: 'Zepto', pattern: /\bzepto\b/i },
  { provider: 'BigBasket', pattern: /\bbig\s*basket\b|\bbigbasket\b/i },
  { provider: 'Amazon', pattern: /\bamazon\b|\bamzn\b|\bamazon\.in\b/i },
  { provider: 'Flipkart', pattern: /\bflipkart\b|\bekart\b/i },
  { provider: 'Blue Dart', pattern: /\bblue\s*dart\b/i },
  { provider: 'Delhivery', pattern: /\bdelhivery\b/i },
  { provider: 'DTDC', pattern: /\bdtdc\b/i },
  { provider: 'Xpressbees', pattern: /\bxpress\s*bees\b|\bxpressbees\b/i },
  { provider: 'Shadowfax', pattern: /\bshadow\s*fax\b|\bshadowfax\b/i },
  { provider: 'India Post / Speed Post', pattern: /\bindia\s*post\b|\bspeed\s*post\b|\bpostal\b/i },
  { provider: 'Registered Parcel', pattern: /\bregistered\s+parcel\b|\bregistered\s+post\b/i }
]

export type DeliveryIntentMatch = {
  provider: DeliveryServiceProvider
  confidence: 'brand' | 'generic'
  matchedTrigger: string
  suggestedWindowHours: number
}

let localMode = false
let localRows: DeliveryPreApproval[] = []

function randomId() {
  return `local-delivery-${Math.random().toString(36).slice(2, 10)}`
}

function windowEndIso(hours: number, from = new Date()) {
  return new Date(from.getTime() + hours * 60 * 60 * 1000).toISOString()
}

export function isPostalOrGenericProvider(provider: DeliveryServiceProvider) {
  return (
    provider === 'India Post / Speed Post' ||
    provider === 'Registered Parcel' ||
    provider === 'Generic Courier / Parcel' ||
    provider === 'Blue Dart' ||
    provider === 'Delhivery' ||
    provider === 'DTDC' ||
    provider === 'Xpressbees' ||
    provider === 'Shadowfax'
  )
}

export function defaultWindowHoursForProvider(provider: DeliveryServiceProvider) {
  return isPostalOrGenericProvider(provider) || provider === 'Amazon' || provider === 'Flipkart'
    ? COURIER_POSTAL_WINDOW_HOURS
    : FOOD_QUICK_WINDOW_HOURS
}

export function providersByCategory(category: DeliveryProviderCategory) {
  return DELIVERY_PROVIDER_OPTIONS.filter((item) => item.category === category)
}

async function invokeExpireRpc() {
  try {
    await fetch(supabaseRestUrl('rpc/expire_delivery_pre_approvals'), {
      method: 'POST',
      headers: getSupabaseRestHeaders(),
      body: '{}'
    })
  } catch {
    // Best-effort expiry; local filter still applies.
  }
}

function expireLocal() {
  const now = Date.now()
  localRows = localRows.map((row) => {
    if (row.status === 'PRE_APPROVED' && new Date(row.expected_window_end).getTime() < now) {
      return { ...row, status: 'EXPIRED' as const }
    }
    return row
  })
}

/** Auto-expire pre-approvals past their window. */
export async function expireStaleDeliveryApprovals(): Promise<void> {
  if (localMode) {
    expireLocal()
    return
  }
  await invokeExpireRpc()
}

export async function listDeliveryPreApprovalsForFlat(
  societyId: string,
  flatNumber: string
): Promise<DeliveryPreApproval[]> {
  await expireStaleDeliveryApprovals()
  if (localMode) {
    expireLocal()
    return localRows.filter(
      (row) => row.society_id === societyId && row.flat_number.toLowerCase() === flatNumber.toLowerCase()
    )
  }
  try {
    return await restGet<DeliveryPreApproval[]>(
      `delivery_pre_approvals?society_id=eq.${societyId}&flat_number=eq.${encodeURIComponent(flatNumber)}&order=created_at.desc`
    )
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return listDeliveryPreApprovalsForFlat(societyId, flatNumber)
  }
}

export async function listActiveDeliveryPreApprovals(societyId: string): Promise<DeliveryPreApproval[]> {
  await expireStaleDeliveryApprovals()
  if (localMode) {
    expireLocal()
    const now = Date.now()
    return localRows.filter(
      (row) =>
        row.society_id === societyId &&
        row.status === 'PRE_APPROVED' &&
        new Date(row.expected_window_end).getTime() >= now
    )
  }
  try {
    return await restGet<DeliveryPreApproval[]>(
      `delivery_pre_approvals?society_id=eq.${societyId}&status=eq.PRE_APPROVED&expected_window_end=gte.${new Date().toISOString()}&order=expected_window_end.asc`
    )
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return listActiveDeliveryPreApprovals(societyId)
  }
}

export async function createDeliveryPreApproval(input: {
  societyId: string
  flatNumber: string
  serviceProvider: DeliveryServiceProvider
  windowHours?: number
  createdByUserId?: string
}): Promise<DeliveryPreApproval> {
  const hours = input.windowHours ?? defaultWindowHoursForProvider(input.serviceProvider)
  const flatId = await ensureSocietyFlatId(input.societyId, input.flatNumber)
  const payload = {
    society_id: input.societyId,
    flat_id: flatId,
    flat_number: input.flatNumber.trim(),
    service_provider: input.serviceProvider,
    expected_window_end: windowEndIso(hours),
    status: 'PRE_APPROVED' as const,
    created_by_user_id: input.createdByUserId ?? null
  }

  if (localMode) {
    const row: DeliveryPreApproval = {
      id: randomId(),
      created_at: new Date().toISOString(),
      ...payload
    }
    localRows.unshift(row)
    return row
  }

  try {
    return await restPost<DeliveryPreApproval>('delivery_pre_approvals', payload)
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return createDeliveryPreApproval(input)
  }
}

/** One-tap Quick Pre-Approve — default window by provider class (2h food / 12h courier). */
export async function quickPreApproveDelivery(input: {
  societyId: string
  flatNumber: string
  serviceProvider: DeliveryServiceProvider
  createdByUserId?: string
  windowHours?: number
}): Promise<DeliveryPreApproval> {
  return createDeliveryPreApproval(input)
}

/** Manual 12-hour Expected Courier / Postal Delivery slot. */
export async function createExpectedCourierPostalSlot(input: {
  societyId: string
  flatNumber: string
  serviceProvider?: DeliveryServiceProvider
  createdByUserId?: string
}): Promise<DeliveryPreApproval> {
  return createDeliveryPreApproval({
    ...input,
    serviceProvider: input.serviceProvider ?? 'Generic Courier / Parcel',
    windowHours: COURIER_POSTAL_WINDOW_HOURS
  })
}

export async function completeDeliveryPreApproval(id: string): Promise<DeliveryPreApproval> {
  if (localMode) {
    const row = localRows.find((item) => item.id === id)
    if (!row) throw new Error('Pre-approval not found')
    row.status = 'COMPLETED'
    return row
  }
  try {
    return await restPatch<DeliveryPreApproval>(`delivery_pre_approvals?id=eq.${id}`, {
      status: 'COMPLETED'
    })
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return completeDeliveryPreApproval(id)
  }
}

/**
 * Universal notification parser for app push / SMS / WhatsApp delivery alerts.
 * Matches branded logistics first, then generic courier triggers.
 */
export function parseUniversalDeliveryNotification(text: string): DeliveryIntentMatch | null {
  const value = text.trim()
  if (!value) return null

  for (const brand of BRAND_PATTERNS) {
    const match = value.match(brand.pattern)
    if (match) {
      return {
        provider: brand.provider,
        confidence: 'brand',
        matchedTrigger: match[0],
        suggestedWindowHours: defaultWindowHoursForProvider(brand.provider)
      }
    }
  }

  for (const trigger of GENERIC_DELIVERY_TRIGGERS) {
    const match = value.match(trigger)
    if (match) {
      return {
        provider: 'Generic Courier / Parcel',
        confidence: 'generic',
        matchedTrigger: match[0],
        suggestedWindowHours: COURIER_POSTAL_WINDOW_HOURS
      }
    }
  }

  return null
}

/** @deprecated Prefer parseUniversalDeliveryNotification for full match metadata. */
export function detectDeliveryIntent(text: string): DeliveryServiceProvider | null {
  return parseUniversalDeliveryNotification(text)?.provider ?? null
}

/**
 * Interceptor helper: parse an inbound alert and optionally create a pre-approval slot.
 */
export async function interceptDeliveryNotification(input: {
  societyId: string
  flatNumber: string
  notificationText: string
  createdByUserId?: string
  autoCreate?: boolean
}): Promise<{ match: DeliveryIntentMatch | null; preApproval: DeliveryPreApproval | null }> {
  const match = parseUniversalDeliveryNotification(input.notificationText)
  if (!match) return { match: null, preApproval: null }
  if (!input.autoCreate) return { match, preApproval: null }

  const preApproval = await createDeliveryPreApproval({
    societyId: input.societyId,
    flatNumber: input.flatNumber,
    serviceProvider: match.provider,
    windowHours: match.suggestedWindowHours,
    createdByUserId: input.createdByUserId
  })
  return { match, preApproval }
}

export function filterDeliveriesByProvider(
  rows: DeliveryPreApproval[],
  provider: DeliveryServiceProvider | 'Postal / Local Courier'
) {
  if (provider === 'Postal / Local Courier') {
    return rows.filter(
      (row) =>
        row.service_provider === 'India Post / Speed Post' ||
        row.service_provider === 'Registered Parcel' ||
        row.service_provider === 'Generic Courier / Parcel'
    )
  }
  return rows.filter((row) => row.service_provider === provider)
}
