import { Link, useLocation } from 'react-router-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { adminNav, primaryNav } from '@/lib/navigation'

type AppSidebarProps = {
  onNavigate?: () => void
  showCloseButton?: boolean
}

export function AppSidebar({ onNavigate, showCloseButton = false }: AppSidebarProps) {
  const { pathname } = useLocation()

  return (
    <aside className="flex h-full w-[min(100vw-3rem,17.5rem)] flex-col border-r border-neutral-200 bg-neutral-50 shadow-xl lg:w-[260px] lg:shadow-none">
      <div className="border-b border-neutral-200 px-4 py-5 sm:px-5 sm:py-6">
        <div className="flex items-start justify-between gap-3">
          <Link to="/dashboard" className="block min-w-0" onClick={onNavigate}>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-400">Syncra</p>
            <p className="mt-0.5 text-base font-semibold tracking-tight text-neutral-900">Society</p>
          </Link>
          {showCloseButton && (
            <button
              type="button"
              aria-label="Close navigation menu"
              onClick={onNavigate}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-700 shadow-sm lg:hidden"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-5">
        <p className="px-3 pb-2 text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-400">Modules</p>
        <div className="space-y-0.5">
          {primaryNav.map((item) => {
            const active =
              pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={onNavigate}
                className={cn(
                  'flex min-h-11 items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors',
                  active
                    ? 'bg-white font-medium text-neutral-900 shadow-sm ring-1 ring-neutral-200'
                    : 'text-neutral-600 hover:bg-white/60 hover:text-neutral-900'
                )}
              >
                <Icon className="h-4 w-4 shrink-0 text-neutral-500" strokeWidth={1.5} />
                <span className="leading-snug">{item.label}</span>
              </Link>
            )
          })}
        </div>

        <p className="px-3 pb-2 pt-7 text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-400">
          Administration
        </p>
        {(() => {
          const item = adminNav
          const active = pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              to={item.href}
              onClick={onNavigate}
              className={cn(
                'flex min-h-11 items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors',
                active
                  ? 'bg-white font-medium text-neutral-900 shadow-sm ring-1 ring-neutral-200'
                  : 'text-neutral-600 hover:bg-white/60 hover:text-neutral-900'
              )}
            >
              <Icon className="h-4 w-4 shrink-0 text-neutral-500" strokeWidth={1.5} />
              <span className="leading-snug">{item.label}</span>
            </Link>
          )
        })()}
      </nav>

      <div className="border-t border-neutral-200 px-4 py-4 sm:px-5">
        <p className="text-xs text-neutral-500">Operations Lead</p>
        <Link
          to="/"
          onClick={onNavigate}
          className="mt-1 inline-flex min-h-11 items-center text-xs text-neutral-400 underline-offset-4 hover:text-neutral-700 hover:underline"
        >
          Sign out
        </Link>
      </div>
    </aside>
  )
}
