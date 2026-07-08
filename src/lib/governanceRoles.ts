import { isGlobalSuperAdmin, type AuthUser } from './roles'
import { resolveWorkspaceRole } from './workspaceAccess'

export type DownwardRole = 'secretary' | 'accountant' | 'committee'

export type PresidentAssignmentMode = 'founding' | 'transfer'

export type SocietyGovernanceTree = {
  presidentEmail: string | null
  /** Set once when the society is first registered — the founding admin. */
  foundingPresidentEmail: string | null
  /** Previous president demoted during election / restructure transfer. */
  previousPresidentEmail: string | null
  demotedPresidentEmails: string[]
  secretaryEmail: string | null
  accountantEmail: string | null
  committeeMembers: string[]
  assignmentMode: PresidentAssignmentMode | null
  updatedAt: string
}

const STORAGE_PREFIX = 'syncra-governance-tree'

function storageKey(societyId: string) {
  return `${STORAGE_PREFIX}:${societyId}`
}

function emptyTree(): SocietyGovernanceTree {
  return {
    presidentEmail: null,
    foundingPresidentEmail: null,
    previousPresidentEmail: null,
    demotedPresidentEmails: [],
    secretaryEmail: null,
    accountantEmail: null,
    committeeMembers: [],
    assignmentMode: null,
    updatedAt: new Date().toISOString()
  }
}

export function readGovernanceTree(societyId: string | null | undefined): SocietyGovernanceTree | null {
  if (!societyId || typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(storageKey(societyId))
    if (!raw) return null
    return JSON.parse(raw) as SocietyGovernanceTree
  } catch {
    return null
  }
}

export function writeGovernanceTree(societyId: string, tree: SocietyGovernanceTree) {
  localStorage.setItem(storageKey(societyId), JSON.stringify(tree))
}

/** True when the society already has a designated president (post-founding). */
export function societyHasPresident(societyId: string | null | undefined): boolean {
  const tree = readGovernanceTree(societyId)
  return Boolean(tree?.presidentEmail)
}

/**
 * First-time society registration — founding admin becomes president automatically.
 * No Super Admin intervention required.
 */
export function initializeFoundingPresident(
  societyId: string,
  founderEmail: string
): { ok: true; tree: SocietyGovernanceTree } | { ok: false; error: string } {
  const email = founderEmail.trim().toLowerCase()
  if (!email) {
    return { ok: false, error: 'Founder email is required to initialize the governance tree.' }
  }

  const existing = readGovernanceTree(societyId)
  if (existing?.presidentEmail) {
    return { ok: true, tree: existing }
  }

  const tree: SocietyGovernanceTree = {
    ...emptyTree(),
    presidentEmail: email,
    foundingPresidentEmail: email,
    assignmentMode: 'founding',
    updatedAt: new Date().toISOString()
  }
  writeGovernanceTree(societyId, tree)
  return { ok: true, tree }
}

/**
 * Election / restructure mode — only Syncra Super Admin may transfer an existing president role.
 */
export function canReassignPresident(
  actor: AuthUser | null | undefined,
  societyId: string | null | undefined
): boolean {
  if (!isGlobalSuperAdmin(actor)) return false
  return societyHasPresident(societyId)
}

/** @deprecated Use canReassignPresident for clarity. */
export function canAssignPresident(actor: AuthUser | null | undefined): boolean {
  return isGlobalSuperAdmin(actor)
}

/** Active president may appoint or clear secretary, accountant, and committee members. */
export function canManageDownwardTree(actor: AuthUser | null | undefined): boolean {
  if (!actor || isGlobalSuperAdmin(actor)) return false
  return resolveWorkspaceRole(actor) === 'president'
}

export function isActivePresident(actor: AuthUser | null | undefined, societyId: string | null | undefined): boolean {
  if (!actor?.email || !societyId) return false
  const tree = readGovernanceTree(societyId)
  if (!tree?.presidentEmail) return resolveWorkspaceRole(actor) === 'president'
  return tree.presidentEmail === actor.email.toLowerCase()
}

/**
 * Super Admin transfer during elections or management restructuring.
 * Demotes the outgoing president and grants full tree-appointment powers to the incoming resident.
 */
