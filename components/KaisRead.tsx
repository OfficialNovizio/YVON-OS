'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWorkspace } from '@/lib/WorkspaceContext'
import { Card } from '@/components/ui'

// ── Venture accent helpers ────────────────────────────────────────────────────
function getVentureAccent(slug: string): { accent: string; glow: string; soft: string; name: string } {
  const map: Record<string, { accent: string; glow: string; soft: string; name: string }> = {
    novizio:    { accent: '#abc7ff', glow: 'rgba(171,199,255,0.35)', soft: 'rgba(171,199,255,0.14)', name: 'Novizio' },
    hourbour:   { accent: '#5ee0ff', glow: 'rgba(94,224,255,0.32)',   soft: 'rgba(94,224,255,0.14)',   name: 'Hourbour' },
    vibe:       { accent: '#abc7ff', glow: 'rgba(171,199,255,0.35)', soft: 'rgba(171,199,255,0.14)', name: 'Vibe with AI' },
    canela:     { accent: '#5fd0b4', glow: 'rgba(95,208,180,0.32)',  soft: 'rgba(95,208,180,0.14)',  name: 'Canela' },
    valhalla:   { accent: '#c08bff', glow: 'rgba(192,139,255,0.35)', soft: 'rgba(192,139,255,0.16)', name: 'Valhalla' },
    bydesign:   { accent: '#5ee0ff', glow: 'rgba(94,224,255,0.32)',  soft: 'rgba(94,224,255,0.14)',  name: 'By Design' },
  }
  return map[slug] ?? map.vibe
}

