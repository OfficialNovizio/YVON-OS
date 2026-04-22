'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { AGENTS_BY_LAYER } from '@/lib/agents'
import { getActiveVentureSlugClient } from '@/lib/venture-context'
import { VENTURES } from '@/lib/venture-context'
import AgentSettingsCard from '@/components/AgentSettingsCard'
import type { AgentSettingsSave, AgentLayer } from '@/lib/types'

const LAYER_LABELS: Record<AgentLayer, string> = {
  executive:  'Executive',
  marketing:  'Marketing',
  analytics:  'Analytics',
  technical:  'Technical',
  operations: 'Operations',
  personal:   'Personal',
}

const LAYER_ORDER: AgentLayer[] = ['executive', 'marketing', 'analytics', 'technical', 'operations', 'personal']

type Tab = 'agents' | 'ventures' | 'notifications'

// ─── Types ────────────────────────────────────────────────────────────────────

interface BrandData {
  slug: string
  name: string
  color: string
  tagline: string
  voice: string
  ventureType: string
  website: string
  igHandle: string
  ytChannelId: string
  liProfileUrl: string
  ga4PropertyId: string
  competitors: string[]
}

// ─── Shared input style ───────────────────────────────────────────────────────
const inp: React.CSSProperties = {
  background: 'var(--color-navy)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: 'var(--color-text)',
  borderRadius: '4px',
  padding: '8px 12px',
  fontSize: '13px',
  outline: 'none',
  width: '100%',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs uppercase tracking-wider font-medium" style={{ color: 'var(--color-muted)' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

// ─── Competitor sub-field used inside brand forms ─────────────────────────────
function CompetitorField({
  competitors,
  onChange,
  color,
  brandName,
  industry,
}: {
  competitors: string[]
  onChange: (list: string[]) => void
  color: string
  brandName: string
  industry: string
}) {
  const [input, setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg]       = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function add() {
    const v = input.trim()
    if (!v || competitors.includes(v)) return
    onChange([...competitors, v])
    setInput('')
    inputRef.current?.focus()
  }

  async function autoSuggest() {
    setLoading(true)
    setMsg(null)
    try {
      const res = await fetch('/api/auto-competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandName, industry }),
      })
      const data = await res.json()
      if (Array.isArray(data.competitors) && data.competitors.length > 0) {
        onChange([...new Set([...competitors, ...data.competitors])])
        setMsg(`Added ${data.competitors.length} suggestions`)
      } else {
        setMsg('No suggestions — try adding manually')
      }
    } catch {
      setMsg('Auto-suggest failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-xs uppercase tracking-wider font-medium" style={{ color: 'var(--color-muted)' }}>
          Competitors
        </label>
        <button
          type="button"
          onClick={autoSuggest}
          disabled={loading}
          style={{
            background: 'transparent',
            border: `1px solid ${color}55`,
            color: loading ? 'var(--color-muted)' : color,
            borderRadius: '3px',
            padding: '2px 10px',
            fontFamily: 'var(--font-dm-mono)',
            fontSize: '9px',
            letterSpacing: '0.08em',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'ANALYZING…' : 'AUTO-SUGGEST'}
        </button>
      </div>

      {competitors.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {competitors.map(c => (
            <span key={c} style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              background: 'var(--color-navy)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '3px', padding: '2px 8px',
              fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--color-text)',
            }}>
              {c}
              <button type="button" onClick={() => onChange(competitors.filter(x => x !== c))}
                style={{ background: 'none', border: 'none', color: 'var(--color-muted)', cursor: 'pointer', padding: 0, fontSize: '12px', lineHeight: 1 }}>×</button>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder="Competitor name…"
          style={{ ...inp, flex: 1 }}
        />
        <button type="button" onClick={add} style={{
          background: color, border: 'none', borderRadius: '4px',
          color: '#0a0a0a', fontFamily: 'var(--font-dm-mono)', fontSize: '10px',
          fontWeight: 600, letterSpacing: '0.06em', padding: '8px 14px', cursor: 'pointer', flexShrink: 0,
        }}>
          ADD
        </button>
      </div>
      {msg && <p className="text-xs" style={{ color: 'var(--color-muted)', margin: 0 }}>{msg}</p>}
    </div>
  )
}

// ─── Brand Form (shared by edit + add) ───────────────────────────────────────
function BrandForm({
  initial,
  color,
  onSave,
  onCancel,
  isNew,
}: {
  initial: BrandData
  color: string
  onSave: (data: BrandData) => void
  onCancel: () => void
  isNew?: boolean
}) {
  const [form, setForm] = useState<BrandData>(initial)

  function set(k: keyof BrandData, v: string | string[]) {
    setForm(prev => ({ ...prev, [k]: v }))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Brand Name">
          <input value={form.name} onChange={e => set('name', e.target.value)} style={inp} placeholder="e.g. Novizio" />
        </Field>
        <Field label="Venture Type">
          <input value={form.ventureType} onChange={e => set('ventureType', e.target.value)} style={inp} placeholder="e.g. Fashion, Fintech, SaaS…" />
        </Field>
        <Field label="Tagline">
          <input value={form.tagline} onChange={e => set('tagline', e.target.value)} style={inp} placeholder="One-sentence brand promise" />
        </Field>
        <Field label="Website / App Link">
          <input value={form.website} onChange={e => set('website', e.target.value)} style={inp} placeholder="https://…" />
        </Field>
      </div>

      <Field label="Brand Voice">
        <textarea
          value={form.voice}
          onChange={e => set('voice', e.target.value)}
          rows={3}
          placeholder="Describe how this brand speaks — tone, style, what it never says…"
          style={{ ...inp, resize: 'none' }}
        />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Instagram Handle">
          <input value={form.igHandle} onChange={e => set('igHandle', e.target.value)} style={inp} placeholder="@handle" />
        </Field>
        <Field label="LinkedIn Profile URL">
          <input value={form.liProfileUrl} onChange={e => set('liProfileUrl', e.target.value)} style={inp} placeholder="https://linkedin.com/…" />
        </Field>
        <Field label="YouTube Channel ID">
          <input value={form.ytChannelId} onChange={e => set('ytChannelId', e.target.value)} style={inp} placeholder="UC…" />
        </Field>
        <Field label="GA4 Property ID">
          <input value={form.ga4PropertyId} onChange={e => set('ga4PropertyId', e.target.value)} style={inp} placeholder="G-…" />
        </Field>
      </div>

      <CompetitorField
        competitors={form.competitors}
        onChange={list => set('competitors', list)}
        color={color}
        brandName={form.name}
        industry={form.ventureType}
      />

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => onSave(form)}
          style={{
            background: color, border: 'none', borderRadius: '4px',
            color: '#0a0a0a', fontWeight: 700, fontSize: '13px',
            padding: '9px 20px', cursor: 'pointer',
          }}
        >
          {isNew ? 'Add Brand' : 'Save Changes'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '4px', color: 'var(--color-muted)',
            fontSize: '13px', padding: '9px 16px', cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ─── Venture Card (display + edit mode) ───────────────────────────────────────
function VentureCard({ brand, onUpdate, onRemove }: {
  brand: BrandData
  onUpdate: (data: BrandData) => void
  onRemove: () => void
}) {
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <div className="rounded-md p-5 flex flex-col gap-4" style={{
        backgroundColor: 'var(--color-surface)',
        border: `1px solid ${brand.color}55`,
        borderLeft: `3px solid ${brand.color}`,
      }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: brand.color }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Edit {brand.name}</span>
          </div>
        </div>
        <BrandForm
          initial={brand}
          color={brand.color}
          onSave={(data) => { onUpdate(data); setEditing(false) }}
          onCancel={() => setEditing(false)}
        />
      </div>
    )
  }

  const infoRows = [
    { label: 'Venture Type', value: brand.ventureType || '— not set' },
    { label: 'Tagline',      value: brand.tagline      || '— not set' },
    { label: 'Website',      value: brand.website      || '— not set' },
    { label: 'Brand Voice',  value: brand.voice        ? brand.voice.slice(0, 80) + (brand.voice.length > 80 ? '…' : '') : '— not set' },
    { label: 'Instagram',    value: brand.igHandle     || '— not set' },
    { label: 'LinkedIn',     value: brand.liProfileUrl || '— not set' },
    { label: 'YouTube',      value: brand.ytChannelId  || '— not set' },
    { label: 'GA4 ID',       value: brand.ga4PropertyId || '— not set' },
  ]

  return (
    <div className="rounded-md p-5 flex flex-col gap-4" style={{
      backgroundColor: 'var(--color-surface)',
      border: `1px solid ${brand.color}33`,
      borderLeft: `3px solid ${brand.color}`,
    }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: brand.color }} />
          <span className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>{brand.name}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setEditing(true)} style={{
            background: `${brand.color}18`, border: `1px solid ${brand.color}44`,
            borderRadius: '4px', color: brand.color,
            fontFamily: 'var(--font-dm-mono)', fontSize: '9px',
            letterSpacing: '0.08em', padding: '4px 12px', cursor: 'pointer',
          }}>
            EDIT
          </button>
          <button onClick={onRemove} style={{
            background: 'transparent', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '4px', color: 'var(--color-muted)',
            fontFamily: 'var(--font-dm-mono)', fontSize: '9px',
            letterSpacing: '0.08em', padding: '4px 12px', cursor: 'pointer',
          }}>
            REMOVE
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {infoRows.map(r => (
          <div key={r.label} className="flex gap-2 text-xs">
            <span style={{ color: 'var(--color-muted)', minWidth: '90px', flexShrink: 0, fontFamily: 'var(--font-dm-mono)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.06em', paddingTop: '1px' }}>{r.label}</span>
            <span style={{ color: 'var(--color-text)' }}>{r.value}</span>
          </div>
        ))}
        {brand.competitors.length > 0 && (
          <div className="flex gap-2 text-xs">
            <span style={{ color: 'var(--color-muted)', minWidth: '90px', flexShrink: 0, fontFamily: 'var(--font-dm-mono)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.06em', paddingTop: '4px' }}>Competitors</span>
            <div className="flex flex-wrap gap-1">
              {brand.competitors.map(c => (
                <span key={c} style={{
                  background: 'var(--color-navy)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '3px', padding: '1px 6px',
                  fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'var(--color-text)',
                }}>{c}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Add Brand Panel ──────────────────────────────────────────────────────────
function AddBrandPanel({ onAdd }: { onAdd: (brand: BrandData) => void }) {
  const [open, setOpen] = useState(false)

  const blank: BrandData = {
    slug: '', name: '', color: '#6366F1', tagline: '', voice: '',
    ventureType: '', website: '', igHandle: '', ytChannelId: '',
    liProfileUrl: '', ga4PropertyId: '', competitors: [],
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-2 text-sm py-3 rounded-md w-full"
        style={{
          background: 'var(--color-surface)',
          border: '1px dashed rgba(255,255,255,0.15)',
          color: 'var(--color-muted)',
          cursor: 'pointer',
          fontFamily: 'var(--font-dm-mono)',
          fontSize: '10px',
          letterSpacing: '0.08em',
        }}
      >
        <span style={{ fontSize: '16px' }}>+</span> ADD BRAND
      </button>
    )
  }

  return (
    <div className="rounded-md p-5 flex flex-col gap-4" style={{
      backgroundColor: 'var(--color-surface)',
      border: '1px dashed rgba(255,255,255,0.2)',
    }}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>New Brand</span>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Brand Color</label>
        <input
          type="color"
          value={blank.color}
          style={{ width: '48px', height: '32px', border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
          onChange={() => {}}
        />
      </div>

      <BrandForm
        initial={blank}
        color="#6366F1"
        onSave={(data) => {
          const slug = data.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
          onAdd({ ...data, slug })
          setOpen(false)
        }}
        onCancel={() => setOpen(false)}
        isNew
      />
    </div>
  )
}

// ─── Ventures Tab ─────────────────────────────────────────────────────────────
function VenturesTab() {
  const [brands, setBrands] = useState<BrandData[]>([])

  // Load brands: start from VENTURES config, merge with localStorage overrides
  useEffect(() => {
    const base: BrandData[] = VENTURES.map(v => {
      const competitors: string[] = (() => {
        try {
          const s = localStorage.getItem(`yvon_competitors_${v.slug}`)
          return s ? JSON.parse(s) : []
        } catch { return [] }
      })()
      const extra = (() => {
        try {
          const s = localStorage.getItem(`yvon_brand_${v.slug}`)
          return s ? JSON.parse(s) : {}
        } catch { return {} }
      })()
      return {
        slug: v.slug,
        name: extra.name ?? v.name,
        color: extra.color ?? v.color,
        tagline: extra.tagline ?? '',
        voice: extra.voice ?? '',
        ventureType: extra.ventureType ?? '',
        website: extra.website ?? '',
        igHandle: extra.igHandle ?? '',
        ytChannelId: extra.ytChannelId ?? '',
        liProfileUrl: extra.liProfileUrl ?? '',
        ga4PropertyId: extra.ga4PropertyId ?? '',
        competitors,
      }
    })

    // Merge any custom brands added
    try {
      const custom: BrandData[] = JSON.parse(localStorage.getItem('yvon_custom_brands') ?? '[]')
      setBrands([...base, ...custom])
    } catch {
      setBrands(base)
    }
  }, [])

  function updateBrand(slug: string, data: BrandData) {
    // Save extended fields to localStorage
    const { competitors, ...rest } = data
    localStorage.setItem(`yvon_brand_${slug}`, JSON.stringify(rest))
    localStorage.setItem(`yvon_competitors_${slug}`, JSON.stringify(competitors))
    setBrands(prev => prev.map(b => b.slug === slug ? data : b))
  }

  function removeBrand(slug: string) {
    if (!confirm(`Remove brand "${slug}"? This cannot be undone.`)) return
    // For built-in brands, just clear their stored data
    localStorage.removeItem(`yvon_brand_${slug}`)
    localStorage.removeItem(`yvon_competitors_${slug}`)
    // For custom brands, remove from the custom list
    try {
      const custom: BrandData[] = JSON.parse(localStorage.getItem('yvon_custom_brands') ?? '[]')
      localStorage.setItem('yvon_custom_brands', JSON.stringify(custom.filter(b => b.slug !== slug)))
    } catch { /* ignore */ }
    setBrands(prev => prev.filter(b => b.slug !== slug))
  }

  function addBrand(brand: BrandData) {
    try {
      const custom: BrandData[] = JSON.parse(localStorage.getItem('yvon_custom_brands') ?? '[]')
      custom.push(brand)
      localStorage.setItem('yvon_custom_brands', JSON.stringify(custom))
    } catch { /* ignore */ }
    setBrands(prev => [...prev, brand])
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        {brands.map(b => (
          <VentureCard
            key={b.slug}
            brand={b}
            onUpdate={(data) => updateBrand(b.slug, data)}
            onRemove={() => removeBrand(b.slug)}
          />
        ))}
      </div>
      <AddBrandPanel onAdd={addBrand} />
    </div>
  )
}

// ─── Main Settings Inner ───────────────────────────────────────────────────────
function SettingsInner() {
  const searchParams = useSearchParams()
  const defaultTab = (searchParams.get('tab') as Tab | null) ?? 'agents'
  const [tab, setTab]                   = useState<Tab>(defaultTab)
  const [agentSettings, setAgentSettings] = useState<AgentSettingsSave[]>([])
  const [ventureId, setVentureId]       = useState<string>('novizio')

  useEffect(() => {
    setVentureId(getActiveVentureSlugClient())
  }, [])

  useEffect(() => {
    if (!ventureId) return
    fetch(`/api/settings?ventureId=${ventureId}`)
      .then((r) => r.json())
      .then((data: AgentSettingsSave[]) => setAgentSettings(data ?? []))
      .catch(() => null)
  }, [ventureId])

  function getSettings(agentId: string): AgentSettingsSave | null {
    return agentSettings.find((s) => s.agentId === agentId) ?? null
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>
          Settings
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
          Configure agents, brands, and notifications
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 rounded-md p-1 w-fit" style={{ backgroundColor: 'var(--color-surface)' }}>
        {(['agents', 'ventures', 'notifications'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-1.5 rounded text-sm font-medium capitalize transition-colors"
            style={{
              backgroundColor: tab === t ? 'var(--color-navy)' : 'transparent',
              color: tab === t ? 'var(--color-text)' : 'var(--color-muted)',
            }}
          >
            {t === 'ventures' ? 'Brands' : t}
          </button>
        ))}
      </div>

      {/* Agents tab */}
      {tab === 'agents' && (
        <div className="flex flex-col gap-8">
          {LAYER_ORDER.map((layer) => {
            const agents = AGENTS_BY_LAYER[layer]
            return (
              <div key={layer} className="flex flex-col gap-4">
                <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>
                  {LAYER_LABELS[layer]}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {agents.map((agent) => (
                    <AgentSettingsCard
                      key={agent.id}
                      agentConfig={agent}
                      initialSettings={getSettings(agent.id)}
                      ventureId={ventureId}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Brands / Ventures tab */}
      {tab === 'ventures' && <VenturesTab />}

      {/* Notifications tab */}
      {tab === 'notifications' && (
        <div className="rounded-md p-6 flex flex-col gap-4" style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid rgba(15,52,96,0.4)',
        }}>
          <h2 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
            Email Briefings
          </h2>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
            CEO morning briefs are generated daily at 7am UTC via a Vercel cron job.
            Set <code className="px-1 rounded" style={{ backgroundColor: 'var(--color-navy)' }}>BRIEFING_EMAIL</code> and{' '}
            <code className="px-1 rounded" style={{ backgroundColor: 'var(--color-navy)' }}>RESEND_API_KEY</code> in Vercel environment variables to receive them by email.
          </p>
          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
            Cron schedule: <code>0 7 * * *</code> (7:00 UTC daily)
          </p>
        </div>
      )}
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div style={{ color: 'var(--color-muted)', padding: '24px', fontFamily: 'var(--font-dm-mono)', fontSize: '11px' }}>Loading settings…</div>}>
      <SettingsInner />
    </Suspense>
  )
}
