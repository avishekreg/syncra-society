'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function PortalEntryPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => router.push('/dashboard'), 400)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4 py-16">
      <div className="mb-10 text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-neutral-400">Syncra Society</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-neutral-900">Operations Portal</h1>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-neutral-500">
          Secure access for housing society administrators, gatekeepers, and platform operators.
        </p>
      </div>

      <section className="w-full max-w-[400px] rounded-lg border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-md border border-neutral-200 bg-neutral-50">
          <Building2 className="h-4 w-4 text-neutral-700" strokeWidth={1.5} />
        </div>

        <h2 className="text-lg font-semibold tracking-tight text-neutral-900">Sign in</h2>
        <p className="mt-1 text-sm text-neutral-500">Enter your credentials to access the administrative console.</p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-neutral-700">
              Work email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="operations@your-society.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-10 border-neutral-200 bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-neutral-700">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-10 border-neutral-200 bg-white"
            />
          </div>
          <Button type="submit" className="h-10 w-full" disabled={loading}>
            {loading ? 'Signing in…' : 'Continue to console'}
          </Button>
        </form>

        <p className="mt-6 text-center text-[11px] leading-relaxed text-neutral-400">
          Authorized personnel only. Session activity is logged for audit compliance.
        </p>
      </section>
    </div>
  )
}
