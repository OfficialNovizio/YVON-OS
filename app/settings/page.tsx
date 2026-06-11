'use client'

import { useState, useEffect, useCallback } from 'react'
import { PageHeader, StatusBadge, Card } from '@/components/ui'
import { useWorkspace } from '@/lib/WorkspaceContext'
import {
  Loader2, ToggleLeft, ToggleRight, Save, Trash2, Plus, ExternalLink,
  Globe, Server, Database, Cpu, Activity, Bell, Key, Shield, Check, AlertTriangle,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────
interface VentureConfig {
  id: string; name: string; slug: string; color: string
  description?: string; tagline?: string
  brandType?: string; brandTier?: string
  status?: string; websiteUrl?: string; logoUrl?: string
  foundedYear?: number; repoUrl?: string; notionUrl?: string
  operatingCountries?: string[]; targetAudience?: Record<string, unknown>
  avgPricePoint?: number; igHandle?: string; ytChannelId?: string
  liProfileUrl?: string; ga4PropertyId?: string
}

interface VentureSocial {
  id: string; ventureId: string; platform: string; handleOrUrl: string; createdAt: string
}

interface SystemInfo {
  systemHealth: {
    status: string; agentsLive: number; supabaseConnected: boolean
    deepseekBalance: number | null; tokenSpentToday: number
  }
}

// ── Persisted prefs ───────────────────────────────────────────────────────
const LS_KEYS = {
  notifications: 'yvon_settings_notifications',
  autoApprove: 'yvon_settings_auto_approve',
  darkMode: 'yvon_settings_dark_mode',
  compactSidebar: 'yvon_settings_compact_sidebar',
  telegramNudge: 'yvon_settings_telegram_nudge',
  weeklyDigest: 'yvon_settings_weekly_digest',
}
function loadBool(k: string, fb: boolean): boolean {
  if (typeof window === 'undefined') return fb
  try { const v = localStorage.getItem(k); return v === null ? fb : v === 'true' } catch { return fb }
}
function saveBool(k: string, v: boolean) { try { localStorage.setItem(k, String(v)) } catch {} }

const SOCIAL_PLATFORMS = [
  { id: 'instagram', label: 'Instagram', icon: '📸' },
  { id: 'youtube', label: 'YouTube', icon: '▶️' },
  { id: 'linkedin', label: 'LinkedIn', icon: '💼' },
  { id: 'tiktok', label: 'TikTok', icon: '🎵' },
  { id: 'twitter', label: 'Twitter', icon: '🐦' },
  { id: 'facebook', label: 'Facebook', icon: '📘' },
  { id: 'pinterest', label: 'Pinterest', icon: '📌' },
  { id: 'github', label: 'GitHub', icon: '🐙' },
  { id: 'discord', label: 'Discord', icon: '💬' },
  { id: 'telegram', label: 'Telegram', icon: '✈️' },
] as const

// ── Tab bar ───────────────────────────────────────────────────────────────
function TabBar({ tabs, active, onChange }: { tabs: { id: string; label: string }[]; active: string; onChange: (id: string) => void }) {
  return (
    <div className="flex gap-1 mb-4 border-b border-white/[0.06] overflow-x-auto no-scrollbar">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition ${
            active === t.id
              ? 'text-on-surface border-current'
              : 'text-on-surface-variant border-transparent hover:text-on-surface hover:border-white/10'
          }`}
          style={active === t.id ? { borderColor: 'var(--ws-accent)', color: 'var(--ws-accent)' } : {}}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

// ── Inline editable field ─────────────────────────────────────────────────
function Field({ label, value, type = 'text' }: { label: string; value: string; type?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] text-on-surface-variant/60 uppercase tracking-wider">{label}</span>
      <input
        type={type}
        defaultValue={value}
        className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-white/20 transition"
      />
    </div>
  )
}

// ── Toggle row ────────────────────────────────────────────────────────────
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

// ═══════════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════
export default function SettingsPage() {
  const { workspace } = useWorkspace()
  const [tab, setTab] = useState('venture')

  // Venture tab state
  const [venture, setVenture] = useState<VentureConfig | null>(null)
  const [socials, setSocials] = useState<VentureSocial[]>([])
  const [ventureLoading, setVentureLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  // System tab state
  const [sysInfo, setSysInfo] = useState<SystemInfo | null>(null)
  const [sysLoading, setSysLoading] = useState(true)

  // Preferences
  const [notifications, setN] = useState(true)
  const [autoApprove, setAA] = useState(false)
  const [darkMode, setDM] = useState(true)
  const [compactSidebar, setCS] = useState(false)
  const [telegramNudge, setTN] = useState(true)
  const [weeklyDigest, setWD] = useState(true)

  // ── Hydrate prefs ──────────────────────────────────────────────────────
  useEffect(() => {
    setN(loadBool(LS_KEYS.notifications, true))
    setAA(loadBool(LS_KEYS.autoApprove, false))
    setDM(loadBool(LS_KEYS.darkMode, true))
    setCS(loadBool(LS_KEYS.compactSidebar, false))
    setTN(loadBool(LS_KEYS.telegramNudge, true))
    setWD(loadBool(LS_KEYS.weeklyDigest, true))
  }, [])

  const setNotifications = useCallback((v: boolean) => { setN(v); saveBool(LS_KEYS.notifications, v) }, [])
  const setAutoApprove    = useCallback((v: boolean) => { setAA(v); saveBool(LS_KEYS.autoApprove, v) }, [])
  const setDarkMode       = useCallback((v: boolean) => { setDM(v); saveBool(LS_KEYS.darkMode, v); document.documentElement.classList.toggle('dark', v) }, [])
  const setCompactSidebar = useCallback((v: boolean) => { setCS(v); saveBool(LS_KEYS.compactSidebar, v) }, [])
  const setTelegramNudge  = useCallback((v: boolean) => { setTN(v); saveBool(LS_KEYS.telegramNudge, v) }, [])
  const setWeeklyDigest   = useCallback((v: boolean) => { setWD(v); saveBool(LS_KEYS.weeklyDigest, v) }, [])

  // ── Fetch venture data ─────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/ventures')
      .then(r => r.json())
      .then((ventures: VentureConfig[]) => {
        const v = ventures.find(v => v.slug === workspace.key)
        if (v) {
          setVenture(v)
          // Fetch socials
          fetch(`/api/ventures/${v.id}/socials`)
            .then(r => r.json())
            .then((s: VentureSocial[]) => { if (Array.isArray(s)) setSocials(s) })
            .catch(() => {})
        }
      })
      .catch(() => {})
      .finally(() => setVentureLoading(false))
  }, [workspace.key])

  // ── Fetch system info ──────────────────────────────────────────────────
  useEffect(() => {
    if (tab === 'system') {
      setSysLoading(true)
      fetch('/api/dashboard')
        .then(r => r.json())
        .then(d => { setSysInfo(d); setSysLoading(false) })
        .catch(() => setSysLoading(false))
    }
  }, [tab])

  // ── Save venture profile ───────────────────────────────────────────────
  const saveVenture = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!venture) return
    setSaving(true)
    setSaveMessage('')
    const form = e.target as HTMLFormElement
    const fd = new FormData(form)

    const body: Record<string, unknown> = {}
    const fields = ['name', 'slug', 'color', 'description', 'tagline', 'brandType', 'brandTier', 'status', 'websiteUrl', 'repoUrl', 'notionUrl']
    for (const f of fields) {
      const val = fd.get(f) as string
      if (val !== null && val !== (venture as any)[f]?.toString()) body[f] = val
    }
    const foundedYear = fd.get('foundedYear')
    if (foundedYear && Number(foundedYear) !== venture.foundedYear) body['foundedYear'] = Number(foundedYear)

    if (Object.keys(body).length === 0) { setSaveMessage('No changes to save'); setSaving(false); return }

    try {
      const res = await fetch(`/api/ventures/${venture.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.ok) {
        setSaveMessage('Saved ✓')
        // Refresh venture data
        const vRes = await fetch('/api/ventures')
        const ventures = await vRes.json()
        const updated = ventures.find((v: VentureConfig) => v.slug === workspace.key)
        if (updated) setVenture(updated)
      } else {
        const err = await res.json()
        setSaveMessage(`Error: ${err.error || 'Failed to save'}`)
      }
    } catch {
      setSaveMessage('Network error')
    }
    setSaving(false)
    setTimeout(() => setSaveMessage(''), 3000)
  }

  // ── Add social ─────────────────────────────────────────────────────────
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
    // Simple approach: set empty handle to "remove" — uses upsert
    if (!venture) return
    try {
      await fetch(`/api/ventures/${venture.id}/socials`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, handleOrUrl: '' }),
      })
      setSocials(prev => prev.filter(s => s.platform !== platform))
    } catch {}
  }

  // ═════════════════════════════════════════════════════════════════════
  //  RENDER
  // ═════════════════════════════════════════════════════════════════════
  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader title="Settings" subtitle="Venture configuration · System status · Preferences" />

      <TabBar
        tabs={[
          { id: 'venture', label: 'Venture' },
          { id: 'system', label: 'System' },
          { id: 'preferences', label: 'Preferences' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {/* ━━━━━━━━━━━━━━━━ VENTURE TAB ━━━━━━━━━━━━━━━━ */}
      {tab === 'venture' && (
        ventureLoading ? (
          <div className="flex items-center justify-center h-48"><Loader2 size={24} className="animate-spin text-on-surface-variant" /></div>
        ) : !venture ? (
          <div className="text-center py-12 text-on-surface-variant">No venture data found for &ldquo;{workspace.name}&rdquo;</div>
        ) : (
          <div className="space-y-4">
            {/* Profile form */}
            <form onSubmit={saveVenture}>
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Globe size={16} style={{ color: 'var(--ws-accent)' }} />
                  <h3 className="text-sm font-semibold text-on-surface">Venture Profile</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Name" value={venture.name} />
                  <Field label="Slug" value={venture.slug} />
                  <Field label="Color" value={venture.color} />
                  <Field label="Status" value={venture.status ?? 'active'} />
                  <div className="sm:col-span-2"><Field label="Tagline" value={venture.tagline ?? ''} /></div>
                  <div className="sm:col-span-2">
                    <label className="text-[11px] text-on-surface-variant/60 uppercase tracking-wider block mb-1">Description</label>
                    <textarea
                      name="description"
                      defaultValue={venture.description ?? ''}
                      rows={3}
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-white/20 transition resize-none"
                    />
                  </div>
                  <Field label="Brand Type" value={venture.brandType ?? ''} />
                  <Field label="Brand Tier" value={venture.brandTier ?? ''} />
                  <Field label="Website" value={venture.websiteUrl ?? ''} />
                  <Field label="Founded Year" value={venture.foundedYear?.toString() ?? ''} />
                  <Field label="Repo URL" value={venture.repoUrl ?? ''} />
                  <Field label="Notion URL" value={venture.notionUrl ?? ''} />
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <button type="submit" disabled={saving} className="btn-accent flex items-center gap-1.5 text-xs px-4 py-2">
                    <Save size={14} /> {saving ? 'Saving...' : 'Save Profile'}
                  </button>
                  {saveMessage && (
                    <span className={`text-xs ${saveMessage.startsWith('Saved') ? 'text-emerald-400' : 'text-red-400'}`}>
                      {saveMessage}
                    </span>
                  )}
                </div>
              </Card>
            </form>

            {/* Social Media Accounts */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Globe size={16} style={{ color: 'var(--ws-accent)' }} />
                <h3 className="text-sm font-semibold text-on-surface">Social Media Accounts</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SOCIAL_PLATFORMS.map(p => {
                  const existing = socials.find(s => s.platform === p.id)
                  return (
                    <div key={p.id} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.01] px-3 py-2.5">
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
                  )
                })}
              </div>
            </Card>

            {/* Infrastructure / Integrations */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Server size={16} style={{ color: 'var(--ws-accent)' }} />
                <h3 className="text-sm font-semibold text-on-surface">Infrastructure & Integrations</h3>
              </div>
              <div className="space-y-2 text-[13px]">
                <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
                  <span className="text-on-surface-variant">Repository</span>
                  {venture.repoUrl ? (
                    <a href={venture.repoUrl} target="_blank" rel="noopener noreferrer" className="text-on-surface hover:text-on-surface-variant inline-flex items-center gap-1">
                      {venture.repoUrl.replace('https://github.com/', '')} <ExternalLink size={11} />
                    </a>
                  ) : <span className="text-on-surface-variant/40">Not set</span>}
                </div>
                <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
                  <span className="text-on-surface-variant">Website</span>
                  {venture.websiteUrl ? (
                    <a href={venture.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-on-surface hover:text-on-surface-variant inline-flex items-center gap-1">
                      {venture.websiteUrl} <ExternalLink size={11} />
                    </a>
                  ) : <span className="text-on-surface-variant/40">Not set</span>}
                </div>
                <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
                  <span className="text-on-surface-variant">Notion</span>
                  {venture.notionUrl ? (
                    <a href={venture.notionUrl} target="_blank" rel="noopener noreferrer" className="text-on-surface hover:text-on-surface-variant inline-flex items-center gap-1">
                      Open workspace <ExternalLink size={11} />
                    </a>
                  ) : <span className="text-on-surface-variant/40">Not set</span>}
                </div>
                <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
                  <span className="text-on-surface-variant">YouTube Channel</span>
                  <span className="text-on-surface">{venture.ytChannelId || 'Not set'}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
                  <span className="text-on-surface-variant">Instagram</span>
                  <span className="text-on-surface">{venture.igHandle || 'Not set'}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
                  <span className="text-on-surface-variant">LinkedIn</span>
                  <span className="text-on-surface">{venture.liProfileUrl || 'Not set'}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
                  <span className="text-on-surface-variant">Google Analytics</span>
                  <span className="text-on-surface">{venture.ga4PropertyId ? 'Connected' : 'Not set'}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-on-surface-variant">Deployment</span>
                  <span className="inline-flex items-center gap-1.5 text-on-surface">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Vercel · yvon.in
                  </span>
                </div>
              </div>
            </Card>
          </div>
        )
      )}

      {/* ━━━━━━━━━━━━━━━━ SYSTEM TAB ━━━━━━━━━━━━━━━━ */}
      {tab === 'system' && (
        sysLoading ? (
          <div className="flex items-center justify-center h-48"><Loader2 size={24} className="animate-spin text-on-surface-variant" /></div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(() => {
              const s = sysInfo?.systemHealth
              return (
                <>
                  {/* AI Provider */}
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-2"><Cpu size={15} style={{ color: 'var(--ws-accent)' }} /><h3 className="text-sm font-semibold text-on-surface">AI Provider</h3></div>
                    <p className="text-[13px] text-on-surface">DeepSeek v4 Pro</p>
                    <p className="text-[12px] text-on-surface-variant/60 mt-0.5">Balance: {s?.deepseekBalance != null ? `$${s.deepseekBalance.toFixed(2)}` : '—'}</p>
                    <StatusBadge tone={s?.deepseekBalance != null && s.deepseekBalance > 1 ? 'green' : 'yellow'}>{s?.deepseekBalance != null ? `$${s.deepseekBalance.toFixed(2)}` : 'Unknown'}</StatusBadge>
                  </Card>

                  {/* Database */}
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-2"><Database size={15} style={{ color: 'var(--ws-accent)' }} /><h3 className="text-sm font-semibold text-on-surface">Database</h3></div>
                    <p className="text-[13px] text-on-surface">Supabase · PostgreSQL</p>
                    <p className="text-[12px] text-on-surface-variant/60 mt-0.5">
                      Tokens today: {s?.tokenSpentToday != null && s.tokenSpentToday > 0 ? (s.tokenSpentToday / 1000).toFixed(1) + 'K' : 'Awaiting data...'}
                    </p>
                    <StatusBadge tone={s?.supabaseConnected ? 'green' : 'red'}>{s?.supabaseConnected ? 'Connected' : 'Disconnected'}</StatusBadge>
                  </Card>

                  {/* Deployment */}
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-2"><Server size={15} style={{ color: 'var(--ws-accent)' }} /><h3 className="text-sm font-semibold text-on-surface">Deployment</h3></div>
                    <p className="text-[13px] text-on-surface">Vercel · yvon.in</p>
                    <p className="text-[12px] text-on-surface-variant/60 mt-0.5">GitHub CI · auto-deploy on push</p>
                    <StatusBadge tone="green">Production</StatusBadge>
                  </Card>

                  {/* System Health */}
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-2"><Activity size={15} style={{ color: 'var(--ws-accent)' }} /><h3 className="text-sm font-semibold text-on-surface">System Health</h3></div>
                    <p className="text-[13px] text-on-surface">{s?.agentsLive ?? '—'} agents live · 4 departments</p>
                    <p className="text-[12px] text-on-surface-variant/60 mt-0.5">13 agents total · 3 machines</p>
                    <StatusBadge tone={s?.status === 'healthy' ? 'green' : s?.status === 'degraded' ? 'yellow' : 'red'}>{s?.status ?? 'Unknown'}</StatusBadge>
                  </Card>

                  {/* API Keys */}
                  <Card className="p-4 sm:col-span-2">
                    <div className="flex items-center gap-2 mb-2"><Key size={15} style={{ color: 'var(--ws-accent)' }} /><h3 className="text-sm font-semibold text-on-surface">API Key Status</h3></div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-xs">
                      {[
                        { name: 'DeepSeek', status: 'Active', tone: 'green' },
                        { name: 'Supabase', status: 'Active', tone: 'green' },
                        { name: 'YouTube', status: 'Active', tone: 'green' },
                        { name: 'Apify', status: 'Optional', tone: 'yellow' },
                        { name: 'GitHub', status: 'Active', tone: 'green' },
                      ].map((key) => (
                        <div key={key.name} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.01] px-3 py-2">
                          <span className="text-on-surface">{key.name}</span>
                          <StatusBadge tone={key.tone as 'green' | 'yellow'}>{key.status}</StatusBadge>
                        </div>
                      ))}
                    </div>
                  </Card>
                </>
              )
            })()}
          </div>
        )
      )}

      {/* ━━━━━━━━━━━━━━━━ PREFERENCES TAB ━━━━━━━━━━━━━━━━ */}
      {tab === 'preferences' && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3"><Bell size={16} style={{ color: 'var(--ws-accent)' }} /><h3 className="text-sm font-semibold text-on-surface">Preferences</h3></div>
          <ToggleRow label="Decision Queue nudge (30 min)" desc="Remind you when decisions pile up" value={notifications} onChange={setNotifications} />
          <ToggleRow label="Telegram nudge" desc="Send critical alerts via Telegram" value={telegramNudge} onChange={setTelegramNudge} />
          <ToggleRow label="Weekly digest" desc="Email summary every Sunday morning" value={weeklyDigest} onChange={setWeeklyDigest} />
          <ToggleRow label="Auto-approve low-risk tasks" desc="Let Marcus auto-handle routine items" value={autoApprove} onChange={setAutoApprove} />
          <ToggleRow label="Dark mode" desc="Use dark color scheme" value={darkMode} onChange={setDarkMode} />
          <ToggleRow label="Compact sidebar" desc="Icons-only sidebar on desktop" value={compactSidebar} onChange={setCompactSidebar} />
        </Card>
      )}
    </div>
  )
}
