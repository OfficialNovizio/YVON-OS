'use client'

import { useState } from 'react'
import type { TrendItem, TrendStatus } from '@/lib/types'

const SEED_TRENDS: TrendItem[] = [
  {
    id: '1', platform: 'instagram', keyword: 'slow fashion process',     angle: 'Behind-the-scenes Reel: show the full journey from fabric sourcing to finished garment. Hook: "This took 3 weeks to make — here\'s why."',
    status: 'new', generatedAt: new Date().toISOString(),
  },
  {
    id: '2', platform: 'instagram', keyword: 'outfit formula',     angle: 'Carousel post: "The 3-piece formula that always works" — curated outfit combinations using only Novizio pieces. Saves-optimized format.',
    status: 'new', generatedAt: new Date().toISOString(),
  },
  {
    id: '3', platform: 'youtube', keyword: 'sustainable wardrobe build',     angle: 'Long-form video: "Building a 10-piece wardrobe that lasts 10 years" — durability focus, anti-fast-fashion positioning.',
    status: 'new', generatedAt: new Date().toISOString(),
  },
  {
    id: '4', platform: 'linkedin', keyword: 'fashion founder story',     angle: 'Personal essay post: the moment you decided to build a sustainable brand vs take the fast-fashion route. High share potential in entrepreneur community.',
    status: 'new', generatedAt: new Date().toISOString(),
  },
  {
    id: '5', platform: 'instagram', keyword: 'size inclusivity fashion',     angle: 'Static post series: real customers in their Novizio pieces — diverse body types. Authentic UGC-style photography. Caption: "Fashion for every version of you."',
    status: 'new', generatedAt: new Date().toISOString(),
  },
  {
    id: '6', platform: 'instagram', keyword: 'spring color palette 2024',     angle: 'Reel: spring color story — WGSN-aligned palette translated into Novizio\'s existing collection. Pair with trending audio.',
    status: 'used', generatedAt: new Date().toISOString(),
  },
  {
    id: '7', platform: 'linkedin', keyword: 'brand vs product business',     angle: 'Thought leadership: "Why we\'re building a brand, not just a product line" — long-form perspective on community-first fashion.',
    status: 'used', generatedAt: new Date().toISOString(),
  },
  {
    id: '8', platform: 'youtube', keyword: 'custom clothing process',     angle: 'Short-form: "What happens after you order" — demystify the custom production process. Builds trust and manages expectations.',
    status: 'archived', generatedAt: new Date().toISOString(),
  },
]

const STATUS_META: Record<TrendStatus, { color: string; label: string }> = {
  new:      { color: 'var(--gn)', label: 'NEW' },
  used:     { color: 'var(--bl)', label: 'USED' },
  archived: { color: 'var(--mu)', label: 'ARCHIVED' },
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'var(--ac)',
  youtube:   'var(--rd)',
  linkedin:  'var(--bl)',
}

const PLATFORM_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  youtube:   'YouTube',
  linkedin:  'LinkedIn',
}

function TrendCard({
  item,
  onStatusChange,
}: {
  item: TrendItem
  onStatusChange: (id: string, status: TrendStatus) => void
}) {
  const meta = STATUS_META[item.status]
  const platformColor = PLATFORM_COLORS[item.platform] || 'var(--di)'

  return (
    <div style={{
      background: 'var(--sf)',
      border: '1px solid var(--b1)',
      borderTop: `2px solid ${platformColor}`,
      padding: '14px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
    }}>
      {/* Badges */}
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        <span style={{
          fontFamily: 'var(--font-dm-mono)',
          fontSize: '9px',
          padding: '2px 6px',
          color: meta.color,
          border: `1px solid ${meta.color}`,
          letterSpacing: '0.04em',
        }}>
          {meta.label}
        </span>
        <span style={{
          fontFamily: 'var(--font-dm-mono)',
          fontSize: '9px',
          padding: '2px 6px',
          color: platformColor,
          border: `1px solid ${platformColor}44`,
          letterSpacing: '0.04em',
        }}>
          {(PLATFORM_LABELS[item.platform] ?? item.platform).toUpperCase()}
        </span>
      </div>

      {/* Keyword */}
      <div style={{ fontSize: '13px', color: 'var(--br)', fontWeight: 500, lineHeight: 1.3 }}>
        {item.keyword}
      </div>

      {/* Angle */}
      <p style={{ fontSize: '12px', color: 'var(--di)', lineHeight: 1.55, margin: 0, flex: 1 }}>
        {item.angle}
      </p>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '6px', paddingTop: '6px', borderTop: '1px solid var(--b1)' }}>
        {item.status !== 'used' && (
          <button
            onClick={() => onStatusChange(item.id, 'used')}
            style={{
              fontFamily: 'var(--font-dm-mono)',
              fontSize: '9px',
              letterSpacing: '0.06em',
              padding: '4px 10px',
              background: 'none',
              border: '1px solid var(--b3)',
              color: 'var(--di)',
              cursor: 'pointer',
            }}
          >
            MARK USED
          </button>
        )}
        {item.status !== 'archived' && (
          <button
            onClick={() => onStatusChange(item.id, 'archived')}
            style={{
              fontFamily: 'var(--font-dm-mono)',
              fontSize: '9px',
              letterSpacing: '0.06em',
              padding: '4px 10px',
              background: 'none',
              border: '1px solid var(--b2)',
              color: 'var(--mu)',
              cursor: 'pointer',
            }}
          >
            ARCHIVE
          </button>
        )}
      </div>
    </div>
  )
}

