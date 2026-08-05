import React from 'react'
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
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
  const location = useLocation()

  if (!user) {
    return <Navigate to="/auth/login" replace />
  }

  if (!isGatekeeperUser(user)) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen bg-syncra-surface">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-2xl flex-col gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <SyncraBrandLogo to="/gatekeeper" />
            <div className="min-w-0 text-right">
              <p className="truncate text-sm font-semibold text-syncra-primary">{societyName}</p>
              <p className="truncate text-xs text-slate-500">{user.username ?? user.email}</p>
            </div>
            <button type="button" onClick={() => void signOut()} className={ui.btnGhost}>
              Sign out
            </button>
          </div>
          <nav className="flex flex-wrap gap-2">
            <Link
              to="/gatekeeper"
              className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                location.pathname === '/gatekeeper'
                  ? 'bg-syncra-blue text-white'
                  : 'border border-slate-200 text-slate-600'
              }`}
            >
              Visitor desk
            </Link>
            <Link
              to="/gatekeeper/entry"
              className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                location.pathname.startsWith('/gatekeeper/entry')
                  ? 'bg-syncra-blue text-white'
                  : 'border border-slate-200 text-slate-600'
              }`}
            >
              Staff & delivery scan
            </Link>
            <Link
              to="/gatekeeper/intelligence"
              className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                location.pathname.startsWith('/gatekeeper/intelligence')
                  ? 'bg-syncra-blue text-white'
                  : 'border border-slate-200 text-slate-600'
              }`}
            >
              Guardian intel
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        <Outlet context={{ societyId: uuid ?? currentSocietyId, societyName }} />
      </main>
    </div>
  )
}
