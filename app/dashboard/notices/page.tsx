'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
      setStatus(data.error ? JSON.stringify(data.error) : 'Failed to publish notice')
      return
    }
    if (data.n8n?.skipped) {
      setStatus('Notice saved. WhatsApp automation skipped — premium module not active.')
    } else if (data.n8n?.ok === false) {
      setStatus(`Notice saved. n8n warning: ${data.n8n.error}`)
    } else {
      setStatus('Notice published + n8n WhatsApp bridge triggered')
    }
    setTitle('')
    setContent('')
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
            <CardTitle>Publish Notice</CardTitle>
            <CardDescription>
              Saves to Supabase. n8n dispatch requires whatsapp_automation addon.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="society">Society</Label>
                <select
                  id="society"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={societyId}
                  onChange={(e) => setSocietyId(e.target.value)}
                  required
                >
                  {societies.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.subscription_tier})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} required rows={5} />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? 'Publishing…' : 'Publish Notice'}
              </Button>
              {status && <p className="text-sm text-muted-foreground">{status}</p>}
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Notices</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {notices.length === 0 && <p className="text-sm text-muted-foreground">No notices yet.</p>}
            {notices.map((notice) => (
              <div key={notice.id} className="rounded-lg border p-4">
                <p className="font-semibold">{notice.title}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{notice.content}</p>
                <p className="mt-3 text-xs text-muted-foreground">{formatDate(notice.created_at)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
