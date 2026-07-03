import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default async function DashboardPage() {
  const supabase = createAdminClient()

  const [{ count: noticeCount }, { count: visitorCount }, { count: paymentCount }, { count: flatCount }] =
    await Promise.all([
      supabase.from('notices').select('*', { count: 'exact', head: true }),
      supabase.from('visitors').select('*', { count: 'exact', head: true }),
      supabase.from('payments').select('*', { count: 'exact', head: true }),
      supabase.from('flats').select('*', { count: 'exact', head: true })
    ])

  const stats = [
    { label: 'Notices', value: noticeCount ?? 0, href: '/dashboard/notices' },
    { label: 'Visitor Entries', value: visitorCount ?? 0, href: '/dashboard/visitors' },
    { label: 'Payments', value: paymentCount ?? 0, href: '/dashboard/payments' },
    { label: 'Flats', value: flatCount ?? 0, href: '/dashboard/notices' }
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Supabase-backed operations with live n8n webhook triggers on every insert.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle className="text-3xl">{stat.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" size="sm">
                <Link href={stat.href}>Manage</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