export default function TrendingPage() {
  const [trends, setTrends] = useState<TrendItem[]>(SEED_TRENDS)
  const [isLoading, setIsLoading] = useState(false)
  const [lastRun, setLastRun] = useState<string | null>(null)

  async function refresh() {
    setIsLoading(true)
    try {
      const res = await fetch('/api/trending')
      const data = await res.json() as { trends?: TrendItem[]; generatedAt?: string }
      if (data.trends && data.trends.length > 0) {
        setTrends(data.trends)
        setLastRun(data.generatedAt ?? null)
      }
    } catch (err) {
      console.error('Trending refresh failed', err)
    } finally {
      setIsLoading(false)
    }
  }

  function updateStatus(id: string, status: TrendStatus) {
    setTrends((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)))
  }

  const newTrends      = trends.filter((t) => t.status === 'new')
  const usedTrends     = trends.filter((t) => t.status === 'used')
  const archivedTrends = trends.filter((t) => t.status === 'archived')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-playfair)', fontWeight: 400, fontSize: '28px', color: 'var(--br)', margin: '0 0 4px' }}>
            Trending
          </h1>
          <p style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--di)', margin: 0 }}>
            Daily content pipeline · Auto-refresh 9am
            {lastRun && ` · Last run: ${new Date(lastRun).toLocaleString()}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Status summary chips */}
          {[
            { label: `${newTrends.length} New`, color: 'var(--gn)' },
            { label: `${usedTrends.length} Used`, color: 'var(--bl)' },
            { label: `${archivedTrends.length} Archived`, color: 'var(--mu)' },
          ].map(c => (
            <span key={c.label} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: c.color, padding: '3px 8px', border: `1px solid ${c.color}44` }}>
              {c.label}
            </span>
          ))}
          <button
            onClick={refresh}
            disabled={isLoading}
            style={{
              fontFamily: 'var(--font-dm-mono)',
              fontSize: '10px',
              letterSpacing: '0.08em',
              padding: '6px 14px',
              background: 'none',
              border: '1px solid var(--ac)',
              color: isLoading ? 'var(--di)' : 'var(--ac)',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.5 : 1,
            }}
          >
            {isLoading ? 'REFRESHING…' : 'REFRESH NOW'}
          </button>
        </div>
      </div>

      {/* New Trends */}
      {newTrends.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '0.1em', color: 'var(--di)', borderBottom: '1px solid var(--b1)', paddingBottom: '8px' }}>
            NEW — {newTrends.length} TOPICS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1px', background: 'var(--b1)' }}>
            {newTrends.map((item) => (
              <TrendCard key={item.id} item={item} onStatusChange={updateStatus} />
            ))}
          </div>
        </div>
      )}

      {/* Used Trends */}
      {usedTrends.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '0.1em', color: 'var(--di)', borderBottom: '1px solid var(--b1)', paddingBottom: '8px' }}>
            USED — {usedTrends.length} TOPICS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1px', background: 'var(--b1)' }}>
            {usedTrends.map((item) => (
              <TrendCard key={item.id} item={item} onStatusChange={updateStatus} />
            ))}
          </div>
        </div>
      )}

      {/* Archived */}
      {archivedTrends.length > 0 && (
        <details>
          <summary style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '0.1em', color: 'var(--mu)', cursor: 'pointer', paddingBottom: '8px', borderBottom: '1px solid var(--b1)', listStyle: 'none' }}>
            ARCHIVED — {archivedTrends.length} TOPICS ▾
          </summary>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1px', background: 'var(--b1)', marginTop: '12px', opacity: 0.5 }}>
            {archivedTrends.map((item) => (
              <TrendCard key={item.id} item={item} onStatusChange={updateStatus} />
            ))}
          </div>
        </details>
      )}
    </div>
  )
}
