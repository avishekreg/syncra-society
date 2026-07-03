import Link from 'next/link'
import { ArrowRight, Bell, CreditCard, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">Syncra Society</p>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-foreground md:text-5xl">
          Full-stack society operations on Supabase + Vercel
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Notices, visitor entries, and maintenance payments — each insert triggers a structured WhatsApp-ready
          payload to your live n8n webhook bridge.
        </p>
        <Button asChild size="lg">
          <Link href="/dashboard">
            Open Dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <Bell className="mb-2 h-8 w-8 text-primary" />
            <CardTitle>Notices</CardTitle>
            <CardDescription>Broadcast society announcements with automatic n8n fan-out to all flat owners.</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <Users className="mb-2 h-8 w-8 text-primary" />
            <CardTitle>Visitors</CardTitle>
            <CardDescription>Log gate entries and notify the flat owner via WhatsApp automation.</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CreditCard className="mb-2 h-8 w-8 text-primary" />
            <CardTitle>Payments</CardTitle>
            <CardDescription>Track dues and payment status with owner-targeted n8n alerts.</CardDescription>
          </CardHeader>
        </Card>
      </section>
    </div>
  )
}