export function transferPresidentRole(
  societyId: string,
  newResidentEmail: string,
  actor: AuthUser | null | undefined
): { ok: true; tree: SocietyGovernanceTree; demotedPresident: string | null } | { ok: false; error: string } {
  if (!canReassignPresident(actor, societyId)) {
    if (!isGlobalSuperAdmin(actor)) {
      return { ok: false, error: 'Only Syncra Super Admin can transfer the Society President role.' }
    }
    return {
      ok: false,
      error:
        'This society has no established president yet. Founding admins receive the President role automatically during first-time registration.'
    }
  }

  const existing = readGovernanceTree(societyId) ?? emptyTree()
  const incoming = newResidentEmail.trim().toLowerCase()
  if (!incoming) {
    return { ok: false, error: 'Select a resident email for the incoming president.' }
  }

  const outgoing = existing.presidentEmail
  if (outgoing === incoming) {
    return { ok: false, error: 'This resident is already the active Society President.' }
  }

  const demotedPresidentEmails = [...existing.demotedPresidentEmails]
  if (outgoing && !demotedPresidentEmails.includes(outgoing)) {
    demotedPresidentEmails.push(outgoing)
  }

  const tree: SocietyGovernanceTree = {
    ...existing,
    presidentEmail: incoming,
    previousPresidentEmail: outgoing,
    demotedPresidentEmails,
    assignmentMode: 'transfer',
    updatedAt: new Date().toISOString()
  }
  writeGovernanceTree(societyId, tree)
  return { ok: true, tree, demotedPresident: outgoing }
}

/** @deprecated Use transferPresidentRole for election / restructure flows. */
export function assignPresident(
  societyId: string,
  residentEmail: string,
  actor: AuthUser | null | undefined
) {
  const result = transferPresidentRole(societyId, residentEmail, actor)
  if (!result.ok) return result
  return { ok: true as const, tree: result.tree }
}

export function assignDownwardRole(
  societyId: string,
  role: DownwardRole,
  residentEmail: string | null,
  actor: AuthUser | null | undefined
): { ok: true; tree: SocietyGovernanceTree } | { ok: false; error: string } {
  if (!canManageDownwardTree(actor)) {
    return { ok: false, error: 'Only the active Society President can manage the governance tree.' }
  }
  const existing = readGovernanceTree(societyId)
  const tree: SocietyGovernanceTree = {
    ...(existing ?? emptyTree()),
    presidentEmail: existing?.presidentEmail ?? actor?.email?.toLowerCase() ?? null,
    updatedAt: new Date().toISOString()
  }

  const email = residentEmail?.trim().toLowerCase() || null
  if (role === 'secretary') tree.secretaryEmail = email
  if (role === 'accountant') tree.accountantEmail = email
  if (role === 'committee') {
    if (!email) {
      tree.committeeMembers = []
    } else if (!tree.committeeMembers.includes(email)) {
      tree.committeeMembers = [...tree.committeeMembers, email]
    }
  }

  writeGovernanceTree(societyId, tree)
  return { ok: true, tree }
}

export function clearDownwardRole(
  societyId: string,
  role: DownwardRole,
  actor: AuthUser | null | undefined,
  committeeEmail?: string
): { ok: true; tree: SocietyGovernanceTree } | { ok: false; error: string } {
  if (!canManageDownwardTree(actor)) {
    return { ok: false, error: 'Only the active Society President can clear governance roles.' }
  }
  const existing = readGovernanceTree(societyId)
  const tree: SocietyGovernanceTree = {
    ...(existing ?? emptyTree()),
    presidentEmail: existing?.presidentEmail ?? actor?.email?.toLowerCase() ?? null,
    updatedAt: new Date().toISOString()
  }

  if (role === 'secretary') tree.secretaryEmail = null
  if (role === 'accountant') tree.accountantEmail = null
  if (role === 'committee' && committeeEmail) {
    tree.committeeMembers = tree.committeeMembers.filter((e) => e !== committeeEmail.toLowerCase())
  }

  writeGovernanceTree(societyId, tree)
  return { ok: true, tree }
}
