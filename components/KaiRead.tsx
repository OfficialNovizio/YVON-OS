'use client'

import { useState } from 'react'

interface KaiInsight {
  what: string
  why: string
  action: string
  confidence: 'high' | 'medium' | 'low'
}

interface KaiReadProps {
  /** Data context to analyse — passed as JSON to /api/kai-read */
  metrics: Record<string, unknown>
  /** Optional label shown in the card header */
  label?: string
}

const CONFIDENCE_COLOR: Record<string, string> = {
  high:   'var(--gn)',
  medium: 'var(--am)',
  low:    'var(--di)',
}

export default function KaiRead({ metrics, label = 'Kai · Data Read' }: KaiReadProps) {
  const [insight, setInsight] = useState<KaiInsight | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function fetchInsight() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/kai-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics }),
      })
      if (!res.ok) throw new Error(`${res.status}`)
      const data = await res.json() as { insight?: KaiInsight; error?: string }
      if (data.error) throw new Error(data.error)
      if (data.insight) setInsight(data.insight)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      background: 'var(--sf)',
      border: '1px solid var(--b1)',
      borderLeft: '3px solid var(--bl)',
      padding: '18px 20px',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: insight ? '16px' : 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: loading ? 'var(--am)' : insight ? 'var(--bl)' : 'var(--di)',
          }} />
          <span style={{
            fontFamily: 'var(--font-dm-mono)', fontSize: '9px',
            letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--di)',
          }}>
            {label}
          </span>
          {insight && (
            <span style={{
              fontFamily: 'var(--font-dm-mono)', fontSize: '9px',
              color: CONFIDENCE_COLOR[insight.confidence],
              letterSpacing: '0.06em',
            }}>
              {insight.confidence.toUpperCase()} CONFIDENCE
            </span>
          )}
        </div>
        <button
          onClick={fetchInsight}
          disabled={loading}
          style={{
            fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '0.1em',
            textTransform: 'uppercase', padding: '4px 12px',
            border: '1px solid var(--b2)', background: 'none',
            color: loading ? 'var(--di)' : 'var(--bl)',
            cursor: loading ? 'default' : 'pointer',
          }}
        >
          {loading ? 'Kai is reading...' : insight ? 'Re-read →' : 'Ask Kai →'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          fontFamily: 'var(--font-dm-mono)', fontSize: '10px',
          color: 'var(--rd)', marginTop: '10px',
        }}>
          Error: {error}
        </div>
      )}

      {/* Insight rows */}
      {insight && !error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {([
            { key: 'what',   label: 'WHAT',   text: insight.what   },
            { key: 'why',    label: 'WHY',    text: insight.why    },
            { key: 'action', label: 'ACTION', text: insight.action },
          ] as const).map(row => (
            <div key={row.key} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <span style={{
                fontFamily: 'var(--font-dm-mono)', fontSize: '8px',
                letterSpacing: '0.12em', color: 'var(--di)',
                paddingTop: '3px', minWidth: '44px', flexShrink: 0,
              }}>
                {row.label}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--tx)', lineHeight: 1.65 }}>
                {row.text}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
