/** Maps the current pathname to the sidebar accordion group that should be open. */
export function resolveActiveNavGroup(pathname: string): string | null {
  if (pathname.startsWith('/finance/')) return 'financial-console'
  if (pathname.startsWith('/admin/')) return 'president-console'
  if (
    pathname.startsWith('/rwa/workspace/cashflow') ||
    pathname.startsWith('/rwa/workspace/complaints') ||
    pathname.startsWith('/rwa/workspace/flats')
  ) {
    return 'society-operations'
  }
  if (
    pathname.startsWith('/rwa/surveys') ||
    pathname.startsWith('/rwa/gallery') ||
    pathname.startsWith('/rwa/elections') ||
    pathname.startsWith('/rwa/rewards')
  ) {
    return 'rwa-community'
  }
  if (
    pathname.startsWith('/resident/surveys') ||
    pathname.startsWith('/resident/gallery') ||
    pathname.startsWith('/resident/elections') ||
    pathname.startsWith('/resident/rewards')
  ) {
    return 'resident-community'
  }
  if (
    pathname === '/resident' ||
    pathname.startsWith('/resident/helpdesk') ||
    pathname.startsWith('/resident/visitor-logs') ||
    pathname.startsWith('/resident/notices') ||
    pathname.startsWith('/resident/rules-guidebook') ||
    pathname.startsWith('/resident/activity')
  ) {
    return 'my-flat-community'
  }
  return null
}
