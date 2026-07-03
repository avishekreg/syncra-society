'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatDate } from '@/lib/utils'
import type { Flat, Society, VisitorWithFlat } from '@/types/database'
import { hasAddon, UnlockPremiumCard } from '@/components/premium/unlock-premium-card'

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
    const vData = (await vRes.json()) as VisitorWithFlat[]
    const sData = (await sRes.json()) as Society[]
    setFlats(fData)
    setVisitors(vData)
    setSocieties(sData)
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
      body: JSON.stringify({
        flat_id: flatId,
        visitor_name: visitorName,
        phone_number: phoneNumber,
        purpose
      })
    })
    const data = await res.json()
    setLoading(false)
    if (res.status === 403) {
      setStatus(data.error ?? 'Premium module locked')
      return
    }
    if (!res.ok) {
      setStatus(data.error ? JSON.stringify(data.error) : 'Failed to log visitor')
      return
    }
    setStatus(data.n8n?.ok === false ? `Saved. n8n: ${data.n8n.error}` : 'Visitor logged + owner notified via n8n')
    setVisitorName('')
    setPhoneNumber('')
    setPurpose('')
    void load()
  }

  return (
    <div className="space-y-6">
      {!whatsappEnabled && selectedSociety && (
        <UnlockPremiumCard addon="whatsapp_automation" societyName={selectedSociety.name} />
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Log Visitor Entry</CardTitle>
            <CardDescription>Requires whatsapp_automation premium addon (403 if locked).</CardDescription>
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
                <Label htmlFor="visitor">Visitor Name</Label>
                <Input id="visitor" value={visitorName} onChange={(e) => setVisitorName(e.target.value)} required disabled={!whatsappEnabled} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Visitor Phone</Label>
                <Input id="phone" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required disabled={!whatsappEnabled} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose</Label>
                <Input id="purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} required disabled={!whatsappEnabled} />
              </div>
              <Button type="submit" disabled={loading || !whatsappEnabled}>
                {loading ? 'Saving…' : 'Log Visitor'}
              </Button>
              {status && <p className="text-sm text-muted-foreground">{status}</p>}
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Visitors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {visitors.length === 0 && <p className="text-sm text-muted-foreground">No visitor entries yet.</p>}
            {visitors.map((visitor) => (
              <div key={visitor.id} className="rounded-lg border p-4">
                <p className="font-semibold">{visitor.visitor_name}</p>
                <p className="text-sm text-muted-foreground">
                  Flat {visitor.flats?.flat_number ?? '—'} · {visitor.purpose}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">{formatDate(visitor.entry_time)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
