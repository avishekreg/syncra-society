import { useEffect, useMemo, useState } from 'react'
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
import { formatDate } from '@/lib/utils'
import type { Flat, Society, VisitorWithFlat } from '@/types/database'
import { hasAddon, UnlockPremiumCard } from '@/components/premium/unlock-premium-card'

function entryStatus(entryTime: string) {
  const hours = (Date.now() - new Date(entryTime).getTime()) / 36e5
  if (hours < 2) return { label: 'On Premises', variant: 'success' as const }
  if (hours < 24) return { label: 'Today', variant: 'warning' as const }
  return { label: 'Archived', variant: 'secondary' as const }
}

export default function VisitorsPage() {
  const [flats, setFlats] = useState<Flat[]>([])
  const [societies, setSocieties] = useState<Society[]>([])
  const [visitors, setVisitors] = useState<VisitorWithFlat[]>([])
  const [flatId, setFlatId] = useState('')
  const [visitorName, setVisitorName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [purpose, setPurpose] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const selectedFlat = flats.find((f) => f.id === flatId)
  const selectedSociety = useMemo(
    () => societies.find((s) => s.id === selectedFlat?.society_id),
    [societies, selectedFlat]
  )
  const whatsappEnabled = hasAddon(selectedSociety?.active_addons, 'whatsapp_automation')

  async function load() {
    const [fRes, vRes, sRes] = await Promise.all([
      fetch('/api/flats'),
      fetch('/api/visitors'),
      fetch('/api/societies')
    ])
    const fData = (await fRes.json()) as Flat[]
    setFlats(fData)
    setVisitors((await vRes.json()) as VisitorWithFlat[])
    setSocieties((await sRes.json()) as Society[])
    if (!flatId && fData[0]?.id) setFlatId(fData[0].id)
  }

  useEffect(() => {
    void load()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!whatsappEnabled) return
    setLoading(true)
    setStatus('')
    const res = await fetch('/api/visitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flat_id: flatId, visitor_name: visitorName, phone_number: phoneNumber, purpose })
    })
    const data = await res.json()
    setLoading(false)
    if (res.status === 403) {
      setStatus(data.error ?? 'Gatekeeper relay blocked — premium module inactive.')
      return
    }
    if (!res.ok) {
      setStatus(data.error ? JSON.stringify(data.error) : 'Unable to register gatekeeper event.')
      return
    }
    setStatus(
      data.n8n?.ok === false
        ? MESSAGE_GATEWAY_UNAVAILABLE
        : 'Gatekeeper event logged and WhatsApp notification dispatched to unit owner.'
    )
    setVisitorName('')
    setPhoneNumber('')
    setPurpose('')
    void load()
  }

  return (
    <div>
      <PageHeader
        eyebrow="Visitor Gatekeeper Logs"
        title="Gate operations"
        description="Register inbound visitors against unit records and route automated WhatsApp notifications to flat owners through Syncra Core."
      />

      {!whatsappEnabled && selectedSociety && (
        <UnlockPremiumCard addon="whatsapp_automation" societyName={selectedSociety.name} />
      )}

      <div className="mt-8 grid gap-8 xl:grid-cols-[340px_1fr]">
        <section className="syncra-panel p-6">
          <h2 className="text-sm font-semibold text-neutral-900">Register entry</h2>
          <p className="mt-1 text-sm text-neutral-500">Requires WhatsApp Automation entitlement for live dispatch.</p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="flat">Destination unit</Label>
              <select id="flat" className="syncra-input h-10" value={flatId} onChange={(e) => setFlatId(e.target.value)} required>
                {flats.map((f) => (
                  <option key={f.id} value={f.id}>
                    Unit {f.flat_number} · {f.owner_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="visitor">Visitor name</Label>
              <Input id="visitor" value={visitorName} onChange={(e) => setVisitorName(e.target.value)} required disabled={!whatsappEnabled} className="border-neutral-200" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Contact number</Label>
              <Input id="phone" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required disabled={!whatsappEnabled} className="border-neutral-200" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose</Label>
              <Input id="purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} required disabled={!whatsappEnabled} className="border-neutral-200" />
            </div>
            <Button type="submit" disabled={loading || !whatsappEnabled}>
              {loading ? 'Registering…' : 'Log visitor entry'}
            </Button>
            {status && <p className="text-sm text-neutral-500">{status}</p>}
          </form>
        </section>

        <section className="syncra-panel overflow-hidden">
          <div className="border-b border-neutral-200 px-4 py-4 sm:px-6">
            <h2 className="text-sm font-semibold text-neutral-900">Gatekeeper ledger</h2>
            <p className="text-sm text-neutral-500">{visitors.length} entries recorded</p>
          </div>
          {visitors.length === 0 ? (
            <p className="px-4 py-10 sm:px-6 sm:py-12 text-sm text-neutral-500">No gatekeeper activity recorded.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-neutral-200 hover:bg-transparent">
                  <TableHead className="text-neutral-500">Visitor</TableHead>
                  <TableHead className="text-neutral-500">Unit</TableHead>
                  <TableHead className="text-neutral-500">Purpose</TableHead>
                  <TableHead className="text-neutral-500">Entry time</TableHead>
                  <TableHead className="text-neutral-500">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visitors.map((visitor) => {
                  const badge = entryStatus(visitor.entry_time)
                  return (
                    <TableRow key={visitor.id} className="border-neutral-100">
                      <TableCell className="font-medium text-neutral-900">{visitor.visitor_name}</TableCell>
                      <TableCell className="text-neutral-600">{visitor.flats?.flat_number ?? '—'}</TableCell>
                      <TableCell className="text-neutral-600">{visitor.purpose}</TableCell>
                      <TableCell className="text-xs text-neutral-500">{formatDate(visitor.entry_time)}</TableCell>
                      <TableCell>
                        <Badge variant={badge.variant} className="font-normal">
                          {badge.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </section>
      </div>
    </div>
  )
}
