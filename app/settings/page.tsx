'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { PageHeader, StatusBadge, Card } from '@/components/ui'
import { useWorkspace } from '@/lib/WorkspaceContext'
import { Bell, Key, Palette, User, Server, Cpu, Database, Loader2, ToggleLeft, ToggleRight, ChevronRight, LayoutDashboard, Bot, GitBranch, Brain, Activity, CheckCircle2 } from 'lucide-react'

interface SystemInfo {
  systemHealth: {
    status: string; agentsLive: number; supabaseConnected: boolean
    deepseekBalance: number | null; tokenSpentToday: number
  }
  greeting: string
  ventures: { slug: string; name: string; decisionsPending: number }[]
}

interface ToonOSData {
  initialized: boolean; venture: string; agentsTotal: number
  departments: { name: string; agentCount: number }[]
  checks: { agents: boolean; graphify: boolean; codegraph: boolean; claudeMD: boolean }
  graphs: { graphify: string; codegraph: string }
  agents: { name: string; role: string; department: string; status: string; skillsCount: number; memoryHealth: number }[]
}

type OSTab = 'overview' | 'agents' | 'health'

const LS = {
  notifications: 'yvon_settings_notifications',
  autoApprove: 'yvon_settings_auto_approve',
  darkMode: 'yvon_settings_dark_mode',
  compactSidebar: 'yvon_settings_compact_sidebar',
}
function load(k: string, fb: boolean): boolean {
  try { const v = localStorage.getItem(k); return v === null ? fb : v === 'true' } catch { return fb }
}
function save(k: string, v: boolean) { try { localStorage.setItem(k, String(v)) } catch {} }

