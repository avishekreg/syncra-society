/**
 * Election Engine — DRAFT → OPEN → CLOSED → PUBLISHED
 * Absolute ballot secrecy: participation seals ≠ anonymous ballots.
 */

import {
  createParticipationSeal,
  decryptVote,
  encryptVote,
  generateElectionKeyPair,
  generateElectionPepper,
  lockPrivateKey,
  normalizeFlatId,
  unlockPrivateKey,
  type ElectionKeyPair
} from '../lib/electionCrypto'
import { logActivity } from '../lib/activityLog'
import { getPlatformConfig } from '../lib/platformConfig'
import { notifyElectionOpen, notifyElectionPublished } from '../lib/pushNotifications'
import { isRemoteSocietyId } from './societies'
import { restGet, restPost, restPatch } from './supabaseClient'
import { shouldUseLocalFallback } from './apiErrors'

export type ElectionStatus = 'draft' | 'open' | 'closed' | 'published'

export type ElectionCandidate = { id: string; name: string }

export type ElectionPosition = {
  id: string
  title: string
  candidates: ElectionCandidate[]
}

export type Election = {
  id: string
  societyId: string
  title: string
  description: string
  positions: ElectionPosition[]
  status: ElectionStatus
  publicKey: JsonWebKey | null
  /** Present only until publish — then destroyed */
  lockedPrivateKey: string | null
  privateKeyDestroyedAt?: string | null
  pepper: string
  eligibleFlatCount: number
  eligibleFlatIds: string[]
  createdAt: string
  openedAt?: string | null
  closedAt?: string | null
  publishedAt?: string | null
  closesAt?: string | null
}

/** Anonymous ballot — NO flat/voter identity */
export type AnonymousBallot = {
  id: string
  electionId: string
  societyId: string
  positionId: string
  encryptedChoice: string
  castAt: string
}

/** Participation seal — flat-bound, never linked to candidate choice */
export type ParticipationSeal = {
  id: string
  electionId: string
  societyId: string
  positionId: string
  flatId: string
  sealHash: string
  castAt: string
}

export type PositionBulletinResult = {
  positionId: string
  title: string
  totalVotes: number
  turnoutPercent: number
  candidates: Array<{
    candidateId: string
    name: string
    votes: number
    percent: number
  }>
  winnerCandidateIds: string[]
  isTie: boolean
}

export type PublishedBulletin = {
  id: string
  electionId: string
  societyId: string
  title: string
  description: string
  publishedAt: string
  openedAt?: string | null
  closedAt?: string | null
  eligibleFlatCount: number
  totalBallots: number
  positionResults: PositionBulletinResult[]
  secrecyStatement: string
  integrity: {
    ballotCountMatchesSeals: boolean
    sealsCount: number
    ballotsCount: number
    tieAlerts: string[]
  }
}

export type ElectionTurnout = {
  electionId: string
  status: ElectionStatus
  eligibleFlatCount: number
  /** Max seals across positions (or per-position map) */
  votedFlatCount: number
  turnoutPercent: number
  byPosition: Array<{
    positionId: string
    title: string
    votedFlatCount: number
    turnoutPercent: number
  }>
}

export type SuperAdminElectionAudit = {
  electionId: string
  societyId: string
  title: string
  status: ElectionStatus
  eligibleFlatCount: number
  sealsCount: number
  ballotsCount: number
  integrityOk: boolean
  tieAlerts: string[]
  privateKeyDestroyed: boolean
  publishedAt?: string | null
}

/* ----------------------------- local storage ----------------------------- */

function electionsKey(societyId: string) {
  return `mai-elections-${societyId}`
}
function ballotsKey(electionId: string) {
  return `mai-election-ballots-${electionId}`
}
function sealsKey(electionId: string) {
  return `mai-election-seals-${electionId}`
}
function bulletinKey(electionId: string) {
  return `mai-election-bulletin-${electionId}`
}

function loadElections(societyId: string): Election[] {
  try {
    const raw =
      localStorage.getItem(electionsKey(societyId)) ||
      localStorage.getItem(`syncra-elections-${societyId}`)
    const parsed = raw ? (JSON.parse(raw) as Election[]) : []
    return parsed.map(normalizeElection)
  } catch {
    return []
  }
}

function saveElections(societyId: string, elections: Election[]) {
  localStorage.setItem(electionsKey(societyId), JSON.stringify(elections))
}

