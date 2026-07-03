import Link from 'next/link'
import { Building2 } from 'lucide-react'

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/notices', label: 'Notices' },
  { href: '/dashboard/visitors', label: 'Visitors' },
  { href: '/dashboard/payments', label: 'Payments' },
  { href: '/admin/config', label: 'Super Admin' }
]

export function SiteHeader() {
  return (
    <header className="border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-primary">
          <Building2 className="h-5 w-5" />
          Syncra Society
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
