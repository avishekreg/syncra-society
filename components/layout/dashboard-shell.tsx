import { AppSidebar } from '@/components/layout/app-sidebar'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-neutral-50">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/90 px-8 py-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-neutral-500">Syncra Society · Administrative Console</p>
            <div className="hidden items-center gap-2 text-xs text-neutral-400 sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Production
            </div>
          </div>
        </header>
        <main className="flex-1 px-8 py-10">{children}</main>
      </div>
    </div>
  )
}