function loadBallots(electionId: string): AnonymousBallot[] {
  try {
    const raw = localStorage.getItem(ballotsKey(electionId))
    return raw ? (JSON.parse(raw) as AnonymousBallot[]) : []
  } catch {
    return []
  }
}

function saveBallots(electionId: string, ballots: AnonymousBallot[]) {
  localStorage.setItem(ballotsKey(electionId), JSON.stringify(ballots))
}

function loadSeals(electionId: string): ParticipationSeal[] {
  try {
    const raw = localStorage.getItem(sealsKey(electionId))
    return raw ? (JSON.parse(raw) as ParticipationSeal[]) : []
  } catch {
    return []
  }
}

function saveSeals(electionId: string, seals: ParticipationSeal[]) {
  localStorage.setItem(sealsKey(electionId), JSON.stringify(seals))
}

function loadBulletin(electionId: string): PublishedBulletin | null {
  try {
    const raw = localStorage.getItem(bulletinKey(electionId))
    return raw ? (JSON.parse(raw) as PublishedBulletin) : null
  } catch {
    return null
  }
}

function saveBulletin(bulletin: PublishedBulletin) {
  localStorage.setItem(bulletinKey(bulletin.electionId), JSON.stringify(bulletin))
}

function normalizeElection(raw: Election): Election {
  const positions =
    raw.positions?.length > 0
      ? raw.positions
      : [
          {
            id: 'pos-general',
            title: 'General',
            candidates: ((raw as Election & { candidates?: ElectionCandidate[] }).candidates ??
              []) as ElectionCandidate[]
          }
        ]

  return {
    ...raw,
    positions,
    status: (raw.status as ElectionStatus) || 'draft',
    publicKey: raw.publicKey ?? null,
    lockedPrivateKey: raw.lockedPrivateKey ?? null,
    eligibleFlatCount: raw.eligibleFlatCount ?? 0,
    eligibleFlatIds: raw.eligibleFlatIds ?? []
  }
}

function buildPositionId(index: number) {
  return `pos-${index + 1}`
}

function buildCandidateId(positionIndex: number, candidateIndex: number) {
  return `cand-${positionIndex + 1}-${candidateIndex + 1}`
}

function newId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function pct(part: number, whole: number) {
  if (whole <= 0) return 0
  return Math.round((part / whole) * 1000) / 10
}

/* ----------------------------- remote helpers ---------------------------- */

type RemoteElectionRow = {
  id: string
  society_id: string
  title: string
  description: string
  status: ElectionStatus
  positions: ElectionPosition[]
  public_key: JsonWebKey | null
  locked_private_key: string | null
  private_key_destroyed_at: string | null
  pepper: string
  eligible_flat_count: number
  eligible_flat_ids: string[]
  created_at: string
  opened_at: string | null
  closed_at: string | null
  published_at: string | null
  closes_at: string | null
}

function fromRemoteElection(row: RemoteElectionRow): Election {
  return normalizeElection({
    id: row.id,
    societyId: row.society_id,
    title: row.title,
    description: row.description,
    positions: row.positions,
    status: row.status,
    publicKey: row.public_key,
    lockedPrivateKey: row.locked_private_key,
    privateKeyDestroyedAt: row.private_key_destroyed_at,
    pepper: row.pepper,
    eligibleFlatCount: row.eligible_flat_count ?? 0,
    eligibleFlatIds: row.eligible_flat_ids ?? [],
    createdAt: row.created_at,
    openedAt: row.opened_at,
    closedAt: row.closed_at,
    publishedAt: row.published_at,
    closesAt: row.closes_at
  })
}

async function remoteListElections(societyId: string): Promise<Election[] | null> {
  try {
    const rows = await restGet<RemoteElectionRow[]>(
      `society_elections?society_id=eq.${encodeURIComponent(societyId)}&order=created_at.desc`
    )
    return (rows ?? []).map(fromRemoteElection)
  } catch (err) {
    if (shouldUseLocalFallback(err)) return null
    throw err
  }
}

