import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { MESSAGE_GATEWAY_UNAVAILABLE } from '../lib/clientCopy'
import { formatInr } from '@/lib/utils'
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
      body: JSON.stringify({ flat_id: flatId, amount: Number(amount), status: statusValue, due_date: dueDate })
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      setStatus(data.error ? JSON.stringify(data.error) : 'Unable to commit payment record.')
      return
    }
    setStatus(
      data.n8n?.skipped
        ? 'Payment recorded. Settlement alert deferred — WhatsApp module inactive.'
        : data.n8n?.ok === false
          ? MESSAGE_GATEWAY_UNAVAILABLE
          : 'Payment recorded and owner settlement alert dispatched.'
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
      body: JSON.stringify({ flat_id: flatId, amount: Number(amount), due_date: dueDate })
    })
    const data = await res.json()
    setLoading(false)
    if (res.status === 403) {
      setStatus(data.error ?? 'Global Payment Gateway module inactive for this society.')
      return
    }
    if (!res.ok) {
      setStatus(data.error ?? 'Gateway order initiation failed.')
      return
    }
    setStatus(`Gateway order provisioned via ${data.order?.provider}: ${data.order?.orderId}`)
    void reload()
  }

  return (
    <div>
      <PageHeader
        eyebrow="Global Payment Configuration"
        title="Multi-regional collections"
        description="Orchestrate maintenance collections through Razorpay, Stripe, or regional providers — with automated owner confirmation via the Syncra communications gateway."
        action={
          <Button asChild variant="outline" size="sm" className="border-neutral-200">
            <Link to="/admin/config">Runtime gateway settings</Link>
          </Button>
        }
      />

      {!paymentGatewayEnabled && selectedSociety && (
        <UnlockPremiumCard addon="payment_gateway" societyName={selectedSociety.name} />
      )}
      {statusValue === 'paid' && !whatsappEnabled && selectedSociety && (
        <UnlockPremiumCard addon="whatsapp_automation" societyName={selectedSociety.name} />
      )}

      {gateway && (
        <section className="syncra-panel mt-2 flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-400">Active processor</p>
            <p className="mt-1 text-base font-semibold text-neutral-900">{gateway.provider}</p>
          </div>
          <p className="font-mono text-xs text-neutral-500">Public key · {gateway.publicKey.slice(0, 16)}…</p>
        </section>
      )}

      <div className="mt-8 grid gap-8 xl:grid-cols-[340px_1fr]">
        <section className="syncra-panel p-4 sm:p-6">
          <h2 className="text-sm font-semibold text-neutral-900">Issue collection</h2>
          <p className="mt-1 text-sm text-neutral-500">Manual ledger entry or initiate a PaymentFactory gateway order.</p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="flat">Assessed unit</Label>
              <select id="flat" className="syncra-input h-10" value={flatId} onChange={(e) => setFlatId(e.target.value)} required>
                {flats.map((f) => (
                  <option key={f.id} value={f.id}>
                    Unit {f.flat_number} · {f.owner_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (INR)</Label>
              <Input id="amount" type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} required className="border-neutral-200" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Settlement status</Label>
              <select id="status" className="syncra-input h-10" value={statusValue} onChange={(e) => setStatusValue(e.target.value as 'paid' | 'pending')}>
                <option value="pending">Pending settlement</option>
                <option value="paid">Settled</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="due">Due date</Label>
              <Input id="due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required className="border-neutral-200" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? 'Committing…' : 'Record collection'}
              </Button>
              <Button type="button" variant="outline" className="border-neutral-200" disabled={loading || !paymentGatewayEnabled} onClick={() => void createGatewayOrder()}>
                Initiate gateway order
              </Button>
            </div>
            {status && <p className="text-sm text-neutral-500">{status}</p>}
          </form>
        </section>

        <section className="syncra-panel overflow-hidden">
          <div className="border-b border-neutral-200 px-4 py-4 sm:px-6">
            <h2 className="text-sm font-semibold text-neutral-900">Settlement ledger</h2>
            <p className="text-sm text-neutral-500">{payments.length} collection records</p>
          </div>
          {payments.length === 0 ? (
            <p className="px-4 py-10 sm:px-6 sm:py-12 text-sm text-neutral-500">No collections recorded.</p>
          ) : (
            <div className="w-full overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">

              <Table className="min-w-[640px] w-full">
              <TableHeader>
                <TableRow className="border-neutral-200 hover:bg-transparent">
                  <TableHead className="text-neutral-500">Amount</TableHead>
                  <TableHead className="text-neutral-500">Unit</TableHead>
                  <TableHead className="text-neutral-500">Due date</TableHead>
                  <TableHead className="text-neutral-500">Reference</TableHead>
                  <TableHead className="text-neutral-500">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id} className="border-neutral-100">
                    <TableCell className="font-medium text-neutral-900">{formatInr(Number(payment.amount))}</TableCell>
                    <TableCell className="text-neutral-600">{payment.flats?.flat_number ?? '—'}</TableCell>
                    <TableCell className="text-neutral-600">{payment.due_date}</TableCell>
                    <TableCell className="font-mono text-xs text-neutral-500">{payment.gateway_order_id ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant={payment.status === 'paid' ? 'success' : 'warning'} className="font-normal">
                        {payment.status === 'paid' ? 'Settled' : 'Outstanding'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </section>
      </div>
    </div>
  )
}
