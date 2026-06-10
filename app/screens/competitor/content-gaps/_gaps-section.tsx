'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useVentureSlug } from '@/lib/use-venture-slug'
import { getCached, setCache } from '@/lib/session-cache'

import { G1, G3, G4, I1, I1c, I1d, I3c, I3d, I4, I4d, L1, ACCENT, INK_4 } from '../_glass-tokens'

interface GapEntry {
  brandName: string; tier: string; score: number
  followers: number; followerDelta: number
  engagementRate: number; engagementDelta: number
  lastChecked: string
}
interface GapData {
  gaps: GapEntry[]
  benchmarks: { avgEngagementRate: number; avgFollowers: number }
  message: string | null
}

function fmtN(n: number) {
  return n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'M' : n >= 1_000 ? Math.round(n / 1_000) + 'K' : String(n)
}

export function GapsSection({ ventureSlug }: { ventureSlug: string }) {
  const router = useRouter()
  const [liveGaps, setLiveGaps] = useState<GapData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ventureSlug) return
    const cacheKey = `content-gaps-${ventureSlug}`
    const cached = getCached<GapData>(cacheKey)
    if (cached) { setLiveGaps(cached); setLoading(false); return }

    setLoading(true)
    fetch(`/api/competitor-gaps?venture=${ventureSlug}`)
      .then(r => r.json())
      .then(d => { setLiveGaps(d as GapData); setCache(cacheKey, d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [ventureSlug])

  const gaps = liveGaps?.gaps ?? []
  const benchmarks = liveGaps?.benchmarks
  const hasData = gaps.length > 0 && gaps.some(g => g.engagementRate > 0 || g.followers > 0)

  if (loading && !liveGaps) {
    return (
      <div className="flex items-center justify-center py-32">
        <span className="material-symbols-outlined animate-spin text-[36px]" style={{ color: 'rgba(0,0,0,0.15)' }}>refresh</span>
      </div>
    )
  }

  // Sort: highest ER first (biggest "gap" = highest performing competitor)
  const sortedGaps = [...gaps].sort((a, b) => b.engagementRate - a.engagementRate)
  const topCompetitor = sortedGaps[0]
  const highPriority = sortedGaps.filter(g => g.engagementRate > (benchmarks?.avgEngagementRate ?? 0))
  const gapCount = highPriority.length

  return (
    <div className="space-y-8">

        {/* ── Hero ───────────────────────────────────────────────────── */}
        <section style={{ ...G3, padding: 40 }}>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: ACCENT }} />
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.22em', color: I3d, margin: 0 }}>Gap Analysis · Real Data</p>
          </div>
          <h2 style={{ fontSize: 36, fontWeight: 700, color: '#f1f5fb', letterSpacing: '-0.025em', lineHeight: 1.1, margin: '0 0 12px' }}>
            {hasData ? `${gaps.length} competitor${gaps.length !== 1 ? 's' : ''} tracked. ${gapCount} outperforming benchmark.` : 'No competitor data yet.'}
          </h2>
          <p style={{ fontSize: 16, color: I3c, lineHeight: 1.5, margin: '0 0 24px' }}>
            {hasData
              ? `Average engagement across all tracked competitors: ${benchmarks?.avgEngagementRate?.toFixed(2) ?? '—'}%. Gaps show where competitors out-perform the group average.`
              : 'Add competitor Instagram handles in Settings → Competitors, then hit Refresh Stats.'}
          </p>
          {hasData && (
            <div className="flex flex-wrap gap-3">
              {[
                { icon: 'radar', label: `${gaps.length} Competitors Tracked`, accent: false },
                { icon: 'warning', label: `${gapCount} Above Average ER`, accent: gapCount > 0 },
                { icon: 'trending_up', label: `Avg ER: ${benchmarks?.avgEngagementRate?.toFixed(2) ?? '—'}%`, accent: false },
              ].map(t => (
                <div key={t.label} className="flex items-center gap-2 rounded-full px-4 py-2"
                  style={{ background: t.accent ? `${ACCENT}25` : 'rgba(241,245,251,0.08)', border: `1px solid ${t.accent ? `${ACCENT}40` : 'rgba(241,245,251,0.12)'}` }}>
                  <span className="material-symbols-outlined text-[14px]" style={{ color: t.accent ? '#5ba8ff' : I3d }}>{t.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: t.accent ? '#5ba8ff' : I3c }}>{t.label}</span>
                </div>
              ))}
            </div>
          )}
          {hasData && (
            <div className="mt-6">
              <button
                onClick={() => router.push(`/screens/war-room?q=${encodeURIComponent(`Content gap analysis: We track ${gaps.length} competitors with avg ${benchmarks?.avgEngagementRate?.toFixed(2)}% engagement. Top performer is ${topCompetitor?.brandName} at ${topCompetitor?.engagementRate?.toFixed(2)}%. Generate a response plan to close these gaps.`)}`)}
                className="flex items-center gap-2 rounded-full px-7 py-3.5 hover:opacity-90 active:scale-95 transition-all"
                style={{ background: ACCENT, color: '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                Generate Response Plan
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          )}
        </section>

        {!hasData && liveGaps?.message && (
          <div style={{ ...G1, padding: 32 }} className="text-center">
            <p style={{ fontSize: 14, color: I1d, margin: 0 }}>{liveGaps.message}</p>
          </div>
        )}

        {hasData && <>
          {/* ── Benchmarks ────────────────────────────────────────────── */}
          <section>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK_4, margin: '0 0 16px' }}>Market Benchmarks</p>
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Avg Engagement Rate', value: benchmarks?.avgEngagementRate?.toFixed(2) + '%', icon: 'favorite', color: I4 },
                { label: 'Avg Followers',         value: fmtN(benchmarks?.avgFollowers ?? 0),          icon: 'group',    color: I4 },
                { label: 'Top Performer',          value: topCompetitor?.brandName ?? '—',              icon: 'star',     color: ACCENT },
                { label: 'Top Performer ER',       value: topCompetitor ? topCompetitor.engagementRate.toFixed(2) + '%' : '—', icon: 'trending_up', color: '#059669' },
              ].map(k => (
                <div key={k.label} style={{ ...G4, padding: 24 }}>
                  <div className="flex items-center justify-between mb-3">
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: I4d, margin: 0 }}>{k.label}</p>
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: I4d }}>{k.icon}</span>
                  </div>
                  <p style={{ fontFamily: 'ui-monospace,"Geist Mono",monospace', fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em', color: k.color, margin: 0, lineHeight: 1.1 }}>{k.value}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Competitor vs Benchmark Table ─────────────────────────── */}
          <section className="grid grid-cols-12 gap-6">
            <div className="col-span-5" style={{ ...G1, overflow: 'hidden' }}>
              <div className="px-6 pt-5 pb-3">
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: I1d, margin: '0 0 4px' }}>Benchmarking</p>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: I1, letterSpacing: '-0.02em', margin: 0 }}>Competitor vs Benchmark</h2>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr style={{ borderTop: `1px solid ${L1}` }}>
                    {['Competitor', 'ER', 'vs Avg', 'Followers'].map(h => (
                      <th key={h} className="px-5 py-3" style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: I1d }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedGaps.map(g => {
                    const delta = g.engagementRate - (benchmarks?.avgEngagementRate ?? 0)
                    const isAbove = delta > 0
                    return (
                      <tr key={g.brandName} style={{ borderTop: `1px solid ${L1}`, borderLeft: isAbove ? '3px solid rgba(5,150,105,0.40)' : '3px solid transparent' }}
                        className="hover:bg-black/[0.02] transition-colors">
                        <td className="px-5 py-3.5">
                          <p style={{ fontSize: 13, fontWeight: 600, color: I1, margin: 0 }}>{g.brandName}</p>
                          <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', padding: '1px 5px', borderRadius: 3,
                            background: g.tier === 'benchmark' ? 'rgba(37,99,235,0.10)' : 'rgba(245,158,11,0.10)',
                            color: g.tier === 'benchmark' ? '#2563eb' : '#f59e0b' }}>{g.tier}</span>
                        </td>
                        <td className="px-5 py-3.5" style={{ fontFamily: 'ui-monospace,monospace', fontSize: 13, fontWeight: 700,
                          color: g.engagementRate >= 2 ? '#059669' : g.engagementRate >= 0.5 ? '#d97706' : I1d }}>
                          {g.engagementRate > 0 ? g.engagementRate.toFixed(2) + '%' : '—'}
                        </td>
                        <td className="px-5 py-3.5">
                          <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 12, fontWeight: 700, color: isAbove ? '#059669' : '#ef4444' }}>
                            {isAbove ? '+' : ''}{delta.toFixed(2)}%
                          </span>
                        </td>
                        <td className="px-5 py-3.5" style={{ fontFamily: 'ui-monospace,monospace', fontSize: 13, color: I1c }}>
                          {g.followers > 0 ? fmtN(g.followers) : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Gap Cards */}
            <div className="col-span-7 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 style={{ fontSize: 15, fontWeight: 700, color: I1, letterSpacing: '-0.02em', margin: 0 }}>Content Gap Analysis</h2>
                <span style={{ fontSize: 11, color: I1d }}>Based on real competitor data</span>
              </div>
              {sortedGaps.map((g, idx) => {
                const delta = g.engagementRate - (benchmarks?.avgEngagementRate ?? 0)
                const isGap = delta > 0
                const priority = isGap && delta > 2 ? 'High Priority' : isGap ? 'Medium Priority' : 'Below Average'
                const priorityColor = priority === 'High Priority' ? '#f87171' : priority === 'Medium Priority' ? '#f59e0b' : I1d
                const growthTrend = g.followerDelta > 5 ? 'Fast growing' : g.followerDelta > 0 ? 'Growing' : g.followerDelta < 0 ? 'Declining' : 'Stable'

                return (
                  <div key={g.brandName} style={{ ...G1, padding: 24, opacity: idx > 2 ? 0.80 : 1 }}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <span className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider inline-block mb-3"
                          style={{ background: `${priorityColor}18`, color: priorityColor }}>{priority}</span>
                        <h3 style={{ fontSize: 17, fontWeight: 700, color: I1, letterSpacing: '-0.02em', margin: 0 }}>{g.brandName}</h3>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: I1d, margin: '0 0 2px' }}>Score</p>
                        <p style={{ fontFamily: 'ui-monospace,monospace', fontSize: 20, fontWeight: 800, color: g.score >= 60 ? '#059669' : g.score >= 30 ? '#d97706' : I1d, margin: 0 }}>{g.score}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: I1d, margin: '0 0 4px' }}>Engagement Rate</p>
                        <p style={{ fontSize: 18, fontWeight: 700, color: g.engagementRate >= 2 ? '#059669' : g.engagementRate > 0 ? '#d97706' : I1d, margin: 0 }}>
                          {g.engagementRate > 0 ? g.engagementRate.toFixed(2) + '%' : '—'}
                        </p>
                        <p style={{ fontSize: 11, color: isGap ? '#059669' : '#ef4444', margin: '2px 0 0', fontWeight: 600 }}>
                          {isGap ? '+' : ''}{delta.toFixed(2)}% vs avg
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: I1d, margin: '0 0 4px' }}>Followers</p>
                        <p style={{ fontSize: 18, fontWeight: 700, color: I1, margin: 0 }}>{g.followers > 0 ? fmtN(g.followers) : '—'}</p>
                        <p style={{ fontSize: 11, color: g.followerDelta > 0 ? '#059669' : g.followerDelta < 0 ? '#ef4444' : I1d, margin: '2px 0 0', fontWeight: 600 }}>
                          {growthTrend} {g.followerDelta !== 0 ? `(${g.followerDelta > 0 ? '+' : ''}${g.followerDelta.toFixed(1)}%)` : ''}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: I1d, margin: '0 0 4px' }}>Tier</p>
                        <p style={{ fontSize: 14, fontWeight: 700, textTransform: 'capitalize', color: g.tier === 'benchmark' ? '#2563eb' : g.tier === 'anchor' ? '#d97706' : '#f59e0b', margin: 0 }}>{g.tier}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-4" style={{ borderTop: `1px solid ${L1}` }}>
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: I1d }}>First Move:</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: I1 }}>
                          {isGap ? `Study ${g.brandName}'s top posts and replicate format` : 'Monitor for shifts'}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => router.push(`/screens/war-room?q=${encodeURIComponent(`Gap analysis for ${g.brandName}: They have ${g.engagementRate.toFixed(2)}% engagement vs our ${benchmarks?.avgEngagementRate?.toFixed(2) ?? '?'}% group average. ${g.followers > 0 ? `They have ${fmtN(g.followers)} followers.` : ''} Create a brief to close this gap.`)}`)}
                          style={{ background: ACCENT, color: '#fff', fontSize: 12, fontWeight: 700, padding: '7px 16px', borderRadius: 999, border: 'none', cursor: 'pointer' }}
                          className="active:scale-95">
                          Create Brief
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* ── Priority Ranking ──────────────────────────────────────── */}
          <section>
            <div className="mb-4">
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK_4, margin: '0 0 4px' }}>Ranked by Score</p>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: I1, letterSpacing: '-0.02em', margin: 0 }}>Competitor Priority Ranking</h2>
            </div>
            <div style={{ ...G1, overflow: 'hidden' }}>
              {[...gaps].sort((a, b) => b.score - a.score).map((g, idx) => (
                <div key={g.brandName} className="flex items-center justify-between px-6 py-4 hover:bg-black/[0.03] transition-colors"
                  style={{ borderTop: idx > 0 ? `1px solid ${L1}` : 'none' }}>
                  <div className="flex items-center gap-4">
                    <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 18, fontWeight: 700, color: ACCENT, width: 44, flexShrink: 0 }}>{g.score}</span>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: I1, margin: '0 0 2px' }}>{g.brandName}</p>
                      <p style={{ fontSize: 12, color: I1d, margin: 0 }}>
                        {g.engagementRate > 0 ? `${g.engagementRate.toFixed(2)}% ER` : 'No ER data'} ·
                        {g.followers > 0 ? ` ${fmtN(g.followers)} followers` : ' Followers unknown'} ·
                        {g.followerDelta !== 0 ? ` ${g.followerDelta > 0 ? '+' : ''}${g.followerDelta.toFixed(1)}% growth` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider"
                      style={{
                        background: g.score >= 60 ? 'rgba(5,150,105,0.10)' : g.score >= 30 ? 'rgba(245,158,11,0.10)' : 'rgba(148,163,184,0.10)',
                        color: g.score >= 60 ? '#059669' : g.score >= 30 ? '#d97706' : I1d,
                      }}>
                      {g.score >= 60 ? 'High threat' : g.score >= 30 ? 'Watch' : 'Low'}
                    </span>
                    <button
                      onClick={() => router.push(`/screens/war-room?q=${encodeURIComponent(`Brief on ${g.brandName}: Score ${g.score}/100, ${g.engagementRate.toFixed(2)}% ER, ${fmtN(g.followers)} followers. Create a competitive response strategy.`)}`)}
                      style={{ background: `${ACCENT}12`, color: ACCENT, fontSize: 11, fontWeight: 700, padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer' }}
                      className="active:scale-95">
                      Brief
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>}
    </div>
  )
}
