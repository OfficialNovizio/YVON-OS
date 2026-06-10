'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import CompetitorSubNav from '../_subnav'
import { useVentureSlug } from '@/lib/use-venture-slug'
import { getCached, setCache } from '@/lib/session-cache'

import { G1, G4, I1, I1c, I1d, I4, I4d, L1, ACCENT, GREEN, AMBER, RED, INK_4, W_MUTED, G2_ALT, G3_ALT } from '../_glass-tokens'

type ReportPeriod = 'weekly' | 'monthly'

interface Competitor {
  name: string; sov: string; score: number; engagementRate: number
  tier: string; followers: number; handle: string | null
}
interface ContentPost {
  id: string; brandName: string; caption: string; type: string
  engagement: number; likes: number; views: number; url: string; capturedAt: string
}
interface Signal {
  id: string; severity: 'red' | 'amber' | 'green'; text: string; cta: string
}
interface IntelData {
  signals: Signal[]
  kpis: Array<{ label: string; value: string; unit: string }>
  competitors: Competitor[]
  contentFeed: ContentPost[]
  activityTimeline: Array<{ brandName: string; capturedAt: string; trendingCount: number; compositeScore: number }>
  lastRefreshed: string | null
}

function fmtN(n: number) {
  return n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'M' : n >= 1_000 ? Math.round(n / 1_000) + 'K' : String(n)
}
function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function CompetitorReportsPage() {
  const router = useRouter()
  const ventureSlug = useVentureSlug()
  const [period, setPeriod] = useState<ReportPeriod>('weekly')
  const [liveData, setLiveData] = useState<IntelData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ventureSlug) return
    const cacheKey = `reports-intel-${ventureSlug}`
    const cached = getCached<IntelData>(cacheKey)
    if (cached) { setLiveData(cached); setLoading(false); return }

    setLoading(true)
    fetch(`/api/competitor-content-intel?venture=${ventureSlug}`)
      .then(r => r.json())
      .then(d => { setLiveData(d as IntelData); setCache(cacheKey, d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [ventureSlug])

  const competitors = liveData?.competitors ?? []
  const contentFeed = liveData?.contentFeed ?? []
  const signals = liveData?.signals ?? []
  const hasData = competitors.length > 0

  const sortedByScore = [...competitors].sort((a, b) => b.score - a.score)
  const topPerformer = sortedByScore[0]
  const topPosts = [...contentFeed].sort((a, b) => b.engagement - a.engagement).slice(0, 3)
  const totalTracked = competitors.length
  const criticalSignals = signals.filter(s => s.severity === 'red').length

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

  return (
    <main className="min-h-screen pb-24">
      <CompetitorSubNav />
      <div className="px-6 max-w-[1200px] 2xl:max-w-[min(92vw,1700px)] mx-auto mt-[18px] space-y-8">

        {/* ── Period Toggle ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK_4, margin: '0 0 6px' }}>Competitive Reports · Real Data</p>
            <p style={{ fontSize: 13, color: I1d, margin: 0 }}>
              {hasData
                ? `${totalTracked} competitor${totalTracked !== 1 ? 's' : ''} tracked · Last refreshed ${fmtDate(liveData?.lastRefreshed ?? null)}`
                : 'No competitor data. Add competitors in Settings.'}
            </p>
          </div>
          <div className="flex items-center gap-1.5 p-1.5"
            style={{ background: 'rgba(8,16,36,0.58)', backdropFilter: 'blur(28px) saturate(160%)', WebkitBackdropFilter: 'blur(28px) saturate(160%)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 999 }}>
            {(['weekly', 'monthly'] as ReportPeriod[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className="px-5 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-[0.18em] transition-all duration-200 active:scale-95"
                style={{ color: period === p ? '#0c0d10' : 'rgba(220,228,248,0.45)', background: period === p ? 'rgba(255,255,255,0.92)' : 'transparent', border: 'none', cursor: 'pointer' }}>
                {p === 'weekly' ? 'This Week' : 'This Month'}
              </button>
            ))}
          </div>
        </div>

        {!hasData ? (
          <div style={{ ...G1, padding: 48 }} className="flex flex-col items-center gap-4 text-center">
            <span className="material-symbols-outlined text-[48px]" style={{ color: 'rgba(0,0,0,0.12)' }}>analytics</span>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: I1 }}>No Report Data Yet</h2>
            <p style={{ fontSize: 14, color: I1d, maxWidth: 400, lineHeight: 1.6 }}>
              Add competitor Instagram handles in Settings → Competitors, then run Refresh Stats to generate a real competitive report.
            </p>
          </div>
        ) : (
          <>
            {/* ── Report Header ─────────────────────────────────────── */}
            <div style={{ ...G3_ALT, padding: '28px 32px' }} className="flex items-center justify-between">
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: W_MUTED, margin: '0 0 8px' }}>
                  <span className="w-1.5 h-1.5 rounded-full inline-block mr-2 align-middle" style={{ background: GREEN }} />
                  {period === 'weekly' ? 'Weekly' : 'Monthly'} Competitive Brief — as of {fmtDate(liveData?.lastRefreshed ?? null)}
                </p>
                <h2 style={{ fontSize: 26, fontWeight: 700, color: '#fff', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
                  {topPerformer ? `${topPerformer.name} leads with ${(topPerformer.engagementRate * 100).toFixed(2)}% engagement.` : 'No data yet.'}
                  {criticalSignals > 0 ? ` ${criticalSignals} critical signal${criticalSignals !== 1 ? 's' : ''} detected.` : ''}
                </h2>
                <p style={{ fontSize: 13, color: W_MUTED, margin: 0, lineHeight: 1.6 }}>
                  {totalTracked} competitors tracked on Instagram. {topPosts.length > 0 ? `${topPosts.length} top-performing posts analysed.` : ''}
                </p>
              </div>
              <div className="flex flex-col gap-2 flex-shrink-0 ml-8">
                {[
                  { label: 'Brands Tracked', value: String(totalTracked), color: '#fff' },
                  { label: 'Critical Signals', value: String(criticalSignals), color: criticalSignals > 0 ? RED : '#fff' },
                  { label: 'Posts Analyzed', value: String(contentFeed.length), color: GREEN },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between gap-6">
                    <span style={{ fontSize: 11, color: W_MUTED, fontWeight: 600 }}>{s.label}</span>
                    <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Market Position ───────────────────────────────────── */}
            <section>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK_4, margin: '0 0 16px' }}>
                Competitor Market Position — Real Data
              </p>
              <div style={{ ...G1, padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${L1}` }}>
                      {['Rank', 'Brand', 'Tier', 'Followers', 'Eng. Rate', 'Share of Voice', 'Score', 'Status'].map(h => (
                        <th key={h} style={{ padding: '14px 18px', textAlign: 'left', fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: I1d }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedByScore.map((c, i) => {
                      const scoreColor = c.score >= 60 ? GREEN : c.score >= 30 ? AMBER : I1d
                      const verdict = c.score >= 60 ? 'High threat — active' : c.score >= 30 ? 'Watch — moderate' : 'Stable — low activity'
                      const verdictColor = c.score >= 60 ? RED : c.score >= 30 ? AMBER : I1d
                      return (
                        <tr key={c.name} style={{ borderBottom: i < sortedByScore.length - 1 ? `1px solid ${L1}` : 'none' }}>
                          <td style={{ padding: '14px 18px' }}>
                            <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 13, fontWeight: 700, color: i === 0 ? AMBER : I1d }}>
                              #{i + 1}
                            </span>
                          </td>
                          <td style={{ padding: '14px 18px', fontSize: 13, fontWeight: 700, color: I1 }}>{c.name}</td>
                          <td style={{ padding: '14px 18px' }}>
                            <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', padding: '2px 6px', borderRadius: 4,
                              background: c.tier === 'benchmark' ? 'rgba(37,99,235,0.10)' : 'rgba(245,158,11,0.10)',
                              color: c.tier === 'benchmark' ? '#2563eb' : '#f59e0b' }}>{c.tier}</span>
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            <div className="flex items-center gap-2">
                              <div style={{ height: 3, background: L1, borderRadius: 999, width: 60, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${Math.min((c.followers / (sortedByScore[0]?.followers || 1)) * 100, 100)}%`, background: I1d, borderRadius: 999 }} />
                              </div>
                              <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 12, color: I1 }}>{c.followers > 0 ? fmtN(c.followers) : '—'}</span>
                            </div>
                          </td>
                          <td style={{ padding: '14px 18px', fontFamily: 'ui-monospace,monospace', fontSize: 13, fontWeight: 700, color: c.engagementRate >= 0.01 ? GREEN : c.engagementRate > 0 ? AMBER : I1d }}>
                            {c.engagementRate > 0 ? (c.engagementRate * 100).toFixed(2) + '%' : '—'}
                          </td>
                          <td style={{ padding: '14px 18px', fontFamily: 'ui-monospace,monospace', fontSize: 13, color: I1c }}>{c.sov}</td>
                          <td style={{ padding: '14px 18px' }}>
                            <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 13, fontWeight: 800, color: scoreColor }}>{c.score}</span>
                          </td>
                          <td style={{ padding: '14px 18px', fontSize: 11, color: verdictColor, fontWeight: 500 }}>{verdict}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* ── Top Competitor Posts This Period ─────────────────── */}
            {topPosts.length > 0 && (
              <section>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK_4, margin: '0 0 16px' }}>
                  Top Competitor Posts — Highest Engagement
                </p>
                <div className="flex flex-col gap-3">
                  {topPosts.map((post, i) => {
                    const borderColor = i === 0 ? RED : i === 1 ? AMBER : I1d
                    return (
                      <div key={post.id} style={{ ...G1, padding: '18px 22px', borderLeft: `4px solid ${borderColor}` }}
                        className="flex items-start gap-4">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: L1 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 18, color: I1d }}>
                            {post.type === 'reel' ? 'play_circle' : post.type === 'carousel' ? 'view_carousel' : 'photo_camera'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: I1d }}>{post.brandName}</span>
                            <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.16em', padding: '2px 8px', borderRadius: 999, color: borderColor,
                              background: i === 0 ? 'rgba(220,38,38,0.10)' : i === 1 ? 'rgba(217,119,6,0.10)' : L1 }}>
                              #{i + 1} · {fmtN(post.engagement)} engagement
                            </span>
                          </div>
                          <p style={{ fontSize: 13, color: I1, margin: '0 0 6px', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                            {post.caption || 'No caption available'}
                          </p>
                          <div className="flex items-center gap-3">
                            {post.likes > 0 && <span style={{ fontSize: 11, color: I1d }}>❤ {fmtN(post.likes)}</span>}
                            {post.views > 0 && <span style={{ fontSize: 11, color: I1d }}>👁 {fmtN(post.views)}</span>}
                            <a href={post.url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: ACCENT, marginLeft: 4 }}>View →</a>
                          </div>
                        </div>
                        <button
                          onClick={() => router.push(`/screens/war-room?q=${encodeURIComponent(`Competitor post by ${post.brandName}: "${post.caption?.slice(0, 100) ?? 'post'}". Engagement: ${fmtN(post.engagement)}. Create a response strategy brief.`)}`)}
                          style={{ background: ACCENT, color: '#fff', fontSize: 11, fontWeight: 700, padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', flexShrink: 0 }}
                          className="active:scale-95">
                          Respond
                        </button>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* ── Signals Summary ──────────────────────────────────── */}
            {signals.length > 0 && (
              <section>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK_4, margin: '0 0 16px' }}>
                  Active Signals Referenced in This Report
                </p>
                <div style={{ ...G1, padding: '16px 22px' }}>
                  <div className="flex flex-col gap-3">
                    {signals.slice(0, 5).map((s, i) => {
                      const dotColor = s.severity === 'red' ? RED : s.severity === 'green' ? GREEN : AMBER
                      return (
                        <div key={s.id} className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: dotColor }} />
                            <span style={{ fontSize: 12, color: I1c }}>{s.text}</span>
                          </div>
                          <button
                            onClick={() => router.push(`/screens/war-room?q=${encodeURIComponent(s.text)}`)}
                            style={{ fontSize: 11, fontWeight: 600, color: ACCENT, background: 'rgba(0,102,204,0.06)', border: 'none', cursor: 'pointer', padding: '2px 8px', borderRadius: 6, flexShrink: 0 }}
                            className="hover:opacity-70 transition-opacity">
                            {s.cta}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </section>
            )}

            {/* ── Monthly Summary ───────────────────────────────────── */}
            {period === 'monthly' && (
              <div style={{ ...G4, padding: '24px 28px' }}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(42,18,64,0.12)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20, color: I4 }}>auto_awesome</span>
                  </div>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.16em', color: I4d, margin: '0 0 6px' }}>Kai · Monthly Summary</p>
                    <p style={{ fontSize: 14, fontWeight: 500, color: I4, lineHeight: 1.7, margin: '0 0 12px' }}>
                      {topPerformer
                        ? `${topPerformer.name} leads with a score of ${topPerformer.score}/100 and ${(topPerformer.engagementRate * 100).toFixed(2)}% engagement. ${totalTracked} competitor${totalTracked !== 1 ? 's' : ''} tracked. ${criticalSignals > 0 ? `${criticalSignals} critical signal${criticalSignals !== 1 ? 's' : ''} require immediate response.` : 'No critical signals this period.'}`
                        : 'Add competitors in Settings to generate a monthly summary.'}
                    </p>
                    <button
                      onClick={() => router.push(`/screens/war-room?q=${encodeURIComponent(`Monthly competitive report: ${totalTracked} competitors tracked. Top performer: ${topPerformer?.name ?? 'unknown'} with ${(topPerformer?.engagementRate ?? 0 * 100).toFixed(2)}% ER and score ${topPerformer?.score ?? 0}. Create a monthly competitive strategy brief.`)}`)}
                      style={{ background: I4, color: '#fff', fontSize: 12, fontWeight: 700, padding: '9px 16px', borderRadius: 10, border: 'none', cursor: 'pointer' }}
                      className="active:scale-95">
                      Brief Strategy Team
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

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
