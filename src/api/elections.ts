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

export type ElectionCandidate = { id: string; name: string; role?: string }

export type Election = {
  id: string
  societyId: string
  title: string
  description: string
  candidates: ElectionCandidate[]
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

function loadElections(societyId: string): Election[] {
  try {
    const raw = localStorage.getItem(electionsKey(societyId))
    return raw ? (JSON.parse(raw) as Election[]) : []
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

export function listElections(societyId: string) {
  return loadElections(societyId).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export async function createElection(input: {
  societyId: string
  title: string
  description: string
  candidates: string[]
  closesAt?: string | null
}) {
  const keys: ElectionKeyPair = await generateElectionKeyPair()
  const election: Election = {
    id: `election-${Date.now()}`,
    societyId: input.societyId,
    title: input.title,
    description: input.description,
    candidates: input.candidates.filter(Boolean).map((name, index) => ({
      id: `cand-${index + 1}`,
      name
    })),
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
    summary: `Election opened: ${election.title}`,
    metadata: { electionId: election.id }
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
  flatNumber: string
  candidateId: string
}) {
  const election = loadElections(input.societyId).find((e) => e.id === input.electionId)
  if (!election || election.status !== 'open') throw new Error('Election is not open for voting.')

  const voterSeal = await createVoterSeal(
    input.electionId,
    input.societyId,
    input.flatNumber,
    election.pepper
  )

  const seals = loadSeals(input.electionId)
  if (seals.has(voterSeal)) {
    throw new Error('This flat has already cast a vote. Votes are irreversible.')
  }

  const encryptedChoice = await encryptVote(election.publicKey, input.candidateId)
  const ballot: EncryptedBallot = {
    id: `ballot-${Date.now()}`,
    electionId: input.electionId,
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
    summary: `Anonymous vote cast in election: ${election.title}`,
    metadata: { electionId: input.electionId }
  })

  return ballot
}

export function hasFlatVoted(_electionId: string, _societyId: string, _flatNumber: string, _pepper: string) {
  return false
}

export async function checkFlatVoted(electionId: string, societyId: string, flatNumber: string, pepper: string) {
  const seal = await createVoterSeal(electionId, societyId, flatNumber, pepper)
  return loadSeals(electionId).has(seal)
}

export async function tallyElection(societyId: string, electionId: string) {
  const election = loadElections(societyId).find((e) => e.id === electionId)
  if (!election) return null

  const privateKey = unlockPrivateKey(election.lockedPrivateKey)
  const ballots = loadBallots(electionId)
  const counts: Record<string, number> = {}
  for (const c of election.candidates) counts[c.id] = 0

  for (const ballot of ballots) {
    try {
      const candidateId = await decryptVote(privateKey, ballot.encryptedChoice)
      counts[candidateId] = (counts[candidateId] ?? 0) + 1
    } catch {
      // skip corrupted ballots
    }
  }

  return {
    election,
    totalVotes: ballots.length,
    counts
  }
}

export function getOpenElections(societyId: string) {
  return loadElections(societyId).filter((e) => e.status === 'open')
}