// ── Types ─────────────────────────────────────────────────────────────────────
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
  context?: string
  variant?: 'dark' | 'light' | 'inline'
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function KaisRead({ ventureSlug, context, variant = 'dark' }: Props) {
  const router = useRouter()
  const [data, setData] = useState<KaiReadData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const profile = getVentureAccent(ventureSlug)

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

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    if (variant === 'inline') {
      return (
        <div className="flex items-center gap-2 py-2">
          <div className="w-3 h-3 rounded-full bg-white/10 animate-pulse" />
          <div className="h-3 w-48 bg-white/5 animate-pulse rounded" />
        </div>
      )
    }
    return (
      <Card className="p-6 min-h-[120px] animate-pulse">
        <div className="h-3 w-24 bg-white/10 rounded mb-3" />
        <div className="h-3 w-full bg-white/5 rounded mb-2" />
        <div className="h-3 w-3/4 bg-white/5 rounded" />
      </Card>
    )
  }

  // ── Error / no data ─────────────────────────────────────────────────────────
  if (error || !data) {
    if (variant === 'inline') {
      return (
        <p className="text-[13px] text-on-surface-variant m-0">
          Kai analysis will appear here. Run a report to populate.
        </p>
      )
    }
    return (
      <Card className="p-5">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-[20px] text-amber-400">psychology</span>
          <div>
            <p className="text-[13px] font-semibold text-on-surface mb-1">
              Kai Read · {profile.name}
            </p>
            <p className="text-[12px] text-on-surface-variant leading-relaxed m-0">
              Intelligence analysis will appear here. Generate a Kai Report or run the morning brief to populate real insights.
            </p>
            <button
              onClick={() => router.push('/trend-radar')}
              className="mt-3 px-4 py-1.5 rounded-full text-[11px] font-semibold text-white active:scale-95 transition-transform"
              style={{ background: profile.accent }}
            >
              Generate Report →
            </button>
          </div>
        </div>
      </Card>
    )
  }

  // ── Confidence color helper ─────────────────────────────────────────────────
  const confidenceColor = (c: string) =>
    c === 'high' ? '#4ade80' : c === 'medium' ? '#fbbf24' : '#9ca3af'

  // ── Dark variant (main dashboard / overview cards) ──────────────────────────
  if (variant === 'dark') {
    return (
      <div
        className="glass-card p-8"
        style={{
          background: `linear-gradient(135deg, ${profile.accent}22, rgba(13,13,13,0.85))`,
          borderColor: `${profile.accent}30`,
        }}
      >
        <div className="flex items-center gap-2 mb-5">
          <span className="w-2 h-2 rounded-full" style={{ background: profile.accent }} />
          <p className="text-[10px] font-bold uppercase tracking-[0.20em] text-on-surface-variant m-0">
            Kai Insight · {profile.name}
          </p>
          {data.source === 'hermes-agent' && (
            <span className="text-[9px] font-bold uppercase tracking-[0.08em] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 ml-1">
              LIVE
            </span>
          )}
        </div>

        {/* Situation */}
        <div className="mb-4">
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-on-surface-variant mb-1">
            What changed
          </p>
          <p className="text-[17px] font-bold text-on-surface leading-[1.45] -tracking-[0.02em] m-0">
            {data.situation}
          </p>
        </div>

        {/* Diagnosis */}
        <div className="mb-4">
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-on-surface-variant mb-1">
            Why it matters
          </p>
          <p className="text-sm text-on-surface-variant leading-relaxed m-0">
            {data.diagnosis}
          </p>
        </div>

        {/* Action */}
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-on-surface-variant mb-1">
            What to do
          </p>
          <p className="text-sm font-semibold text-emerald-400 leading-relaxed m-0">
            {data.action}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 mt-5 pt-4 border-t border-white/[0.08]">
          <span
            className="text-[9px] font-bold uppercase tracking-[0.10em]"
            style={{ color: confidenceColor(data.confidence) }}
          >
            Confidence: {data.confidence}
          </span>
          <span className="text-[9px] text-on-surface-variant">
            {new Date(data.generatedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <button
            onClick={() => router.push('/trend-radar')}
            className="ml-auto flex items-center gap-1 text-[10px] font-semibold opacity-60 hover:opacity-100 transition-opacity"
            style={{ color: profile.accent }}
          >
            <span className="material-symbols-outlined text-[12px]">auto_awesome</span>
            Full report
          </button>
        </div>
      </div>
    )
  }

  // ── Light variant (for use inside lighter containers) ───────────────────────
  if (variant === 'light') {
    return (
      <Card className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Situation', text: data.situation, color: profile.accent },
            { label: 'Diagnosis', text: data.diagnosis, color: '#fbbf24' },
            { label: 'Action', text: data.action, color: '#4ade80' },
          ].map(item => (
            <div key={item.label} className="flex flex-col gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: item.color }}>
                {item.label}
              </span>
              <p className="text-sm leading-relaxed text-on-surface-variant">
                {item.text}
              </p>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 mt-5 pt-4 border-t border-white/[0.06]">
          <span
            className="text-[10px] font-bold uppercase tracking-[0.08em]"
            style={{ color: confidenceColor(data.confidence) }}
          >
            Confidence: {data.confidence}
          </span>
          {data.source === 'hermes-agent' && (
            <span className="text-[9px] font-bold uppercase tracking-[0.08em] px-2 py-0.5 rounded-full bg-emerald-500/12 text-emerald-500">
              AI ANALYSIS
            </span>
          )}
        </div>
      </Card>
    )
  }

  // ── Inline variant ──────────────────────────────────────────────────────────
  return (
    <div
      className="flex items-start gap-3 px-4 py-3 rounded-xl"
      style={{ background: `${profile.accent}0F`, border: `1px solid ${profile.accent}1F` }}
    >
      <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5" style={{ color: profile.accent }}>
        psychology
      </span>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: profile.accent }}>
          Kai&apos;s Read · {profile.name}
        </p>
        <p className="text-[13px] leading-relaxed text-on-surface m-0">
          <strong>{data.situation}</strong> {data.diagnosis}
        </p>
        <p className="text-[12px] mt-1 font-semibold text-emerald-400">{data.action}</p>
      </div>
      {data.source === 'hermes-agent' && (
        <span className="ml-auto shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/12 text-emerald-400">
          LIVE
        </span>
      )}
    </div>
  )
}
