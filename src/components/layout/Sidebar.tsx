import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../providers/AuthProvider'
import { canAccessResidentPortal, isGlobalSuperAdmin, isRwaStaff } from '../../lib/roles'
import { ui } from '../../lib/ui'

function SyncraLogo() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-9 w-9 shrink-0" aria-hidden="true">
      <rect width="40" height="40" rx="10" fill="#F4F5F7" />
      <path d="M8 28 L20 8 L32 28" stroke="url(#syncra-gradient)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 22 H28" stroke="#00B4D8" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 32 H26" stroke="#0052CC" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
      <defs>
        <linearGradient id="syncra-gradient" x1="8" y1="28" x2="32" y2="8" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00B4D8" />
          <stop offset="1" stopColor="#0052CC" />
        </linearGradient>
      </defs>
    </svg>
  )
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200',
    isActive
      ? 'border border-syncra-accent/30 bg-syncra-accent/10 text-syncra-blue shadow-sm'
      : 'border border-transparent text-slate-600 hover:border-slate-200 hover:bg-white hover:text-syncra-primary'
  ].join(' ')

export default function Sidebar({ children }: { children?: React.ReactNode }) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  if (!user) {
    return (
      <div className={`${ui.page} flex items-center justify-center p-8 text-slate-500`}>
        Loading Syncra Workspace Safely...
      </div>
    )
  }

  const isSuperAdmin = isGlobalSuperAdmin(user)
  const showResidentNav = canAccessResidentPortal(user)
  const showRwaNav = isRwaStaff(user)

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <div className="flex min-h-screen bg-syncra-surface">
      <aside className="sticky top-0 flex h-screen w-[17.5rem] shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-6">
          <div className="flex items-center gap-3">
            <SyncraLogo />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-syncra-accent">Syncra Systems</p>
              <h2 className="truncate text-base font-semibold tracking-tight text-syncra-primary">syncra-society</h2>
            </div>
          </div>
          {user && <p className="mt-3 truncate text-xs text-slate-500">{user.email}</p>}
          {isSuperAdmin && (
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-syncra-action">
              Global Platform Admin
            </p>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
          {showResidentNav && (
            <>
              <p className="mb-2 px-3.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Workspace
              </p>
              <NavLink to="/resident" end className={navLinkClass}>
                Resident Dashboard
              </NavLink>
              <NavLink to="/resident/helpdesk" className={navLinkClass}>
                Smart Helpdesk
              </NavLink>
              <NavLink to="/resident/visitor-logs" className={navLinkClass}>
                Visitor Logs
              </NavLink>
              <NavLink to="/resident/surveys" className={navLinkClass}>
                Surveys
              </NavLink>
              <NavLink to="/resident/gallery" className={navLinkClass}>
                Photo Gallery
              </NavLink>
              <NavLink to="/resident/elections" className={navLinkClass}>
                Elections
              </NavLink>
              <NavLink to="/resident/rewards" className={navLinkClass}>
                Rewards & Recognition
              </NavLink>
            </>
          )}

          {(showRwaNav || isSuperAdmin) && (
            <>
              <p className="mb-2 mt-6 px-3.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Administration
              </p>
              {showRwaNav && (
                <>
                  <NavLink to="/rwa" end className={navLinkClass}>
                    RWA Dashboard
                  </NavLink>
                  <NavLink to="/rwa/surveys" className={navLinkClass}>
                    Surveys
                  </NavLink>
                  <NavLink to="/rwa/gallery" className={navLinkClass}>
                    Gallery Management
                  </NavLink>
                  <NavLink to="/rwa/elections" className={navLinkClass}>
                    Elections
                  </NavLink>
                  <NavLink to="/rwa/rewards" className={navLinkClass}>
                    Rewards & Governance
                  </NavLink>
                  <NavLink to="/rwa/gatekeeper" className={navLinkClass}>
                    Guard Console
                  </NavLink>
                  <NavLink to="/rwa/settings" className={navLinkClass}>
                    RWA Settings
                  </NavLink>
                </>
              )}
              {isSuperAdmin && (
                <NavLink to="/super-admin" end className={navLinkClass}>
                  Super Admin
                </NavLink>
              )}
            </>
          )}
        </nav>

        <div className="border-t border-slate-200 p-4">
          <button type="button" onClick={handleSignOut} className={`w-full text-left ${ui.btnGhost}`}>
            Sign Out
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 bg-syncra-surface text-slate-900">{children}</main>
    </div>
  )
}
