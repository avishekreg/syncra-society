export const ADMIN_ALERT_EVENT = 'syncra:admin-alert'

export function publishAdminAlert(message: string) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(ADMIN_ALERT_EVENT, { detail: message }))
}
