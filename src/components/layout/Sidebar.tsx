import React, { useEffect, useRef, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { NavLink, Navigate, useLocation, useNavigate } from 'react-router-dom'
import SyncraBrandLogo from '../brand/SyncraBrandLogo'
import { useAuth } from '../../providers/AuthProvider'
import { usePlatformConfig } from '../../providers/PlatformConfigProvider'
import { useSocietyBranding } from '../../hooks/useSocietyBranding'
import { AccordionNavLink, NavAccordionProvider, useNavAccordion } from './NavAccordionContext'
import { isGlobalSuperAdmin, isRwaStaff } from '../../lib/roles'
import {
  canAccessFinancialConsole,
  canAccessGuardConsole,
  canAccessHelpdeskDashboard,
  canAccessNoticesManagement,
  canAccessPresidentConsole,
  canAccessResidentPortal,
  canAccessRulesGuidebook,
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

function SidebarSubNavLink(props: React.ComponentProps<typeof NavLink>) {
  return <NavLink preventScrollReset {...props} />
}

type NavGroupProps = {
  groupId: string
  label: string
  paths: string[]
  /** Primary route opened when the group label is clicked. */
  defaultRoute?: string
  children: React.ReactNode
}

function NavGroup({ groupId, label, paths, defaultRoute, children }: NavGroupProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { openGroupId, toggleGroup, openGroup } = useNavAccordion()
  const childActive = paths.some((path) => location.pathname.startsWith(path))
  const open = openGroupId === groupId

  const handleLabelClick = () => {
    if (defaultRoute) {
      if (!childActive) {
        navigate(defaultRoute)
        openGroup(groupId)
        return
      }
      if (!open) {
        openGroup(groupId)
        return
      }
    }
    toggleGroup(groupId)
  }

  const handleChevronToggle = () => {
    toggleGroup(groupId)
  }

  return (
    <div className="space-y-0.5" data-nav-group={groupId}>
      <div
        className={`${ui.navLink} flex w-full items-center justify-between gap-2 p-0 text-slate-600 hover:bg-syncra-surface-alt hover:text-syncra-primary ${
          childActive ? ui.navLinkActive : ui.navLinkIdle
        }`}
      >
        <button
          type="button"
          onClick={handleLabelClick}
          aria-expanded={open}
          aria-controls={`nav-group-${groupId}`}
          className="min-h-11 flex-1 px-3.5 py-2.5 text-left"
        >
          {label}
        </button>
        <button
          type="button"
          onClick={handleChevronToggle}
          aria-label={open ? `Collapse ${label}` : `Expand ${label}`}
          aria-expanded={open}
          className="flex h-11 w-11 shrink-0 items-center justify-center"
        >
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
      {open && (
        <div
          id={`nav-group-${groupId}`}
          className="space-y-0.5 pb-1 pl-1"
          onClick={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
        >
          {children}
        </div>
      )}
    </div>
  )
}

type SidebarProps = {
  children?: React.ReactNode
  title?: string
}

function SidebarSignOutButton({ onSignOut }: { onSignOut: () => void | Promise<void> }) {
  const { closeAllGroups } = useNavAccordion()

  return (
    <button
      type="button"
      onClick={() => {
        closeAllGroups()
        void onSignOut()
      }}
      className={`w-full ${ui.btnGhost}`}
    >
      Sign Out
    </button>
  )
}

export default function Sidebar({ children, title }: SidebarProps) {
  const { user, signOut, currentSocietyId } = useAuth()
  const { societyName } = useSocietyBranding()
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
    if (!nav) return
    requestAnimationFrame(() => {
      nav.scrollTop = navScrollTopRef.current
    })
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
  const embedResidentInStaffNav = showStaffNav && showResidentNav
  const showStandaloneResidentNav = showResidentNav && !embedResidentInStaffNav

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

  const embeddedResidentPaths = [
    '/resident',
    '/resident/helpdesk',
    '/resident/visitor-logs',
    '/resident/notices',
    '/resident/rules-guidebook',
    '/resident/activity',
    ...residentCommunityPaths
  ]
  const presidentConsolePaths = [
    '/admin/dashboard',
    '/admin/notices',
    '/admin/guidebook',
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
        {user && (
          <p className="mt-3 truncate text-xs text-slate-500">{user.username ? `@${user.username}` : user.email}</p>
        )}
        <p className="mt-1 truncate text-xs font-medium text-syncra-primary">{societyName}</p>
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
        {showStandaloneResidentNav && (
          <>
            <p className="mb-2 px-3.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Workspace
            </p>
            <AccordionNavLink to="/resident" end className={navLinkClass}>
              Resident Dashboard
            </AccordionNavLink>
            {moduleEnabled('helpdesk') && (
              <AccordionNavLink to="/resident/helpdesk" className={navLinkClass}>
                Smart Helpdesk
              </AccordionNavLink>
            )}
            {moduleEnabled('visitorLogs') && (
              <AccordionNavLink to="/resident/visitor-logs" className={navLinkClass}>
                Visitor Logs
              </AccordionNavLink>
            )}
            {moduleEnabled('notices') && (
              <AccordionNavLink to="/resident/notices" className={navLinkClass}>
                Notices
              </AccordionNavLink>
            )}
            <AccordionNavLink to="/resident/rules-guidebook" className={navLinkClass}>
              Rules & Regulations
            </AccordionNavLink>
            <AccordionNavLink to="/resident/activity" className={navLinkClass}>
              Activity
            </AccordionNavLink>
            {showResidentCommunity && (
              <NavGroup
                groupId="resident-community"
                label="Community & Governance"
                paths={residentCommunityPaths}
                defaultRoute={residentCommunityPaths[0]}
              >
                {moduleEnabled('surveys') && (
                  <SidebarSubNavLink to="/resident/surveys" className={subNavLinkClass}>
                    Surveys
                  </SidebarSubNavLink>
                )}
                {moduleEnabled('gallery') && (
                  <SidebarSubNavLink to="/resident/gallery" className={subNavLinkClass}>
                    Photo Gallery
                  </SidebarSubNavLink>
                )}
                {moduleEnabled('elections') && (
                  <SidebarSubNavLink to="/resident/elections" className={subNavLinkClass}>
                    Elections
                  </SidebarSubNavLink>
                )}
                {moduleEnabled('rewards') && (
                  <SidebarSubNavLink to="/resident/rewards" className={subNavLinkClass}>
                    Rewards & Recognition
                  </SidebarSubNavLink>
                )}
              </NavGroup>
            )}
            <AccordionNavLink to="/profile" className={navLinkClass}>
              Profile & Settings
            </AccordionNavLink>
          </>
        )}

        {showStaffNav && (
          <>
            <p className="mb-2 mt-4 px-3.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 sm:mt-6">
              Administration
            </p>

            {workspaceRole === 'secretary' && (
              <AccordionNavLink to="/rwa/workspace/secretary" className={navLinkClass}>
                Secretary Dashboard
              </AccordionNavLink>
            )}

            {workspaceRole === 'accountant' && (
              <AccordionNavLink to="/rwa/workspace/accountant" className={navLinkClass}>
                Accountant Dashboard
              </AccordionNavLink>
            )}

            {showFinancialConsole && (
              <NavGroup
                groupId="financial-console"
                label="Financial Console"
                paths={financePaths}
                defaultRoute="/finance/ledger"
              >
                <SidebarSubNavLink to="/finance/ledger" className={subNavLinkClass}>
                  Financial Ledger
                </SidebarSubNavLink>
                <SidebarSubNavLink to="/finance/downloads" className={subNavLinkClass}>
                  Download Center
                </SidebarSubNavLink>
                <SidebarSubNavLink to="/finance/bank-upload" className={subNavLinkClass}>
                  Bank Statement Upload
                </SidebarSubNavLink>
                <SidebarSubNavLink to="/finance/cashflow" className={subNavLinkClass}>
                  Cashflow Transparency
                </SidebarSubNavLink>
              </NavGroup>
            )}

            {showPresidentConsole && (
              <NavGroup
                groupId="president-console"
                label="President Console"
                paths={presidentConsolePaths}
                defaultRoute="/admin/dashboard"
              >
                <SidebarSubNavLink to="/admin/dashboard" className={subNavLinkClass}>
                  Analytics Overview
                </SidebarSubNavLink>
                {moduleEnabled('notices') && canAccessNoticesManagement(user) && (
                  <SidebarSubNavLink to="/admin/notices" className={subNavLinkClass}>
                    Notices Management
                  </SidebarSubNavLink>
                )}
                {canAccessRulesGuidebook(user) && (
                  <SidebarSubNavLink to="/admin/guidebook" className={subNavLinkClass}>
                    Rules & Regulations
                  </SidebarSubNavLink>
                )}
                {moduleEnabled('helpdesk') && canAccessHelpdeskDashboard(user) && (
                  <SidebarSubNavLink to="/admin/helpdesk" className={subNavLinkClass}>
                    Complaints Dashboard
                  </SidebarSubNavLink>
                )}
                {canAccessSocietyConfiguration(user) && (
                  <SidebarSubNavLink to="/admin/configuration" className={subNavLinkClass}>
                    Society Configuration
                  </SidebarSubNavLink>
                )}
              </NavGroup>
            )}

            {embedResidentInStaffNav && (
              <NavGroup
                groupId="my-flat-community"
                label="My Flat & Community"
                paths={embeddedResidentPaths}
                defaultRoute="/resident"
              >
                <SidebarSubNavLink to="/resident" end className={subNavLinkClass}>
                  Resident Dashboard
                </SidebarSubNavLink>
                {moduleEnabled('helpdesk') && (
                  <SidebarSubNavLink to="/resident/helpdesk" className={subNavLinkClass}>
                    Smart Helpdesk
                  </SidebarSubNavLink>
                )}
                {moduleEnabled('visitorLogs') && (
                  <SidebarSubNavLink to="/resident/visitor-logs" className={subNavLinkClass}>
                    Visitor Logs
                  </SidebarSubNavLink>
                )}
                {moduleEnabled('notices') && (
                  <SidebarSubNavLink to="/resident/notices" className={subNavLinkClass}>
                    Notices
                  </SidebarSubNavLink>
                )}
                <SidebarSubNavLink to="/resident/rules-guidebook" className={subNavLinkClass}>
                  Rules & Regulations
                </SidebarSubNavLink>
                <SidebarSubNavLink to="/resident/activity" className={subNavLinkClass}>
                  Activity
                </SidebarSubNavLink>
                {moduleEnabled('surveys') && (
                  <SidebarSubNavLink to="/resident/surveys" className={subNavLinkClass}>
                    Surveys
                  </SidebarSubNavLink>
                )}
                {moduleEnabled('gallery') && (
                  <SidebarSubNavLink to="/resident/gallery" className={subNavLinkClass}>
                    Photo Gallery
                  </SidebarSubNavLink>
                )}
                {moduleEnabled('elections') && (
                  <SidebarSubNavLink to="/resident/elections" className={subNavLinkClass}>
                    Elections
                  </SidebarSubNavLink>
                )}
                {moduleEnabled('rewards') && (
                  <SidebarSubNavLink to="/resident/rewards" className={subNavLinkClass}>
                    Rewards & Recognition
                  </SidebarSubNavLink>
                )}
              </NavGroup>
            )}

            {showPresidentConsole && showWorkspaceGroup && (
              <NavGroup
                groupId="society-operations"
                label="Society Operations"
                paths={workspacePaths}
                defaultRoute={workspacePaths[0]}
              >
                {canAccessWorkspaceCashflow(user) && (
                  <SidebarSubNavLink to="/rwa/workspace/cashflow" className={subNavLinkClass}>
                    Cashflow Forecast
                  </SidebarSubNavLink>
                )}
                {canAccessWorkspaceComplaints(user) && (
                  <SidebarSubNavLink to="/rwa/workspace/complaints" className={subNavLinkClass}>
                    Incident Stream
                  </SidebarSubNavLink>
                )}
                {canAccessWorkspaceFlats(user) && (
                  <SidebarSubNavLink to="/rwa/workspace/flats" className={subNavLinkClass}>
                    Flat Owner Showcase
                  </SidebarSubNavLink>
                )}
              </NavGroup>
            )}

            {!showPresidentConsole && canAccessHelpdeskDashboard(user) && (
              <>
                {moduleEnabled('helpdesk') && (
                  <AccordionNavLink to="/admin/helpdesk" className={navLinkClass}>
                    Complaints Dashboard
                  </AccordionNavLink>
                )}
                {canAccessWorkspaceComplaints(user) && (
                  <AccordionNavLink to="/rwa/workspace/complaints" className={navLinkClass}>
                    Helpdesk & Incident Stream
                  </AccordionNavLink>
                )}
              </>
            )}

            {!showPresidentConsole && canAccessNoticesManagement(user) && moduleEnabled('notices') && (
              <AccordionNavLink to="/admin/notices" className={navLinkClass}>
                Notices Management
              </AccordionNavLink>
            )}

            {!showPresidentConsole && canAccessRulesGuidebook(user) && (
              <AccordionNavLink to="/admin/guidebook" className={navLinkClass}>
                Rules & Regulations
              </AccordionNavLink>
            )}

            {showRwaControls && (
              <NavGroup
                groupId="rwa-community"
                label="Community & Governance"
                paths={rwaControlPaths}
                defaultRoute={rwaControlPaths[0]}
              >
                {moduleEnabled('surveys') && (
                  <SidebarSubNavLink to="/rwa/surveys" className={subNavLinkClass}>
                    Surveys
                  </SidebarSubNavLink>
                )}
                {moduleEnabled('gallery') && (
                  <SidebarSubNavLink to="/rwa/gallery" className={subNavLinkClass}>
                    Gallery Management
                  </SidebarSubNavLink>
                )}
                {moduleEnabled('elections') && (
                  <SidebarSubNavLink to="/rwa/elections" className={subNavLinkClass}>
                    Elections
                  </SidebarSubNavLink>
                )}
                {moduleEnabled('rewards') && (
                  <SidebarSubNavLink to="/rwa/rewards" className={subNavLinkClass}>
                    Rewards & Governance
                  </SidebarSubNavLink>
                )}
              </NavGroup>
            )}

            {canAccessGuardConsole(user) && moduleEnabled('gatekeeper') && (
              <AccordionNavLink to="/rwa/gatekeeper" className={navLinkClass}>
                Guard Console
              </AccordionNavLink>
            )}

            {canAccessWhatsappAutomation(user) && moduleEnabled('whatsappAutomation') && (
              <AccordionNavLink to="/rwa/whatsapp" className={navLinkClass}>
                WhatsApp Automation
              </AccordionNavLink>
            )}

            {canAccessRwaSettings(user) && (
              <AccordionNavLink to="/rwa/settings" className={navLinkClass}>
                RWA Settings
              </AccordionNavLink>
            )}

            <AccordionNavLink to="/profile" className={navLinkClass}>
              Profile & Settings
            </AccordionNavLink>
          </>
        )}
      </nav>

      <div className="mt-auto shrink-0 border-t border-slate-200 bg-white p-3 sm:p-4">
        <SidebarSignOutButton onSignOut={handleSignOut} />
      </div>
    </div>
  )

  return (
    <NavAccordionProvider>
      <div className="flex min-h-screen flex-col bg-syncra-surface md:h-screen md:min-h-0 md:flex-row md:overflow-hidden lg:h-screen">
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
          <p className="truncate text-xs font-semibold uppercase tracking-wide text-syncra-blue">{societyName}</p>
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
          'fixed inset-y-0 left-0 z-50 flex h-screen w-[min(100vw-3rem,17.5rem)] flex-col border-r border-slate-200 bg-white shadow-xl transition-transform duration-200 ease-out md:sticky md:top-0 md:z-auto md:h-screen md:w-[17.5rem] md:shrink-0 md:translate-x-0 md:shadow-none lg:static',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        ].join(' ')}
      >
        {navContent}
      </aside>

      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain bg-syncra-surface text-slate-900 md:h-screen lg:h-full">
        {children}
      </main>
      </div>
    </NavAccordionProvider>
  )
}
