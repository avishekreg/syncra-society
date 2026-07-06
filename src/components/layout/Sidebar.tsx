import React, { useEffect, useRef, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { NavLink, Navigate, useLocation, useNavigate } from 'react-router-dom'
import SyncraBrandLogo from '../brand/SyncraBrandLogo'
import { useAuth } from '../../providers/AuthProvider'
import { usePlatformConfig } from '../../providers/PlatformConfigProvider'
import { isGlobalSuperAdmin, isRwaStaff } from '../../lib/roles'
import {
  canAccessFinancialConsole,
  canAccessGuardConsole,
  canAccessHelpdeskDashboard,
  canAccessNoticesManagement,
  canAccessPresidentConsole,
  canAccessResidentPortal,
  canAccessRwaControls,
  canAccessRwaSettings,
  canAccessSocietyConfiguration,
  canAccessWhatsappAutomation,
  canAccessWorkspaceCashflow,
  canAccessWorkspaceComplaints,
  canAccessWorkspaceFlats,
  resolveWorkspaceRole,
  workspaceRoleLabel
} from '../../lib/workspaceAccess'
import { SUPER_ADMIN_HOME } from '../../lib/superAdminNav'
import { ui } from '../../lib/ui'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [ui.navLink, isActive ? ui.navLinkActive : ui.navLinkIdle].join(' ')

const subNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    ui.subNavLink,
    isActive
      ? 'bg-syncra-accent/10 text-syncra-blue'
      : 'text-slate-600 hover:bg-syncra-surface-alt hover:text-syncra-primary'
  ].join(' ')

