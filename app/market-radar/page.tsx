'use client'

import { useState, useEffect } from 'react'

interface Competitor {
  id: string
  brandName: string
  url: string | null
  signalScore: number
  followerGrowthRate: number
  trafficSpikeDetected: boolean
  viralContentCount: number
  fundingRoundDetected: boolean
  shareOfVoice: number
  weekOverWeekChange: number
  lastChecked: string
}

interface Territory {
  clusterName: string
  keywords: string[]
  saturationScore: number
  engagementCeiling: number
  isClaimed: boolean
  trendDirection: string
  score: number
}

export default function MarketRadarPage() {
  const [loading, setLoading] = useState(true)
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [territories, setTerritories] = useState<Territory[]>([])

  useEffect(() => {
    async function load() {
      try {
        const [resM, resT] = await Promise.all([
          fetch('/api/market-radar'),
          fetch('/api/territory-scout'),
        ])
        const mData = await resM.json()
        const tData = await resT.json()
        setCompetitors(mData.competitors || [])
        setTerritories(tData.unclaimedTerritories || tData.allClusters || [])
      } catch (e) {
        console.error('[market-radar] load error:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function runScout() {
    const res = await fetch('/api/territory-scout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brandName: 'Novizio' }),
    })
    const data = await res.json()
    setTerritories(data.unclaimedTerritories ?? [])
  }

  if (loading) return <div style={{ padding: '40px', color: 'var(--color-muted)' }}>Loading Market Radar…</div>

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700 }}>Market Radar</h1>
        <button
          onClick={runScout}
          style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', cursor: 'pointer' }}
        >
          Run Territory Scout
        </button>
      </div>

      {/* Scorecard Table */}
      <Section title="Competitor Scorecard">
        {competitors.length === 0 ? (
          <EmptyState message="No competitor data yet. Add competitors in /ventures or run a scan." />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: '8px', textAlign: 'left', color: 'var(--color-muted)', fontWeight: 600 }}>#</th>
                  <th style={{ padding: '8px', textAlign: 'left', color: 'var(--color-muted)', fontWeight: 600 }}>Brand</th>
                  <th style={{ padding: '8px', textAlign: 'right', color: 'var(--color-muted)', fontWeight: 600 }}>Score</th>
                  <th style={{ padding: '8px', textAlign: 'right', color: 'var(--color-muted)', fontWeight: 600 }}>Follower Growth</th>
                  <th style={{ padding: '8px', textAlign: 'center', color: 'var(--color-muted)', fontWeight: 600 }}>Viral</th>
                  <th style={{ padding: '8px', textAlign: 'center', color: 'var(--color-muted)', fontWeight: 600 }}>Funding</th>
                  <th style={{ padding: '8px', textAlign: 'right', color: 'var(--color-muted)', fontWeight: 600 }}>Share of Voice</th>
                  <th style={{ padding: '8px', textAlign: 'center', color: 'var(--color-muted)', fontWeight: 600 }}>Change</th>
                </tr>
              </thead>
              <tbody>
                {competitors.map((c, i) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '8px', color: 'var(--color-muted)' }}>{i + 1}</td>
                    <td style={{ padding: '8px', fontWeight: 600 }}>
                      {i === 0 ? '🔵 ' : ''}{c.brandName}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700 }}>{Math.round(c.signalScore)}</td>
                    <td style={{ padding: '8px', textAlign: 'right', color: c.followerGrowthRate > 0 ? '#22C55E' : '#E94560' }}>
                      {c.followerGrowthRate > 0 ? '+' : ''}{c.followerGrowthRate.toFixed(1)}%
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>{c.viralContentCount}</td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>{c.fundingRoundDetected ? '💰' : '—'}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{c.shareOfVoice}%</td>
                    <td style={{ padding: '8px', textAlign: 'center', color: c.weekOverWeekChange > 0 ? '#22C55E' : '#E94560' }}>
                      {c.weekOverWeekChange > 0 ? '▲' : c.weekOverWeekChange < 0 ? '▼' : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* Territory Scout */}
      <Section title="Territory Scout — Unclaimed Opportunities">
        {territories.length === 0 ? (
          <EmptyState message="Run Territory Scout to identify unclaimed content territory." />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {territories
              .filter((t: string | Territory) => { const x = t as Territory; return !x.isClaimed && x.saturationScore < 50 })
              .slice(0, 6)
              .map((t: string | Territory) => {
                const terr = t as Territory
                return (
                  <div key={terr.clusterName} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 600, fontSize: '14px' }}>{terr.clusterName}</span>
                      <span style={{ fontSize: '11px', color: terr.trendDirection === 'up' ? '#22C55E' : '#F59E0B', fontWeight: 600 }}>
                        {terr.trendDirection === 'up' ? '▲ Emerging' : '— Stable'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: `${terr.saturationScore < 30 ? '#22C55E20' : '#F59E0B20'}`, color: terr.saturationScore < 30 ? '#22C55E' : '#F59E0B' }}>
                        Saturation: {terr.saturationScore}%
                      </span>
                      <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: '#3B82F620', color: '#3B82F6' }}>
                        Score: {Math.round(terr.score)}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-muted)' }}>
                      Keywords: {terr.keywords?.join(', ') ?? '—'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-muted)', marginTop: '4px' }}>
              Recommended: {terr.trendDirection === 'up' ? 'daily' : 'weekly'} posting
            </div>
          </div>
        )
    })}
        </div>
    )}
      </Section>

      {/* Bubble Chart Placeholder */}
      <Section title="Brand Positioning — Bubble Chart">
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '20px', textAlign: 'center', color: 'var(--color-muted)' }}>
          <p style={{ fontSize: '13px', marginBottom: '16px' }}>
            X Axis: Engagement Rate &nbsp;|&nbsp; Y Axis: Estimated Monthly Reach &nbsp;|&nbsp; Bubble: Revenue/Traffic
          </p>
          <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {competitors.length === 0 ? (
              <span>Competitor data needed first — add competitors and run Market Radar analysis</span>
            ) : (
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {competitors.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      width: `${Math.max(40, Math.min(100, c.signalScore))}px`,
                      height: `${Math.max(40, Math.min(100, c.signalScore))}px`,
                      borderRadius: '50%',
                      background: 'rgba(233, 69, 96, 0.3)',
                      border: '2px solid var(--color-accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      textAlign: 'center',
                      padding: '4px',
                    }}
                  >
                    {c.brandName}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '32px' }}>
      <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>{title}</h2>
      {children}
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-muted)', fontSize: '13px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
      {message}
    </div>
  )
}