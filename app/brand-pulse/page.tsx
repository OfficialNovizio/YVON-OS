'use client'

import { useState, useEffect } from 'react'
import type { ContentScoreCard, AnomalyAlert, AudienceMomentumEntry } from '@/lib/types'

export default function BrandPulsePage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'revenue' | 'anomalies'>('overview')
  const [loading, setLoading] = useState(true)
  const [pulseData, setPulseData] = useState<{
    top10: ContentScoreCard[]
    worst10: ContentScoreCard[]
    alerts: AnomalyAlert[]
    momentum: Record<string, AudienceMomentumEntry[]>
    overview: {
      totalFollowers: number
      totalEngagement: number
      activeAlerts: number
    }
  } | null>(null)

  useEffect(() => {
    async function loadPulse() {
      try {
        const [scoresRes, alertsRes] = await Promise.all([
          fetch('/api/content-score'),
          fetch('/api/anomaly-check'),
        ])
        const scores = await scoresRes.json() as { top: ContentScoreCard[]; worst: ContentScoreCard[] }
        const alertsData = await alertsRes.json() as { alerts: AnomalyAlert[] }
        setPulseData({
          top10: scores.top,
          worst10: scores.worst,
          alerts: alertsData.alerts ?? [],
          momentum: {},
          overview: {
            totalFollowers: 0,
            totalEngagement: scores.top.reduce((sum, c) => sum + c.likes + c.saves + c.shares, 0),
            activeAlerts: alertsData.alerts?.filter((a: AnomalyAlert) => a.status === 'active').length ?? 0,
          },
        })
      } catch (err) {
        console.error('[brand-pulse] load error:', err)
      } finally {
        setLoading(false)
      }
    }
    loadPulse()
  }, [])

  if (loading) return <div style={{ padding: '40px', color: 'var(--color-muted)' }}>Loading Brand Pulse…</div>
  if (!pulseData) return <div style={{ padding: '40px', color: 'var(--color-accent)' }}>Failed to load Brand Pulse</div>

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px' }}>Brand Pulse</h1>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {(['overview', 'revenue', 'anomalies'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: `1px solid ${activeTab === tab ? 'var(--color-accent)' : 'var(--color-border)'}`,
              background: activeTab === tab ? 'rgba(0,200,83,0.1)' : 'var(--color-surface)',
              color: activeTab === tab ? 'var(--color-accent)' : 'var(--color-muted)',
              fontSize: '12px',
              fontWeight: activeTab === tab ? 700 : 400,
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            <MetricCard label="Total Engagement" value={pulseData.overview.totalEngagement.toLocaleString()} />
            <MetricCard label="Active Alerts" value={pulseData.overview.activeAlerts} color={pulseData.overview.activeAlerts > 0 ? '#E94560' : undefined} />
            <MetricCard label="Content Scored" value={(pulseData.top10.length + pulseData.worst10.length).toString()} />
          </div>

          {/* Active Alerts */}
          {pulseData.alerts.filter((a: AnomalyAlert) => a.status === 'active').length > 0 && (
            <Section title={`⚡ ${pulseData.alerts.filter((a: AnomalyAlert) => a.status === 'active').length} Active Alert${pulseData.alerts.filter((a: AnomalyAlert) => a.status === 'active').length > 1 ? 's' : ''}`}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {pulseData.alerts.filter((a: AnomalyAlert) => a.status === 'active').map((alert) => (
                  <AlertCard key={alert.id ?? alert.metricName} alert={alert} />
                ))}
              </div>
            </Section>
          )}

          {/* Top 10 Content */}
          <Section title="Top 10 Content">
            <ContentTable scores={pulseData.top10} />
          </Section>

          {/* Worst 10 Content */}
          <Section title="Worst 10 Content">
            <ContentTable scores={pulseData.worst10} />
          </Section>
        </>
      )}

      {/* Revenue Tab (placeholder until Stripe connected) */}
      {activeTab === 'revenue' && (
        <div style={{ padding: '40px', textAlign: 'center', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Revenue Attribution</h2>
          <p style={{ color: 'var(--color-muted)', fontSize: '13px' }}>
            Connect Stripe webhooks to see post-to-purchase attribution here.
          </p>
          <p style={{ color: 'var(--color-muted)', fontSize: '12px', marginTop: '8px' }}>
            UTM → Session → Stripe Webhook → Attribution Map
          </p>
        </div>
      )}

      {/* Anomalies Tab */}
      {activeTab === 'anomalies' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600 }}>Anomaly Alerts</h2>
            <button
              onClick={async () => {
                setLoading(true)
                const res = await fetch('/api/anomaly-check')
                const data = await res.json() as { alerts: AnomalyAlert[] }
                setPulseData((prev) => prev ? { ...prev, alerts: data.alerts ?? [] } : null)
                setLoading(false)
              }}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Run Check
            </button>
          </div>
          {pulseData.alerts.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', color: 'var(--color-muted)' }}>
              No anomalies detected. All systems within baseline.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {pulseData.alerts.map((alert) => (
                <AlertCard key={alert.id ?? alert.metricName} alert={alert} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function MetricCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '16px' }}>
      <div style={{ fontSize: '11px', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '4px', color: color ?? 'var(--color-text-primary)' }}>{value}</div>
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

function AlertCard({ alert }: { alert: AnomalyAlert }) {
  const severityColor = alert.severity === 'critical'
    ? '#E94560'
    : alert.severity === 'warning'
      ? '#F59E0B'
      : '#3B82F6'
  return (
    <div style={{ background: 'var(--color-surface)', borderLeft: `3px solid ${severityColor}`, borderRight: '1px solid var(--color-border)', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', borderRadius: '8px', padding: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', padding: '2px 6px', borderRadius: '4px', background: severityColor + '22', color: severityColor }}>
          {alert.severity}
        </span>
        <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>{alert.alertType.replace(/_/g, ' ')}</span>
        <span style={{ fontSize: '11px', color: alert.changePct > 0 ? '#22C55E' : '#E94560', marginLeft: 'auto' }}>
          {alert.changePct > 0 ? '+' : ''}{alert.changePct.toFixed(1)}%
        </span>
      </div>
      <div style={{ fontSize: '13px' }}>{alert.message}</div>
    </div>
  )
}

function ContentTable({ scores }: { scores: ContentScoreCard[] }) {
  if (scores.length === 0) {
    return <div style={{ padding: '16px', color: 'var(--color-muted)', fontSize: '13px' }}>No data available yet</div>
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            {['#', 'Platform', 'Caption', 'Reach', 'Saves', 'Shares', 'Comments', 'Score'].map((h) => (
              <th key={h} style={{ padding: '8px', textAlign: h === 'Caption' ? 'left' : 'right', color: 'var(--color-muted)', fontWeight: 600 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {scores.map((card, i) => (
            <tr key={card.id ?? card.postId} style={{ borderBottom: '1px solid var(--color-border)' }}>
              <td style={{ padding: '8px', color: 'var(--color-muted)' }}>{i + 1}</td>
              <td style={{ padding: '8px' }}>{card.platform}</td>
              <td style={{ padding: '8px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {card.captionPreview ?? '—'}
              </td>
              <td style={{ padding: '8px', textAlign: 'right' }}>{card.reach.toLocaleString()}</td>
              <td style={{ padding: '8px', textAlign: 'right' }}>{card.saves.toLocaleString()}</td>
              <td style={{ padding: '8px', textAlign: 'right' }}>{card.shares.toLocaleString()}</td>
              <td style={{ padding: '8px', textAlign: 'right' }}>{card.comments.toLocaleString()}</td>
              <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700 }}>{Math.round(card.compositeScore).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}