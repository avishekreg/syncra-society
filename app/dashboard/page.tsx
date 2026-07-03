export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { ArrowUpRight, Bell, Building2, CreditCard, Users } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { PageHeader } from '@/components/layout/page-header'
import { formatInr } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = createAdminClient()

  const [
    { count: flatCount },
    { count: noticeCount },
    { data: visitors },
    { data: payments }
  ] = await Promise.all([
    supabase.from('flats').select('*', { count: 'exact', head: true }),
    supabase.from('notices').select('*', { count: 'exact', head: true }),
    supabase.from('visitors').select('entry_time'),
    supabase.from('payments').select('amount, status')
  ])

  const pendingVisitors = (visitors ?? []).filter((v) => {
    const hours = (Date.now() - new Date(v.entry_time).getTime()) / 36e5
    return hours < 24
  }).length

  const revenue = (payments ?? [])
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + Number(p.amount), 0)

  const stats = [
    {
      label: 'Total Flats',
      value: String(flatCount ?? 0),
      href: '/dashboard/flats',
      icon: Building2
    },
    {
      label: 'Active Notices',
      value: String(noticeCount ?? 0),
      href: '/dashboard/notices',
      icon: Bell
    },
    {
      label: 'Pending Visitors',
      value: String(pendingVisitors),
      href: '/dashboard/visitors',
      icon: Users
    },
    {
      label: 'Revenue',
      value: formatInr(revenue),
      href: '/dashboard/payments',
      icon: CreditCard
    }
  ]

  return (
    <div>
      <PageHeader
        eyebrow="Overview"
        title="Administrative console"
        description="Portfolio metrics across society records, resident communications, gatekeeper activity, and payment operations."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="syncra-panel group p-6 transition-colors hover:border-neutral-300"
            >
              <div className="flex items-center justify-between">
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
