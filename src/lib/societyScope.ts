/** Ensures API queries are scoped to the active society — never fetch cross-tenant data. */

export function assertSocietyId(societyId: string | null | undefined): asserts societyId is string {
  if (!societyId) {
    throw new Error('Society context is required for this operation.')
  }
}

export function withSocietyFilter(basePath: string, societyId: string): string {
  const separator = basePath.includes('?') ? '&' : '?'
  return `${basePath}${separator}society_id=eq.${encodeURIComponent(societyId)}`
}

export function mergeSocietyScope<T extends { society_id?: string }>(
  payload: T,
  societyId: string
): T & { society_id: string } {
  return { ...payload, society_id: societyId }
}
