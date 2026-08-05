import type { P2pEnergyTrade } from '../types/db'
import { restGet, restPost } from './supabaseClient'
import { shouldUseLocalFallback } from './apiErrors'
import { ensureSocietyFlatId } from './flatRegistry'

let localMode = false
let localTrades: P2pEnergyTrade[] = []

const CREDIT_PER_KWH = 8

function rid() {
  return `energy-${Math.random().toString(36).slice(2, 10)}`
}

export function estimateEnergyCredits(kwh: number) {
  return Math.round(Math.max(0, kwh) * CREDIT_PER_KWH * 100) / 100
}

export async function listEnergyTrades(societyId: string): Promise<P2pEnergyTrade[]> {
  if (localMode) return localTrades.filter((t) => t.society_id === societyId)
  try {
    return await restGet<P2pEnergyTrade[]>(
      `p2p_energy_trades?society_id=eq.${societyId}&order=created_at.desc&limit=40`
    )
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return listEnergyTrades(societyId)
  }
}

export async function createEnergyTrade(input: {
  societyId: string
  sellerFlatNumber: string
  buyerFlatNumber: string
  energyKwh: number
}): Promise<P2pEnergyTrade> {
  if (input.sellerFlatNumber.trim().toLowerCase() === input.buyerFlatNumber.trim().toLowerCase()) {
    throw new Error('Seller and buyer flats must differ')
  }
  const kwh = Math.max(0.1, input.energyKwh)
  const sellerFlatId = await ensureSocietyFlatId(input.societyId, input.sellerFlatNumber)
  const buyerFlatId = await ensureSocietyFlatId(input.societyId, input.buyerFlatNumber)
  const payload = {
    society_id: input.societyId,
    seller_flat_id: sellerFlatId,
    seller_flat_number: input.sellerFlatNumber.trim(),
    buyer_flat_id: buyerFlatId,
    buyer_flat_number: input.buyerFlatNumber.trim(),
    energy_kwh: kwh,
    credits_transferred: estimateEnergyCredits(kwh),
    status: 'COMPLETED' as const
  }

  if (localMode) {
    const row: P2pEnergyTrade = { id: rid(), created_at: new Date().toISOString(), ...payload }
    localTrades.unshift(row)
    return row
  }
  try {
    return await restPost<P2pEnergyTrade>('p2p_energy_trades', payload)
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err
    localMode = true
    return createEnergyTrade(input)
  }
}