async function remoteUpsertElection(election: Election) {
  if (!isRemoteSocietyId(election.societyId)) return
  try {
    await restPost('society_elections', {
      id: election.id,
      society_id: election.societyId,
      title: election.title,
      description: election.description,
      status: election.status,
      positions: election.positions,
      public_key: election.publicKey,
      locked_private_key: election.lockedPrivateKey,
      private_key_destroyed_at: election.privateKeyDestroyedAt ?? null,
      pepper: election.pepper,
      eligible_flat_count: election.eligibleFlatCount,
      eligible_flat_ids: election.eligibleFlatIds,
      created_at: election.createdAt,
      opened_at: election.openedAt ?? null,
      closed_at: election.closedAt ?? null,
      published_at: election.publishedAt ?? null,
      closes_at: election.closesAt ?? null
    })
  } catch (err) {
    // Prefer upsert via patch if conflict
    try {
      await restPatch(`society_elections?id=eq.${encodeURIComponent(election.id)}`, {
        title: election.title,
        description: election.description,
        status: election.status,
        positions: election.positions,
        public_key: election.publicKey,
        locked_private_key: election.lockedPrivateKey,
        private_key_destroyed_at: election.privateKeyDestroyedAt ?? null,
        eligible_flat_count: election.eligibleFlatCount,
        eligible_flat_ids: election.eligibleFlatIds,
        opened_at: election.openedAt ?? null,
        closed_at: election.closedAt ?? null,
        published_at: election.publishedAt ?? null,
        closes_at: election.closesAt ?? null
      })
    } catch (err2) {
      if (!shouldUseLocalFallback(err2) && !shouldUseLocalFallback(err)) {
        console.warn('[elections] remote upsert failed', err2)
      }
    }
  }
}

/* --------------------------------- API ---------------------------------- */

