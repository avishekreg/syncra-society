import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Bell, Building2, CreditCard, Users } from 'lucide-react'
import { PageHeader } from '../../components/layout/page-header'
import { formatInr } from '@/lib/utils'
import type { Payment, Visitor } from '@/types/database'

export default function DashboardPage() {
  const [flatCount, setFlatCount] = useState(0)
  const [noticeCount, setNoticeCount] = useState(0)
  const [pendingVisitors, setPendingVisitors] = useState(0)
  const [revenue, setRevenue] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      try {
        const [fRes, nRes, vRes, pRes] = await Promise.all([
          fetch('/api/flats'),
          fetch('/api/notices'),
          fetch('/api/visitors'),
          fetch('/api/payments')
        ])
        const flats = (await fRes.json()) as unknown[]
        const notices = (await nRes.json()) as unknown[]
        const visitors = (await vRes.json()) as Visitor[]
        const payments = (await pRes.json()) as Payment[]

        setFlatCount(Array.isArray(flats) ? flats.length : 0)
        setNoticeCount(Array.isArray(notices) ? notices.length : 0)
        setPendingVisitors(
          visitors.filter((v) => (Date.now() - new Date(v.entry_time).getTime()) / 36e5 < 24).length
        )
        setRevenue(
          payments.filter((p) => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0)
        )
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const stats = [
    { label: 'Total Flats', value: loading ? '—' : String(flatCount), href: '/dashboard/flats', icon: Building2 },
    { label: 'Active Notices', value: loading ? '—' : String(noticeCount), href: '/dashboard/notices', icon: Bell },
    { label: 'Pending Visitors', value: loading ? '—' : String(pendingVisitors), href: '/dashboard/visitors', icon: Users },
    { label: 'Revenue', value: loading ? '—' : formatInr(revenue), href: '/dashboard/payments', icon: CreditCard }
  ]

  return (
    <div>
      <PageHeader
        eyebrow="Overview"
        title="Administrative console"
        description="Portfolio metrics across society records, resident communications, gatekeeper activity, and payment operations."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Link
              key={stat.label}
              to={stat.href}
              className="syncra-panel group p-6 transition-colors hover:border-neutral-300"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Icon className="h-4 w-4 text-neutral-400" strokeWidth={1.5} />
                <ArrowUpRight className="h-4 w-4 text-neutral-300 opacity-0 transition group-hover:opacity-100" />
              </div>
              <p className="mt-6 text-2xl font-semibold tracking-tight text-neutral-900">{stat.value}</p>
              <p className="mt-1 text-sm text-neutral-500">{stat.label}</p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
