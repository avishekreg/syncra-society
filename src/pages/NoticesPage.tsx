import { useEffect, useState } from 'react'
import { PageHeader } from '../../components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { formatDate } from '@/lib/utils'
import type { Notice, Society } from '@/types/database'
import { hasAddon, UnlockPremiumCard } from '@/components/premium/unlock-premium-card'

export default function NoticesPage() {
  const [societies, setSocieties] = useState<Society[]>([])
  const [notices, setNotices] = useState<Notice[]>([])
  const [societyId, setSocietyId] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const selectedSociety = societies.find((s) => s.id === societyId)
  const whatsappEnabled = hasAddon(selectedSociety?.active_addons, 'whatsapp_automation')

  async function load() {
    const [sRes, nRes] = await Promise.all([fetch('/api/societies'), fetch('/api/notices')])
    const sData = (await sRes.json()) as Society[]
    const nData = (await nRes.json()) as Notice[]
    setSocieties(sData)
    setNotices(nData)
    if (!societyId && sData[0]?.id) setSocietyId(sData[0].id)
  }

  useEffect(() => {
    void load()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setStatus('')
    const res = await fetch('/api/notices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ society_id: societyId, title, content })
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      setStatus(data.error ? JSON.stringify(data.error) : 'Broadcast failed to commit.')
      return
    }
    if (data.n8n?.skipped) {
      setStatus('Notice archived. n8n relay deferred — WhatsApp Automation module inactive.')
    } else if (data.n8n?.ok === false) {
      setStatus(`Notice archived. Relay warning: ${data.n8n.error}`)
    } else {
      setStatus('Notice published and n8n dispatch triggered successfully.')
    }
    setTitle('')
    setContent('')
    void load()
  }

  return (
    <div>
      <PageHeader
        eyebrow="Live Notices Broadcast"
        title="Society announcements"
        description="Compose authoritative notices and dispatch resident communications through the n8n WhatsApp automation bridge."
      />

      {!whatsappEnabled && selectedSociety && (
        <UnlockPremiumCard addon="whatsapp_automation" societyName={selectedSociety.name} />
      )}

      <div className="mt-8 grid gap-8 xl:grid-cols-[340px_1fr]">
        <section className="syncra-panel p-6">
          <h2 className="text-sm font-semibold text-neutral-900">Broadcast notice</h2>
          <p className="mt-1 text-sm text-neutral-500">Persists to Supabase and triggers n8n on publish.</p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="society">Target society</Label>
              <select
                id="society"
                className="syncra-input h-10"
                value={societyId}
                onChange={(e) => setSocietyId(e.target.value)}
                required
              >
                {societies.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} · {s.subscription_tier}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Headline</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required className="border-neutral-200" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Notice body</Label>
              <Textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} required rows={5} className="border-neutral-200" />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Broadcasting…' : 'Broadcast Notice'}
            </Button>
            {status && <p className="text-sm text-neutral-500">{status}</p>}
          </form>
        </section>

        <section className="syncra-panel overflow-hidden">
          <div className="border-b border-neutral-200 px-6 py-4">
            <h2 className="text-sm font-semibold text-neutral-900">Active announcements</h2>
            <p className="text-sm text-neutral-500">{notices.length} notices on record</p>
          </div>
          {notices.length === 0 ? (
            <p className="px-6 py-12 text-sm text-neutral-500">No announcements published yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-neutral-200 hover:bg-transparent">
                  <TableHead className="text-neutral-500">Title</TableHead>
                  <TableHead className="text-neutral-500">Content</TableHead>
                  <TableHead className="text-neutral-500">Published</TableHead>
                  <TableHead className="text-neutral-500">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notices.map((notice) => (
                  <TableRow key={notice.id} className="border-neutral-100">
                    <TableCell className="align-top font-medium text-neutral-900">{notice.title}</TableCell>
                    <TableCell className="max-w-xs align-top text-sm text-neutral-600">
                      <span className="line-clamp-3 whitespace-pre-wrap">{notice.content}</span>
                    </TableCell>
                    <TableCell className="align-top text-xs text-neutral-500">{formatDate(notice.created_at)}</TableCell>
                    <TableCell className="align-top">
                      <Badge variant="outline" className="border-neutral-200 font-normal">
                        Live
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
