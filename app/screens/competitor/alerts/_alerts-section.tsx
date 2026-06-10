'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useVentureSlug } from '@/lib/use-venture-slug'
import { getCached, setCache } from '@/lib/session-cache'

import { G1, G4, I1, I1c, I1d, I4, I4d, L1, ACCENT, INK_4 } from '../_glass-tokens'

interface Signal {
  id: string
  severity: 'red' | 'amber' | 'green'
  text: string
  cta: string
}
interface IntelData {
  signals: Signal[]
  competitors: Array<{ name: string; score: number; engagementRate: number }>
  contentFeed: Array<{ id: string; brandName: string; caption: string; type: string; engagement: number; url: string; views: number; likes: number }>
}

type SeverityFilter = 'All' | 'Critical' | 'High' | 'Trending'

function severityLabel(s: Signal['severity']): string {
  return s === 'red' ? 'Critical' : s === 'amber' ? 'High' : 'Info'
}

function extractBrand(text: string): string {
  const colon = text.indexOf(':')
  return colon > 0 ? text.slice(0, colon).trim() : 'Competitor'
}

function fmtN(n: number) {
  return n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'M' : n >= 1_000 ? Math.round(n / 1_000) + 'K' : String(n)
}

export function AlertsSection({ ventureSlug }: { ventureSlug: string }) {
  const router = useRouter()
  const [liveData, setLiveData] = useState<IntelData | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<SeverityFilter>('All')
  const [dismissed, setDismissed] = useState<string[]>([])

  useEffect(() => {
    if (!ventureSlug) return
    const cacheKey = `alerts-intel-${ventureSlug}`
    const cached = getCached<IntelData>(cacheKey)
    if (cached) { setLiveData(cached); setLoading(false); return }

    setLoading(true)
    fetch(`/api/competitor-content-intel?venture=${ventureSlug}`)
      .then(r => r.json())
      .then(d => { setLiveData(d as IntelData); setCache(cacheKey, d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [ventureSlug])

  const signals = liveData?.signals ?? []
  const competitors = liveData?.competitors ?? []
  const contentFeed = liveData?.contentFeed ?? []

  // Supplement signals with top engaging posts as viral alerts
  const viralPosts = [...contentFeed]
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, 3)
    .map((p, i) => ({
      id: `viral-${p.id}`,
      severity: i === 0 ? 'red' as const : 'amber' as const,
      text: `${p.brandName}: ${p.type === 'reel' ? 'Reel' : p.type === 'carousel' ? 'Carousel' : 'Post'} with ${fmtN(p.engagement)} engagement${p.views > 0 ? ` · ${fmtN(p.views)} views` : ''}. ${p.caption?.slice(0, 80) ?? ''}`,
      cta: 'View Post',
      url: p.url,
    }))

  const allAlerts = [
    ...signals.map(s => ({ ...s, url: null })),
    ...viralPosts.filter(vp => !signals.some(s => s.text.startsWith(extractBrand(vp.text)))),
  ]

  const visible = allAlerts.filter(a => {
    if (dismissed.includes(a.id)) return false
    if (filter === 'All') return true
    if (filter === 'Critical') return a.severity === 'red'
    if (filter === 'High') return a.severity === 'amber'
    if (filter === 'Trending') return a.id.startsWith('viral-') || a.id.startsWith('trending-')
    return true
  })

  const unread = allAlerts.filter(a => !dismissed.includes(a.id)).length
  const critCount = allAlerts.filter(a => a.severity === 'red').length
  const brands = new Set(allAlerts.map(a => extractBrand(a.text)))

  const summaryKpis = [
    { label: 'Total Alerts',   value: allAlerts.length, icon: 'notifications_active', valueColor: ACCENT    },
    { label: 'Critical',       value: critCount,         icon: 'warning',              valueColor: '#f87171' },
    { label: 'Brands Active',  value: brands.size,       icon: 'radar',                valueColor: I4        },
    { label: 'Dismissed',      value: dismissed.length,  icon: 'check_circle',         valueColor: I4d       },
  ]

  const filters: SeverityFilter[] = ['All', 'Critical', 'High', 'Trending']

  if (loading && !liveData) {
    return (
      <div className="flex items-center justify-center py-32">
        <span className="material-symbols-outlined animate-spin text-[36px]" style={{ color: 'rgba(0,0,0,0.15)' }}>refresh</span>
      </div>
    )
  }

  return (
    <div className="space-y-8">

        {/* ── Summary KPIs ─────────────────────────────────────────── */}
        <section>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK_4, margin: '0 0 16px' }}>
            Alert Summary · Real competitor activity
          </p>
          <div className="grid grid-cols-4 gap-4">
            {summaryKpis.map(k => (
              <div key={k.label} style={{ ...G4, padding: 24 }}>
                <div className="flex items-center justify-between mb-3">
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: I4d, margin: 0 }}>{k.label}</p>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: k.valueColor }}>{k.icon}</span>
                </div>
                <p style={{ fontFamily: 'ui-monospace,monospace', fontSize: 32, fontWeight: 700, letterSpacing: '-0.04em', color: k.valueColor, margin: 0, lineHeight: 1 }}>{k.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Filter Bar ───────────────────────────────────────────── */}
        <div className="flex items-center gap-1.5 p-1.5 flex-wrap w-fit"
          style={{
            background: 'rgba(8,16,36,0.58)', backdropFilter: 'blur(28px) saturate(160%)',
            WebkitBackdropFilter: 'blur(28px) saturate(160%)',
            border: '1px solid rgba(255,255,255,0.12)', borderRadius: 999,
            boxShadow: '0 1px 0 rgba(255,255,255,0.10) inset,0 20px 40px -18px rgba(0,0,0,0.50)',
          }}>
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="flex items-center gap-1.5 px-[18px] py-[9px] rounded-full text-[11px] font-bold uppercase tracking-[0.18em] transition-all duration-200 active:scale-95"
              style={{
                color: filter === f ? '#0c0d10' : 'rgba(220,228,248,0.45)',
                background: filter === f ? 'rgba(255,255,255,0.92)' : 'transparent',
                border: 'none', cursor: 'pointer',
              }}>
              {f}
              {f === 'All' && unread > 0 && (
                <span style={{ background: ACCENT, color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 999 }}>
                  {unread}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Alert Feed ───────────────────────────────────────────── */}
        <section className="flex flex-col gap-3">
          {allAlerts.length === 0 ? (
            <div style={{ ...G1, padding: 48 }} className="flex flex-col items-center gap-3 text-center">
              <span className="material-symbols-outlined" style={{ fontSize: 40, color: I1d }}>notifications_off</span>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: I1, margin: 0 }}>No Alerts Yet</h2>
              <p style={{ fontSize: 14, color: I1d, margin: 0, maxWidth: 400, lineHeight: 1.6 }}>
                Add competitors in Settings → Competitors and run Refresh Stats. Alerts are generated from real scrape data.
              </p>
            </div>
          ) : visible.length === 0 ? (
            <div style={{ ...G1, padding: 48 }} className="flex flex-col items-center gap-3 text-center">
              <span className="material-symbols-outlined" style={{ fontSize: 40, color: I1d }}>filter_list_off</span>
              <p style={{ fontSize: 14, color: I1d, margin: 0 }}>No alerts in this filter.</p>
            </div>
          ) : null}

          {visible.map(alert => {
            const borderColor = alert.severity === 'red' ? '#f87171' : alert.severity === 'amber' ? '#fb923c' : '#34d399'
            const badgeColor = alert.severity === 'red' ? '#f87171' : alert.severity === 'amber' ? '#fb923c' : '#34d399'
            const badgeBg = alert.severity === 'red' ? 'rgba(239,68,68,0.10)' : alert.severity === 'amber' ? 'rgba(249,115,22,0.10)' : 'rgba(52,211,153,0.10)'
            const brand = extractBrand(alert.text)
            const isViral = alert.id.startsWith('viral-')
            const categoryIcon = isViral ? 'trending_up' : alert.id.startsWith('trending-') ? 'play_circle' : 'campaign'

            return (
              <div key={alert.id} style={{ ...G1, padding: 20, borderLeft: `4px solid ${borderColor}` }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: L1 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18, color: I1d }}>{categoryIcon}</span>
                    </div>
                    <div className="flex flex-col gap-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: I1d }}>{brand}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', padding: '2px 8px', borderRadius: 999, color: badgeColor, background: badgeBg }}>
                          {severityLabel(alert.severity)}
                        </span>
                        {isViral && <span style={{ fontSize: 10, fontWeight: 700, color: '#fbbf24', background: 'rgba(251,191,36,0.10)', padding: '2px 8px', borderRadius: 999 }}>Viral</span>}
                      </div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: I1, lineHeight: 1.4, margin: 0 }}>{alert.text}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {(alert as typeof alert & { url?: string | null }).url ? (
                      <a href={(alert as typeof alert & { url?: string | null }).url!} target="_blank" rel="noreferrer"
                        style={{ background: ACCENT, color: '#fff', fontSize: 12, fontWeight: 700, padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', textDecoration: 'none', display: 'inline-block', whiteSpace: 'nowrap' }}>
                        {alert.cta}
                      </a>
                    ) : (
                      <button
                        onClick={() => router.push(`/screens/war-room?q=${encodeURIComponent(alert.text)}`)}
                        style={{ background: ACCENT, color: '#fff', fontSize: 12, fontWeight: 700, padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
                        className="active:scale-95">
                        {alert.cta}
                      </button>
                    )}
                    <button onClick={() => setDismissed(d => [...d, alert.id])}
                      className="hover:bg-black/5 transition-colors active:scale-95"
                      style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16, color: I1d }}>close</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </section>

        {/* ── Competitor Score Snapshot ─────────────────────────────── */}
        {competitors.length > 0 && (
          <section>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK_4, margin: '0 0 16px' }}>
              Competitor Activity Scores
            </p>
            <div style={{ ...G1, padding: '16px 22px' }}>
              <div className="flex flex-col gap-3">
                {[...competitors].sort((a, b) => b.score - a.score).map(c => {
                  const scoreColor = c.score >= 60 ? '#059669' : c.score >= 30 ? '#d97706' : I1d
                  return (
                    <div key={c.name} className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: `${scoreColor}15`, border: `1px solid ${scoreColor}40` }}>
                          <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 10, fontWeight: 800, color: scoreColor }}>{c.score}</span>
                        </div>
                        <div>
                          <span style={{ fontSize: 13, fontWeight: 600, color: I1 }}>{c.name}</span>
                          <span style={{ fontSize: 11, color: I1d, marginLeft: 8 }}>
                            {c.engagementRate > 0 ? `${(c.engagementRate * 100).toFixed(2)}% ER` : 'No ER data'}
                          </span>
                        </div>
                      </div>
                      <div style={{ flex: 1, maxWidth: 200 }}>
                        <div style={{ height: 4, background: L1, borderRadius: 999, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.min(c.score, 100)}%`, background: scoreColor, borderRadius: 999, transition: 'width 0.4s ease' }} />
                        </div>
                      </div>
                      <button
                        onClick={() => router.push(`/screens/war-room?q=${encodeURIComponent(`Competitor ${c.name} has activity score ${c.score}/100 and ${(c.engagementRate * 100).toFixed(2)}% engagement. Create a competitive response strategy.`)}`)}
                        style={{ fontSize: 11, fontWeight: 600, color: ACCENT, background: 'rgba(0,102,204,0.06)', border: 'none', cursor: 'pointer', padding: '3px 10px', borderRadius: 6 }}
                        className="hover:opacity-80 transition-opacity flex-shrink-0">
                        Brief
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        )}
    </div>
  )
}

