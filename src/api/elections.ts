import {
  createVoterSeal,
  decryptVote,
  encryptVote,
  generateElectionKeyPair,
  generateElectionPepper,
  lockPrivateKey,
  unlockPrivateKey,
  type ElectionKeyPair
} from '../lib/electionCrypto'
import { logActivity } from '../lib/activityLog'

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
  /** @deprecated Legacy flat candidate list — migrated into positions on read */
  candidates?: ElectionCandidate[]
  status: 'draft' | 'open' | 'closed'
  publicKey: JsonWebKey
  lockedPrivateKey: string
  pepper: string
  createdAt: string
  closesAt?: string | null
}

export type EncryptedBallot = {
  id: string
  electionId: string
  positionId: string
  voterSeal: string
  encryptedChoice: string
  castAt: string
}

function electionsKey(societyId: string) {
  return `syncra-elections-${societyId}`
}

function ballotsKey(electionId: string) {
  return `syncra-election-ballots-${electionId}`
}

function sealsKey(electionId: string) {
  return `syncra-election-seals-${electionId}`
}

function normalizeElection(raw: Election): Election {
  if (raw.positions?.length) {
    return { ...raw, positions: raw.positions }
  }

  const legacyCandidates = raw.candidates ?? []
  return {
    ...raw,
    positions: [
      {
        id: 'pos-general',
        title: 'General',
        candidates: legacyCandidates
      }
    ]
  }
}

function loadElections(societyId: string): Election[] {
  try {
    const raw = localStorage.getItem(electionsKey(societyId))
    const parsed = raw ? (JSON.parse(raw) as Election[]) : []
    return parsed.map(normalizeElection)
  } catch {
    return []
  }
}

function saveElections(societyId: string, elections: Election[]) {
  localStorage.setItem(electionsKey(societyId), JSON.stringify(elections))
}

function loadBallots(electionId: string): EncryptedBallot[] {
  try {
    const raw = localStorage.getItem(ballotsKey(electionId))
    return raw ? (JSON.parse(raw) as EncryptedBallot[]) : []
  } catch {
    return []
  }
}

function saveBallots(electionId: string, ballots: EncryptedBallot[]) {
  localStorage.setItem(ballotsKey(electionId), JSON.stringify(ballots))
}

function loadSeals(electionId: string): Set<string> {
  try {
    const raw = localStorage.getItem(sealsKey(electionId))
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

function saveSeals(electionId: string, seals: Set<string>) {
  localStorage.setItem(sealsKey(electionId), JSON.stringify([...seals]))
}

function buildPositionId(index: number) {
  return `pos-${index + 1}`
}

function buildCandidateId(positionIndex: number, candidateIndex: number) {
  return `cand-${positionIndex + 1}-${candidateIndex + 1}`
}

export function listElections(societyId: string) {
  return loadElections(societyId).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export async function createElection(input: {
  societyId: string
  title: string
  description: string
  positions: { title: string; candidates: string[] }[]
  closesAt?: string | null
}) {
  const keys: ElectionKeyPair = await generateElectionKeyPair()
  const positions: ElectionPosition[] = input.positions
    .filter((position) => position.title.trim())
    .map((position, positionIndex) => ({
      id: buildPositionId(positionIndex),
      title: position.title.trim(),
      candidates: position.candidates
        .map((name) => name.trim())
        .filter(Boolean)
        .map((name, candidateIndex) => ({
          id: buildCandidateId(positionIndex, candidateIndex),
          name
        }))
    }))
    .filter((position) => position.candidates.length > 0)

  if (positions.length === 0) {
    throw new Error('Add at least one contested position with candidates.')
  }

  const election: Election = {
    id: `election-${Date.now()}`,
    societyId: input.societyId,
    title: input.title,
    description: input.description,
    positions,
    status: 'open',
    publicKey: keys.publicKey,
    lockedPrivateKey: lockPrivateKey(keys.privateKey),
    pepper: generateElectionPepper(),
    createdAt: new Date().toISOString(),
    closesAt: input.closesAt ?? null
  }

  const elections = loadElections(input.societyId)
  elections.unshift(election)
  saveElections(input.societyId, elections)
  logActivity({
    societyId: input.societyId,
    category: 'election',
    action: 'election_created',
    summary: `Election opened: ${election.title} (${positions.length} positions)`,
    metadata: { electionId: election.id, positions: positions.map((p) => p.title) }
  })
  return election
}

export function closeElection(societyId: string, electionId: string) {
  const elections = loadElections(societyId).map((e) =>
    e.id === electionId ? { ...e, status: 'closed' as const } : e
  )
  saveElections(societyId, elections)
}

export async function castEncryptedVote(input: {
  societyId: string
  electionId: string
  positionId: string
  flatNumber: string
  candidateId: string
}) {
  const election = loadElections(input.societyId).find((e) => e.id === input.electionId)
  if (!election || election.status !== 'open') throw new Error('Election is not open for voting.')

  const position = election.positions.find((p) => p.id === input.positionId)
  if (!position) throw new Error('Invalid position for this election.')
  if (!position.candidates.some((c) => c.id === input.candidateId)) {
    throw new Error('Invalid candidate for this position.')
  }

  const voterSeal = await createVoterSeal(
    input.electionId,
    input.societyId,
    input.flatNumber,
    election.pepper,
    input.positionId
  )

  const seals = loadSeals(input.electionId)
  if (seals.has(voterSeal)) {
    throw new Error(`Your flat has already voted for ${position.title}. Votes are irreversible.`)
  }

  const encryptedChoice = await encryptVote(election.publicKey, input.candidateId)
  const ballot: EncryptedBallot = {
    id: `ballot-${Date.now()}`,
    electionId: input.electionId,
    positionId: input.positionId,
    voterSeal,
    encryptedChoice,
    castAt: new Date().toISOString()
  }

  const ballots = loadBallots(input.electionId)
  ballots.push(ballot)
  saveBallots(input.electionId, ballots)
  seals.add(voterSeal)
  saveSeals(input.electionId, seals)

  logActivity({
    societyId: input.societyId,
    flatNumber: input.flatNumber,
    category: 'election',
    action: 'vote_cast',
    summary: `Anonymous vote cast for ${position.title} in election: ${election.title}`,
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
  const seal = await createVoterSeal(electionId, societyId, flatNumber, pepper, positionId)
  return loadSeals(electionId).has(seal)
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

export async function tallyElection(societyId: string, electionId: string) {
  const election = loadElections(societyId).find((e) => e.id === electionId)
  if (!election) return null

  const privateKey = unlockPrivateKey(election.lockedPrivateKey)
  const ballots = loadBallots(electionId)

  const positionResults = []
  for (const position of election.positions) {
    const counts: Record<string, number> = {}
    for (const candidate of position.candidates) counts[candidate.id] = 0

    const positionBallots = ballots.filter((ballot) => ballot.positionId === position.id)
    for (const ballot of positionBallots) {
      try {
        const candidateId = await decryptVote(privateKey, ballot.encryptedChoice)
        if (counts[candidateId] !== undefined) counts[candidateId] += 1
      } catch {
        // skip corrupted ballots
      }
    }

    positionResults.push({
      position,
      totalVotes: positionBallots.length,
      counts
    })
  }

  return {
    election,
    totalVotes: ballots.length,
    positionResults
  }
}

export function getOpenElections(societyId: string) {
  return loadElections(societyId).filter((e) => e.status === 'open')
}
