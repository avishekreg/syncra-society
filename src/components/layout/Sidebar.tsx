import React, { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../providers/AuthProvider'
import { usePlatformConfig } from '../../providers/PlatformConfigProvider'
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

const subNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'flex items-center gap-2 rounded-lg py-2 pl-9 pr-3.5 text-sm font-medium transition-all duration-200',
    isActive
      ? 'bg-syncra-accent/10 text-syncra-blue'
      : 'text-slate-600 hover:bg-syncra-surface-alt hover:text-syncra-primary'
  ].join(' ')

type NavGroupProps = {
  label: string
  paths: string[]
  defaultOpen?: boolean
  children: React.ReactNode
}

function NavGroup({ label, paths, defaultOpen = false, children }: NavGroupProps) {
  const location = useLocation()
  const childActive = paths.some((path) => location.pathname.startsWith(path))
  const [open, setOpen] = useState(defaultOpen || childActive)

  useEffect(() => {
    if (childActive) setOpen(true)
  }, [childActive])

  return (
    <div className="space-y-0.5">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-syncra-surface-alt hover:text-syncra-primary"
      >
        <span>{label}</span>
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {open && <div className="space-y-0.5 pb-1">{children}</div>}
    </div>
  )
}

export default function Sidebar({ children }: { children?: React.ReactNode }) {
  const { user, signOut } = useAuth()
  const { isModuleEnabled } = usePlatformConfig()
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

  const residentCommunityPaths = [
    ...(isModuleEnabled('surveys') ? ['/resident/surveys'] : []),
    ...(isModuleEnabled('gallery') ? ['/resident/gallery'] : []),
    ...(isModuleEnabled('elections') ? ['/resident/elections'] : []),
    ...(isModuleEnabled('rewards') ? ['/resident/rewards'] : [])
  ]

  const rwaControlPaths = [
    ...(isModuleEnabled('surveys') ? ['/rwa/surveys'] : []),
    ...(isModuleEnabled('gallery') ? ['/rwa/gallery'] : []),
    ...(isModuleEnabled('elections') ? ['/rwa/elections'] : []),
    ...(isModuleEnabled('rewards') ? ['/rwa/rewards'] : [])
  ]

  const showResidentCommunity =
    isModuleEnabled('surveys') ||
    isModuleEnabled('gallery') ||
    isModuleEnabled('elections') ||
    isModuleEnabled('rewards')

  const showRwaControls = rwaControlPaths.length > 0

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
              {isModuleEnabled('helpdesk') && (
                <NavLink to="/resident/helpdesk" className={navLinkClass}>
                  Smart Helpdesk
                </NavLink>
              )}
              {isModuleEnabled('visitorLogs') && (
                <NavLink to="/resident/visitor-logs" className={navLinkClass}>
                  Visitor Logs
                </NavLink>
              )}
              {showResidentCommunity && (
                <NavGroup label="Community & Governance" paths={residentCommunityPaths}>
                  {isModuleEnabled('surveys') && (
                    <NavLink to="/resident/surveys" className={subNavLinkClass}>
                      Surveys
                    </NavLink>
                  )}
                  {isModuleEnabled('gallery') && (
                    <NavLink to="/resident/gallery" className={subNavLinkClass}>
                      Photo Gallery
                    </NavLink>
                  )}
                  {isModuleEnabled('elections') && (
                    <NavLink to="/resident/elections" className={subNavLinkClass}>
                      Elections
                    </NavLink>
                  )}
                  {isModuleEnabled('rewards') && (
                    <NavLink to="/resident/rewards" className={subNavLinkClass}>
                      Rewards & Recognition
                    </NavLink>
                  )}
                </NavGroup>
              )}
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
                  {showRwaControls && (
                    <NavGroup label="RWA Controls" paths={rwaControlPaths}>
                      {isModuleEnabled('surveys') && (
                        <NavLink to="/rwa/surveys" className={subNavLinkClass}>
                          Surveys
                        </NavLink>
                      )}
                      {isModuleEnabled('gallery') && (
                        <NavLink to="/rwa/gallery" className={subNavLinkClass}>
                          Gallery Management
                        </NavLink>
                      )}
                      {isModuleEnabled('elections') && (
                        <NavLink to="/rwa/elections" className={subNavLinkClass}>
                          Elections
                        </NavLink>
                      )}
                      {isModuleEnabled('rewards') && (
                        <NavLink to="/rwa/rewards" className={subNavLinkClass}>
                          Rewards & Governance
                        </NavLink>
                      )}
                    </NavGroup>
                  )}
                  {isModuleEnabled('gatekeeper') && (
                    <NavLink to="/rwa/gatekeeper" className={navLinkClass}>
                      Guard Console
                    </NavLink>
                  )}
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
