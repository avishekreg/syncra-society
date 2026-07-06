import React, { useEffect, useRef, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import SyncraBrandLogo from '../brand/SyncraBrandLogo'
import { useAuth } from '../../providers/AuthProvider'
import { SUPER_ADMIN_NAV } from '../../lib/superAdminNav'
import { ui } from '../../lib/ui'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [ui.navLink, isActive ? ui.navLinkActive : ui.navLinkIdle].join(' ')

type SuperAdminSidebarProps = {
  title?: string
  children?: React.ReactNode
}

export default function SuperAdminSidebar({ title, children }: SuperAdminSidebarProps) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const navScrollRef = useRef<HTMLElement>(null)
  const navScrollTopRef = useRef(0)

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const nav = navScrollRef.current
    if (nav) nav.scrollTop = navScrollTopRef.current
  }, [location.pathname])

  async function handleSignOut() {
    setMobileOpen(false)
    await signOut()
    navigate('/')
  }

  const shell = (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-white">
      <div className="shrink-0 border-b border-slate-200 px-4 py-4 sm:px-5 sm:py-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
          <SyncraBrandLogo to={SUPER_ADMIN_NAV[0].path} />
          <button
            type="button"
            className={`${ui.btnIcon} lg:hidden`}
            aria-label="Close navigation menu"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        {user?.email && <p className="mt-3 truncate text-xs text-slate-500">{user.email}</p>}
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-syncra-action">
          Global Platform Admin
        </p>
      </div>

      <nav
        ref={navScrollRef}
        onScroll={() => {
          if (navScrollRef.current) navScrollTopRef.current = navScrollRef.current.scrollTop
        }}
        className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain px-3 py-4 sm:py-5"
      >
        <p className="mb-2 px-3.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
          Platform Console
        </p>
        {SUPER_ADMIN_NAV.map(({ path, label }) => (
          <NavLink key={path} to={path} end={path === SUPER_ADMIN_NAV[0].path} preventScrollReset className={navLinkClass}>
            {label}
          </NavLink>
        ))}
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
          <p className="truncate text-sm font-semibold text-syncra-primary">{title ?? 'Syncra Platform Admin'}</p>
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
        {shell}
      </aside>

      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-syncra-surface text-slate-900 lg:h-full">
        {children}
      </main>
    </div>
  )
}
