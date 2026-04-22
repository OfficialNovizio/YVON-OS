'use client'

import { useState, useEffect } from 'react'
import { getActiveVentureSlugClient } from '@/lib/venture-context'
import type { CompetitorContent } from '@/lib/types'

interface ContentResult {
  caption?: string
  hook?: string
  hookVariants?: string[]
  hashtags?: string[][]
}

type PanelType = 'niche' | 'viral'

const PANEL_CONFIG: Record<PanelType, { label: string; placeholder: string; topic: string }> = {
  niche: {
    label: 'Growing in Your Niche',
    placeholder: 'Topic for niche audience (e.g. "how we built our product", "industry trends")',
    topic: 'thought leadership and niche authority building',
  },
  viral: {
    label: 'Viral Formats',
    placeholder: 'Topic for high-engagement format (e.g. "controversial take", "unpopular opinion")',
    topic: 'viral LinkedIn hook and engagement format',
  },
}

export default function LinkedInContentPage() {
  const [ventureId, setVentureId]     = useState('novizio')
  const [ventureName, setVentureName] = useState('Novizio')
  const [topics, setTopics]   = useState<Record<PanelType, string>>({ niche: '', viral: '' })
  const [results, setResults] = useState<Record<PanelType, ContentResult | null>>({ niche: null, viral: null })
  const [loading, setLoading] = useState<Record<PanelType, boolean>>({ niche: false, viral: false })
  const [errors, setErrors]   = useState<Record<PanelType, string | null>>({ niche: null, viral: null })
  const [competitors, setCompetitors] = useState<CompetitorContent[]>([])
  const [competitorsLoading, setCompetitorsLoading] = useState(false)

  useEffect(() => {
    const slug = getActiveVentureSlugClient()
    setVentureId(slug)
    setVentureName(slug.charAt(0).toUpperCase() + slug.slice(1))
    loadCompetitors(slug)
  }, [])

  async function loadCompetitors(vid: string) {
    setCompetitorsLoading(true)
    try {
      const data = await fetch(`/api/competitor-content?platform=linkedin&ventureId=${vid}`)
        .then((r) => r.json()) as CompetitorContent[]
      setCompetitors(Array.isArray(data) ? data : [])
    } finally {
      setCompetitorsLoading(false)
    }
  }

  async function generate(panel: PanelType) {
    setErrors((e) => ({ ...e, [panel]: null }))
    setLoading((l) => ({ ...l, [panel]: true }))
    setResults((r) => ({ ...r, [panel]: null }))
    try {
      const combinedTopic = `${PANEL_CONFIG[panel].topic}: ${topics[panel]}`
      const res = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: 'linkedin', contentType: 'post', topic: combinedTopic, ventureId, ventureName }),
      })
      const data = await res.json() as ContentResult & { error?: string }
      if (data.error) {
        setErrors((e) => ({ ...e, [panel]: data.error! }))
        return
      }
      setResults((r) => ({ ...r, [panel]: data }))
    } finally {
      setLoading((l) => ({ ...l, [panel]: false }))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>LinkedIn Content</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>Niche authority + viral format side by side</p>
      </div>

      {/* Side-by-side panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(['niche', 'viral'] as PanelType[]).map((panel) => {
          const cfg = PANEL_CONFIG[panel]
          const res = results[panel]
          const isLoading = loading[panel]
          const err = errors[panel]

          return (
            <div
              key={panel}
              className="rounded-md p-5 flex flex-col gap-4"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: `1px solid ${panel === 'niche' ? 'rgba(59,130,246,0.3)' : 'rgba(233,69,96,0.3)'}`,
                borderTop: `3px solid ${panel === 'niche' ? '#3B82F6' : 'var(--color-red)'}`,
              }}
            >
              <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{cfg.label}</h2>

              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={topics[panel]}
                  onChange={(e) => setTopics((t) => ({ ...t, [panel]: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && generate(panel)}
                  placeholder={cfg.placeholder}
                  className="rounded px-3 py-2 text-sm outline-none"
                  style={{
                    backgroundColor: 'var(--color-navy)',
                    border: '1px solid rgba(15,52,96,0.8)',
                    color: 'var(--color-text)',
                  }}
                />
                <button
                  onClick={() => generate(panel)}
                  disabled={isLoading}
                  className="px-4 py-2 rounded text-sm font-semibold disabled:opacity-50"
                  style={{
                    backgroundColor: panel === 'niche' ? '#3B82F6' : 'var(--color-red)',
                    color: '#fff',
                  }}
                >
                  {isLoading ? 'Generating…' : 'Generate'}
                </button>
              </div>

              {err && <p className="text-xs" style={{ color: 'var(--color-red)' }}>{err}</p>}

              {res && (
                <div className="flex flex-col gap-3">
                  {res.hook && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-muted)' }}>Hook</p>
                      <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{res.hook}</p>
                    </div>
                  )}
                  {res.caption && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-muted)' }}>Post</p>
                      <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--color-text)' }}>{res.caption}</p>
                    </div>
                  )}
                  {res.hashtags && res.hashtags.flat().length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {res.hashtags.flat().slice(0, 10).map((tag) => (
                        <span key={tag} className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(59,130,246,0.1)', color: '#3B82F6' }}>
                          #{tag.replace(/^#/, '')}
                        </span>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => fetch('/api/deliverables', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ ventureId, agentId: 'alex-marketing-dir', title: `LinkedIn ${cfg.label}: ${topics[panel] || 'content'}`, type: 'content', content: [res.hook, res.caption].filter(Boolean).join('\n\n'), status: 'draft' }),
                    })}
                    className="text-xs px-3 py-1.5 rounded self-start"
                    style={{ color: 'var(--color-muted)', border: '1px solid rgba(160,174,192,0.2)' }}
                  >
                    + Save as Deliverable
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Competitor viral content */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Competitor Viral Content (LinkedIn)</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: 'var(--color-muted)' }}>Updated bi-weekly</span>
            <button onClick={() => loadCompetitors(ventureId)} className="text-xs px-2 py-1 rounded" style={{ color: 'var(--color-muted)', border: '1px solid rgba(160,174,192,0.2)' }}>Refresh</button>
          </div>
        </div>

        {competitorsLoading && <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Loading…</p>}

        {!competitorsLoading && competitors.length === 0 && (
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>No competitor content cached yet. Configure via agent memory and cron.</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {competitors.map((c) => (
            <div key={c.id} className="rounded-md p-3 flex flex-col gap-1" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid rgba(15,52,96,0.4)' }}>
              {c.title && <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{c.title}</p>}
              {c.description && <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{c.description.slice(0, 100)}{c.description.length > 100 ? '…' : ''}</p>}
              {c.engagementHint && (
                <span className="text-xs px-2 py-0.5 rounded self-start" style={{ backgroundColor: 'rgba(59,130,246,0.15)', color: '#3B82F6' }}>
                  {c.engagementHint}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