export function listElections(societyId: string) {
  return loadElections(societyId).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export async function hydrateElections(societyId: string) {
  if (!isRemoteSocietyId(societyId)) return listElections(societyId)
  const remote = await remoteListElections(societyId)
  if (remote) {
    saveElections(societyId, remote)
    return remote
  }
  return listElections(societyId)
}

export function getElection(societyId: string, electionId: string) {
  return loadElections(societyId).find((e) => e.id === electionId) ?? null
}

export function getOpenElections(societyId: string) {
  return listElections(societyId).filter((e) => e.status === 'open')
}

export function getPublishedElections(societyId: string) {
  return listElections(societyId).filter((e) => e.status === 'published')
}

export function resolveEligibleFlatCount(societyId: string, explicit?: number) {
  if (typeof explicit === 'number' && explicit > 0) return Math.floor(explicit)
  try {
    const raw = localStorage.getItem(`syncra-eligible-flats-${societyId}`)
    if (raw) {
      const parsed = JSON.parse(raw) as string[]
      if (Array.isArray(parsed) && parsed.length > 0) return parsed.length
    }
  } catch {
    /* ignore */
  }
  try {
    const billing = localStorage.getItem(`syncra-billing-${societyId}`)
    if (billing) {
      const parsed = JSON.parse(billing) as { flatCount?: number; totalFlats?: number }
      const n = parsed.flatCount ?? parsed.totalFlats
      if (typeof n === 'number' && n > 0) return n
    }
  } catch {
    /* ignore */
  }
  return 0
}

export async function createElection(input: {
  societyId: string
  title: string
  description: string
  positions: { title: string; candidates: string[] }[]
  closesAt?: string | null
  eligibleFlatCount?: number
  /** When true, opens immediately after create */
  openImmediately?: boolean
}) {
  const platform = getPlatformConfig()
  if (!platform.electionModule.enabled) {
    throw new Error('Election module is disabled by platform configuration.')
  }
  if (!platform.electionModule.allowAnonymousVoting) {
    throw new Error('Anonymous encrypted voting is disabled by platform configuration.')
  }

  const keys: ElectionKeyPair = await generateElectionKeyPair()
  const positions: ElectionPosition[] = input.positions
    .filter((position) => position.title.trim())
    .slice(0, platform.electionModule.maxPositionsPerElection)
    .map((position, positionIndex) => ({
      id: buildPositionId(positionIndex),
      title: position.title.trim(),
      candidates: position.candidates
        .map((name) => name.trim())
        .filter(Boolean)
        .slice(0, platform.electionModule.maxCandidatesPerPosition)
        .map((name, candidateIndex) => ({
          id: buildCandidateId(positionIndex, candidateIndex),
          name
        }))
    }))
    .filter((position) => position.candidates.length > 0)

  if (positions.length === 0) {
    throw new Error('Add at least one contested position with candidates.')
  }

  const now = new Date().toISOString()
  const openImmediately = input.openImmediately !== false
  const eligibleFlatCount = resolveEligibleFlatCount(input.societyId, input.eligibleFlatCount)

  const election: Election = {
    id: newId('election'),
    societyId: input.societyId,
    title: input.title.trim(),
    description: input.description.trim(),
    positions,
    status: openImmediately ? 'open' : 'draft',
    publicKey: keys.publicKey,
    lockedPrivateKey: lockPrivateKey(keys.privateKey),
    privateKeyDestroyedAt: null,
    pepper: generateElectionPepper(),
    eligibleFlatCount,
    eligibleFlatIds: [],
    createdAt: now,
    openedAt: openImmediately ? now : null,
    closedAt: null,
    publishedAt: null,
    closesAt: input.closesAt ?? null
  }

  const elections = loadElections(input.societyId)
  elections.unshift(election)
  saveElections(input.societyId, elections)
  await remoteUpsertElection(election)

  logActivity({
    societyId: input.societyId,
    category: 'election',
    action: openImmediately ? 'election_opened' : 'election_created',
    summary: openImmediately
      ? `Election opened for voting: ${election.title}`
      : `Election drafted: ${election.title}`,
    metadata: { electionId: election.id, status: election.status, positions: positions.map((p) => p.title) }
  })

  if (openImmediately) {
    void notifyElectionOpen(input.societyId, election.title, election.id)
  }

  return election
}

export async function openElection(societyId: string, electionId: string) {
  const elections = loadElections(societyId)
  const idx = elections.findIndex((e) => e.id === electionId)
  if (idx < 0) throw new Error('Election not found.')
  const election = elections[idx]
  if (election.status !== 'draft') throw new Error('Only draft elections can be opened.')

  const now = new Date().toISOString()
  const next: Election = {
    ...election,
    status: 'open',
    openedAt: now,
    eligibleFlatCount: election.eligibleFlatCount || resolveEligibleFlatCount(societyId)
  }
  elections[idx] = next
  saveElections(societyId, elections)
  await remoteUpsertElection(next)

  logActivity({
    societyId,
    category: 'election',
    action: 'election_opened',
    summary: `Voting opened: ${next.title}`,
    metadata: { electionId }
  })
  void notifyElectionOpen(societyId, next.title, electionId)
  return next
}

export async function closeElection(societyId: string, electionId: string) {
  const elections = loadElections(societyId)
  const idx = elections.findIndex((e) => e.id === electionId)
  if (idx < 0) throw new Error('Election not found.')
  const election = elections[idx]
  if (election.status !== 'open') throw new Error('Only open elections can be closed.')

  const now = new Date().toISOString()
  const next: Election = { ...election, status: 'closed', closedAt: now }
  elections[idx] = next
  saveElections(societyId, elections)
  await remoteUpsertElection(next)

  logActivity({
    societyId,
    category: 'election',
    action: 'election_closed',
    summary: `Voting closed: ${next.title}`,
    metadata: { electionId }
  })
  return next
}

/**
 * Cast an anonymous encrypted vote bound by participation seal to flat_id.
 * Ballot record never contains flat/voter identity.
 */
export async function castEncryptedVote(input: {
  societyId: string
  electionId: string
  positionId: string
  /** Flat number or canonical flat_id */
  flatNumber: string
  flatId?: string
  candidateId: string
}) {
  const election = getElection(input.societyId, input.electionId)
  if (!election || election.status !== 'open') {
    throw new Error('Election is not open for voting.')
  }
  if (!election.publicKey) throw new Error('Election encryption keys are unavailable.')

  const position = election.positions.find((p) => p.id === input.positionId)
  if (!position) throw new Error('Invalid position for this election.')
  if (!position.candidates.some((c) => c.id === input.candidateId)) {
    throw new Error('Invalid candidate for this position.')
  }

  const flatId = input.flatId || normalizeFlatId(input.societyId, input.flatNumber)
  const sealHash = await createParticipationSeal(
    input.electionId,
    input.positionId,
    flatId,
    election.pepper
  )

  const seals = loadSeals(input.electionId)
  if (seals.some((s) => s.positionId === input.positionId && (s.flatId === flatId || s.sealHash === sealHash))) {
    throw new Error('Your flat has already cast its vote')
  }

  const encryptedChoice = await encryptVote(election.publicKey, input.candidateId)
  const castAt = new Date().toISOString()

  const ballot: AnonymousBallot = {
    id: newId('ballot'),
    electionId: input.electionId,
    societyId: input.societyId,
    positionId: input.positionId,
    encryptedChoice,
    castAt
  }

  const seal: ParticipationSeal = {
    id: newId('seal'),
    electionId: input.electionId,
    societyId: input.societyId,
    positionId: input.positionId,
    flatId,
    sealHash,
    castAt
  }

  const ballots = loadBallots(input.electionId)
  ballots.push(ballot)
  saveBallots(input.electionId, ballots)
  seals.push(seal)
  saveSeals(input.electionId, seals)

  if (isRemoteSocietyId(input.societyId)) {
    try {
      await restPost('election_anonymous_ballots', {
        id: ballot.id,
        election_id: ballot.electionId,
        society_id: ballot.societyId,
        position_id: ballot.positionId,
        encrypted_choice: ballot.encryptedChoice,
        cast_at: ballot.castAt
      })
      await restPost('election_participation_seals', {
        id: seal.id,
        election_id: seal.electionId,
        society_id: seal.societyId,
        position_id: seal.positionId,
        flat_id: seal.flatId,
        seal_hash: seal.sealHash,
        cast_at: seal.castAt
      })
    } catch (err) {
      if (!shouldUseLocalFallback(err)) {
        // Unique violation → already voted
        const msg = err instanceof Error ? err.message : String(err)
        if (/duplicate|unique|conflict/i.test(msg)) {
          throw new Error('Your flat has already cast its vote')
        }
        console.warn('[elections] remote vote persist failed', err)
      }
    }
  }

  // Anonymous activity — NO flat number / candidate
  logActivity({
    societyId: input.societyId,
    category: 'election',
    action: 'vote_cast',
    summary: `Anonymous ballot cast for ${position.title} in ${election.title}`,
    metadata: { electionId: input.electionId, positionId: input.positionId }
  })

  return ballot
}

export async function checkFlatVoted(
  electionId: string,
  societyId: string,
  flatNumber: string,
  pepper: string,
  positionId: string
) {
  const flatId = normalizeFlatId(societyId, flatNumber)
  const sealHash = await createParticipationSeal(electionId, positionId, flatId, pepper)
  return loadSeals(electionId).some(
    (s) => s.positionId === positionId && (s.flatId === flatId || s.sealHash === sealHash)
  )
}

export async function checkFlatVotedForElection(
  electionId: string,
  societyId: string,
  flatNumber: string,
  pepper: string,
  positionIds: string[]
) {
  const results: Record<string, boolean> = {}
  for (const positionId of positionIds) {
    results[positionId] = await checkFlatVoted(electionId, societyId, flatNumber, pepper, positionId)
  }
  return results
}

export function getElectionTurnout(societyId: string, electionId: string): ElectionTurnout | null {
  const election = getElection(societyId, electionId)
  if (!election) return null

  const seals = loadSeals(electionId)
  const eligible = election.eligibleFlatCount || resolveEligibleFlatCount(societyId)
  const byPosition = election.positions.map((position) => {
    const votedFlatCount = new Set(
      seals.filter((s) => s.positionId === position.id).map((s) => s.flatId)
    ).size
    return {
      positionId: position.id,
      title: position.title,
      votedFlatCount,
      turnoutPercent: pct(votedFlatCount, eligible)
    }
  })

  const votedFlatCount = Math.max(0, ...byPosition.map((p) => p.votedFlatCount), 0)

  return {
    electionId,
    status: election.status,
    eligibleFlatCount: eligible,
    votedFlatCount,
    turnoutPercent: pct(votedFlatCount, eligible),
    byPosition
  }
}

/**
 * Internal aggregate tally — only used at publish time.
 * Candidate counts are NEVER returned while status === 'open'.
 */
async function computeAggregateTally(election: Election) {
  if (!election.lockedPrivateKey) {
    throw new Error('Private key has been destroyed; results must come from the published bulletin.')
  }

  const privateKey = unlockPrivateKey(election.lockedPrivateKey)
  const ballots = loadBallots(election.id)
  const seals = loadSeals(election.id)
  const eligible = election.eligibleFlatCount || resolveEligibleFlatCount(election.societyId)
  const tieAlerts: string[] = []

  const positionResults: PositionBulletinResult[] = []

  for (const position of election.positions) {
    const counts: Record<string, number> = {}
    for (const candidate of position.candidates) counts[candidate.id] = 0

    const positionBallots = ballots.filter((b) => b.positionId === position.id)
    for (const ballot of positionBallots) {
      try {
        const candidateId = await decryptVote(privateKey, ballot.encryptedChoice)
        if (counts[candidateId] !== undefined) counts[candidateId] += 1
      } catch {
        /* skip corrupted */
      }
    }

    const totalVotes = positionBallots.length
    const ranked = position.candidates.map((candidate) => ({
      candidateId: candidate.id,
      name: candidate.name,
      votes: counts[candidate.id] ?? 0,
      percent: pct(counts[candidate.id] ?? 0, totalVotes)
    }))
    const maxVotes = Math.max(0, ...ranked.map((c) => c.votes))
    const winners = ranked.filter((c) => c.votes === maxVotes && maxVotes > 0).map((c) => c.candidateId)
    const isTie = winners.length > 1
    if (isTie) tieAlerts.push(`Tie in ${position.title}`)

    positionResults.push({
      positionId: position.id,
      title: position.title,
      totalVotes,
      turnoutPercent: pct(
        new Set(seals.filter((s) => s.positionId === position.id).map((s) => s.flatId)).size,
        eligible
      ),
      candidates: ranked.sort((a, b) => b.votes - a.votes),
      winnerCandidateIds: winners,
      isTie
    })
  }

  return {
    positionResults,
    totalBallots: ballots.length,
    sealsCount: seals.length,
    eligibleFlatCount: eligible,
    tieAlerts,
    integrity: {
      ballotCountMatchesSeals: ballots.length === seals.length,
      sealsCount: seals.length,
      ballotsCount: ballots.length,
      tieAlerts
    }
  }
}

/** Block early peek: only closed/published elections may be tallied, and publish is preferred. */
export async function tallyElection(societyId: string, electionId: string) {
  const election = getElection(societyId, electionId)
  if (!election) return null
  if (election.status === 'open' || election.status === 'draft') {
    throw new Error('Candidate tallies are hidden until voting is closed and results are published.')
  }
  if (election.status === 'published') {
    const bulletin = getPublishedBulletin(electionId)
    if (!bulletin) return null
    return {
      election,
      totalVotes: bulletin.totalBallots,
      positionResults: bulletin.positionResults.map((p) => ({
        position: election.positions.find((x) => x.id === p.positionId)!,
        totalVotes: p.totalVotes,
        counts: Object.fromEntries(p.candidates.map((c) => [c.candidateId, c.votes]))
      }))
    }
  }

  const aggregate = await computeAggregateTally(election)
  return {
    election,
    totalVotes: aggregate.totalBallots,
    positionResults: aggregate.positionResults.map((p) => ({
      position: election.positions.find((x) => x.id === p.positionId)!,
      totalVotes: p.totalVotes,
      counts: Object.fromEntries(p.candidates.map((c) => [c.candidateId, c.votes]))
    }))
  }
}

export async function publishElectionResults(societyId: string, electionId: string) {
  const elections = loadElections(societyId)
  const idx = elections.findIndex((e) => e.id === electionId)
  if (idx < 0) throw new Error('Election not found.')
  const election = elections[idx]
  if (election.status !== 'closed') {
    throw new Error('Close voting before publishing results.')
  }

  const aggregate = await computeAggregateTally(election)
  const publishedAt = new Date().toISOString()

  const bulletin: PublishedBulletin = {
    id: newId('bulletin'),
    electionId,
    societyId,
    title: election.title,
    description: election.description,
    publishedAt,
    openedAt: election.openedAt,
    closedAt: election.closedAt,
    eligibleFlatCount: aggregate.eligibleFlatCount,
    totalBallots: aggregate.totalBallots,
    positionResults: aggregate.positionResults,
    secrecyStatement:
      'Individual ballots are secret. Only aggregate results are published. No flat-to-candidate link exists in this system.',
    integrity: aggregate.integrity
  }

  saveBulletin(bulletin)

  const next: Election = {
    ...election,
    status: 'published',
    publishedAt,
    lockedPrivateKey: null,
    privateKeyDestroyedAt: publishedAt
  }
  elections[idx] = next
  saveElections(societyId, elections)
  await remoteUpsertElection(next)

  if (isRemoteSocietyId(societyId)) {
    try {
      await restPost('election_published_bulletins', {
        id: bulletin.id,
        election_id: bulletin.electionId,
        society_id: bulletin.societyId,
        title: bulletin.title,
        description: bulletin.description,
        published_at: bulletin.publishedAt,
        opened_at: bulletin.openedAt ?? null,
        closed_at: bulletin.closedAt ?? null,
        eligible_flat_count: bulletin.eligibleFlatCount,
        total_ballots: bulletin.totalBallots,
        position_results: bulletin.positionResults,
        integrity: bulletin.integrity,
        secrecy_statement: bulletin.secrecyStatement
      })
    } catch (err) {
      if (!shouldUseLocalFallback(err)) console.warn('[elections] bulletin persist failed', err)
    }
  }

  logActivity({
    societyId,
    category: 'election',
    action: 'election_published',
    summary: `Results published: ${election.title}`,
    metadata: {
      electionId,
      totalBallots: bulletin.totalBallots,
      tieAlerts: bulletin.integrity.tieAlerts
    }
  })

  void notifyElectionPublished(societyId, election.title, electionId)
  return bulletin
}

export function getPublishedBulletin(electionId: string) {
  return loadBulletin(electionId)
}

export async function getPublishedBulletinAsync(societyId: string, electionId: string) {
  const local = loadBulletin(electionId)
  if (local) return local
  if (!isRemoteSocietyId(societyId)) return null
  try {
    const rows = await restGet<
      Array<{
        id: string
        election_id: string
        society_id: string
        title: string
        description: string
        published_at: string
        opened_at: string | null
        closed_at: string | null
        eligible_flat_count: number
        total_ballots: number
        position_results: PositionBulletinResult[]
        integrity: PublishedBulletin['integrity']
        secrecy_statement: string
      }>
    >(`election_published_bulletins?election_id=eq.${encodeURIComponent(electionId)}&limit=1`)
    const row = rows?.[0]
    if (!row) return null
    const bulletin: PublishedBulletin = {
      id: row.id,
      electionId: row.election_id,
      societyId: row.society_id,
      title: row.title,
      description: row.description,
      publishedAt: row.published_at,
      openedAt: row.opened_at,
      closedAt: row.closed_at,
      eligibleFlatCount: row.eligible_flat_count,
      totalBallots: row.total_ballots,
      positionResults: row.position_results,
      secrecyStatement: row.secrecy_statement,
      integrity: row.integrity
    }
    saveBulletin(bulletin)
    return bulletin
  } catch (err) {
    if (shouldUseLocalFallback(err)) return null
    throw err
  }
}

/** Super Admin health audit — counts only; never returns flat→candidate links. */
export function getSuperAdminElectionAudit(societyId: string, electionId: string): SuperAdminElectionAudit | null {
  const election = getElection(societyId, electionId)
  if (!election) return null
  const seals = loadSeals(electionId)
  const ballots = loadBallots(electionId)
  const bulletin = loadBulletin(electionId)
  return {
    electionId,
    societyId,
    title: election.title,
    status: election.status,
    eligibleFlatCount: election.eligibleFlatCount,
    sealsCount: seals.length,
    ballotsCount: ballots.length,
    integrityOk: seals.length === ballots.length,
    tieAlerts: bulletin?.integrity.tieAlerts ?? [],
    privateKeyDestroyed: !election.lockedPrivateKey || Boolean(election.privateKeyDestroyedAt),
    publishedAt: election.publishedAt
  }
}

export function listAllElectionAudits(): SuperAdminElectionAudit[] {
  if (typeof window === 'undefined') return []
  const audits: SuperAdminElectionAudit[] = []
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i)
    if (!key?.startsWith('mai-elections-') && !key?.startsWith('syncra-elections-')) continue
    const societyId = key.replace(/^mai-elections-/, '').replace(/^syncra-elections-/, '')
    for (const election of listElections(societyId)) {
      const audit = getSuperAdminElectionAudit(societyId, election.id)
      if (audit) audits.push(audit)
    }
  }
  return audits.sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''))
}
