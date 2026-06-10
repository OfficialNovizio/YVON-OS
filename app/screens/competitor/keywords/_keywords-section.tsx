'use client'

import { useEffect, useState } from 'react'
import { useVentureSlug } from '@/lib/use-venture-slug'
import { getCached, setCache } from '@/lib/session-cache'

import { G1, G2, G3, G4, I1, I1c, I1d, I2, I2d, I3c, I3d, I4, I4d, L1, ACCENT, INK_4 } from '../_glass-tokens'

interface Keyword {
  word: string; count: number; brandCount: number; brands: string[]
}
interface KeywordData {
  keywords: Keyword[]
  totalKeywords: number
  competitorsScraped: number
  message?: string
}

export function KeywordsSection({ ventureSlug }: { ventureSlug: string }) {
  const [liveKw, setLiveKw] = useState<KeywordData | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!ventureSlug) return
    const cacheKey = `competitor-keywords-${ventureSlug}`
    const cached = getCached<KeywordData>(cacheKey)
    if (cached) { setLiveKw(cached); setLoading(false); return }

    setLoading(true)
    fetch(`/api/competitor-keywords?venture=${ventureSlug}`)
      .then(r => r.json())
      .then(d => { setLiveKw(d as KeywordData); setCache(cacheKey, d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [ventureSlug])

  const keywords = liveKw?.keywords ?? []
  const hasData = keywords.length > 0

  const filtered = search
    ? keywords.filter(k => k.word.toLowerCase().includes(search.toLowerCase()))
    : keywords

  const topHashtags = [...keywords].sort((a, b) => b.count - a.count).slice(0, 5)
  const multipleUsed = keywords.filter(k => k.brandCount >= 2)

  if (loading && !liveKw) {
    return (
      <div className="flex items-center justify-center py-32">
        <span className="material-symbols-outlined animate-spin text-[36px]" style={{ color: 'rgba(0,0,0,0.15)' }}>refresh</span>
      </div>
    )
  }

  return (
    <div className="space-y-8">

        {/* ── KPI Row ──────────────────────────────────────────────── */}
        <section>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK_4, margin: '0 0 16px' }}>
            Hashtag Intelligence · Extracted from Competitor Instagram Posts
          </p>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Hashtags Found',       value: liveKw?.totalKeywords ?? 0,       icon: 'tag',          color: I4    },
              { label: 'Shown (Top)',           value: keywords.length,                  icon: 'format_list_numbered', color: ACCENT },
              { label: 'Used by 2+ Brands',    value: multipleUsed.length,              icon: 'group_work',   color: '#059669' },
              { label: 'Competitors Scraped',  value: liveKw?.competitorsScraped ?? 0,  icon: 'radar',        color: I4d   },
            ].map(k => (
              <div key={k.label} style={{ ...G4, padding: 24 }}>
                <div className="flex items-center justify-between mb-3">
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: I4d, margin: 0 }}>{k.label}</p>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: I4d }}>{k.icon}</span>
                </div>
                <p style={{ fontFamily: 'ui-monospace,"Geist Mono",monospace', fontSize: 32, fontWeight: 700, letterSpacing: '-0.04em', color: k.color, margin: 0, lineHeight: 1 }}>{k.value}</p>
              </div>
            ))}
          </div>
        </section>

        {!hasData ? (
          <div style={{ ...G1, padding: 48 }} className="flex flex-col items-center gap-4 text-center">
            <span className="material-symbols-outlined text-[48px]" style={{ color: 'rgba(0,0,0,0.12)' }}>tag</span>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: I1 }}>No Hashtag Data Yet</h2>
            <p style={{ fontSize: 14, color: I1d, maxWidth: 400, lineHeight: 1.6 }}>
              {liveKw?.message ?? 'Add competitor Instagram handles in Settings → Competitors, then run Refresh Stats.'}
            </p>
          </div>
        ) : (
          <>
            {/* ── Main Grid: Hashtag Table + Sidebar ───────────────────── */}
            <section className="grid grid-cols-12 gap-6">

              {/* Hashtag Table */}
              <div className="col-span-8" style={{ ...G1, overflow: 'hidden' }}>
                <div className="px-6 pt-5 pb-3 flex items-end justify-between">
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: I1d, margin: '0 0 4px' }}>Instagram · Real Data</p>
                    <h2 style={{ fontSize: 15, fontWeight: 700, color: I1, letterSpacing: '-0.02em', margin: 0 }}>Competitor Hashtags</h2>
                  </div>
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search hashtag…"
                    style={{ fontSize: 12, padding: '6px 12px', borderRadius: 8, border: `1px solid ${L1}`, background: 'transparent', color: I1, outline: 'none', width: 160 }}
                  />
                </div>
                <table className="w-full text-left">
                  <thead>
                    <tr style={{ borderTop: `1px solid ${L1}` }}>
                      {['Hashtag', 'Uses', 'Brands', 'Spread', 'Action'].map((h, i) => (
                        <th key={h} className={`px-5 py-3 ${i >= 2 ? 'text-center' : ''}`}
                          style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: I1d }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.slice(0, 30).map((kw, i) => {
                      const isTop = i < 5
                      const isMultiBrand = kw.brandCount >= 2
                      return (
                        <tr key={kw.word} style={{ borderTop: `1px solid ${L1}`, background: isTop ? `${ACCENT}04` : 'transparent' }}
                          className="hover:bg-black/[0.02] transition-colors group">
                          <td className="px-5 py-3">
                            <span style={{ fontSize: 13, fontWeight: isTop ? 700 : 500, color: isTop ? ACCENT : I1 }}>{kw.word}</span>
                          </td>
                          <td className="px-5 py-3">
                            <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 13, fontWeight: 700, color: I1 }}>{kw.count}</span>
                          </td>
                          <td className="px-5 py-3 text-center">
                            <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 13, color: isMultiBrand ? '#059669' : I1c }}>{kw.brandCount}</span>
                          </td>
                          <td className="px-5 py-3 text-center">
                            <div style={{ display: 'flex', justifyContent: 'center', gap: 3, flexWrap: 'wrap', maxWidth: 120 }}>
                              {kw.brands.slice(0, 3).map(b => (
                                <span key={b} style={{ fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 3, background: L1, color: I1d }}>
                                  {b.length > 10 ? b.slice(0, 9) + '…' : b}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <button className="opacity-0 group-hover:opacity-100 transition-opacity active:scale-95"
                              style={{ fontSize: 11, fontWeight: 700, color: ACCENT, background: `${ACCENT}12`, padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer' }}>
                              Use Tag
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {filtered.length === 0 && search && (
                  <div className="px-6 py-6 text-center">
                    <p style={{ fontSize: 13, color: I1d }}>No hashtags matching &quot;{search}&quot;</p>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="col-span-4 flex flex-col gap-5">

                {/* Trending Hashtags */}
                <div style={{ ...G3, overflow: 'hidden' }}>
                  <div className="px-5 pt-5 pb-3">
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: I3d, margin: '0 0 4px' }}>Most Used</p>
                    <h2 style={{ fontSize: 15, fontWeight: 700, color: '#f1f5fb', letterSpacing: '-0.02em', margin: 0 }}>Top Hashtags</h2>
                  </div>
                  {topHashtags.map(t => (
                    <div key={t.word} className="flex items-center justify-between px-5 py-3.5 hover:bg-white/5 transition-colors"
                      style={{ borderTop: '1px solid rgba(241,245,251,0.07)' }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#f1f5fb', margin: '0 0 2px' }}>{t.word}</p>
                        <p style={{ fontSize: 11, color: I3d, margin: 0 }}>{t.brandCount} brand{t.brandCount !== 1 ? 's' : ''} · {t.count} uses</p>
                      </div>
                      <div style={{
                        fontFamily: 'ui-monospace,monospace', fontSize: 18, fontWeight: 700, color: ACCENT,
                        background: 'rgba(0,102,204,0.18)', padding: '2px 8px', borderRadius: 6,
                      }}>{t.count}</div>
                    </div>
                  ))}
                </div>

                {/* Cross-brand hashtags */}
                {multipleUsed.length > 0 && (
                  <div style={{ ...G1, overflow: 'hidden' }}>
                    <div className="px-5 pt-5 pb-3">
                      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: I1d, margin: '0 0 4px' }}>Industry Tags</p>
                      <h2 style={{ fontSize: 15, fontWeight: 700, color: I1, letterSpacing: '-0.02em', margin: 0 }}>Used by Multiple Brands</h2>
                    </div>
                    {multipleUsed.slice(0, 6).map((t, idx) => (
                      <div key={t.word} className="flex items-center justify-between px-5 py-3 hover:bg-black/[0.02] transition-colors"
                        style={{ borderTop: idx > 0 ? `1px solid ${L1}` : `1px solid ${L1}` }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: ACCENT }}>{t.word}</span>
                        <span style={{ fontSize: 11, color: I1d }}>{t.brandCount} brands</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Note */}
                <div style={{ ...G2, padding: 20 }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: ACCENT }}>info</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: I2 }}>Data Source</span>
                  </div>
                  <p style={{ fontSize: 12, color: I2d, lineHeight: 1.6, margin: 0 }}>
                    Hashtags extracted from competitor Instagram post captions via Apify.
                    {liveKw?.competitorsScraped ? ` ${liveKw.competitorsScraped} competitor profile${liveKw.competitorsScraped !== 1 ? 's' : ''} analysed.` : ''}
                    {' '}Other platforms (TikTok, YouTube, LinkedIn) coming soon.
                  </p>
                </div>

              </div>
            </section>

            {/* ── Hashtag Cloud by brand ─────────────────────────────── */}
            {keywords.length > 0 && (
              <section>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK_4, margin: '0 0 16px' }}>
                  Full Hashtag Set · Instagram Competitor Posts
                </p>
                <div style={{ ...G1, padding: '20px 24px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {keywords.map(k => {
                      const intensity = Math.min(k.count / (keywords[0]?.count ?? 1), 1)
                      const size = 10 + Math.round(intensity * 6)
                      const opacity = 0.4 + intensity * 0.6
                      return (
                        <span key={k.word} style={{
                          fontSize: size, fontWeight: k.brandCount >= 2 ? 700 : 500,
                          color: k.brandCount >= 2 ? ACCENT : I1,
                          opacity,
                          padding: '3px 8px', borderRadius: 6,
                          background: k.brandCount >= 2 ? `${ACCENT}08` : L1,
                          cursor: 'default',
                        }} title={`${k.count} uses · ${k.brandCount} brands`}>
                          {k.word}
                        </span>
                      )
                    })}
                  </div>
                  <p style={{ fontSize: 10, color: I1d, margin: '12px 0 0' }}>
                    Larger = more uses · Blue = used by 2+ competitors
                  </p>
                </div>
              </section>
            )}
          </>
        )}
    </div>
  )
}
