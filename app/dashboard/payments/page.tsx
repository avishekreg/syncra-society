'use client'

import { useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatDate, formatInr } from '@/lib/utils'
import type { Flat, PaymentWithFlat, Society } from '@/types/database'
import { hasAddon, UnlockPremiumCard } from '@/components/premium/unlock-premium-card'

export default function PaymentsPage() {
  const [flats, setFlats] = useState<Flat[]>([])
  const [societies, setSocieties] = useState<Society[]>([])
  const [payments, setPayments] = useState<PaymentWithFlat[]>([])
  const [gateway, setGateway] = useState<{ provider: string; publicKey: string } | null>(null)
  const [flatId, setFlatId] = useState('')
  const [amount, setAmount] = useState('3500')
  const [statusValue, setStatusValue] = useState<'paid' | 'pending'>('pending')
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const selectedFlat = flats.find((f) => f.id === flatId)
  const selectedSociety = useMemo(
    () => societies.find((s) => s.id === selectedFlat?.society_id),
    [societies, selectedFlat]
  )
  const paymentGatewayEnabled = hasAddon(selectedSociety?.active_addons, 'payment_gateway')
  const whatsappEnabled = hasAddon(selectedSociety?.active_addons, 'whatsapp_automation')

  async function reload() {
    const [fRes, pRes, sRes, gRes] = await Promise.all([
      fetch('/api/flats'),
      fetch('/api/payments'),
      fetch('/api/societies'),
      fetch('/api/payments/gateway')
    ])
    const fData = (await fRes.json()) as Flat[]
    setFlats(fData)
    setPayments((await pRes.json()) as PaymentWithFlat[])
    setSocieties((await sRes.json()) as Society[])
    setGateway((await gRes.json()) as { provider: string; publicKey: string })
    if (!flatId && fData[0]?.id) setFlatId(fData[0].id)
  }

  useEffect(() => {
    void reload()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setStatus('')
    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        flat_id: flatId,
        amount: Number(amount),
        status: statusValue,
        due_date: dueDate
      })
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      setStatus(data.error ? JSON.stringify(data.error) : 'Failed to create payment')
      return
    }
    setStatus(
      data.n8n?.skipped
        ? 'Payment recorded. WhatsApp alert skipped — enable whatsapp_automation.'
        : data.n8n?.ok === false
          ? `Payment saved. n8n: ${data.n8n.error}`
          : 'Payment recorded + n8n alert sent'
    )
    void reload()
  }

  async function createGatewayOrder() {
    if (!paymentGatewayEnabled) return
    setLoading(true)
    setStatus('')
    const res = await fetch('/api/payments/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        flat_id: flatId,
        amount: Number(amount),
        due_date: dueDate
      })
    })
    const data = await res.json()
    setLoading(false)
    if (res.status === 403) {
      setStatus(data.error ?? 'Payment gateway module locked')
      return
    }
    if (!res.ok) {
      setStatus(data.error ?? 'Order failed')
      return
    }
    setStatus(`Gateway order created via ${data.order?.provider}: ${data.order?.orderId}`)
    void reload()
  }

  return (
    <div className="space-y-6">
      {!paymentGatewayEnabled && selectedSociety && (
        <UnlockPremiumCard addon="payment_gateway" societyName={selectedSociety.name} />
      )}
      {statusValue === 'paid' && !whatsappEnabled && selectedSociety && (
        <UnlockPremiumCard addon="whatsapp_automation" societyName={selectedSociety.name} />
      )}

      {gateway && (
        <p className="text-sm text-muted-foreground">
          Active gateway: <strong>{gateway.provider}</strong> (public key loaded from system_configs)
        </p>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Record Payment</CardTitle>
            <CardDescription>Manual entry or create a gateway order via PaymentFactory.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="flat">Flat</Label>
                <select
                  id="flat"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={flatId}
                  onChange={(e) => setFlatId(e.target.value)}
                  required
                >
                  {flats.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.flat_number} — {f.owner_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (INR)</Label>
                <Input id="amount" type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={statusValue}
                  onChange={(e) => setStatusValue(e.target.value as 'paid' | 'pending')}
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="due">Due Date</Label>
                <Input id="due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving…' : 'Record Payment'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={loading || !paymentGatewayEnabled}
                  onClick={() => void createGatewayOrder()}
                >
                  Create Gateway Order
                </Button>
              </div>
              {status && <p className="text-sm text-muted-foreground">{status}</p>}
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {payments.length === 0 && <p className="text-sm text-muted-foreground">No payments yet.</p>}
            {payments.map((payment) => (
              <div key={payment.id} className="flex items-start justify-between rounded-lg border p-4">
                <div>
                  <p className="font-semibold">{formatInr(Number(payment.amount))}</p>
                  <p className="text-sm text-muted-foreground">
                    Flat {payment.flats?.flat_number ?? '—'} · Due {payment.due_date}
                  </p>
                  {payment.gateway_order_id && (
                    <p className="text-xs text-muted-foreground">Order: {payment.gateway_order_id}</p>
                  )}
                  {payment.created_at && (
                    <p className="mt-2 text-xs text-muted-foreground">{formatDate(payment.created_at)}</p>
                  )}
                </div>
                <Badge variant={payment.status === 'paid' ? 'success' : 'warning'}>{payment.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
