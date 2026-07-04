'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/layout/page-header'
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
import type { Flat, Society } from '@/types/database'

type FlatRow = Flat & { societyName?: string }

export default function SocietyRecordsPage() {
  const [flats, setFlats] = useState<FlatRow[]>([])
  const [societies, setSocieties] = useState<Society[]>([])
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    void load()
  }, [])

  async function load() {
    const [fRes, sRes] = await Promise.all([fetch('/api/flats'), fetch('/api/societies')])
    const flatData = (await fRes.json()) as Flat[]
    const societyData = (await sRes.json()) as Society[]
    setSocieties(societyData)
    const map = new Map(societyData.map((s) => [s.id, s.name]))
    setFlats(flatData.map((f) => ({ ...f, societyName: map.get(f.society_id) })))
  }

  return (
    <div>
      <PageHeader
        eyebrow="Society Records & Flat Directory"
        title="Registry and unit records"
        description="Authoritative society registry and flat-level owner contact graph — the foundation for notices, gatekeeper alerts, and payment communications."
      />

      <div className="grid gap-8 xl:grid-cols-[1fr_1.6fr]">
        <section className="syncra-panel p-6">
          <h2 className="text-sm font-semibold text-neutral-900">Register society</h2>
          <p className="mt-1 text-sm text-neutral-500">Capture legal entity details before unit provisioning.</p>
          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              setStatus('Society provisioning will be enabled via the admin API in the next release.')
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="name">Society name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Windsor Castle RWA"
                className="border-neutral-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Primary address</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Sector, city, state"
                className="border-neutral-200"
              />
            </div>
            <Button type="submit">Submit for provisioning</Button>
            {status && <p className="text-sm text-neutral-500">{status}</p>}
          </form>
        </section>

        <section className="syncra-panel overflow-hidden">
          <div className="border-b border-neutral-200 px-4 py-4 sm:px-6">
            <h2 className="text-sm font-semibold text-neutral-900">Society records</h2>
            <p className="text-sm text-neutral-500">{societies.length} societies under management</p>
          </div>
          <div className="divide-y divide-neutral-100">
            {societies.length === 0 ? (
              <p className="px-4 py-8 sm:px-6 sm:py-10 text-sm text-neutral-500">No societies registered.</p>
            ) : (
              societies.map((society) => (
                <div key={society.id} className="flex flex-wrap items-start justify-between gap-4 px-4 py-4 sm:px-6 sm:py-5">
                  <div>
                    <p className="font-medium text-neutral-900">{society.name}</p>
                    <p className="mt-1 text-sm text-neutral-500">{society.address ?? 'Address pending'}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="outline" className="border-neutral-200 capitalize">
                      {society.subscription_tier}
                    </Badge>
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {(society.active_addons ?? []).length === 0 ? (
                        <Badge variant="secondary">Core only</Badge>
                      ) : (
                        society.active_addons.map((addon) => (
                          <Badge key={addon} variant="outline" className="border-neutral-200 capitalize">
                            {addon.replace(/_/g, ' ')}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="syncra-panel mt-8 overflow-hidden">
        <div className="border-b border-neutral-200 px-4 py-4 sm:px-6">
          <h2 className="text-sm font-semibold text-neutral-900">Flat master directory</h2>
          <p className="text-sm text-neutral-500">
            {flats.length} units indexed across {societies.length} societies
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-neutral-200 hover:bg-transparent">
              <TableHead className="text-neutral-500">Society</TableHead>
              <TableHead className="text-neutral-500">Unit</TableHead>
              <TableHead className="text-neutral-500">Registered owner</TableHead>
              <TableHead className="text-neutral-500">Contact</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {flats.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-12 text-center text-neutral-500">
                  No units provisioned. Register a society to populate the directory.
                </TableCell>
              </TableRow>
            ) : (
              flats.map((flat) => (
                <TableRow key={flat.id} className="border-neutral-100">
                  <TableCell className="font-medium text-neutral-900">{flat.societyName ?? '—'}</TableCell>
                  <TableCell className="text-neutral-700">{flat.flat_number}</TableCell>
                  <TableCell className="text-neutral-700">{flat.owner_name}</TableCell>
                  <TableCell className="font-mono text-xs text-neutral-500">{flat.owner_phone}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </section>
    </div>
  )
}
