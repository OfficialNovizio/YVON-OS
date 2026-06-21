'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { PageHeader, StatusBadge, Card } from '@/components/ui'
import { useWorkspace } from '@/lib/WorkspaceContext'
import { Bell, Key, Palette, User, Server, Cpu, Database, Loader2, ToggleLeft, ToggleRight, ChevronRight, LayoutDashboard, Package, Download, CheckCircle2, AlertTriangle } from 'lucide-react'

interface SystemInfo {
  systemHealth: {
    status: string; agentsLive: number; supabaseConnected: boolean
    deepseekBalance: number | null; tokenSpentToday: number
  }
  greeting: string
  ventures: { slug: string; name: string; decisionsPending: number }[]
}

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

export default function SettingsPage() {
  const { workspace } = useWorkspace()
  const [info, setInfo] = useState<SystemInfo | null>(null)
  const [loading, setLoading] = useState(true)

  const [notifications, setNotificationsState] = useState(true)
  const [autoApprove, setAutoApproveState] = useState(false)
  const [darkMode, setDarkModeState] = useState(true)
  const [compactSidebar, setCompactSidebarState] = useState(false)

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Venture Profile — clickable, opens detail page */}
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

        {/* YVON Dashboard — moved to top for visibility */}
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

        {/* Theme */}
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
    </div>
  )
}

// ─── 
