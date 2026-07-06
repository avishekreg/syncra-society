import React, { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
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

  const societyScope = currentSocietyId
  const moduleEnabled = (key: Parameters<typeof isModuleEnabled>[0]) =>
    isModuleEnabled(key, societyScope)

  useEffect(() => {
    setMobileOpen(false)
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

  const workspaceRole = resolveWorkspaceRole(user)
  const isSuperAdmin = isGlobalSuperAdmin(user)
  const showResidentNav = canAccessResidentPortal(user)
  const showStaffNav = isRwaStaff(user) || isSuperAdmin

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

  const superAdminPaths = [
    '/super-admin/societies',
    '/super-admin/pricing',
    '/super-admin/master-config'
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

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain px-3 py-4 sm:py-5">
        {showResidentNav && (
          <>
            <p className="mb-2 px-3.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Workspace
            </p>
            <NavLink to="/resident" end className={navLinkClass}>
              Resident Dashboard
            </NavLink>
            {moduleEnabled('helpdesk') && (
              <NavLink to="/resident/helpdesk" className={navLinkClass}>
                Smart Helpdesk
              </NavLink>
            )}
            {moduleEnabled('visitorLogs') && (
              <NavLink to="/resident/visitor-logs" className={navLinkClass}>
                Visitor Logs
              </NavLink>
            )}
            {moduleEnabled('notices') && (
              <NavLink to="/resident/notices" className={navLinkClass}>
                Notices
              </NavLink>
            )}
            <NavLink to="/resident/activity" className={navLinkClass}>
              Activity
            </NavLink>
            {showResidentCommunity && (
              <NavGroup label="Community & Governance" paths={residentCommunityPaths}>
                {moduleEnabled('surveys') && (
                  <NavLink to="/resident/surveys" className={subNavLinkClass}>
                    Surveys
                  </NavLink>
                )}
                {moduleEnabled('gallery') && (
                  <NavLink to="/resident/gallery" className={subNavLinkClass}>
                    Photo Gallery
                  </NavLink>
                )}
                {moduleEnabled('elections') && (
                  <NavLink to="/resident/elections" className={subNavLinkClass}>
                    Elections
                  </NavLink>
                )}
                {moduleEnabled('rewards') && (
                  <NavLink to="/resident/rewards" className={subNavLinkClass}>
                    Rewards & Recognition
                  </NavLink>
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
                <NavLink to="/finance/ledger" className={subNavLinkClass}>
                  Financial Ledger
                </NavLink>
                <NavLink to="/finance/downloads" className={subNavLinkClass}>
                  Download Center
                </NavLink>
                <NavLink to="/finance/bank-upload" className={subNavLinkClass}>
                  Bank Statement Upload
                </NavLink>
                <NavLink to="/finance/cashflow" className={subNavLinkClass}>
                  Cashflow Transparency
                </NavLink>
              </NavGroup>
            )}

            {showPresidentConsole && (
              <NavGroup label="President Console" paths={presidentConsolePaths} defaultOpen>
                <NavLink to="/admin/dashboard" className={subNavLinkClass}>
                  Analytics Overview
                </NavLink>
                {moduleEnabled('notices') && canAccessNoticesManagement(user) && (
                  <NavLink to="/admin/notices" className={subNavLinkClass}>
                    Notices Management
                  </NavLink>
                )}
                {moduleEnabled('helpdesk') && canAccessHelpdeskDashboard(user) && (
                  <NavLink to="/admin/helpdesk" className={subNavLinkClass}>
                    Complaints Dashboard
                  </NavLink>
                )}
                {canAccessSocietyConfiguration(user) && (
                  <NavLink to="/admin/configuration" className={subNavLinkClass}>
                    Society Configuration
                  </NavLink>
                )}
              </NavGroup>
            )}

            {showPresidentConsole && showWorkspaceGroup && (
              <NavGroup label="Society Operations" paths={workspacePaths}>
                {canAccessWorkspaceCashflow(user) && (
                  <NavLink to="/rwa/workspace/cashflow" className={subNavLinkClass}>
                    Cashflow Forecast
                  </NavLink>
                )}
                {canAccessWorkspaceComplaints(user) && (
                  <NavLink to="/rwa/workspace/complaints" className={subNavLinkClass}>
                    Incident Stream
                  </NavLink>
                )}
                {canAccessWorkspaceFlats(user) && (
                  <NavLink to="/rwa/workspace/flats" className={subNavLinkClass}>
                    Flat Owner Showcase
                  </NavLink>
                )}
              </NavGroup>
            )}

            {!showPresidentConsole && canAccessHelpdeskDashboard(user) && (
              <>
                {moduleEnabled('helpdesk') && (
                  <NavLink to="/admin/helpdesk" className={navLinkClass}>
                    Complaints Dashboard
                  </NavLink>
                )}
                {canAccessWorkspaceComplaints(user) && (
                  <NavLink to="/rwa/workspace/complaints" className={navLinkClass}>
                    Helpdesk & Incident Stream
                  </NavLink>
                )}
              </>
            )}

            {!showPresidentConsole && canAccessNoticesManagement(user) && moduleEnabled('notices') && (
              <NavLink to="/admin/notices" className={navLinkClass}>
                Notices Management
              </NavLink>
            )}

            {showRwaControls && (
              <NavGroup label="Community & Governance" paths={rwaControlPaths}>
                {moduleEnabled('surveys') && (
                  <NavLink to="/rwa/surveys" className={subNavLinkClass}>
                    Surveys
                  </NavLink>
                )}
                {moduleEnabled('gallery') && (
                  <NavLink to="/rwa/gallery" className={subNavLinkClass}>
                    Gallery Management
                  </NavLink>
                )}
                {moduleEnabled('elections') && (
                  <NavLink to="/rwa/elections" className={subNavLinkClass}>
                    Elections
                  </NavLink>
                )}
                {moduleEnabled('rewards') && (
                  <NavLink to="/rwa/rewards" className={subNavLinkClass}>
                    Rewards & Governance
                  </NavLink>
                )}
              </NavGroup>
            )}

            {canAccessGuardConsole(user) && moduleEnabled('gatekeeper') && (
              <NavLink to="/rwa/gatekeeper" className={navLinkClass}>
                Guard Console
              </NavLink>
            )}

            {canAccessWhatsappAutomation(user) && moduleEnabled('whatsappAutomation') && (
              <NavLink to="/rwa/whatsapp" className={navLinkClass}>
                WhatsApp Automation
              </NavLink>
            )}

            {canAccessRwaSettings(user) && (
              <NavLink to="/rwa/settings" className={navLinkClass}>
                RWA Settings
              </NavLink>
            )}

            {isSuperAdmin && (
              <NavGroup label="Super Admin" paths={superAdminPaths} defaultOpen>
                <NavLink to="/super-admin/societies" className={subNavLinkClass}>
                  Societies Manager
                </NavLink>
                <NavLink to="/super-admin/pricing" className={subNavLinkClass}>
                  Pricing & Subscriptions
                </NavLink>
                <NavLink to="/super-admin/master-config" className={subNavLinkClass}>
                  Global Platform Settings
                </NavLink>
              </NavGroup>
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
