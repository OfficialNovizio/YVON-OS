'use client'

import { useState, useEffect, useCallback } from 'react'
import { PageHeader, StatusBadge, Card } from '@/components/ui'
import { useWorkspace } from '@/lib/WorkspaceContext'
import {
  Loader2, ToggleLeft, ToggleRight, Save, Trash2, Plus, ExternalLink,
  Globe, Server, Database, Cpu, Activity, Bell, Key, Shield,
  ChevronDown, ChevronUp, User,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────
interface VentureConfig {
  id: string; name: string; slug: string; color: string
  description?: string; tagline?: string
  brandType?: string; brandTier?: string
  status?: string; websiteUrl?: string; logoUrl?: string
  foundedYear?: number; repoUrl?: string; notionUrl?: string
  igHandle?: string; ytChannelId?: string
  liProfileUrl?: string; ga4PropertyId?: string
}
interface VentureSocial { id: string; platform: string; handleOrUrl: string }
interface SystemInfo {
  systemHealth: {
    status: string; agentsLive: number; supabaseConnected: boolean
    deepseekBalance: number | null; tokenSpentToday: number
  }
}

// ── localStorage helpers ─────────────────────────────────
const LS_KEYS: Record<string, string> = {
  notifications: 'yvon_settings_notifications', autoApprove: 'yvon_settings_auto_approve',
  darkMode: 'yvon_settings_dark_mode', compactSidebar: 'yvon_settings_compact_sidebar',
  telegramNudge: 'yvon_settings_telegram_nudge', weeklyDigest: 'yvon_settings_weekly_digest',
}
function loadBool(k: string, fb: boolean): boolean {
  if (typeof window === 'undefined') return fb
  try { const v = localStorage.getItem(k); return v === null ? fb : v === 'true' } catch { return fb }
}
function saveBool(k: string, v: boolean) { try { localStorage.setItem(k, String(v)) } catch {} }

const SOCIAL_PLATFORMS = [
  'instagram','youtube','linkedin','tiktok','twitter','facebook','pinterest','github','discord','telegram',
] as const

// ── ExpandableSection ────────────────────────────────────
function Section({
  icon: Icon, title, subtitle, badge, defaultOpen = false, children,
}: {
  icon: React.ComponentType<{ size: number; style?: React.CSSProperties }>
  title: string; subtitle: string; badge?: React.ReactNode
  defaultOpen?: boolean; children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <Card className="overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full p-4 flex items-center gap-3 text-left hover:bg-white/[0.02] transition">
        <Icon size={18} style={{ color: 'var(--ws-accent)' }} />
        <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-on-surface">{title}</p><p className="text-[11px] text-on-surface-variant/60 mt-0.5">{subtitle}</p></div>
        {badge}
        {open ? <ChevronUp size={16} className="text-on-surface-variant shrink-0" /> : <ChevronDown size={16} className="text-on-surface-variant shrink-0" />}
      </button>
      {open && <div className="px-4 pb-4 border-t border-white/[0.04]"><div className="pt-3">{children}</div></div>}
    </Card>
  )
}

function ToggleRow({ label, desc, value, onChange }: { label: string; desc: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-0">
      <div className="mr-4"><p className="text-[13px] text-on-surface">{label}</p><p className="text-[11px] text-on-surface-variant/60 mt-0.5">{desc}</p></div>
      <button onClick={() => onChange(!value)} className="shrink-0 text-on-surface-variant hover:text-on-surface transition">
        {value ? <ToggleRight size={22} style={{ color: 'var(--ws-accent)' }} /> : <ToggleLeft size={22} />}
      </button>
    </div>
  )
}

// ═════════════════════════════════════════════════════════
//  PAGE
// ═════════════════════════════════════════════════════════
export default function SettingsPage() {
  const { workspace } = useWorkspace()

  // Data
  const [venture, setVenture] = useState<VentureConfig | null>(null)
  const [socials, setSocials] = useState<VentureSocial[]>([])
  const [sysInfo, setSysInfo] = useState<SystemInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingVenture, setSavingVenture] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  // Prefs
  const [notifications, setN] = useState(true)
  const [autoApprove, setAA] = useState(false); const [darkMode, setDM] = useState(true)
  const [compactSidebar, setCS] = useState(false); const [telegramNudge, setTN] = useState(true)
  const [weeklyDigest, setWD] = useState(true)

  useEffect(() => {
    setN(loadBool('notifications', true)); setAA(loadBool('autoApprove', false)); setDM(loadBool('darkMode', true))
    setCS(loadBool('compactSidebar', false)); setTN(loadBool('telegramNudge', true)); setWD(loadBool('weeklyDigest', true))
  }, [])
  const setNotifications = useCallback((v: boolean) => { setN(v); saveBool('notifications', v) }, [])
  const setAutoApprove    = useCallback((v: boolean) => { setAA(v); saveBool('autoApprove', v) }, [])
  const setDarkMode = useCallback((v: boolean) => { setDM(v); saveBool('darkMode', v); document.documentElement.classList.toggle('dark', v) }, [])
  const setCompactSidebar = useCallback((v: boolean) => { setCS(v); saveBool('compactSidebar', v) }, [])
  const setTelegramNudge  = useCallback((v: boolean) => { setTN(v); saveBool('telegramNudge', v) }, [])
  const setWeeklyDigest   = useCallback((v: boolean) => { setWD(v); saveBool('weeklyDigest', v) }, [])

  // Fetch
  useEffect(() => {
    Promise.all([
      fetch('/api/ventures').then(r => r.json()),
      fetch('/api/dashboard').then(r => r.json()),
    ]).then(([ventures, dash]) => {
      const v = ventures.find((x: VentureConfig) => x.slug === workspace.key)
      if (v) {
        setVenture(v)
        fetch(`/api/ventures/${v.id}/socials`).then(r => r.json()).then((s: VentureSocial[]) => { if (Array.isArray(s)) setSocials(s) }).catch(() => {})
      }
      setSysInfo(dash)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [workspace.key])

  // Save venture profile
  const saveVenture = async (e: React.FormEvent) => {
    e.preventDefault(); if (!venture) return
    setSavingVenture(true); setSaveMsg('')
    const fd = new FormData(e.target as HTMLFormElement)
    const body: Record<string, unknown> = {}
    for (const f of ['name','slug','color','description','tagline','brandType','brandTier','status','websiteUrl','repoUrl','notionUrl']) {
      const val = fd.get(f) as string
      if (val !== null && val !== ((venture as any)[f]?.toString() ?? '')) body[f] = val
    }
    const fy = fd.get('foundedYear')
    if (fy && Number(fy) !== venture.foundedYear) body['foundedYear'] = Number(fy)
    if (Object.keys(body).length === 0) { setSaveMsg('No changes'); setSavingVenture(false); return }
    try {
      const res = await fetch(`/api/ventures/${venture.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.ok) {
        setSaveMsg('Saved ✓')
        const vRes = await fetch('/api/ventures'); const ventures = await vRes.json()
        const updated = ventures.find((x: VentureConfig) => x.slug === workspace.key)
        if (updated) setVenture(updated)
      } else { const err = await res.json(); setSaveMsg(err.error || 'Failed') }
    } catch { setSaveMsg('Network error') }
    setSavingVenture(false); setTimeout(() => setSaveMsg(''), 3000)
  }

  const addSocial = async (platform: string) => {
    if (!venture) return; const h = prompt(`Enter ${platform} handle/URL:`); if (!h) return
    try {
      const res = await fetch(`/api/ventures/${venture.id}/socials`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ platform, handleOrUrl: h }) })
      if (res.ok) { const created = await res.json(); setSocials(prev => [...prev.filter(s => s.platform !== platform), created]) }
    } catch {}
  }
  const removeSocial = async (platform: string) => {
    if (!venture) return
    try {
      await fetch(`/api/ventures/${venture.id}/socials`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ platform, handleOrUrl: '' }) })
      setSocials(prev => prev.filter(s => s.platform !== platform))
    } catch {}
  }

  const s = sysInfo?.systemHealth

  if (loading) return <div><PageHeader title="Settings" subtitle="Configure YVON OS" /><div className="flex justify-center h-48 items-center"><Loader2 size={24} className="animate-spin text-on-surface-variant" /></div></div>

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader title="Settings" subtitle={`${workspace.name} · Configure venture, integrations, and preferences`} />

      <div className="space-y-3">
        {/* ═══ 1. VENTURE PROFILE ═══ */}
        <Section icon={Globe} title="Venture Profile" subtitle="Name, brand details, links — edit and save" defaultOpen badge={savingVenture ? <Loader2 size={14} className="animate-spin" /> : undefined}>
          <form onSubmit={saveVenture}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div><label className="text-[10px] uppercase tracking-wider text-on-surface-variant/60">Name</label><input name="name" defaultValue={venture?.name ?? ''} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface mt-1" /></div>
              <div><label className="text-[10px] uppercase tracking-wider text-on-surface-variant/60">Slug</label><input name="slug" defaultValue={venture?.slug ?? ''} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface mt-1" /></div>
              <div><label className="text-[10px] uppercase tracking-wider text-on-surface-variant/60">Color</label><div className="flex items-center gap-2 mt-1"><span className="h-5 w-5 rounded-full border border-white/20" style={{ background: venture?.color }} /><input name="color" defaultValue={venture?.color ?? ''} className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface" /></div></div>
              <div><label className="text-[10px] uppercase tracking-wider text-on-surface-variant/60">Status</label><select name="status" defaultValue={venture?.status ?? 'active'} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface mt-1"><option value="active">Active</option><option value="paused">Paused</option><option value="archived">Archived</option></select></div>
              <div><label className="text-[10px] uppercase tracking-wider text-on-surface-variant/60">Tagline</label><input name="tagline" defaultValue={venture?.tagline ?? ''} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface mt-1" /></div>
              <div><label className="text-[10px] uppercase tracking-wider text-on-surface-variant/60">Brand Type</label><select name="brandType" defaultValue={venture?.brandType ?? ''} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface mt-1"><option value="">—</option><option value="ecommerce">E-commerce</option><option value="saas">SaaS</option><option value="agency">Agency</option><option value="media">Media</option><option value="marketplace">Marketplace</option></select></div>
              <div><label className="text-[10px] uppercase tracking-wider text-on-surface-variant/60">Brand Tier</label><select name="brandTier" defaultValue={venture?.brandTier ?? ''} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface mt-1"><option value="">—</option><option value="budget">Budget</option><option value="fast-fashion">Fast Fashion</option><option value="mid-market">Mid Market</option><option value="contemporary">Contemporary</option><option value="premium">Premium</option><option value="luxury">Luxury</option><option value="ultra-luxury">Ultra Luxury</option></select></div>
              <div className="sm:col-span-2"><label className="text-[10px] uppercase tracking-wider text-on-surface-variant/60">Description</label><textarea name="description" defaultValue={venture?.description ?? ''} rows={2} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface mt-1 resize-none" /></div>
              <div><label className="text-[10px] uppercase tracking-wider text-on-surface-variant/60">Website</label><input name="websiteUrl" defaultValue={venture?.websiteUrl ?? ''} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface mt-1" /></div>
              <div><label className="text-[10px] uppercase tracking-wider text-on-surface-variant/60">Founded Year</label><input name="foundedYear" type="number" defaultValue={venture?.foundedYear ?? ''} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface mt-1" /></div>
              <div><label className="text-[10px] uppercase tracking-wider text-on-surface-variant/60">Repo URL</label><input name="repoUrl" defaultValue={venture?.repoUrl ?? ''} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface mt-1" /></div>
              <div><label className="text-[10px] uppercase tracking-wider text-on-surface-variant/60">Notion URL</label><input name="notionUrl" defaultValue={venture?.notionUrl ?? ''} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface mt-1" /></div>
            </div>
            <div className="flex items-center gap-3">
              <button type="submit" disabled={savingVenture} className="btn-accent flex items-center gap-1.5 text-xs px-4 py-2"><Save size={14} /> {savingVenture ? 'Saving...' : 'Save Profile'}</button>
              {saveMsg && <span className={`text-xs ${saveMsg.startsWith('Saved') ? 'text-emerald-400' : 'text-red-400'}`}>{saveMsg}</span>}
            </div>
          </form>
        </Section>

        {/* ═══ 2. SOCIAL MEDIA ═══ */}
        <Section icon={Globe} title="Social Media Accounts" subtitle="Connect platforms per venture — add or remove handles">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SOCIAL_PLATFORMS.map(p => {
              const existing = socials.find(s => s.platform === p)
              return (
                <div key={p} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.01] px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-[13px] text-on-surface capitalize font-medium">{p}</p>
                    {existing ? <p className="text-[11px] text-on-surface-variant/60 truncate">{existing.handleOrUrl}</p> : <p className="text-[11px] text-on-surface-variant/40 italic">Not connected</p>}
                  </div>
                  {existing ? (
                    <button onClick={() => removeSocial(p)} className="text-on-surface-variant/40 hover:text-red-400 transition shrink-0 ml-2"><Trash2 size={14} /></button>
                  ) : (
                    <button onClick={() => addSocial(p)} className="text-on-surface-variant/40 hover:text-on-surface transition shrink-0 ml-2"><Plus size={14} /></button>
                  )}
                </div>
              )
            })}
          </div>
        </Section>

        {/* ═══ 3. INFRASTRUCTURE ═══ */}
        <Section icon={Server} title="Infrastructure & Integrations" subtitle="Repo, deployment, analytics — per venture links" defaultOpen>
          <div className="space-y-2 text-[13px]">
            {[
              { label: 'Repository', value: venture?.repoUrl, isLink: true },
              { label: 'Website', value: venture?.websiteUrl, isLink: true },
              { label: 'Notion', value: venture?.notionUrl, isLink: true },
              { label: 'YouTube Channel', value: venture?.ytChannelId, isLink: false },
              { label: 'Instagram', value: venture?.igHandle, isLink: false },
              { label: 'LinkedIn', value: venture?.liProfileUrl, isLink: false },
              { label: 'Google Analytics', value: venture?.ga4PropertyId ? 'Connected' : 'Not set', isLink: false },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                <span className="text-on-surface-variant">{row.label}</span>
                {row.value ? (
                  row.isLink ? (
                    <a href={row.value} target="_blank" rel="noopener noreferrer" className="text-on-surface hover:text-on-surface-variant inline-flex items-center gap-1 text-xs"><span className="truncate max-w-[200px]">{row.value.replace('https://','')}</span><ExternalLink size={10} /></a>
                  ) : <span className="text-on-surface text-xs">{row.value}</span>
                ) : <span className="text-on-surface-variant/40 text-xs">Not set</span>}
              </div>
            ))}
            <div className="flex items-center justify-between py-2"><span className="text-on-surface-variant">Deployment</span><span className="text-xs text-on-surface inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Vercel · yvon.in</span></div>
          </div>
        </Section>

        {/* ═══ 4. AI PROVIDER ═══ */}
        <Section icon={Cpu} title="AI Provider" subtitle="DeepSeek v4 Pro — balance and token usage" badge={s?.deepseekBalance != null ? <StatusBadge tone={s.deepseekBalance > 1 ? 'green' : 'yellow'}>${s.deepseekBalance.toFixed(2)}</StatusBadge> : undefined}>
          <div className="space-y-2 text-[13px]">
            <div className="flex justify-between"><span className="text-on-surface-variant">Provider</span><span className="text-on-surface">DeepSeek</span></div>
            <div className="flex justify-between"><span className="text-on-surface-variant">Model</span><span className="text-on-surface">v4 Pro</span></div>
            <div className="flex justify-between"><span className="text-on-surface-variant">Balance</span><span className={s?.deepseekBalance != null && s.deepseekBalance > 10 ? 'text-emerald-400' : 'text-on-surface'}>{s?.deepseekBalance != null ? `$${s.deepseekBalance.toFixed(2)}` : 'Unknown'}</span></div>
            <div className="flex justify-between"><span className="text-on-surface-variant">Tokens today</span><span className="text-on-surface">{s?.tokenSpentToday != null && s.tokenSpentToday > 0 ? (s.tokenSpentToday/1000).toFixed(1)+'K' : 'Awaiting data...'}</span></div>
            <div className="flex justify-between"><span className="text-on-surface-variant">Status</span><StatusBadge tone="green">Active</StatusBadge></div>
          </div>
        </Section>

        {/* ═══ 5. DATABASE ═══ */}
        <Section icon={Database} title="Database" subtitle="Supabase PostgreSQL — connection status" badge={<StatusBadge tone={s?.supabaseConnected ? 'green' : 'red'}>{s?.supabaseConnected ? 'Connected' : 'Offline'}</StatusBadge>}>
          <div className="space-y-2 text-[13px]">
            <div className="flex justify-between"><span className="text-on-surface-variant">Provider</span><span className="text-on-surface">Supabase</span></div>
            <div className="flex justify-between"><span className="text-on-surface-variant">Database</span><span className="text-on-surface">PostgreSQL 15</span></div>
            <div className="flex justify-between"><span className="text-on-surface-variant">Migrations</span><span className="text-on-surface">50+ applied</span></div>
            <div className="flex justify-between"><span className="text-on-surface-variant">Tables</span><span className="text-on-surface">ventures, agent_sessions, token_usage, +30</span></div>
          </div>
        </Section>

        {/* ═══ 6. API KEYS ═══ */}
        <Section icon={Key} title="API Keys" subtitle="Service credentials status" badge={<span className="text-[10px] text-emerald-400">4/5 active</span>}>
          <div className="space-y-1.5">
            {[
              { name: 'DeepSeek', env: 'DEEPSEEK_API_KEY', tone: 'green' as const },
              { name: 'Supabase', env: 'SUPABASE_URL + KEY', tone: 'green' as const },
              { name: 'YouTube', env: 'YOUTUBE_API_KEY', tone: 'green' as const },
              { name: 'Apify', env: 'APIFY_API_KEY', tone: 'yellow' as const },
              { name: 'GitHub', env: 'GITHUB_TOKEN', tone: 'green' as const },
            ].map(k => (
              <div key={k.name} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                <div><span className="text-[13px] text-on-surface">{k.name}</span><span className="text-[10px] text-on-surface-variant/50 ml-2">{k.env}</span></div>
                <StatusBadge tone={k.tone}>{k.tone === 'green' ? 'Active' : 'Optional'}</StatusBadge>
              </div>
            ))}
          </div>
        </Section>

        {/* ═══ 7. SYSTEM HEALTH ═══ */}
        <Section icon={Activity} title="System Health" subtitle="Agents, machines, uptime" badge={<StatusBadge tone={s?.status === 'healthy' ? 'green' : 'yellow'}>{s?.status ?? 'Unknown'}</StatusBadge>}>
          <div className="space-y-2 text-[13px]">
            <div className="flex justify-between"><span className="text-on-surface-variant">Agents live</span><span className="text-on-surface">{s?.agentsLive ?? '—'}</span></div>
            <div className="flex justify-between"><span className="text-on-surface-variant">Total agents</span><span className="text-on-surface">13</span></div>
            <div className="flex justify-between"><span className="text-on-surface-variant">Departments</span><span className="text-on-surface">4 (CEO, Technical, Marketing, Finance)</span></div>
            <div className="flex justify-between"><span className="text-on-surface-variant">Active venture</span><span className="text-on-surface inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{background:workspace.accent}}/>{workspace.name}</span></div>
          </div>
        </Section>

        {/* ═══ 8. SECURITY ═══ */}
        <Section icon={Shield} title="Security" subtitle="Access controls and hardening">
          <div className="space-y-2 text-[13px]">
            <div className="flex justify-between"><span className="text-on-surface-variant">CSP Headers</span><StatusBadge tone="green">Enabled</StatusBadge></div>
            <div className="flex justify-between"><span className="text-on-surface-variant">HTTPS</span><StatusBadge tone="green">Enforced</StatusBadge></div>
            <div className="flex justify-between"><span className="text-on-surface-variant">API rate limiting</span><StatusBadge tone="green">Active</StatusBadge></div>
            <div className="flex justify-between"><span className="text-on-surface-variant">Last audit</span><span className="text-on-surface">June 2026</span></div>
          </div>
        </Section>

        {/* ═══ 9. PREFERENCES ═══ */}
        <Section icon={Bell} title="Preferences" subtitle="Notification and display settings" defaultOpen>
          <ToggleRow label="Decision Queue nudge (30 min)" desc="Remind you when decisions pile up" value={notifications} onChange={setNotifications} />
          <ToggleRow label="Telegram nudge" desc="Critical alerts via Telegram" value={telegramNudge} onChange={setTelegramNudge} />
          <ToggleRow label="Weekly digest" desc="Email summary every Sunday" value={weeklyDigest} onChange={setWeeklyDigest} />
          <ToggleRow label="Auto-approve low-risk" desc="Let Marcus handle routine tasks" value={autoApprove} onChange={setAutoApprove} />
          <ToggleRow label="Dark mode" desc="Dark color scheme" value={darkMode} onChange={setDarkMode} />
          <ToggleRow label="Compact sidebar" desc="Icons-only sidebar on desktop" value={compactSidebar} onChange={setCompactSidebar} />
        </Section>
      </div>

      <div className="mt-6 text-center text-[11px] text-on-surface-variant/30">YVON OS v3.0 · 13 agents · {workspace.name}</div>
    </div>
  )
}
