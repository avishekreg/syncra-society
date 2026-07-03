import { getActivationFeeInr, getTierRateInr } from './platformPricingStore'

export async function resolveMonthlyRatePerFlat(pricingSlabId?: string | null) {
  return getTierRateInr(pricingSlabId)
}

export function calculateMonthlyDues(totalFlats: number, ratePerFlatInr: number) {
  const flats = Math.max(0, Math.floor(totalFlats))
  const rate = Math.max(0, ratePerFlatInr)
  const monthlyTotalInr = flats * rate
  return {
    totalFlats: flats,
    monthlyRatePerFlat: rate,
    monthlyTotalInr,
    monthlyTotalPaise: Math.round(monthlyTotalInr * 100)
  }
}

export async function activationFeePaise() {
  return Math.round((await getActivationFeeInr()) * 100)
}
