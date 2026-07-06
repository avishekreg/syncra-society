import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import { useSocietyBranding } from '../hooks/useSocietyBranding'
import { useResolvedSocietyUuid } from '../hooks/useResolvedSocietyUuid'
import SyncraBrandLogo from '../components/brand/SyncraBrandLogo'
import { ui } from '../lib/ui'

function isGatekeeperUser(user: { roles?: string[]; role?: string; user_metadata?: { role?: string } } | null) {
  if (!user) return false
  const role = user.user_metadata?.role ?? user.role
  return role === 'gatekeeper' || user.roles?.includes('gatekeeper') === true
}

export default function GatekeeperLayout() {
  const { user, signOut, currentSocietyId } = useAuth()
  const { societyName } = useSocietyBranding()
  const { uuid } = useResolvedSocietyUuid()

  if (!user) {
    return <Navigate to="/auth/login" replace />
  }

  if (!isGatekeeperUser(user)) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen bg-syncra-surface">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <SyncraBrandLogo to="/gatekeeper" />
          <div className="min-w-0 text-right">
            <p className="truncate text-sm font-semibold text-syncra-primary">{societyName}</p>
            <p className="truncate text-xs text-slate-500">{user.username ?? user.email}</p>
          </div>
          <button type="button" onClick={() => void signOut()} className={ui.btnGhost}>
            Sign out
          </button>
        </div>
      </header>

      <Outlet context={{ societyId: uuid ?? currentSocietyId, societyName }} />
    </div>
  )
}
