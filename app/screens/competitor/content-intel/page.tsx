'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import CompetitorSubNav from '../_subnav'
import { useVentureSlug } from '@/lib/use-venture-slug'
import { getCached, setCache } from '@/lib/session-cache'
import { AlertsSection } from '../alerts/_alerts-section'

import { G1, G2, G3, G4, I1, I1c, I1d, I2, I2d, I3c, I3d, I4, I4d, L1, ACCENT, INK_4 } from '../_glass-tokens'

interface ContentPost {
  id: string; brandName: string; handle: string; caption: string
  type: string; likes: number; comments: number; views: number; shares: number
  engagement: number; url: string; displayUrl: string; images: string[]
  capturedAt: string; publishedAt: string
}
interface Competitor {
  name: string; sov: string; score: number; engagementRate: number
  tier: string; handle: string | null; followers: number; dashed?: boolean
}
interface IntelData {
  signals: Array<{ id: string; severity: 'red' | 'amber' | 'green'; text: string; cta: string }>
  kpis: Array<{ label: string; icon: string; value: string; unit: string; delta: string; up: boolean | null }>
  competitors: Competitor[]
  contentFeed: ContentPost[]
  activityTimeline: Array<{ id: string; brandName: string; capturedAt: string; trendingCount: number; compositeScore: number }>
}
interface VentureSocial { platform: string; handleOrUrl: string }

const PLATFORM_ICON: Record<string, string> = {
  instagram: 'photo_camera', tiktok: 'music_note', youtube: 'play_circle',
  linkedin: 'work', twitter: 'tag', threads: 'alternate_email', facebook: 'groups',
}

function fmtN(n: number) {
  return n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'M' : n >= 1_000 ? Math.round(n / 1_000) + 'K' : String(n)
}
function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime()
  const d = Math.floor(ms / 86400000)
  const h = Math.floor(ms / 3600000)
  return d > 0 ? `${d}d ago` : h > 0 ? `${h}h ago` : 'recently'
}

