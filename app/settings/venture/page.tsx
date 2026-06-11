'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useWorkspace } from '@/lib/WorkspaceContext'
import { Card, StatusBadge } from '@/components/ui'
import {
  Loader2, Save, Plus, Trash2, ExternalLink, ArrowLeft,
  Globe, Server, Database, Cpu, Activity, Shield, Smartphone,
  Monitor, Github, Bell,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────
interface VentureData {
  id: string; name: string; slug: string; color: string
  description?: string; tagline?: string
  brandType?: string; brandTier?: string; status?: string
  websiteUrl?: string; logoUrl?: string; foundedYear?: number
  repoUrl?: string; notionUrl?: string; localRepoPath?: string
  operatingCountries?: string[]; operatingCities?: string[]
  targetAudience?: {
    ageGroups?: string[]; socialStatus?: string[]; gender?: string
    ageRange?: string; incomeTier?: string; region?: string; description?: string; interests?: string[]
  }
  productCategories?: { category: string; subcategories: string[] }[]
  iosAppUrl?: string; androidAppUrl?: string; hostingPlatform?: string
  igHandle?: string; ytChannelId?: string; liProfileUrl?: string; ga4PropertyId?: string
}

interface VentureSocial {
  id: string; ventureId: string; platform: string; handleOrUrl: string; createdAt: string
}

interface SystemHealth {
  supabaseConnected: boolean; agentsLive: number; tokenSpentToday: number
  deepseekBalance: number | null; status: string
}

const SOCIAL_PLATFORMS = [
  { id: 'instagram', label: 'Instagram', icon: '📸' },
  { id: 'youtube', label: 'YouTube', icon: '▶️' },
  { id: 'linkedin', label: 'LinkedIn', icon: '💼' },
  { id: 'tiktok', label: 'TikTok', icon: '🎵' },
  { id: 'twitter', label: 'Twitter / X', icon: '🐦' },
  { id: 'facebook', label: 'Facebook', icon: '📘' },
  { id: 'pinterest', label: 'Pinterest', icon: '📌' },
  { id: 'github', label: 'GitHub', icon: '🐙' },
  { id: 'discord', label: 'Discord', icon: '💬' },
  { id: 'telegram', label: 'Telegram', icon: '✈️' },
] as const

const AGE_GROUPS = ['13-17', '18-24', '25-34', '35-44', '45-54', '55+']
const SOCIAL_STATUSES = ['Working', 'College', 'School', 'Housewife', 'Self-employed', 'Unemployed', 'Retired']
const GENDERS = ['Male', 'Female', 'Unisex', 'All']
const BRAND_TYPES = ['ecommerce', 'saas', 'agency', 'media', 'marketplace']
const BRAND_TIERS = ['budget', 'fast-fashion', 'mid-market', 'contemporary', 'premium', 'luxury', 'ultra-luxury']
const STATUSES = ['active', 'paused', 'archived']
const HOSTING_PLATFORMS = ['vercel', 'aws', 'railway', 'fly.io', 'netlify', 'cloudflare', 'custom', 'none']
const CLOTHING_CATEGORIES: { category: string; defaultSubs: string[] }[] = [
  { category: 'Ethnic', defaultSubs: ['Salwar Suit', 'Saree', 'Kurti', 'Lehenga', 'Anarkali', 'Dupatta'] },
  { category: 'Western', defaultSubs: ['Crop Top', 'Jeans', 'T-Shirt', 'Dress', 'Skirt', 'Blazer'] },
  { category: 'Fusion', defaultSubs: ['Indo-Western Dress', 'Dhoti Pants', 'Jacket Set'] },
  { category: 'Accessories', defaultSubs: ['Jewelry', 'Bags', 'Scarves', 'Belts'] },
  { category: 'Footwear', defaultSubs: ['Heels', 'Flats', 'Sneakers', 'Sandals', 'Boots'] },
]

// ── Sub-tabs ──────────────────────────────────────────────────────────────
function SubTabs({ tabs, active, onChange }: { tabs: { id: string; label: string }[]; active: string; onChange: (id: string) => void }) {
  return (
    <div className="flex gap-1 mb-4 border-b border-white/[0.06] overflow-x-auto no-scrollbar">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition ${
            active === t.id ? 'border-current' : 'border-transparent text-on-surface-variant hover:text-on-surface hover:border-white/10'
          }`}
          style={active === t.id ? { borderColor: 'var(--ws-accent)', color: 'var(--ws-accent)' } : {}}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

// ── Inline field ──────────────────────────────────────────────────────────
function Field({ label, name, value, type = 'text', placeholder }: { label: string; name: string; value: string; type?: string; placeholder?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] text-on-surface-variant/60 uppercase tracking-wider">{label}</label>
      <input
        type={type} name={name} defaultValue={value} placeholder={placeholder}
        className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-white/20 transition"
      />
    </div>
  )
}

// ── Multi-select chips ────────────────────────────────────────────────────
function MultiSelect({ label, options, selected, onChange }: { label: string; options: string[]; selected: string[]; onChange: (v: string[]) => void }) {
  const toggle = (opt: string) => {
    if (selected.includes(opt)) onChange(selected.filter(s => s !== opt))
    else onChange([...selected, opt])
  }
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] text-on-surface-variant/60 uppercase tracking-wider">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map(opt => (
          <button
            key={opt} type="button"
            onClick={() => toggle(opt)}
            className={`px-2.5 py-1 rounded-full text-[12px] border transition ${
              selected.includes(opt)
                ? 'border-current text-on-surface bg-white/[0.08]'
                : 'border-white/[0.08] text-on-surface-variant/60 hover:border-white/15'
            }`}
            style={selected.includes(opt) ? { borderColor: 'var(--ws-accent)', color: 'var(--ws-accent)' } : {}}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
export default function VentureSettingsPage() {
  const { workspace } = useWorkspace()
  const [tab, setTab] = useState('general')
  const [venture, setVenture] = useState<VentureData | null>(null)
  const [socials, setSocials] = useState<VentureSocial[]>([])
  const [sysHealth, setSysHealth] = useState<SystemHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  // Editable state for multi-select & product categories
  const [audAgeGroups, setAudAgeGroups] = useState<string[]>([])
  const [audSocialStatus, setAudSocialStatus] = useState<string[]>([])
  const [audGender, setAudGender] = useState('')
  const [productCats, setProductCats] = useState<{ category: string; subcategories: string[] }[]>([])

  // ── Fetch venture + system ──────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      fetch('/api/ventures').then(r => r.json()),
      fetch('/api/dashboard').then(r => r.json()),
    ]).then(([ventures, dash]) => {
      const v = (ventures as VentureData[]).find(v => v.slug === workspace.key)
      if (v) {
        setVenture(v)
        setAudAgeGroups(v.targetAudience?.ageGroups ?? [])
        setAudSocialStatus(v.targetAudience?.socialStatus ?? [])
        setAudGender(v.targetAudience?.gender ?? '')
        setProductCats(v.productCategories ?? [])
        // Fetch socials
        fetch(`/api/ventures/${v.id}/socials`).then(r => r.json()).then((s: VentureSocial[]) => { if (Array.isArray(s)) setSocials(s) }).catch(() => {})
      }
      setSysHealth(dash?.systemHealth ?? null)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [workspace.key])

  // ── Save General form ───────────────────────────────────────────────────
  const saveGeneral = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!venture) return
    setSaving(true); setSaveMsg('')
    const form = e.target as HTMLFormElement
    const fd = new FormData(form)

    const body: Record<string, unknown> = {
      targetAudience: {
        ageGroups: audAgeGroups,
        socialStatus: audSocialStatus,
        gender: audGender,
        interests: venture.targetAudience?.interests ?? [],
      },
      productCategories: productCats,
    }
    // Simple string fields
    const strFields = ['name', 'slug', 'color', 'description', 'tagline', 'brandType', 'brandTier', 'status', 'websiteUrl', 'repoUrl', 'notionUrl']
    for (const f of strFields) {
      const val = fd.get(f) as string
      if (val && val !== (venture as any)[f]) body[f] = val
    }
    const fy = fd.get('foundedYear')
    if (fy && Number(fy) !== venture.foundedYear) body['foundedYear'] = Number(fy)

    try {
      const res = await fetch(`/api/ventures/${venture.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setSaveMsg('Saved ✓')
        // Refresh
        const vRes = await fetch('/api/ventures')
        const ventures = await vRes.json()
        const updated = (ventures as VentureData[]).find(v => v.slug === workspace.key)
        if (updated) { setVenture(updated); setProductCats(updated.productCategories ?? []) }
      } else {
        const err = await res.json()
        setSaveMsg(`Error: ${err.error || 'Failed'}`)
      }
    } catch { setSaveMsg('Network error') }
    setSaving(false)
    setTimeout(() => setSaveMsg(''), 3000)
  }

  // ── Social CRUD ─────────────────────────────────────────────────────────
  const addSocial = async (platform: string) => {
    if (!venture) return
    const handle = prompt(`Enter ${platform} handle/URL:`)
    if (!handle) return
    try {
      const res = await fetch(`/api/ventures/${venture.id}/socials`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, handleOrUrl: handle }),
      })
      if (res.ok) {
        const created = await res.json()
        setSocials(prev => [...prev.filter(s => s.platform !== platform), created])
      }
    } catch {}
  }
  const removeSocial = async (platform: string) => {
    if (!venture) return
    try {
      await fetch(`/api/ventures/${venture.id}/socials`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, handleOrUrl: '' }),
      })
      setSocials(prev => prev.filter(s => s.platform !== platform))
    } catch {}
  }

  // ── Product category CRUD ──────────────────────────────────────────────
  const addProductCat = () => {
    const cat = prompt('Category name (e.g., "Ethnic", "Western"):')
    if (!cat) return
    setProductCats(prev => [...prev, { category: cat, subcategories: [] }])
  }
  const removeProductCat = (idx: number) => {
    setProductCats(prev => prev.filter((_, i) => i !== idx))
  }
  const addSubcat = (idx: number) => {
    const sub = prompt('Subcategory name:')
    if (!sub) return
    setProductCats(prev => prev.map((c, i) => i === idx ? { ...c, subcategories: [...c.subcategories, sub] } : c))
  }
  const removeSubcat = (catIdx: number, subIdx: number) => {
    setProductCats(prev => prev.map((c, i) => i === catIdx ? { ...c, subcategories: c.subcategories.filter((_, j) => j !== subIdx) } : c))
  }

  // ── Loading ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div>
        <Link href="/settings" className="inline-flex items-center gap-1 text-xs text-on-surface-variant hover:text-on-surface mb-3">
          <ArrowLeft size={14} /> Back to Settings
        </Link>
        <div className="flex items-center justify-center h-48"><Loader2 size={24} className="animate-spin text-on-surface-variant" /></div>
      </div>
    )
  }
  if (!venture) {
    return (
      <div>
        <Link href="/settings" className="inline-flex items-center gap-1 text-xs text-on-surface-variant hover:text-on-surface mb-3">
          <ArrowLeft size={14} /> Back to Settings
        </Link>
        <div className="text-center py-12 text-on-surface-variant">No venture data found</div>
      </div>
    )
  }

  const s = sysHealth

  // ═════════════════════════════════════════════════════════════════════════
  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <Link href="/settings" className="inline-flex items-center gap-1 text-xs text-on-surface-variant hover:text-on-surface mb-2">
        <ArrowLeft size={14} /> Back to Settings
      </Link>
      <div className="flex items-center gap-3 mb-1">
        <span className="h-3 w-3 rounded-full shrink-0" style={{ background: venture.color }} />
        <h1 className="text-2xl font-bold text-on-surface">{venture.name}</h1>
        <StatusBadge tone={venture.status === 'active' ? 'green' : 'yellow'}>{venture.status ?? 'active'}</StatusBadge>
      </div>
      <p className="text-sm text-on-surface-variant mb-4">{venture.brandType} · {venture.brandTier} · {venture.tagline || 'No tagline'}</p>

      {/* Sub-tabs */}
      <SubTabs
        tabs={[
          { id: 'general', label: 'General' },
          { id: 'technical', label: 'Technical' },
          { id: 'social', label: 'Social' },
          { id: 'deployment', label: 'Deployment' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {/* ════ GENERAL TAB ════ */}
      {tab === 'general' && (
        <form onSubmit={saveGeneral} className="space-y-4">
          {/* Basic info */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3"><Globe size={16} style={{ color: 'var(--ws-accent)' }} /><h3 className="text-sm font-semibold">Basic Info</h3></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Name" name="name" value={venture.name} />
              <Field label="Slug" name="slug" value={venture.slug} />
              <Field label="Color" name="color" value={venture.color} />
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-on-surface-variant/60 uppercase tracking-wider">Status</label>
                <select name="status" defaultValue={venture.status ?? 'active'} className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none">
                  {STATUSES.map(s => <option key={s} value={s} className="bg-surface-container text-on-surface">{s}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-on-surface-variant/60 uppercase tracking-wider">Brand Type</label>
                <select name="brandType" defaultValue={venture.brandType ?? ''} className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none">
                  <option value="" className="bg-surface-container">—</option>
                  {BRAND_TYPES.map(t => <option key={t} value={t} className="bg-surface-container text-on-surface">{t}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-on-surface-variant/60 uppercase tracking-wider">Brand Tier</label>
                <select name="brandTier" defaultValue={venture.brandTier ?? ''} className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none">
                  <option value="" className="bg-surface-container">—</option>
                  {BRAND_TIERS.map(t => <option key={t} value={t} className="bg-surface-container text-on-surface">{t}</option>)}
                </select>
              </div>
              <Field label="Founded Year" name="foundedYear" value={venture.foundedYear?.toString() ?? ''} type="number" />
            </div>
            <div className="grid grid-cols-1 gap-3 mt-3">
              <Field label="Tagline" name="tagline" value={venture.tagline ?? ''} />
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-on-surface-variant/60 uppercase tracking-wider">Description</label>
                <textarea name="description" defaultValue={venture.description ?? ''} rows={3}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-white/20 transition resize-none" />
              </div>
            </div>
          </Card>

          {/* Target Audience */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3"><Activity size={16} style={{ color: 'var(--ws-accent)' }} /><h3 className="text-sm font-semibold">Target Audience</h3></div>
            <div className="space-y-4">
              <MultiSelect label="Age Groups" options={AGE_GROUPS} selected={audAgeGroups} onChange={setAudAgeGroups} />
              <MultiSelect label="Social Status" options={SOCIAL_STATUSES} selected={audSocialStatus} onChange={setAudSocialStatus} />
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-on-surface-variant/60 uppercase tracking-wider">Gender</span>
                <div className="flex flex-wrap gap-1.5">
                  {GENDERS.map(g => (
                    <button key={g} type="button" onClick={() => setAudGender(g)}
                      className={`px-2.5 py-1 rounded-full text-[12px] border transition ${
                        audGender === g ? 'border-current text-on-surface bg-white/[0.08]' : 'border-white/[0.08] text-on-surface-variant/60 hover:border-white/15'
                      }`}
                      style={audGender === g ? { borderColor: 'var(--ws-accent)', color: 'var(--ws-accent)' } : {}}
                    >{g}</button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Product Categories */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3"><Globe size={16} style={{ color: 'var(--ws-accent)' }} /><h3 className="text-sm font-semibold">Product Categories</h3></div>
            <div className="space-y-3">
              {productCats.map((cat, ci) => (
                <div key={ci} className="rounded-lg border border-white/[0.06] bg-white/[0.01] p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-on-surface">{cat.category}</span>
                    <button type="button" onClick={() => removeProductCat(ci)} className="text-on-surface-variant/40 hover:text-red-400 transition"><Trash2 size={14} /></button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.subcategories.map((sub, si) => (
                      <span key={si} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] bg-white/[0.05] text-on-surface-variant border border-white/[0.06]">
                        {sub}
                        <button type="button" onClick={() => removeSubcat(ci, si)} className="text-on-surface-variant/40 hover:text-red-400">×</button>
                      </span>
                    ))}
                    <button type="button" onClick={() => addSubcat(ci)}
                      className="px-2.5 py-0.5 rounded-full text-[11px] border border-dashed border-white/[0.1] text-on-surface-variant/50 hover:text-on-surface hover:border-white/20 transition">
                      + Add
                    </button>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addProductCat}
                className="w-full py-2 rounded-lg border border-dashed border-white/[0.1] text-xs text-on-surface-variant/50 hover:text-on-surface hover:border-white/20 transition">
                + Add Category
              </button>
            </div>
          </Card>

          {/* Save */}
          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving} className="btn-accent flex items-center gap-1.5 text-xs px-4 py-2">
              <Save size={14} /> {saving ? 'Saving...' : 'Save All Changes'}
            </button>
            {saveMsg && <span className={`text-xs ${saveMsg.startsWith('Saved') ? 'text-emerald-400' : 'text-red-400'}`}>{saveMsg}</span>}
          </div>
        </form>
      )}

      {/* ════ TECHNICAL TAB ════ */}
      {tab === 'technical' && (
        <div className="space-y-3">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3"><Github size={16} style={{ color: 'var(--ws-accent)' }} /><h3 className="text-sm font-semibold">Repository</h3></div>
            {venture.repoUrl ? (
              <a href={venture.repoUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-on-surface hover:text-on-surface-variant inline-flex items-center gap-1">
                {venture.repoUrl} <ExternalLink size={12} />
              </a>
            ) : <p className="text-sm text-on-surface-variant/40">No repository set</p>}
            {venture.localRepoPath && <p className="text-[12px] text-on-surface-variant/60 mt-1">Local: {venture.localRepoPath}</p>}
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3"><Database size={16} style={{ color: 'var(--ws-accent)' }} /><h3 className="text-sm font-semibold">Database</h3></div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-on-surface-variant">Supabase</span><StatusBadge tone={s?.supabaseConnected ? 'green' : 'red'}>{s?.supabaseConnected ? 'Connected' : 'Offline'}</StatusBadge></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Tokens today</span><span className="text-on-surface">{s?.tokenSpentToday ? (s.tokenSpentToday / 1000).toFixed(1) + 'K' : 'Awaiting data...'}</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">PostgreSQL</span><span className="text-on-surface">15</span></div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3"><Cpu size={16} style={{ color: 'var(--ws-accent)' }} /><h3 className="text-sm font-semibold">API Provider</h3></div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-on-surface-variant">Provider</span><span className="text-on-surface">DeepSeek</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Model</span><span className="text-on-surface">v4 Pro</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Balance</span>
                <span className={s?.deepseekBalance && s.deepseekBalance > 1 ? 'text-emerald-400' : 'text-on-surface'}>
                  {s?.deepseekBalance != null ? `$${s.deepseekBalance.toFixed(2)}` : '—'}
                </span>
              </div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Status</span><StatusBadge tone="green">Active</StatusBadge></div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3"><Server size={16} style={{ color: 'var(--ws-accent)' }} /><h3 className="text-sm font-semibold">Software Status</h3></div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-on-surface-variant inline-flex items-center gap-1.5"><Monitor size={13} /> Website</span>
                {venture.websiteUrl ? <StatusBadge tone="green">Deployed</StatusBadge> : <span className="text-on-surface-variant/40">No URL</span>}
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant inline-flex items-center gap-1.5"><Smartphone size={13} /> iOS App</span>
                {venture.iosAppUrl ? <StatusBadge tone="green">Live</StatusBadge> : <span className="text-on-surface-variant/40">Not configured</span>}
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant inline-flex items-center gap-1.5"><Smartphone size={13} /> Android App</span>
                {venture.androidAppUrl ? <StatusBadge tone="green">Live</StatusBadge> : <span className="text-on-surface-variant/40">Not configured</span>}
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3"><Shield size={16} style={{ color: 'var(--ws-accent)' }} /><h3 className="text-sm font-semibold">Security</h3></div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-on-surface-variant">CSP Headers</span><StatusBadge tone="green">Enabled</StatusBadge></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">HTTPS</span><StatusBadge tone="green">Enforced</StatusBadge></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Rate Limiting</span><StatusBadge tone="green">Active</StatusBadge></div>
            </div>
          </Card>

          {venture.notionUrl && (
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3"><Globe size={16} style={{ color: 'var(--ws-accent)' }} /><h3 className="text-sm font-semibold">Notion Workspace</h3></div>
              <a href={venture.notionUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-on-surface hover:text-on-surface-variant inline-flex items-center gap-1">
                Open workspace <ExternalLink size={12} />
              </a>
            </Card>
          )}
        </div>
      )}

      {/* ════ SOCIAL TAB ════ */}
      {tab === 'social' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SOCIAL_PLATFORMS.map(p => {
            const existing = socials.find(s => s.platform === p.id)
            return (
              <Card key={p.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm">{p.icon}</span>
                    <div className="min-w-0">
                      <p className="text-[13px] text-on-surface font-medium">{p.label}</p>
                      {existing ? (
                        <p className="text-[11px] text-on-surface-variant/60 truncate">{existing.handleOrUrl}</p>
                      ) : (
                        <p className="text-[11px] text-on-surface-variant/40 italic">Not connected</p>
                      )}
                    </div>
                  </div>
                  {existing ? (
                    <button onClick={() => removeSocial(p.id)} className="text-on-surface-variant/40 hover:text-red-400 transition shrink-0 ml-2">
                      <Trash2 size={14} />
                    </button>
                  ) : (
                    <button onClick={() => addSocial(p.id)} className="text-on-surface-variant/40 hover:text-on-surface transition shrink-0 ml-2">
                      <Plus size={14} />
                    </button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* ════ DEPLOYMENT TAB ════ */}
      {tab === 'deployment' && (
        <div className="space-y-3">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3"><Server size={16} style={{ color: 'var(--ws-accent)' }} /><h3 className="text-sm font-semibold">Deployment Configuration</h3></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-on-surface-variant/60 uppercase tracking-wider">Hosting Platform</label>
                <span className="text-sm text-on-surface">{venture.hostingPlatform || 'Not set'}</span>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-on-surface-variant/60 uppercase tracking-wider">Website</label>
                {venture.websiteUrl ? (
                  <a href={venture.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-on-surface hover:text-on-surface-variant inline-flex items-center gap-1">
                    {venture.websiteUrl} <ExternalLink size={12} />
                  </a>
                ) : <span className="text-sm text-on-surface-variant/40">Not set</span>}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-on-surface-variant/60 uppercase tracking-wider">iOS App</label>
                {venture.iosAppUrl ? (
                  <a href={venture.iosAppUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-on-surface hover:text-on-surface-variant inline-flex items-center gap-1">
                    App Store <ExternalLink size={12} />
                  </a>
                ) : <span className="text-sm text-on-surface-variant/40">None</span>}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-on-surface-variant/60 uppercase tracking-wider">Android App</label>
                {venture.androidAppUrl ? (
                  <a href={venture.androidAppUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-on-surface hover:text-on-surface-variant inline-flex items-center gap-1">
                    Play Store <ExternalLink size={12} />
                  </a>
                ) : <span className="text-sm text-on-surface-variant/40">None</span>}
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3"><Globe size={16} style={{ color: 'var(--ws-accent)' }} /><h3 className="text-sm font-semibold">Analytics</h3></div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-on-surface-variant">Google Analytics</span>
                {venture.ga4PropertyId ? <StatusBadge tone="green">Connected</StatusBadge> : <span className="text-on-surface-variant/40">Not set</span>}
              </div>
              <div className="flex justify-between"><span className="text-on-surface-variant">YouTube</span>
                {venture.ytChannelId ? <StatusBadge tone="green">Connected</StatusBadge> : <span className="text-on-surface-variant/40">Not set</span>}
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3"><Bell size={16} style={{ color: 'var(--ws-accent)' }} /><h3 className="text-sm font-semibold">CI / CD</h3></div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-on-surface-variant">Pipeline</span><StatusBadge tone="green">GitHub Actions</StatusBadge></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Auto-deploy</span><StatusBadge tone="green">On push to master</StatusBadge></div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
