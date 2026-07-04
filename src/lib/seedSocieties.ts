import type { Society } from '../types/db'

/** Canonical UUIDs from schema.sql demo seed — used when remote fetch is unavailable. */
export const SEED_SOCIETY_UUIDS = {
  windsorCastle: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  lotusGreens: 'c2d3e4f5-a6b7-8901-cdef-234567890abc'
} as const

export const SEED_SOCIETIES: Society[] = [
  {
    id: SEED_SOCIETY_UUIDS.windsorCastle,
    name: 'Syncra Windsor Castle',
    address: 'Sector 78, Gurugram, Haryana',
    subscription_status: 'trial',
    pricing_slab_id: 'tier2',
    total_flats: 120
  },
  {
    id: SEED_SOCIETY_UUIDS.lotusGreens,
    name: 'Lotus Greens (Basic)',
    address: 'Koregaon Park, Pune',
    subscription_status: 'trial',
    pricing_slab_id: 'tier1',
    total_flats: 48
  }
]