export default function CompetitorContentIntelPage() {
  const router = useRouter()
  const ventureSlug = useVentureSlug()
  const [liveData, setLiveData] = useState<IntelData | null>(null)
  const [ventureSocials, setVentureSocials] = useState<VentureSocial[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ventureSlug) return
    const intelKey = `content-intel-${ventureSlug}`
    const socialsKey = `venture-socials-${ventureSlug}`

    const cached = getCached<IntelData>(intelKey)
    const cachedSocials = getCached<VentureSocial[]>(socialsKey)
    if (cached) { setLiveData(cached); setLoading(false) }
    if (cachedSocials) setVentureSocials(cachedSocials)
    if (cached && cachedSocials) return

    setLoading(true)
    Promise.all([
      fetch(`/api/competitor-content-intel?venture=${ventureSlug}`).then(r => r.json()),
      fetch(`/api/social-accounts?venture_slug=${ventureSlug}`).then(r => r.json()),
    ]).then(([intel, socialsData]) => {
      setLiveData(intel as IntelData)
      setCache(intelKey, intel)
      const s = (socialsData.socials ?? []) as VentureSocial[]
      setVentureSocials(s)
      setCache(socialsKey, s)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [ventureSlug])

  const signals = liveData?.signals ?? []
  const kpis = liveData?.kpis ?? []
  const competitors = liveData?.competitors ?? []
  const contentFeed = liveData?.contentFeed ?? []
  const connectedPlatforms = new Set(ventureSocials.map(s => s.platform.toLowerCase()))
  const sortedByEng = [...contentFeed].sort((a, b) => b.engagement - a.engagement)

  if (loading && !liveData) {
    return (
      <main className="min-h-screen pb-24">
        <CompetitorSubNav />
        <div className="flex items-center justify-center py-32">
          <span className="material-symbols-outlined animate-spin text-[36px]" style={{ color: 'rgba(0,0,0,0.15)' }}>refresh</span>
        </div>
      </main>
    )
  }

  if (!loading && competitors.length === 0 && contentFeed.length === 0) {
    return (
      <main className="min-h-screen pb-24">
        <CompetitorSubNav />
        <div className="px-6 max-w-[1200px] mx-auto mt-[18px] flex flex-col items-center justify-center py-24 text-center gap-4">
          <span className="material-symbols-outlined text-[48px]" style={{ color: 'rgba(0,0,0,0.12)' }}>radar</span>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: I1 }}>No Competitor Data Yet</h2>
          <p style={{ fontSize: 14, color: I1d, maxWidth: 420, lineHeight: 1.6 }}>
            Go to Settings → Competitors, add competitor Instagram handles, then hit Refresh Stats in the Overview tab.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen pb-24">
      <CompetitorSubNav />
      <div className="px-6 max-w-[1200px] 2xl:max-w-[min(92vw,1700px)] mx-auto mt-[18px] space-y-8">

        {/* ── ZONE 1: OUR POSITION ─────────────────────────────────────── */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#0066cc]" />
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK_4, margin: 0 }}>Zone 1 — Market Position</p>
          </div>

          {kpis.length > 0 && (
            <div className="grid grid-cols-4 gap-4">
              {kpis.map(k => (
                <div key={k.label} style={{ ...G4, padding: 24 }}>
                  <div className="flex items-center justify-between mb-3">
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: I4d, margin: 0 }}>{k.label}</p>
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: I4d }}>{k.icon}</span>
                  </div>
                  <p style={{ fontFamily: 'ui-monospace,"Geist Mono",monospace', fontSize: 32, fontWeight: 700, letterSpacing: '-0.04em', color: I4, margin: '0 0 8px', lineHeight: 1 }}>
                    {k.value}<span style={{ fontSize: 16, fontWeight: 500, color: I4d }}>{k.unit}</span>
                  </p>
                  <div className={`flex items-center gap-1 text-[11px] font-bold ${k.up === true ? 'text-emerald-600' : k.up === false ? 'text-rose-500' : ''}`}
                    style={k.up === null ? { color: I4d } : {}}>
                    <span className="material-symbols-outlined text-[13px]">
                      {k.up === true ? 'trending_up' : k.up === false ? 'trending_down' : 'horizontal_rule'}
                    </span>
                    {k.delta}
                  </div>
                </div>
              ))}
            </div>
          )}

          {competitors.length > 0 && (
            <div style={{ ...G1, overflow: 'hidden' }}>
              <div className="px-6 pt-5 pb-3 flex items-center justify-between">
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: I1d, margin: '0 0 4px' }}>Live Data</p>
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: I1, letterSpacing: '-0.02em', margin: 0 }}>Competitor Landscape</h2>
                </div>
                <span style={{ fontSize: 11, color: I1d }}>{competitors.length} tracked · Score · ER · SoV</span>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr style={{ borderTop: `1px solid ${L1}` }}>
                    {['Brand', 'Tier', 'Followers', 'Eng. Rate', 'Share of Voice', 'Score', 'Trend'].map(h => (
                      <th key={h} className="px-5 py-3" style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: I1d }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...competitors].sort((a, b) => b.engagementRate - a.engagementRate).map(c => (
                    <tr key={c.name} style={{ borderTop: `1px solid ${L1}` }} className="hover:bg-black/[0.03] transition-colors">
                      <td className="px-5 py-3.5" style={{ fontSize: 13, fontWeight: 600, color: I1 }}>{c.name}</td>
                      <td className="px-5 py-3.5">
                        <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', padding: '2px 7px', borderRadius: 4,
                          background: c.tier === 'benchmark' ? 'rgba(37,99,235,0.10)' : c.tier === 'anchor' ? 'rgba(251,191,36,0.12)' : 'rgba(245,158,11,0.10)',
                          color: c.tier === 'benchmark' ? '#2563eb' : c.tier === 'anchor' ? '#d97706' : '#f59e0b' }}>
                          {c.tier}
                        </span>
                      </td>
                      <td className="px-5 py-3.5" style={{ fontFamily: 'ui-monospace,monospace', fontSize: 13, color: I1c }}>{c.followers > 0 ? fmtN(c.followers) : '—'}</td>
                      <td className="px-5 py-3.5" style={{ fontFamily: 'ui-monospace,monospace', fontSize: 13, fontWeight: 700, color: c.engagementRate >= 0.01 ? '#059669' : c.engagementRate >= 0.005 ? '#d97706' : I1d }}>
                        {c.engagementRate > 0 ? (c.engagementRate * 100).toFixed(2) + '%' : '—'}
                      </td>
                      <td className="px-5 py-3.5" style={{ fontFamily: 'ui-monospace,monospace', fontSize: 13, color: I1c }}>{c.sov}</td>
                      <td className="px-5 py-3.5">
                        <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 13, fontWeight: 800, color: c.score >= 60 ? '#059669' : c.score >= 30 ? '#d97706' : I1d }}>{c.score}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="material-symbols-outlined text-[16px]" style={{ color: c.score >= 50 ? '#059669' : c.dashed ? I1d : '#d97706' }}>
                          {c.score >= 50 ? 'trending_up' : c.dashed ? 'remove' : 'trending_flat'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── ZONE 2: ACTIVITY ─────────────────────────────────────────── */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK_4, margin: 0 }}>Zone 2 — Competitor Activity</p>
          </div>

          {signals.length > 0 && (
            <section style={{ ...G3, overflow: 'hidden' }}>
              {signals.map((s, idx) => {
                const dotCls = s.severity === 'red' ? 'bg-red-400' : s.severity === 'green' ? 'bg-emerald-400' : 'bg-amber-400'
                const textCls = s.severity === 'red' ? 'text-red-400' : s.severity === 'green' ? 'text-emerald-400' : 'text-amber-400'
                const borderCls = s.severity === 'red' ? 'border-red-400/20 bg-red-400/5' : s.severity === 'green' ? 'border-emerald-400/20 bg-emerald-400/5' : 'border-amber-400/20 bg-amber-400/5'
                return (
                  <div key={s.id} className="flex items-center justify-between px-6 py-4 gap-6"
                    style={{ borderTop: idx > 0 ? '1px solid rgba(241,245,251,0.07)' : 'none' }}>
                    <div className="flex items-center gap-4">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotCls}`} />
                      <p style={{ fontSize: 13, lineHeight: 1.55, color: I3c, margin: 0 }}>{s.text}</p>
                    </div>
                    <button className={`flex-shrink-0 border rounded-full px-4 py-1.5 transition-all hover:opacity-80 active:scale-95 ${textCls} ${borderCls}`}
                      style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                      {s.cta}
                    </button>
                  </div>
                )
              })}
            </section>
          )}

          <section className="grid grid-cols-12 gap-6">
            {/* Recent Posts Feed */}
            <div className="col-span-4" style={{ ...G3, overflow: 'hidden' }}>
              <div className="px-5 pt-5 pb-3">
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: I3d, margin: '0 0 4px' }}>Instagram · Live</p>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: '#f1f5fb', letterSpacing: '-0.02em', margin: 0 }}>Recent Competitor Posts</h2>
              </div>
              {contentFeed.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <p style={{ fontSize: 13, color: I3d, lineHeight: 1.6 }}>No posts yet. Run Refresh Stats in the Overview tab to scrape competitor profiles.</p>
                </div>
              ) : (
                contentFeed.slice(0, 7).map(post => (
                  <div key={post.id} className="px-5 py-4 hover:bg-white/5 transition-colors cursor-pointer"
                    style={{ borderTop: '1px solid rgba(241,245,251,0.07)' }}
                    onClick={() => window.open(post.url, '_blank', 'noreferrer')}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span style={{
                        fontSize: 9, fontWeight: 700, textTransform: 'uppercase', padding: '1px 7px', borderRadius: 999,
                        background: post.type === 'reel' ? 'rgba(0,102,204,0.22)' : post.type === 'carousel' ? 'rgba(245,158,11,0.18)' : 'rgba(241,245,251,0.08)',
                        color: post.type === 'reel' ? '#5ba8ff' : post.type === 'carousel' ? '#fbbf24' : I3d,
                      }}>{post.type}</span>
                      <span style={{ fontSize: 11, color: I3d }}>{timeAgo(post.capturedAt)}</span>
                    </div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#f1f5fb', margin: '0 0 2px' }}>{post.brandName}</p>
                    <p style={{ fontSize: 11, color: I3c, margin: '0 0 5px', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {post.caption || 'No caption'}
                    </p>
                    <div style={{ display: 'flex', gap: 10, fontSize: 10, color: I3d }}>
                      {post.likes > 0 && <span>❤ {fmtN(post.likes)}</span>}
                      {post.views > 0 && <span>👁 {fmtN(post.views)}</span>}
                      {post.comments > 0 && <span>💬 {fmtN(post.comments)}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Competitor Momentum Table */}
            <div className="col-span-8 flex flex-col gap-6">
              <div style={{ ...G1, overflow: 'hidden' }}>
                <div className="px-6 pt-5 pb-3">
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: I1d, margin: '0 0 4px' }}>Real Data</p>
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: I1, letterSpacing: '-0.02em', margin: 0 }}>Competitive Momentum</h2>
                </div>
                <table className="w-full text-left">
                  <thead>
                    <tr style={{ borderTop: `1px solid ${L1}` }}>
                      {['Brand', 'Eng. Rate', 'Followers', 'Score', 'Posts in Feed', 'Signal'].map(h => (
                        <th key={h} className="px-5 py-3" style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: I1d }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...competitors].sort((a, b) => b.score - a.score).map(c => {
                      const postCount = contentFeed.filter(p =>
                        p.brandName === c.name ||
                        (c.handle && (p.handle === c.handle || p.handle?.includes(c.handle.replace(/^@/, '')) || c.handle.includes(p.handle?.replace(/^@/, '') ?? '')))
                      ).length
                      return (
                        <tr key={c.name} style={{ borderTop: `1px solid ${L1}` }} className="hover:bg-black/[0.03] transition-colors">
                          <td className="px-5 py-3.5" style={{ fontSize: 13, fontWeight: 600, color: I1 }}>{c.name}</td>
                          <td className="px-5 py-3.5" style={{ fontFamily: 'ui-monospace,monospace', fontSize: 13, fontWeight: 700, color: c.engagementRate >= 0.01 ? '#059669' : c.engagementRate > 0 ? '#d97706' : I1d }}>
                            {c.engagementRate > 0 ? (c.engagementRate * 100).toFixed(2) + '%' : '—'}
                          </td>
                          <td className="px-5 py-3.5" style={{ fontFamily: 'ui-monospace,monospace', fontSize: 13, color: I1c }}>{c.followers > 0 ? fmtN(c.followers) : '—'}</td>
                          <td className="px-5 py-3.5">
                            <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 13, fontWeight: 800, color: c.score >= 60 ? '#059669' : c.score >= 30 ? '#d97706' : I1d }}>{c.score}</span>
                          </td>
                          <td className="px-5 py-3.5" style={{ fontSize: 13, color: I1c }}>{postCount > 0 ? `${postCount} posts` : '—'}</td>
                          <td className="px-5 py-3.5">
                            <span className="material-symbols-outlined text-[16px]" style={{ color: c.score >= 50 ? '#059669' : '#d97706' }}>
                              {c.score >= 50 ? 'trending_up' : 'trending_flat'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Platform Monitoring — venture-scoped */}
              <div style={{ ...G2, padding: 22 }}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: ACCENT }}>radar</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: I2 }}>Platforms Being Monitored</span>
                </div>
                {connectedPlatforms.size === 0 ? (
                  <p style={{ fontSize: 12, color: I2d, margin: 0, lineHeight: 1.6 }}>
                    No social accounts connected. Add them in Settings → Venture to enable platform tracking.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-3 mb-3">
                    {Array.from(connectedPlatforms).map(platform => {
                      const hasData = platform === 'instagram' && contentFeed.length > 0
                      return (
                        <div key={platform} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20,
                          background: hasData ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.06)',
                          border: `1px solid ${hasData ? 'rgba(255,255,255,0.32)' : 'rgba(255,255,255,0.12)'}` }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 14, color: hasData ? I2 : I2d }}>
                            {PLATFORM_ICON[platform] ?? 'public'}
                          </span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: hasData ? I2 : I2d, textTransform: 'capitalize' }}>{platform}</span>
                          <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.10em',
                            color: hasData ? '#34d399' : I2d,
                            background: hasData ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.08)',
                            padding: '1px 6px', borderRadius: 999 }}>{hasData ? 'Live' : 'Coming soon'}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
                <p style={{ fontSize: 11, color: I2d, margin: 0, lineHeight: 1.55 }}>
                  Competitor scraping is Instagram-only (via Apify). Other platform analysis coming in a future update.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* ── ZONE 3: TOP PERFORMING POSTS ─────────────────────────── */}
        {sortedByEng.length > 0 && (
          <section>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK_4, margin: '0 0 16px' }}>
              Top Performing Posts · Sorted by Engagement
            </p>
            <div className="flex flex-col gap-4">
              {sortedByEng.slice(0, 6).map((post, i) => (
                <div key={post.id} style={{ ...G1, overflow: 'hidden' }} className="flex items-stretch">

                  {/* ── Media preview ── */}
                  <div className="relative flex-shrink-0 w-[160px] bg-black/10"
                    style={{ minHeight: 160, borderRight: `1px solid ${L1}` }}>
                    {post.displayUrl ? (
                      <img
                        src={post.displayUrl}
                        alt={post.caption?.slice(0, 60) || post.type}
                        className="w-full h-full object-cover"
                        style={{ minHeight: 160, maxHeight: 220, display: 'block' }}
                        onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2" style={{ minHeight: 160 }}>
                        <span className="material-symbols-outlined text-[32px]" style={{ color: 'rgba(0,102,204,0.25)' }}>
                          {post.type === 'reel' ? 'play_circle' : post.type === 'carousel' ? 'view_carousel' : 'photo_camera'}
                        </span>
                        <span style={{ fontSize: 9, color: 'rgba(0,102,204,0.30)', fontWeight: 700, textTransform: 'uppercase' }}>No preview</span>
                      </div>
                    )}
                    {/* Type badge */}
                    <div className="absolute top-2 left-2">
                      <span style={{
                        fontSize: 8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.10em',
                        padding: '2px 7px', borderRadius: 999,
                        background: 'rgba(0,0,0,0.68)', backdropFilter: 'blur(8px)',
                        color: post.type === 'reel' ? '#5ba8ff' : post.type === 'carousel' ? '#fbbf24' : 'rgba(255,255,255,0.80)',
                      }}>
                        {post.type === 'reel' ? '▶ Reel' : post.type === 'carousel' ? '⊞ Carousel' : '◻ Static'}
                      </span>
                    </div>
                    {/* Play overlay for reels */}
                    {post.type === 'reel' && post.displayUrl && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ background: 'rgba(0,0,0,0.52)', backdropFilter: 'blur(4px)' }}>
                          <span className="material-symbols-outlined text-[20px] text-white" style={{ marginLeft: 2 }}>play_arrow</span>
                        </div>
                      </div>
                    )}
                    {/* Carousel dots */}
                    {post.type === 'carousel' && post.images.length > 1 && (
                      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                        {post.images.slice(0, 5).map((_, idx) => (
                          <div key={idx} className="w-1.5 h-1.5 rounded-full"
                            style={{ background: idx === 0 ? '#fff' : 'rgba(255,255,255,0.42)' }} />
                        ))}
                      </div>
                    )}
                    {/* Rank badge */}
                    <div className="absolute bottom-2 right-2">
                      <span style={{
                        fontFamily: 'ui-monospace,monospace', fontSize: 10, fontWeight: 800,
                        padding: '2px 7px', borderRadius: 6,
                        background: 'rgba(0,0,0,0.65)', color: 'rgba(255,255,255,0.72)',
                        backdropFilter: 'blur(6px)',
                      }}>#{i + 1}</span>
                    </div>
                  </div>

                  {/* ── Content panel ── */}
                  <div className="flex flex-col justify-between flex-1 min-w-0 p-5 gap-3">
                    {/* Header */}
                    <div>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span style={{ fontSize: 13, fontWeight: 700, color: I1 }}>{post.brandName}</span>
                        <span style={{ color: I1d }}>·</span>
                        <span style={{ fontSize: 12, color: I1c }}>Instagram</span>
                        {post.publishedAt && (
                          <>
                            <span style={{ color: I1d }}>·</span>
                            <span style={{ fontSize: 11, color: I1d }}>{timeAgo(post.publishedAt)}</span>
                          </>
                        )}
                      </div>
                      <p style={{ fontSize: 13, color: I1c, margin: 0, lineHeight: 1.55, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                        {post.caption || 'No caption available'}
                      </p>
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {[
                        { icon: 'favorite', label: 'Likes', value: post.likes, color: '#ef4444', show: post.likes > 0 },
                        { icon: 'chat_bubble', label: 'Comments', value: post.comments, color: ACCENT, show: post.comments > 0 },
                        { icon: 'visibility', label: 'Views', value: post.views, color: '#8b5cf6', show: post.views > 0 },
                        { icon: 'share', label: 'Shares', value: post.shares, color: '#059669', show: post.shares > 0 },
                      ].filter(m => m.show).map(m => (
                        <div key={m.label} style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          background: L1, borderRadius: 8, padding: '6px 12px',
                        }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 13, color: m.color }}>{m.icon}</span>
                          <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 14, fontWeight: 700, color: I1 }}>{fmtN(m.value)}</span>
                          <span style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: I1d }}>{m.label}</span>
                        </div>
                      ))}
                      {post.engagement > 0 && (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          background: 'rgba(0,102,204,0.08)', borderRadius: 8, padding: '6px 12px',
                          border: '1px solid rgba(0,102,204,0.14)',
                        }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 13, color: ACCENT }}>ads_click</span>
                          <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 14, fontWeight: 700, color: ACCENT }}>{fmtN(post.engagement)}</span>
                          <span style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: I1d }}>Total Eng.</span>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <a href={post.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:underline" style={{ fontSize: 11, color: ACCENT }}>
                        <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                        View on Instagram
                      </a>
                      <button
                        onClick={() => router.push(`/screens/war-room?q=${encodeURIComponent(`Competitor insight: ${post.brandName} posted "${post.caption?.slice(0, 120) ?? 'a post'}" on Instagram — ${fmtN(post.engagement)} engagement${post.views > 0 ? `, ${fmtN(post.views)} views` : ''}. Brief a response strategy for our brand.`)}`)}
                        style={{ background: ACCENT, color: '#fff', fontSize: 12, fontWeight: 700, padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer' }}
                        className="hover:bg-[#0055bb] active:scale-95 transition-all">
                        Respond
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Recommended Actions from Signals ───────────────────── */}
        {signals.length > 0 && (
          <section>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK_4, margin: '0 0 16px' }}>Recommended Actions</p>
            <div style={{ ...G1, overflow: 'hidden' }}>
              {signals.slice(0, 4).map((s, idx) => (
                <div key={s.id} className="flex items-start justify-between px-6 py-5 hover:bg-black/[0.03] transition-colors"
                  style={{ borderTop: idx > 0 ? `1px solid ${L1}` : 'none' }}>
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0 mt-0.5"
                      style={{
                        background: s.severity === 'red' ? 'rgba(239,68,68,0.10)' : s.severity === 'green' ? 'rgba(5,150,105,0.10)' : 'rgba(245,158,11,0.10)',
                        color: s.severity === 'red' ? '#ef4444' : s.severity === 'green' ? '#059669' : '#f59e0b',
                      }}>{idx + 1}</div>
                    <p style={{ fontSize: 13, color: I1, margin: 0, lineHeight: 1.6 }}>{s.text}</p>
                  </div>
                  <button
                    onClick={() => router.push(`/screens/war-room?q=${encodeURIComponent(s.text)}`)}
                    style={{ background: ACCENT, color: '#fff', fontSize: 11, fontWeight: 700, padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', flexShrink: 0, marginLeft: 16 }}
                    className="active:scale-95">
                    Brief War Room
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── What changed (folded-in Alerts) ──────────────────────── */}
        <section className="pt-2">
          <div className="flex items-center gap-2 mb-4" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK_4 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14, color: ACCENT }}>notifications_active</span>
            What changed · Alerts
          </div>
          <AlertsSection ventureSlug={ventureSlug} />
        </section>

        <footer className="border-t flex items-center justify-between py-6" style={{ borderColor: L1 }}>
          <p style={{ fontSize: 11, color: INK_4 }}>© 2026 YVON Intelligence. Built for Excellence.</p>
          <div className="flex items-center gap-5">
            {['Privacy', 'Terms', 'Support'].map(l => (
              <a key={l} href="#" style={{ fontSize: 11, color: INK_4 }} className="hover:opacity-70 transition-opacity">{l}</a>
            ))}
          </div>
        </footer>

      </div>
    </main>
  )
}
