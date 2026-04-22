'use client'

import { useState, useEffect } from 'react'
import BriefCard from '@/components/BriefCard'
import { getActiveVentureSlugClient } from '@/lib/venture-context'
import type { Brief } from '@/lib/types'

export default function InboxPage() {
  const [briefs, setBriefs]     = useState<Brief[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)

  const ventureSlug = getActiveVentureSlugClient()
  const unreadCount = briefs.filter((b) => !b.readAt).length

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        // For now load via Supabase client-side — replace with server component + db call if preferred
        const res = await fetch(`/api/briefing?venture=${ventureSlug}`, {
          headers: {
            authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET ?? ''}`,
          },
        })
        if (!res.ok) throw new Error('Failed to load briefs')
        const data = await res.json() as { briefId?: string; content?: string }
        // If there's a just-generated brief, show it
        if (data.briefId && data.content) {
          setBriefs([{
            id: data.briefId,
            ventureId: ventureSlug,
            content: data.content,
            date: new Date().toISOString(),
            readAt: null,
            emailSent: false,
          }])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading inbox')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [ventureSlug])

  function handleRead(id: string) {
    setBriefs((prev) =>
      prev.map((b) => b.id === id ? { ...b, readAt: new Date().toISOString() } : b)
    )
    // Mark read in DB
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'markBriefRead', briefId: id }),
    }).catch(() => null)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>
              Inbox
            </h1>
            {unreadCount > 0 && (
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: 'var(--color-red)', color: '#fff' }}
              >
                {unreadCount}
              </span>
            )}
          </div>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
            Morning CEO briefs — generated daily at 7am UTC
          </p>
        </div>
      </div>

      {/* Content */}
      {loading && (
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Loading…</p>
      )}
      {error && (
        <p className="text-sm" style={{ color: 'var(--color-red)' }}>{error}</p>
      )}
      {!loading && !error && briefs.length === 0 && (
        <div
          className="text-center py-16 rounded-md"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid rgba(15,52,96,0.3)' }}
        >
          <p className="text-3xl mb-3">📭</p>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
            No briefs yet. The first brief will arrive at 7am UTC.
          </p>
        </div>
      )}
      <div className="flex flex-col gap-3">
        {briefs.map((brief) => (
          <BriefCard key={brief.id} brief={brief} onRead={handleRead} />
        ))}
      </div>
    </div>
  )
}
