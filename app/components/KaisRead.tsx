'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { G3, G1, I3, I3c, I3d, I1, I1c, I1d, ACCENT, GREEN, AMBER } from '@/app/screens/analytics/_glass-tokens'
import { getVentureProfile } from '@/app/screens/analytics/_venture-context'

interface KaiReadData {
  situation: string
  diagnosis: string
  action: string
  confidence: 'high' | 'medium' | 'low'
  generatedAt: string
  source: 'hermes-agent' | 'fallback'
}

interface Props {
  ventureSlug: string
  /** Optional extra context to pass to Kai */
  context?: string
  /** Visual variant: 'dark' (Overview Kai card), 'light' (Social tab), 'inline' (Market tab) */
  variant?: 'dark' | 'light' | 'inline'
}

function confidenceColor(c: string) {
  if (c === 'high') return GREEN
  if (c === 'medium') return AMBER
  return I1d
}

export default function KaisRead({ ventureSlug, context, variant = 'dark' }: Props) {
  const router = useRouter()
  const [data, setData] = useState<KaiReadData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const profile = getVentureProfile(ventureSlug)

  useEffect(() => {
    if (!ventureSlug) return
    setLoading(true)
    setError(false)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15_000)

    fetch('/api/kai-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ venture: ventureSlug, context }),
      signal: controller.signal,
    })
      .then(r => r.json())
      .then((d: KaiReadData) => {
        if (d.situation && d.diagnosis && d.action) {
          setData(d)
        } else {
          setError(true)
        }
      })
      .catch(() => setError(true))
      .finally(() => {
        clearTimeout(timeout)
        setLoading(false)
      })

    return () => {
      controller.abort()
      clearTimeout(timeout)
    }
  }, [ventureSlug, context])

  // ── Loading state ────────────────────────────────────────────────────────
  if (loading) {
    if (variant === 'inline') {
      return (
        <div className="flex items-center gap-2 py-2">
          <div className="w-3 h-3 rounded-full bg-black/10 animate-pulse" />
          <div className="h-3 w-48 bg-black/5 animate-pulse rounded" />
        </div>
      )
    }
    return (
      <div style={{ ...G3, padding: 32, minHeight: 120 }} className="animate-pulse">
        <div className="h-3 w-24 bg-white/10 rounded mb-3" />
        <div className="h-3 w-full bg-white/5 rounded mb-2" />
        <div className="h-3 w-3/4 bg-white/5 rounded" />
      </div>
    )
  }

  // ── Error / no data state ────────────────────────────────────────────────
  if (error || !data) {
    if (variant === 'inline') {
      return (
        <p style={{ fontSize: 13, color: I1d, margin: 0 }}>
          Kai analysis will appear here. Run a report to populate.
        </p>
      )
    }
    return (
      <div style={{ ...G1, padding: 20 }}>
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-[20px]" style={{ color: AMBER }}>psychology</span>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: I1, margin: '0 0 4px' }}>
              Kai Read — {profile.name}
            </p>
            <p style={{ fontSize: 12, color: I1c, margin: 0, lineHeight: 1.5 }}>
              Intelligence analysis will appear here. Click <strong>Generate Kai Report</strong> on the Reports tab
              or run the morning brief to populate real insights.
            </p>
            <button
              onClick={() => router.push('/screens/analytics/reports')}
              className="mt-3 px-4 py-1.5 rounded-full text-[11px] font-semibold active:scale-95"
              style={{
                background: profile.accentColor,
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Generate Report →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Dark variant (Overview Kai Insight card) ─────────────────────────────
  if (variant === 'dark') {
    return (
      <div style={{
        ...G3,
        background: `linear-gradient(135deg, ${profile.accentColor}35, rgba(8,14,28,0.72))`,
        border: `1px solid ${profile.accentColor}4D`,
        padding: 32,
      }}>
        <div className="flex items-center gap-2 mb-5">
          <span className="w-2 h-2 rounded-full" style={{ background: profile.accentColor }} />
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.20em', color: '#5ba8ff', margin: 0 }}>
            Kai Insight · {profile.name}
          </p>
          {data.source === 'hermes-agent' && (
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
              padding: '2px 8px', borderRadius: 999,
              background: 'rgba(52,211,153,0.15)', color: '#34d399',
              marginLeft: 4,
            }}>
              LIVE
            </span>
          )}
        </div>

        {/* Situation */}
        <div className="mb-4">
          <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: I3d, margin: '0 0 4px' }}>
            What changed
          </p>
          <p style={{ fontSize: 17, fontWeight: 700, color: '#d7e8ff', letterSpacing: '-0.02em', lineHeight: 1.45, margin: 0 }}>
            {data.situation}
          </p>
        </div>

        {/* Diagnosis */}
        <div className="mb-4">
          <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: I3d, margin: '0 0 4px' }}>
            Why it matters
          </p>
          <p style={{ fontSize: 14, color: I3c, lineHeight: 1.55, margin: 0 }}>
            {data.diagnosis}
          </p>
        </div>

        {/* Action */}
        <div>
          <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: I3d, margin: '0 0 4px' }}>
            What to do
          </p>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#34d399', lineHeight: 1.5, margin: 0 }}>
            {data.action}
          </p>
        </div>

        {/* Confidence + source */}
        <div className="flex items-center gap-3 mt-5 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase',
            color: confidenceColor(data.confidence),
          }}>
            Confidence: {data.confidence}
          </span>
          <span style={{ fontSize: 9, color: I3d }}>
            {new Date(data.generatedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <button
            onClick={() => router.push('/screens/analytics/reports')}
            className="ml-auto flex items-center gap-1 text-[10px] font-semibold opacity-60 hover:opacity-100 transition-opacity"
            style={{ color: profile.accentColor, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <span className="material-symbols-outlined text-[12px]">auto_awesome</span>
            Full report
          </button>
        </div>
      </div>
    )
  }

  // ── Light variant (Social Media Kai Situation Report) ────────────────────
  if (variant === 'light') {
    return (
      <div className="ana-glass rounded-[20px] p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Situation', text: data.situation, accent: '#000' },
            { label: 'Diagnosis', text: data.diagnosis, accent: AMBER },
            { label: 'Action', text: data.action, accent: profile.accentColor },
          ].map(item => (
            <div key={item.label} className="flex flex-col gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: item.accent }}>
                {item.label}
              </span>
              <p className="text-[14px] leading-relaxed" style={{ color: 'rgba(0,0,0,0.65)' }}>
                {item.text}
              </p>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 mt-5 pt-4" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <span style={{ fontSize: 10, color: confidenceColor(data.confidence), fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Confidence: {data.confidence}
          </span>
          {data.source === 'hermes-agent' && (
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 8px', borderRadius: 999, background: 'rgba(52,211,153,0.12)', color: '#059669' }}>
              AI ANALYSIS
            </span>
          )}
        </div>
      </div>
    )
  }

  // ── Inline variant (Market tab bottom bar) ───────────────────────────────
  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-xl" style={{ background: 'rgba(0,102,204,0.06)', border: '1px solid rgba(0,102,204,0.12)' }}>
      <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5" style={{ color: profile.accentColor }}>psychology</span>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: profile.accentColor }}>
          {"Kai's Read"} · {profile.name}
        </p>
        <p className="text-[13px] leading-relaxed" style={{ color: I1, margin: 0 }}>
          <strong>{data.situation}</strong> {data.diagnosis}
        </p>
        <p className="text-[12px] mt-1 font-semibold" style={{ color: GREEN }}>{data.action}</p>
      </div>
      {data.source === 'hermes-agent' && (
        <span className="ml-auto shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(5,150,105,0.12)', color: GREEN }}>
          LIVE
        </span>
      )}
    </div>
  )
}
