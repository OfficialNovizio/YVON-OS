'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useWorkspace } from '@/lib/WorkspaceContext'
import { Card, StatusBadge } from '@/components/ui'
import {
  Loader2, Save, Plus, Trash2, ExternalLink, ArrowLeft,
  Globe, Server, Database, Cpu, Activity, Shield, Smartphone,
  Monitor, Github, Bell, Cloud, LinkIcon,
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

// ── Helpers ───────────────────────────────────────────────────────────────
function SubTabs({ tabs, active, onChange }: { tabs: { id: string; label: string }[]; active: string; onChange: (id: string) => void }) {
  return (
    <div className="flex gap-1 mb-4 border-b border-white/[0.06] overflow-x-auto no-scrollbar">
      {tabs.map((t) => (
        <button key={t.id} onClick={() => onChange(t.id)}
          className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition ${
            active === t.id ? 'border-current' : 'border-transparent text-on-surface-variant hover:text-on-surface hover:border-white/10'
          }`}
          style={active === t.id ? { borderColor: 'var(--ws-accent)', color: 'var(--ws-accent)' } : {}}
        >{t.label}</button>
      ))}
    </div>
  )
}

function Field({ label, name, value, type = 'text' }: { label: string; name: string; value: string; type?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] text-on-surface-variant/60 uppercase tracking-wider">{label}</label>
      <input type={type} name={name} defaultValue={value}
        className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-white/20 transition" />
    </div>
  )
}

function SelectField({ label, name, value, options }: { label: string; name: string; value: string; options: string[] }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] text-on-surface-variant/60 uppercase tracking-wider">{label}</label>
      <select name={name} defaultValue={value}
        className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-white/20 transition">
        <option value="" className="bg-surface-container">—</option>
        {options.map(o => <option key={o} value={o} className="bg-surface-container text-on-surface">{o}</option>)}
      </select>
    </div>
  )
}

function MultiSelect({ label, options, selected, onChange }: { label: string; options: string[]; selected: string[]; onChange: (v: string[]) => void }) {
  const toggle = (opt: string) => {
    if (selected.includes(opt)) onChange(selected.filter(s => s !== opt))
    else onChange([...selected, opt])
  }
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] text-on-surface-variant/60 uppercase tracking-wider">{label}</span>
      <div className="flex flex-wrap gap-1">
        {options.map(opt => (
          <button key={opt} type="button" onClick={() => toggle(opt)}
            className={`px-2 py-0.5 rounded-full text-[11px] border transition ${
              selected.includes(opt) ? 'bg-white/[0.08]' : 'border-white/[0.06] text-on-surface-variant/60 hover:border-white/15'
            }`}
            style={selected.includes(opt) ? { borderColor: 'var(--ws-accent)', color: 'var(--ws-accent)' } : {}}
          >{opt}</button>
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

  const [audAgeGroups, setAudAgeGroups] = useState<string[]>([])
  const [audSocialStatus, setAudSocialStatus] = useState<string[]>([])
  const [audGender, setAudGender] = useState('')
  const [productCats, setProductCats] = useState<{ category: string; subcategories: string[] }[]>([])

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
        fetch(`/api/ventures/${v.id}/socials`).then(r => r.json()).then((s: VentureSocial[]) => { if (Array.isArray(s)) setSocials(s) }).catch(() => {})
      }
      setSysHealth(dash?.systemHealth ?? null)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [workspace.key])

  // ── Save ────────────────────────────────────────────────────────────────
  const saveForm = async (body: Record<string, unknown>) => {
    if (!venture) return
    setSaving(true); setSaveMsg('')
    try {
      const res = await fetch(`/api/ventures/${venture.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      if (res.ok) {
        setSaveMsg('Saved ✓')
        const vRes = await fetch('/api/ventures'); const ventures = await vRes.json()
        const updated = (ventures as VentureData[]).find(v => v.slug === workspace.key)
        if (updated) { setVenture(updated); setProductCats(updated.productCategories ?? []) }
      } else {
        const err = await res.json(); setSaveMsg(`Error: ${err.error || 'Failed'}`)
      }
    } catch { setSaveMsg('Network error') }
    setSaving(false); setTimeout(() => setSaveMsg(''), 3000)
  }

  const saveGeneral = (e: React.FormEvent) => {
    e.preventDefault()
    const fd = new FormData(e.target as HTMLFormElement)
    const body: Record<string, unknown> = {
      targetAudience: { ageGroups: audAgeGroups, socialStatus: audSocialStatus, gender: audGender, interests: venture?.targetAudience?.interests ?? [] },
      productCategories: productCats,
    }
    const strFields = ['name', 'slug', 'color', 'description', 'tagline', 'brandType', 'brandTier', 'status', 'websiteUrl', 'repoUrl', 'notionUrl']
    for (const f of strFields) { const v = fd.get(f) as string; if (v && v !== (venture as any)[f]) body[f] = v }
    const fy = fd.get('foundedYear'); if (fy && Number(fy) !== venture?.foundedYear) body['foundedYear'] = Number(fy)
    saveForm(body)
  }

  const saveDeployment = (e: React.FormEvent) => {
    e.preventDefault()
    const fd = new FormData(e.target as HTMLFormElement)
    const body: Record<string, unknown> = {}
    const fields = ['hostingPlatform', 'websiteUrl', 'iosAppUrl', 'androidAppUrl', 'repoUrl', 'ga4PropertyId', 'notionUrl']
    for (const f of fields) { const v = fd.get(f) as string; if (v && v !== (venture as any)[f]) body[f] = v }
    if (Object.keys(body).length === 0) { setSaveMsg('No changes'); return }
    saveForm(body)
  }

  // ── Social ──────────────────────────────────────────────────────────────
  const addSocial = async (platform: string) => {
    if (!venture) return
    const handle = prompt(`Enter ${platform} handle/URL:`); if (!handle) return
    try {
      const res = await fetch(`/api/ventures/${venture.id}/socials`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ platform, handleOrUrl: handle }),
      })
      if (res.ok) { const created = await res.json(); setSocials(prev => [...prev.filter(s => s.platform !== platform), created]) }
    } catch {}
  }
  const removeSocial = async (platform: string) => {
    if (!venture) return
    try {
      await fetch(`/api/ventures/${venture.id}/socials`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ platform, handleOrUrl: '' }),
      })
      setSocials(prev => prev.filter(s => s.platform !== platform))
    } catch {}
  }

  // ── Product categories ──────────────────────────────────────────────────
  const addProductCat = () => {
    const cat = prompt('Category name:'); if (!cat) return
    setProductCats(prev => [...prev, { category: cat, subcategories: [] }])
  }
  const removeProductCat = (idx: number) => setProductCats(prev => prev.filter((_, i) => i !== idx))
  const addSubcat = (idx: number) => {
    const sub = prompt('Subcategory:'); if (!sub) return
    setProductCats(prev => prev.map((c, i) => i === idx ? { ...c, subcategories: [...c.subcategories, sub] } : c))
  }
  const removeSubcat = (ci: number, si: number) => {
    setProductCats(prev => prev.map((c, i) => i === ci ? { ...c, subcategories: c.subcategories.filter((_, j) => j !== si) } : c))
  }

  // ── Loading / not found ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div>
        <Link href="/settings" className="inline-flex items-center gap-1 text-xs text-on-surface-variant hover:text-on-surface mb-3"><ArrowLeft size={14} /> Back to Settings</Link>
        <div className="flex items-center justify-center h-48"><Loader2 size={24} className="animate-spin text-on-surface-variant" /></div>
      </div>
    )
  }
  if (!venture) {
    return (
      <div>
        <Link href="/settings" className="inline-flex items-center gap-1 text-xs text-on-surface-variant hover:text-on-surface mb-3"><ArrowLeft size={14} /> Back to Settings</Link>
        <div className="text-center py-12 text-on-surface-variant">No venture data found</div>
      </div>
    )
  }

  const s = sysHealth

  return (
    <div className="px-4 sm:px-6">
      {/* Header */}
      <Link href="/settings" className="inline-flex items-center gap-1 text-xs text-on-surface-variant hover:text-on-surface mb-2"><ArrowLeft size={14} /> Back to Settings</Link>
      <div className="flex items-center gap-3 mb-1">
        <span className="h-3 w-3 rounded-full shrink-0" style={{ background: venture.color }} />
        <h1 className="text-2xl font-bold text-on-surface">{venture.name}</h1>
        <StatusBadge tone={venture.status === 'active' ? 'green' : 'yellow'}>{venture.status ?? 'active'}</StatusBadge>
      </div>
      <p className="text-sm text-on-surface-variant mb-4">{venture.brandType} · {venture.brandTier} · {venture.tagline || 'No tagline'}</p>

      <SubTabs tabs={[
        { id: 'general', label: 'General' },
        { id: 'technical', label: 'Technical' },
        { id: 'social', label: 'Social' },
        { id: 'deployment', label: 'Deployment' },
      ]} active={tab} onChange={setTab} />

      {/* ═══ GENERAL ═══ */}
      {tab === 'general' && (
        <form onSubmit={saveGeneral} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Name" name="name" value={venture.name} />
            <Field label="Slug" name="slug" value={venture.slug} />
            <Field label="Color" name="color" value={venture.color} />
            <SelectField label="Status" name="status" value={venture.status ?? 'active'} options={STATUSES} />
            <SelectField label="Brand Type" name="brandType" value={venture.brandType ?? ''} options={BRAND_TYPES} />
            <SelectField label="Brand Tier" name="brandTier" value={venture.brandTier ?? ''} options={BRAND_TIERS} />
            <Field label="Founded Year" name="foundedYear" value={venture.foundedYear?.toString() ?? ''} type="number" />
            <Field label="Tagline" name="tagline" value={venture.tagline ?? ''} />
          </div>
          <div>
            <label className="text-[10px] text-on-surface-variant/60 uppercase tracking-wider block mb-1">Description</label>
            <textarea name="description" defaultValue={venture.description ?? ''} rows={3}
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-white/20 transition resize-none" />
          </div>

          {/* Target Audience */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Activity size={15} style={{ color: 'var(--ws-accent)' }} /> Target Audience</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <MultiSelect label="Age Groups" options={AGE_GROUPS} selected={audAgeGroups} onChange={setAudAgeGroups} />
              <MultiSelect label="Social Status" options={SOCIAL_STATUSES} selected={audSocialStatus} onChange={setAudSocialStatus} />
              <div>
                <span className="text-[10px] text-on-surface-variant/60 uppercase tracking-wider block mb-1">Gender</span>
                <div className="flex flex-wrap gap-1">
                  {GENDERS.map(g => (
                    <button key={g} type="button" onClick={() => setAudGender(g)}
                      className={`px-2 py-0.5 rounded-full text-[11px] border transition ${audGender === g ? 'bg-white/[0.08]' : 'border-white/[0.06] text-on-surface-variant/60 hover:border-white/15'}`}
                      style={audGender === g ? { borderColor: 'var(--ws-accent)', color: 'var(--ws-accent)' } : {}}
                    >{g}</button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Product Categories */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Globe size={15} style={{ color: 'var(--ws-accent)' }} /> Product Categories</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {productCats.map((cat, ci) => (
                <div key={ci} className="rounded-lg border border-white/[0.06] bg-white/[0.01] p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-on-surface">{cat.category}</span>
                    <button type="button" onClick={() => removeProductCat(ci)} className="text-on-surface-variant/40 hover:text-red-400 transition"><Trash2 size={14} /></button>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-1">
                    {cat.subcategories.map((sub, si) => (
                      <span key={si} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-white/[0.05] text-on-surface-variant border border-white/[0.06]">{sub}
                        <button type="button" onClick={() => removeSubcat(ci, si)} className="text-on-surface-variant/40 hover:text-red-400">×</button>
                      </span>
                    ))}
                    <button type="button" onClick={() => addSubcat(ci)} className="px-2 py-0.5 rounded-full text-[11px] border border-dashed border-white/[0.1] text-on-surface-variant/50 hover:text-on-surface hover:border-white/20 transition">+ Add</button>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={addProductCat} className="mt-3 w-full py-2 rounded-lg border border-dashed border-white/[0.1] text-xs text-on-surface-variant/50 hover:text-on-surface hover:border-white/20 transition">+ Add Category</button>
          </Card>

          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving} className="btn-accent flex items-center gap-1.5 text-xs px-4 py-2"><Save size={14} /> {saving ? 'Saving...' : 'Save All'}</button>
            {saveMsg && <span className={`text-xs ${saveMsg.startsWith('Saved') ? 'text-emerald-400' : 'text-red-400'}`}>{saveMsg}</span>}
          </div>
        </form>
      )}

      {/* ═══ TECHNICAL ═══ */}
      {tab === 'technical' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2"><Github size={15} style={{ color: 'var(--ws-accent)' }} /> Repository</h3>
            {venture.repoUrl ? (
              <a href={venture.repoUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-on-surface hover:text-on-surface-variant inline-flex items-center gap-1">{venture.repoUrl} <ExternalLink size={12} /></a>
            ) : <p className="text-sm text-on-surface-variant/40">Not set</p>}
            {venture.localRepoPath && <p className="text-[11px] text-on-surface-variant/60 mt-1">Local: {venture.localRepoPath}</p>}
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2"><Database size={15} style={{ color: 'var(--ws-accent)' }} /> Database</h3>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-on-surface-variant">Supabase</span><StatusBadge tone={s?.supabaseConnected ? 'green' : 'red'}>{s?.supabaseConnected ? 'Connected' : 'Offline'}</StatusBadge></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Tokens today</span><span className="text-on-surface">{s?.tokenSpentToday ? (s.tokenSpentToday / 1000).toFixed(1) + 'K' : '...'}</span></div>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2"><Cpu size={15} style={{ color: 'var(--ws-accent)' }} /> API Provider</h3>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-on-surface-variant">DeepSeek</span><StatusBadge tone="green">Active</StatusBadge></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Balance</span>
                <span className={s?.deepseekBalance && s.deepseekBalance > 1 ? 'text-emerald-400' : 'text-on-surface'}>{s?.deepseekBalance != null ? `$${s.deepseekBalance.toFixed(2)}` : '—'}</span>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2"><Shield size={15} style={{ color: 'var(--ws-accent)' }} /> Security</h3>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-on-surface-variant">CSP Headers</span><StatusBadge tone="green">Enabled</StatusBadge></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">HTTPS</span><StatusBadge tone="green">Enforced</StatusBadge></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Rate Limiting</span><StatusBadge tone="green">Active</StatusBadge></div>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2"><Smartphone size={15} style={{ color: 'var(--ws-accent)' }} /> Software Status</h3>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-on-surface-variant inline-flex items-center gap-1.5"><Monitor size={13} /> Website</span>
                {venture.websiteUrl ? <StatusBadge tone="green">Deployed</StatusBadge> : <span className="text-on-surface-variant/40">No URL</span>}
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant inline-flex items-center gap-1.5"><Smartphone size={13} /> iOS</span>
                {venture.iosAppUrl ? <StatusBadge tone="green">Live</StatusBadge> : <span className="text-on-surface-variant/40">Not configured</span>}
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant inline-flex items-center gap-1.5"><Smartphone size={13} /> Android</span>
                {venture.androidAppUrl ? <StatusBadge tone="green">Live</StatusBadge> : <span className="text-on-surface-variant/40">Not configured</span>}
              </div>
            </div>
          </Card>

          {venture.notionUrl && (
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2"><Globe size={15} style={{ color: 'var(--ws-accent)' }} /> Notion</h3>
              <a href={venture.notionUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-on-surface hover:text-on-surface-variant inline-flex items-center gap-1">Open <ExternalLink size={12} /></a>
            </Card>
          )}
        </div>
      )}

      {/* ═══ SOCIAL ═══ */}
      {tab === 'social' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {SOCIAL_PLATFORMS.map(p => {
            const existing = socials.find(s => s.platform === p.id)
            return (
              <Card key={p.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm">{p.icon}</span>
                    <div className="min-w-0">
                      <p className="text-[13px] text-on-surface font-medium">{p.label}</p>
                      {existing ? <p className="text-[11px] text-on-surface-variant/60 truncate">{existing.handleOrUrl}</p>
                        : <p className="text-[11px] text-on-surface-variant/40 italic">Not connected</p>}
                    </div>
                  </div>
                  {existing ? (
                    <button onClick={() => removeSocial(p.id)} className="text-on-surface-variant/40 hover:text-red-400 transition shrink-0 ml-2"><Trash2 size={14} /></button>
                  ) : (
                    <button onClick={() => addSocial(p.id)} className="text-on-surface-variant/40 hover:text-on-surface transition shrink-0 ml-2"><Plus size={14} /></button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* ═══ DEPLOYMENT ═══ */}
      {tab === 'deployment' && (
        <form onSubmit={saveDeployment} className="space-y-4">
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Cloud size={15} style={{ color: 'var(--ws-accent)' }} /> Hosting & Apps</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <SelectField label="Hosting Platform" name="hostingPlatform" value={venture.hostingPlatform ?? ''} options={HOSTING_PLATFORMS} />
              <Field label="Website URL" name="websiteUrl" value={venture.websiteUrl ?? ''} />
              <Field label="iOS App Store URL" name="iosAppUrl" value={venture.iosAppUrl ?? ''} />
              <Field label="Android Play Store URL" name="androidAppUrl" value={venture.androidAppUrl ?? ''} />
            </div>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><LinkIcon size={15} style={{ color: 'var(--ws-accent)' }} /> Platform Connections</h3>
              <div className="grid grid-cols-1 gap-3">
                <Field label="Repository URL" name="repoUrl" value={venture.repoUrl ?? ''} />
                <Field label="Google Analytics (GA4)" name="ga4PropertyId" value={venture.ga4PropertyId ?? ''} />
                <Field label="Notion URL" name="notionUrl" value={venture.notionUrl ?? ''} />
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Server size={15} style={{ color: 'var(--ws-accent)' }} /> Connected Services</h3>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-on-surface-variant">Vercel</span>
                  {venture.websiteUrl ? <StatusBadge tone="green">Deployed</StatusBadge> : <span className="text-on-surface-variant/40">—</span>}
                </div>
                <div className="flex justify-between"><span className="text-on-surface-variant">Supabase</span><StatusBadge tone={s?.supabaseConnected ? 'green' : 'red'}>{s?.supabaseConnected ? 'Connected' : 'Offline'}</StatusBadge></div>
                <div className="flex justify-between"><span className="text-on-surface-variant">GA4</span>
                  {venture.ga4PropertyId ? <StatusBadge tone="green">Connected</StatusBadge> : <span className="text-on-surface-variant/40">Not set</span>}
                </div>
                <div className="flex justify-between"><span className="text-on-surface-variant">YouTube</span>
                  {venture.ytChannelId ? <StatusBadge tone="green">Connected</StatusBadge> : <span className="text-on-surface-variant/40">Not set</span>}
                </div>
                <div className="flex justify-between"><span className="text-on-surface-variant">CI/CD</span><StatusBadge tone="green">GitHub Actions</StatusBadge></div>
              </div>
            </Card>
          </div>

          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving} className="btn-accent flex items-center gap-1.5 text-xs px-4 py-2"><Save size={14} /> {saving ? 'Saving...' : 'Save Deployment'}</button>
            {saveMsg && <span className={`text-xs ${saveMsg.startsWith('Saved') ? 'text-emerald-400' : 'text-red-400'}`}>{saveMsg}</span>}
          </div>
        </form>
      )}
    </div>
  )
}
