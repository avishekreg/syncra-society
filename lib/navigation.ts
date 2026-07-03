import {
  Building2,
  CreditCard,
  LayoutDashboard,
  Megaphone,
  Settings2,
  Users
} from 'lucide-react'

export type NavItem = {
  label: string
  href: string
  icon: typeof LayoutDashboard
  description: string
}

export const primaryNav: NavItem[] = [
  {
    label: 'Overview',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Portfolio metrics and operational summary'
  },
  {
    label: 'Society Records & Flat Directory',
    href: '/dashboard/flats',
    icon: Building2,
    description: 'Society registry and unit-level owner records'
  },
  {
    label: 'Live Notices Broadcast',
    href: '/dashboard/notices',
    icon: Megaphone,
    description: 'Institutional announcements with n8n relay'
  },
  {
    label: 'Visitor Gatekeeper Logs',
    href: '/dashboard/visitors',
    icon: Users,
    description: 'Gate entries with automated WhatsApp routing'
  },
  {
    label: 'Global Payment Configuration',
    href: '/dashboard/payments',
    icon: CreditCard,
    description: 'Razorpay, Stripe, and multi-regional settlement'
  }
]

export const adminNav: NavItem = {
  label: 'Platform Configuration',
  href: '/admin/config',
  icon: Settings2,
  description: 'Runtime gateway and system_configs control plane'
}
