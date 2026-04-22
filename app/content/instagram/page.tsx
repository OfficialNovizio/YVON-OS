'use client'

import { useState, useEffect } from 'react'
import { getActiveVentureSlugClient } from '@/lib/venture-context'
import type { CompetitorContent } from '@/lib/types'

type TabType = 'reel' | 'carousel' | 'post'

interface ContentResult {
  caption?: string
  hook?: string
  hookVariants?: string[]
  hashtags?: string[][]
  audioSuggestion?: string
}

const TABS: { id: TabType; label: string }[] = [
  { id: 'reel',     label: '🎬 Reel' },
  { id: 'carousel', label: '📸 Carousel' },
  { id: 'post',     label: '📝 Post' },
]

export default function InstagramContentPage() {
  const [tab, setTab]           = useState<TabType>('reel')
  const [topic, setTopic]       = useState('')
  const [result, setResult]     = useState<ContentResult | null>(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [ventureId, setVentureId] = useState('novizio')
  const [ventureName, setVentureName] = useState('Novizio')
  const [competitors, setCompetitors] = useState<CompetitorContent[]>([])
  const [competitorsLoading, setCompetitorsLoading] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    const slug = getActiveVentureSlugClient()
    setVentureId(slug)
    setVentureName(slug.charAt(0).toUpperCase() + slug.slice(1))
    loadCompetitors(slug)
  }, [])

  async function loadCompetitors(vid: string) {
    setCompetitorsLoading(true)
    try {
      const data = await fetch(`/api/competitor-content?platform=instagram&ventureId=${vid}`)
        .then((r) => r.json()) as CompetitorContent[]
      setCompetitors(Array.isArray(data) ? data : [])
    } finally {
      setCompetitorsLoading(false)
    }
  }

  async function generate() {
    setError(null)
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: 'instagram', contentType: tab, topic, ventureId, ventureName }),
      })
      const data = await res.json() as ContentResult & { error?: string }
      if (data.error) { setError(data.error); return }
      setResult(data)
    } finally {
      setLoading(false)
    }
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).catch(() => null)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>Instagram Content</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>AI-generated captions, hooks, and hashtags</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6">
        {/* Left: Generator */}
        <div className="flex flex-col gap-4">
          {/* Tab bar */}
          <div className="flex gap-1 rounded-md p-1 w-fit" style={{ backgroundColor: 'var(--color-surface)' }}>
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setResult(null) }}
                className="px-4 py-1.5 rounded text-sm font-medium transition-colors"
                style={{
                  backgroundColor: tab === t.id ? 'var(--color-navy)' : 'transparent',
                  color: tab === t.id ? 'var(--color-text)' : 'var(--color-muted)',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Topic input */}
          <div className="flex gap-3">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && generate()}
              placeholder={`Topic for your ${tab} (e.g. "new product drop", "behind the scenes")`}
              className="flex-1 rounded px-3 py-2.5 text-sm outline-none"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid rgba(15,52,96,0.6)',
                color: 'var(--color-text)',
              }}
            />
            <button
              onClick={generate}
              disabled={loading}
              className="px-5 py-2.5 rounded text-sm font-semibold disabled:opacity-50 shrink-0"
              style={{ backgroundColor: 'var(--color-red)', color: '#fff' }}
            >
              {loading ? 'Generating…' : 'Generate'}
            </button>
          </div>

          {error && <p className="text-sm" style={{ color: 'var(--color-red)' }}>{error}</p>}

          {result && (
            <div className="flex flex-col gap-4">
              {/* Hook */}
              {result.hook && (
                <ContentBlock label="Hook" onCopy={() => copy(result.hook!, 'hook')} copied={copied === 'hook'}>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{result.hook}</p>
                  {result.hookVariants && result.hookVariants.length > 0 && (
                    <div className="mt-2 flex flex-col gap-1">
                      <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Variants:</p>
                      {result.hookVariants.map((v, i) => (
                        <p key={i} className="text-xs pl-3 border-l-2" style={{ color: 'var(--color-text)', borderColor: 'var(--color-red)' }}>{v}</p>
                      ))}
                    </div>
                  )}
                </ContentBlock>
              )}

              {/* Caption */}
              {result.caption && (
                <ContentBlock label="Caption" onCopy={() => copy(result.caption!, 'caption')} copied={copied === 'caption'}>
                  <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--color-text)' }}>{result.caption}</p>
                </ContentBlock>
              )}

              {/* Hashtags */}
              {result.hashtags && (
                <ContentBlock label="Hashtag Sets" onCopy={() => copy(result.hashtags!.flat().map((h) => `#${h.replace(/^#/, '')}`).join(' '), 'hashtags')} copied={copied === 'hashtags'}>
                  <div className="flex flex-col gap-2">
                    {['Broad', 'Mid', 'Niche'].map((tier, i) => (
                      result.hashtags![i] && (
                        <div key={tier}>
                          <p className="text-xs mb-1" style={{ color: 'var(--color-muted)' }}>{tier}</p>
                          <div className="flex flex-wrap gap-1">
                            {result.hashtags![i].map((tag) => (
                              <span key={tag} className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(233,69,96,0.1)', color: 'var(--color-red)' }}>
                                #{tag.replace(/^#/, '')}
                              </span>
                            ))}
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </ContentBlock>
              )}

              {/* Audio (reels only) */}
              {tab === 'reel' && result.audioSuggestion && (
                <ContentBlock label="Audio Suggestion" onCopy={() => copy(result.audioSuggestion!, 'audio')} copied={copied === 'audio'}>
                  <p className="text-sm" style={{ color: 'var(--color-text)' }}>🎵 {result.audioSuggestion}</p>
                </ContentBlock>
              )}

              {/* Save as deliverable */}
              <SaveDeliverable
                ventureId={ventureId}
                title={`Instagram ${tab}: ${topic || 'Brand Content'}`}
                content={[result.hook, result.caption, result.hashtags?.flat().map((h) => `#${h}`).join(' ')].filter(Boolean).join('\n\n')}
              />
            </div>
          )}
        </div>

        {/* Right: Competitor content */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Competitor Spotlight</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: 'var(--color-muted)' }}>Updated bi-weekly</span>
              <button
                onClick={() => loadCompetitors(ventureId)}
                className="text-xs px-2 py-1 rounded"
                style={{ color: 'var(--color-muted)', border: '1px solid rgba(160,174,192,0.2)' }}
              >
                Refresh
              </button>
            </div>
          </div>

          {competitorsLoading && <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Loading…</p>}

          {!competitorsLoading && competitors.length === 0 && (
            <div
              className="rounded-md p-4 text-sm"
              style={{ backgroundColor: 'var(--color-surface)', border: '1px solid rgba(15,52,96,0.4)', color: 'var(--color-muted)' }}
            >
              No competitor content cached yet. Configure competitor handles in agent memory and run the weekly cron to populate.
            </div>
          )}

          <div className="flex flex-col gap-2">
            {competitors.map((c) => (
              <div
                key={c.id}
                className="rounded-md p-3 flex flex-col gap-1"
                style={{ backgroundColor: 'var(--color-surface)', border: '1px solid rgba(15,52,96,0.4)' }}
              >
                {c.title && <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{c.title}</p>}
                {c.description && <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{c.description.slice(0, 120)}{c.description.length > 120 ? '…' : ''}</p>}
                {c.engagementHint && (
                  <span className="text-xs px-2 py-0.5 rounded self-start" style={{ backgroundColor: 'rgba(16,185,129,0.15)', color: '#10B981' }}>
                    {c.engagementHint}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ContentBlock({ label, children, onCopy, copied }: { label: string; children: React.ReactNode; onCopy: () => void; copied: boolean }) {
  return (
    <div className="rounded-md p-4 flex flex-col gap-2" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid rgba(15,52,96,0.4)' }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>{label}</span>
        <button onClick={onCopy} className="text-xs px-2 py-0.5 rounded transition-colors" style={{ color: copied ? '#10B981' : 'var(--color-muted)', border: '1px solid rgba(160,174,192,0.2)' }}>
          {copied ? 'Copied ✓' : 'Copy'}
        </button>
      </div>
      {children}
    </div>
  )
}

function SaveDeliverable({ ventureId, title, content }: { ventureId: string; title: string; content: string }) {
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    try {
      await fetch('/api/deliverables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ventureId, agentId: 'lena-brand', title, type: 'content', content, status: 'draft' }),
      })
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <button
      onClick={save}
      disabled={saving || saved}
      className="text-sm px-4 py-2 rounded self-start transition-colors disabled:opacity-60"
      style={{ color: saved ? '#10B981' : 'var(--color-muted)', border: `1px solid ${saved ? '#10B98144' : 'rgba(160,174,192,0.2)'}` }}
    >
      {saving ? 'Saving…' : saved ? '✓ Saved as Deliverable' : '+ Save as Deliverable'}
    </button>
  )
}