function OSTabs({ tab, onChange }: { tab: OSTab; onChange: (t: OSTab) => void }) {
  const items: { id: OSTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={13} /> },
    { id: 'agents', label: 'Agents', icon: <Bot size={13} /> },
    { id: 'health', label: 'Health', icon: <Activity size={13} /> },
  ]
  return (
    <div className="flex gap-1 border-b border-white/[0.06] mb-4">
      {items.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)}
          className={`flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold border-b-2 transition ${
            tab === t.id ? 'border-current' : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
          style={tab === t.id ? { borderColor: 'var(--ws-accent)', color: 'var(--ws-accent)' } : {}}>
          {t.icon} {t.label}
        </button>
      ))}
    </div>
  )
}

export default function SettingsPage() {
  const { workspace } = useWorkspace()
  const [info, setInfo] = useState<SystemInfo | null>(null)
  const [loading, setLoading] = useState(true)

  const [notifications, setNotificationsState] = useState(true)
  const [autoApprove, setAutoApproveState] = useState(false)
  const [darkMode, setDarkModeState] = useState(true)
  const [compactSidebar, setCompactSidebarState] = useState(false)
  const [toonOS, setToonOS] = useState<ToonOSData | null>(null)
  const [osTab, setOsTab] = useState<OSTab>('overview')

  useEffect(() => {
    setNotificationsState(load(LS.notifications, true))
    setAutoApproveState(load(LS.autoApprove, false))
    setDarkModeState(load(LS.darkMode, true))
    setCompactSidebarState(load(LS.compactSidebar, false))
  }, [])

  const setNotifications = useCallback((v: boolean) => { setNotificationsState(v); save(LS.notifications, v) }, [])
  const setAutoApprove    = useCallback((v: boolean) => { setAutoApproveState(v); save(LS.autoApprove, v) }, [])
  const setDarkMode       = useCallback((v: boolean) => { setDarkModeState(v); save(LS.darkMode, v); document.documentElement.classList.toggle('dark', v) }, [])
  const setCompactSidebar = useCallback((v: boolean) => { setCompactSidebarState(v); save(LS.compactSidebar, v) }, [])

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then((d) => { setInfo(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetch('/api/ventures-health')
      .then(r => r.json())
      .then(d => setToonOS(d))
      .catch(() => {})
  }, [])

  const s = info?.systemHealth

  if (loading) {
    return (
      <div>
        <PageHeader title="Settings" subtitle="System preferences, API connections, and profile." />
        <div className="flex items-center justify-center h-48"><Loader2 size={24} className="animate-spin text-on-surface-variant" /></div>
      </div>
    )
  }

  const toggle = (label: string, value: boolean, onChange: (v: boolean) => void) => (
    <div className="flex items-center justify-between py-2">
      <span className="text-[13px] text-on-surface">{label}</span>
      <button onClick={() => onChange(!value)} className="text-on-surface-variant hover:text-on-surface transition">
        {value ? <ToggleRight size={22} style={{ color: 'var(--ws-accent)' }} /> : <ToggleLeft size={22} />}
      </button>
    </div>
  )

  return (
    <div>
      <PageHeader title="Settings" subtitle="System preferences, API connections, and profile." />

      {/* ── Card Grid ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        {/* Venture Profile */}
        <Link href="/settings/venture">
          <Card className="p-4 cursor-pointer hover:bg-white/[0.04] transition group">
            <div className="flex items-center gap-2 mb-3">
              <User size={16} style={{ color: 'var(--ws-accent)' }} />
              <h3 className="text-sm font-semibold text-on-surface flex-1">Venture · {workspace.name}</h3>
              <ChevronRight size={14} className="text-on-surface-variant/30 group-hover:text-on-surface-variant transition" />
            </div>
            <p className="text-[13px] text-on-surface">{workspace.business}</p>
            <p className="text-[12px] text-on-surface-variant/60 mt-1">{s?.agentsLive ?? '—'} agents active · 4 departments</p>
            <StatusBadge tone={s?.status === 'healthy' ? 'green' : 'yellow'}>{s?.status ?? 'Unknown'}</StatusBadge>
          </Card>
        </Link>

        {/* YVON Dashboard */}
        <Link href="/settings/dashboard">
          <Card className="p-4 cursor-pointer hover:bg-white/[0.04] transition group border-l-2 border-l-[var(--ws-accent)]">
            <div className="flex items-center gap-2 mb-3">
              <LayoutDashboard size={16} style={{ color: 'var(--ws-accent)' }} />
              <h3 className="text-sm font-semibold text-on-surface flex-1">Dashboard</h3>
              <ChevronRight size={14} className="text-on-surface-variant/30 group-hover:text-on-surface-variant transition" />
            </div>
            <p className="text-[13px] text-on-surface">Live metrics · Cost tracking · Agents</p>
            <p className="text-[12px] text-on-surface-variant/60 mt-1">TOON · CIE · Knowledge Graph</p>
            <StatusBadge tone="green">Active</StatusBadge>
          </Card>
        </Link>

        {/* Preferences */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3"><Bell size={16} style={{ color: 'var(--ws-accent)' }} /><h3 className="text-sm font-semibold text-on-surface">Preferences</h3></div>
          {toggle('Decision Queue nudge (30 min)', notifications, setNotifications)}
          {toggle('Auto-approve low-risk tasks', autoApprove, setAutoApprove)}
          {toggle('Dark mode', darkMode, setDarkMode)}
          {toggle('Compact sidebar', compactSidebar, setCompactSidebar)}
        </Card>

        {/* AI Provider */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3"><Cpu size={16} style={{ color: 'var(--ws-accent)' }} /><h3 className="text-sm font-semibold text-on-surface">AI Provider</h3></div>
          <p className="text-[13px] text-on-surface">DeepSeek v4 Pro</p>
          <p className="text-[12px] text-on-surface-variant/60 mt-1">Balance: {s?.deepseekBalance != null ? `$${s.deepseekBalance.toFixed(2)}` : 'Loading...'}</p>
          <StatusBadge tone={s?.deepseekBalance != null && s.deepseekBalance > 1 ? 'green' : 'yellow'}>
            {s?.deepseekBalance != null ? `$${s.deepseekBalance.toFixed(2)}` : '—'}
          </StatusBadge>
        </Card>

        {/* Database */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3"><Database size={16} style={{ color: 'var(--ws-accent)' }} /><h3 className="text-sm font-semibold text-on-surface">Database</h3></div>
          <p className="text-[13px] text-on-surface">Supabase · PostgreSQL</p>
          <p className="text-[12px] text-on-surface-variant/60 mt-1">Tokens today: {s?.tokenSpentToday != null ? `${(s.tokenSpentToday / 1000).toFixed(1)}K` : '—'}</p>
          <StatusBadge tone={s?.supabaseConnected ? 'green' : 'red'}>
            {s?.supabaseConnected ? 'Connected' : 'Disconnected'}
          </StatusBadge>
        </Card>

        {/* API Keys */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3"><Key size={16} style={{ color: 'var(--ws-accent)' }} /><h3 className="text-sm font-semibold text-on-surface">API Keys</h3></div>
          <div className="space-y-1.5 text-[13px]">
            <div className="flex justify-between"><span className="text-on-surface">DeepSeek</span><span className="text-emerald-400">● Active</span></div>
            <div className="flex justify-between"><span className="text-on-surface">Supabase</span><span className="text-emerald-400">● Active</span></div>
            <div className="flex justify-between"><span className="text-on-surface">YouTube</span><span className="text-emerald-400">● Active</span></div>
            <div className="flex justify-between"><span className="text-on-surface">Apify</span><span className="text-yellow-400">● Optional</span></div>
            <div className="flex justify-between"><span className="text-on-surface">GitHub</span><span className="text-emerald-400">● Active</span></div>
          </div>
        </Card>

        {/* Active Venture */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3"><Palette size={16} style={{ color: 'var(--ws-accent)' }} /><h3 className="text-sm font-semibold text-on-surface">Active Venture</h3></div>
          <p className="text-[13px] text-on-surface">{workspace.name}</p>
          <p className="text-[12px] text-on-surface-variant/60 mt-1">{workspace.business} · {workspace.theme}</p>
          <span className="inline-flex items-center gap-1.5 mt-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: workspace.accent }} />
            <span className="text-[11px] text-on-surface-variant">{workspace.accent}</span>
          </span>
        </Card>

        {/* Deployment */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3"><Server size={16} style={{ color: 'var(--ws-accent)' }} /><h3 className="text-sm font-semibold text-on-surface">Deployment</h3></div>
          <p className="text-[13px] text-on-surface">Vercel · yvon.in</p>
          <p className="text-[12px] text-on-surface-variant/60 mt-1">GitHub CI · auto-deploy on push</p>
          <StatusBadge tone="green">Production</StatusBadge>
        </Card>
      </div>

      {/* ── ToonGine OS Section ─────────────────────────────────────────── */}
      <div className="border-t border-white/[0.06] pt-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'var(--ws-accent-soft)' }}>
            <Bot size={20} style={{ color: 'var(--ws-accent)' }} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-on-surface">ToonGine OS</h2>
            <p className="text-[12px] text-on-surface-variant">
              {toonOS?.initialized
                ? `${toonOS.agentsTotal} agents · ${toonOS.departments.length} departments`
                : 'Not initialized — run npx toongine init'}
            </p>
          </div>
          <StatusBadge tone={toonOS?.initialized ? 'green' : 'yellow'}>
            {toonOS?.initialized ? 'Active' : 'Init needed'}
          </StatusBadge>
        </div>

        <OSTabs tab={osTab} onChange={setOsTab} />

        {/* OS Tab: Overview */}
        {osTab === 'overview' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="p-4 text-center">
              <Bot size={20} className="mx-auto mb-2" style={{ color: 'var(--ws-accent)' }} />
              <div className="text-2xl font-bold text-on-surface">{toonOS?.agentsTotal ?? '—'}</div>
              <div className="text-[11px] text-on-surface-variant mt-1">Agents Deployed</div>
            </Card>
            <Card className="p-4 text-center">
              <GitBranch size={20} className="mx-auto mb-2" style={{ color: 'var(--ws-accent)' }} />
              <div className="text-2xl font-bold text-on-surface">{toonOS?.departments?.length ?? '—'}</div>
              <div className="text-[11px] text-on-surface-variant mt-1">Departments</div>
            </Card>
            <Card className="p-4 text-center">
              <Brain size={20} className="mx-auto mb-2 text-emerald-400" />
              <div className="text-2xl font-bold text-on-surface">{toonOS?.checks?.graphify ? '✓' : '—'}</div>
              <div className="text-[11px] text-on-surface-variant mt-1">Graphify</div>
            </Card>
            <Card className="p-4 text-center">
              <Activity size={20} className="mx-auto mb-2 text-blue-400" />
              <div className="text-2xl font-bold text-on-surface">{toonOS?.checks?.codegraph ? '✓' : '—'}</div>
              <div className="text-[11px] text-on-surface-variant mt-1">Codegraph</div>
            </Card>
          </div>
        )}

        {/* OS Tab: Agents */}
        {osTab === 'agents' && (
          <div className="space-y-2">
            {toonOS?.agents && toonOS.agents.length > 0 ? toonOS.agents.map((a, i) => (
              <Card key={`${a.name}-${i}`} className="p-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center text-[10px] font-bold text-on-surface-variant">
                    {a.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-on-surface font-medium">{a.name}</div>
                    <div className="text-[11px] text-on-surface-variant/50">{a.role} · {a.department}</div>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <div className="text-[11px] text-on-surface-variant/50">
                      <span className="text-on-surface-variant">{a.skillsCount} skills</span>
                    </div>
                    <StatusBadge tone={a.status === 'active' ? 'green' : 'yellow'}>{a.status}</StatusBadge>
                  </div>
                </div>
              </Card>
            )) : (
              <Card className="p-8 text-center">
                <Bot size={28} className="text-on-surface-variant/20 mx-auto mb-3" />
                <p className="text-[13px] text-on-surface-variant/60">
                  {toonOS?.initialized ? 'Agent data loading...' : 'Run npx toongine init to deploy agents'}
                </p>
              </Card>
            )}
          </div>
        )}

        {/* OS Tab: Health */}
        {osTab === 'health' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Card className="p-4">
              <h3 className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-3">Agent Checks</h3>
              <div className="space-y-2.5">
                {[
                  { label: 'Agents Directory', ok: toonOS?.checks?.agents },
                  { label: 'CLAUDE.md Present', ok: toonOS?.checks?.claudeMD },
                  { label: 'Graphify Built', ok: toonOS?.checks?.graphify },
                  { label: 'Codegraph Built', ok: toonOS?.checks?.codegraph },
                ].map((check, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02]">
                    <span className="text-[13px] text-on-surface-variant">{check.label}</span>
                    {check.ok ? (
                      <CheckCircle2 size={16} className="text-emerald-400" />
                    ) : (
                      <span className="w-4 h-4 rounded-full border border-white/10" />
                    )}
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-4">
              <h3 className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-3">Graph Sizes</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-[12px] mb-1">
                    <span className="text-on-surface-variant">Graphify</span>
                    <span className="text-on-surface font-mono">{toonOS?.graphs?.graphify || 'not built'}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-400/60" style={{ width: toonOS?.checks?.graphify ? '100%' : '0%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[12px] mb-1">
                    <span className="text-on-surface-variant">Codegraph</span>
                    <span className="text-on-surface font-mono">{toonOS?.graphs?.codegraph || 'not built'}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                    <div className="h-full rounded-full bg-blue-400/60" style={{ width: toonOS?.checks?.codegraph ? '100%' : '0%' }} />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