function SidebarNavLink(props: React.ComponentProps<typeof NavLink>) {
  return <NavLink preventScrollReset {...props} />
}

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

  const toggleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setOpen((value) => !value)
  }

  return (
    <div className="space-y-0.5">
      <button
        type="button"
        onClick={toggleOpen}
        aria-expanded={open}
        className={`${ui.navLink} w-full justify-between text-slate-600 hover:bg-syncra-surface-alt hover:text-syncra-primary`}
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

type SidebarProps = {
  children?: React.ReactNode
  title?: string
}

export default function Sidebar({ children, title }: SidebarProps) {
  const { user, signOut, currentSocietyId } = useAuth()
  const { isModuleEnabled } = usePlatformConfig()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const navScrollRef = useRef<HTMLElement>(null)
  const navScrollTopRef = useRef(0)

  const societyScope = currentSocietyId
  const moduleEnabled = (key: Parameters<typeof isModuleEnabled>[0]) =>
    isModuleEnabled(key, societyScope)

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const nav = navScrollRef.current
    if (nav) {
      nav.scrollTop = navScrollTopRef.current
    }
  }, [location.pathname])

  useEffect(() => {
    if (!mobileOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [mobileOpen])

  if (!user) {
    return (
      <div className={`${ui.page} flex items-center justify-center p-6 text-slate-500 sm:p-8`}>
        Loading Syncra Workspace Safely...
      </div>
    )
  }

  if (isGlobalSuperAdmin(user)) {
    return <Navigate to={SUPER_ADMIN_HOME} replace />
  }

  const workspaceRole = resolveWorkspaceRole(user)
  const showResidentNav = canAccessResidentPortal(user)
  const showStaffNav = isRwaStaff(user)

  async function handleSignOut() {
    setMobileOpen(false)
    await signOut()
    navigate('/')
  }

  const residentCommunityPaths = [
    ...(moduleEnabled('surveys') ? ['/resident/surveys'] : []),
    ...(moduleEnabled('gallery') ? ['/resident/gallery'] : []),
    ...(moduleEnabled('elections') ? ['/resident/elections'] : []),
    ...(moduleEnabled('rewards') ? ['/resident/rewards'] : [])
  ]

  const rwaControlPaths = [
    ...(moduleEnabled('surveys') ? ['/rwa/surveys'] : []),
    ...(moduleEnabled('gallery') ? ['/rwa/gallery'] : []),
    ...(moduleEnabled('elections') ? ['/rwa/elections'] : []),
    ...(moduleEnabled('rewards') ? ['/rwa/rewards'] : [])
  ]

  const workspacePaths = [
    ...(canAccessWorkspaceCashflow(user) ? ['/rwa/workspace/cashflow'] : []),
    ...(canAccessWorkspaceComplaints(user) ? ['/rwa/workspace/complaints'] : []),
    ...(canAccessWorkspaceFlats(user) ? ['/rwa/workspace/flats'] : [])
  ]

  const financePaths = [
    '/finance/ledger',
    '/finance/downloads',
    '/finance/bank-upload',
    '/finance/cashflow'
  ]

  const presidentConsolePaths = [
    '/admin/dashboard',
    '/admin/notices',
    '/admin/helpdesk',
    '/admin/configuration',
    ...workspacePaths
  ]

  const showResidentCommunity =
    moduleEnabled('surveys') ||
    moduleEnabled('gallery') ||
    moduleEnabled('elections') ||
    moduleEnabled('rewards')

  const showRwaControls = canAccessRwaControls(user) && rwaControlPaths.length > 0
  const showPresidentConsole = canAccessPresidentConsole(user)
  const showFinancialConsole = canAccessFinancialConsole(user)
  const showWorkspaceGroup = workspacePaths.length > 0

  const navContent = (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-white">
      <div className="shrink-0 border-b border-slate-200 px-4 py-4 sm:px-5 sm:py-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
          <SyncraBrandLogo to="/" />
          <button
            type="button"
            className={`${ui.btnIcon} lg:hidden`}
            aria-label="Close navigation menu"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        {user && <p className="mt-3 truncate text-xs text-slate-500">{user.email}</p>}
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-syncra-blue">
          {workspaceRoleLabel(workspaceRole)}
        </p>
      </div>

      <nav
        ref={navScrollRef}
        onScroll={() => {
          if (navScrollRef.current) {
            navScrollTopRef.current = navScrollRef.current.scrollTop
          }
        }}
        className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain px-3 py-4 sm:py-5"
      >
        {showResidentNav && (
          <>
            <p className="mb-2 px-3.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Workspace
            </p>
            <SidebarNavLink to="/resident" end className={navLinkClass}>
              Resident Dashboard
            </SidebarNavLink>
            {moduleEnabled('helpdesk') && (
              <SidebarNavLink to="/resident/helpdesk" className={navLinkClass}>
                Smart Helpdesk
              </SidebarNavLink>
            )}
            {moduleEnabled('visitorLogs') && (
              <SidebarNavLink to="/resident/visitor-logs" className={navLinkClass}>
                Visitor Logs
              </SidebarNavLink>
            )}
            {moduleEnabled('notices') && (
              <SidebarNavLink to="/resident/notices" className={navLinkClass}>
                Notices
              </SidebarNavLink>
            )}
            <SidebarNavLink to="/resident/activity" className={navLinkClass}>
              Activity
            </SidebarNavLink>
            {showResidentCommunity && (
              <NavGroup label="Community & Governance" paths={residentCommunityPaths}>
                {moduleEnabled('surveys') && (
                  <SidebarNavLink to="/resident/surveys" className={subNavLinkClass}>
                    Surveys
                  </SidebarNavLink>
                )}
                {moduleEnabled('gallery') && (
                  <SidebarNavLink to="/resident/gallery" className={subNavLinkClass}>
                    Photo Gallery
                  </SidebarNavLink>
                )}
                {moduleEnabled('elections') && (
                  <SidebarNavLink to="/resident/elections" className={subNavLinkClass}>
                    Elections
                  </SidebarNavLink>
                )}
                {moduleEnabled('rewards') && (
                  <SidebarNavLink to="/resident/rewards" className={subNavLinkClass}>
                    Rewards & Recognition
                  </SidebarNavLink>
                )}
              </NavGroup>
            )}
          </>
        )}

        {showStaffNav && (
          <>
            <p className="mb-2 mt-4 px-3.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 sm:mt-6">
              Administration
            </p>

            {showFinancialConsole && (
              <NavGroup label="Financial Console" paths={financePaths} defaultOpen={workspaceRole === 'accountant'}>
                <SidebarNavLink to="/finance/ledger" className={subNavLinkClass}>
                  Financial Ledger
                </SidebarNavLink>
                <SidebarNavLink to="/finance/downloads" className={subNavLinkClass}>
                  Download Center
                </SidebarNavLink>
                <SidebarNavLink to="/finance/bank-upload" className={subNavLinkClass}>
                  Bank Statement Upload
                </SidebarNavLink>
                <SidebarNavLink to="/finance/cashflow" className={subNavLinkClass}>
                  Cashflow Transparency
                </SidebarNavLink>
              </NavGroup>
            )}

            {showPresidentConsole && (
              <NavGroup label="President Console" paths={presidentConsolePaths} defaultOpen>
                <SidebarNavLink to="/admin/dashboard" className={subNavLinkClass}>
                  Analytics Overview
                </SidebarNavLink>
                {moduleEnabled('notices') && canAccessNoticesManagement(user) && (
                  <SidebarNavLink to="/admin/notices" className={subNavLinkClass}>
                    Notices Management
                  </SidebarNavLink>
                )}
                {moduleEnabled('helpdesk') && canAccessHelpdeskDashboard(user) && (
                  <SidebarNavLink to="/admin/helpdesk" className={subNavLinkClass}>
                    Complaints Dashboard
                  </SidebarNavLink>
                )}
                {canAccessSocietyConfiguration(user) && (
                  <SidebarNavLink to="/admin/configuration" className={subNavLinkClass}>
                    Society Configuration
                  </SidebarNavLink>
                )}
              </NavGroup>
            )}

            {showPresidentConsole && showWorkspaceGroup && (
              <NavGroup label="Society Operations" paths={workspacePaths}>
                {canAccessWorkspaceCashflow(user) && (
                  <SidebarNavLink to="/rwa/workspace/cashflow" className={subNavLinkClass}>
                    Cashflow Forecast
                  </SidebarNavLink>
                )}
                {canAccessWorkspaceComplaints(user) && (
                  <SidebarNavLink to="/rwa/workspace/complaints" className={subNavLinkClass}>
                    Incident Stream
                  </SidebarNavLink>
                )}
                {canAccessWorkspaceFlats(user) && (
                  <SidebarNavLink to="/rwa/workspace/flats" className={subNavLinkClass}>
                    Flat Owner Showcase
                  </SidebarNavLink>
                )}
              </NavGroup>
            )}

            {!showPresidentConsole && canAccessHelpdeskDashboard(user) && (
              <>
                {moduleEnabled('helpdesk') && (
                  <SidebarNavLink to="/admin/helpdesk" className={navLinkClass}>
                    Complaints Dashboard
                  </SidebarNavLink>
                )}
                {canAccessWorkspaceComplaints(user) && (
                  <SidebarNavLink to="/rwa/workspace/complaints" className={navLinkClass}>
                    Helpdesk & Incident Stream
                  </SidebarNavLink>
                )}
              </>
            )}

            {!showPresidentConsole && canAccessNoticesManagement(user) && moduleEnabled('notices') && (
              <SidebarNavLink to="/admin/notices" className={navLinkClass}>
                Notices Management
              </SidebarNavLink>
            )}

            {showRwaControls && (
              <NavGroup label="Community & Governance" paths={rwaControlPaths}>
                {moduleEnabled('surveys') && (
                  <SidebarNavLink to="/rwa/surveys" className={subNavLinkClass}>
                    Surveys
                  </SidebarNavLink>
                )}
                {moduleEnabled('gallery') && (
                  <SidebarNavLink to="/rwa/gallery" className={subNavLinkClass}>
                    Gallery Management
                  </SidebarNavLink>
                )}
                {moduleEnabled('elections') && (
                  <SidebarNavLink to="/rwa/elections" className={subNavLinkClass}>
                    Elections
                  </SidebarNavLink>
                )}
                {moduleEnabled('rewards') && (
                  <SidebarNavLink to="/rwa/rewards" className={subNavLinkClass}>
                    Rewards & Governance
                  </SidebarNavLink>
                )}
              </NavGroup>
            )}

            {canAccessGuardConsole(user) && moduleEnabled('gatekeeper') && (
              <SidebarNavLink to="/rwa/gatekeeper" className={navLinkClass}>
                Guard Console
              </SidebarNavLink>
            )}

            {canAccessWhatsappAutomation(user) && moduleEnabled('whatsappAutomation') && (
              <SidebarNavLink to="/rwa/whatsapp" className={navLinkClass}>
                WhatsApp Automation
              </SidebarNavLink>
            )}

            {canAccessRwaSettings(user) && (
              <SidebarNavLink to="/rwa/settings" className={navLinkClass}>
                RWA Settings
              </SidebarNavLink>
            )}
          </>
        )}
      </nav>

      <div className="mt-auto shrink-0 border-t border-slate-200 bg-white p-3 sm:p-4">
        <button type="button" onClick={() => void handleSignOut()} className={`w-full ${ui.btnGhost}`}>
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen flex-col bg-syncra-surface lg:h-screen lg:min-h-0 lg:flex-row lg:overflow-hidden">
      <header className="sticky top-0 z-40 flex min-h-14 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 lg:hidden">
        <button
          type="button"
          className={ui.btnIcon}
          aria-label="Open navigation menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="min-w-0 flex-1 text-center">
          <p className="truncate text-sm font-semibold text-syncra-primary">{title ?? 'Syncra Society'}</p>
        </div>
        <div className="w-11" aria-hidden="true" />
      </header>

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[1px] lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 flex h-screen w-[min(100vw-3rem,17.5rem)] flex-col border-r border-slate-200 bg-white shadow-xl transition-transform duration-200 ease-out lg:static lg:z-auto lg:h-full lg:w-[17.5rem] lg:shrink-0 lg:translate-x-0 lg:shadow-none',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        ].join(' ')}
      >
        {navContent}
      </aside>

      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-syncra-surface text-slate-900 lg:h-full">
        {children}
      </main>
    </div>
  )
}
