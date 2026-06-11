'use client'

import { useState, useEffect } from 'react'
import { PageHeader, StatusBadge, Card } from '@/components/ui'
import { useWorkspace } from '@/lib/WorkspaceContext'
import { WORKSPACES } from '@/lib/workspaces'
import { Bell, Key, Palette, User, Server, Cpu, Coins, Database, Loader2 } from 'lucide-react'

interface SystemInfo {
  systemHealth: {
    status: string; agentsLive: number; supabaseConnected: boolean
    deepseekBalance: number | null; tokenSpentToday: number
  }
  greeting: string
  ventures: { slug: string; name: string; decisionsPending: number }[]
}

export default function SettingsPage() {
  const { workspace, setWorkspace } = useWorkspace()
  const [info, setInfo] = useState<SystemInfo | null>(null)
  const [loading, setLoading] = useState(true)

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
        <PageHeader title="Settings" subtitle="System preferences, API connections, and profile — YVON OS configuration." />
        <div className="flex items-center justify-center h-48"><Loader2 size={24} className="animate-spin text-on-surface-variant" /></div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Settings" subtitle="System preferences, API connections, and profile — YVON OS configuration." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Profile */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3"><User size={16} style={{ color: 'var(--ws-accent)' }} /><h3 className="text-sm font-semibold text-on-surface">Profile</h3></div>
          <p className="text-[13px] text-on-surface">CEO Marcus · YVON OS</p>
          <p className="text-[12px] text-on-surface-variant/60 mt-1">{s?.agentsLive ?? '—'} agents active · 4 departments</p>
          <StatusBadge tone={s?.status === 'healthy' ? 'green' : 'yellow'}>{s?.status ?? 'Unknown'}</StatusBadge>
        </Card>

        {/* Notification config */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3"><Bell size={16} style={{ color: 'var(--ws-accent)' }} /><h3 className="text-sm font-semibold text-on-surface">Notifications</h3></div>
          <p className="text-[13px] text-on-surface">Decision Queue nudge: 30 min</p>
          <p className="text-[12px] text-on-surface-variant/60 mt-1">Telegram channel connected · Hermes gateway</p>
          <StatusBadge tone="blue">Configured</StatusBadge>
        </Card>

        {/* API Keys */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3"><Key size={16} style={{ color: 'var(--ws-accent)' }} /><h3 className="text-sm font-semibold text-on-surface">API Keys</h3></div>
          <p className="text-[13px] text-on-surface">DeepSeek · Supabase · YouTube</p>
          <p className="text-[12px] text-on-surface-variant/60 mt-1">Apify · GitHub · Vercel</p>
          <StatusBadge tone="green">6 / 6 configured</StatusBadge>
        </Card>

        {/* Theme */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3"><Palette size={16} style={{ color: 'var(--ws-accent)' }} /><h3 className="text-sm font-semibold text-on-surface">Theme</h3></div>
          <p className="text-[13px] text-on-surface">Dark glass · Material 3</p>
          <p className="text-[12px] text-on-surface-variant/60 mt-1">Active: {workspace.name} · {workspace.theme}</p>
          <span className="inline-flex items-center gap-1.5 mt-1">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: workspace.accent }} />
            <span className="text-[11px] text-on-surface-variant">{workspace.accent}</span>
          </span>
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

        {/* Supabase */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3"><Database size={16} style={{ color: 'var(--ws-accent)' }} /><h3 className="text-sm font-semibold text-on-surface">Database</h3></div>
          <p className="text-[13px] text-on-surface">Supabase · PostgreSQL</p>
          <p className="text-[12px] text-on-surface-variant/60 mt-1">Tokens today: {s?.tokenSpentToday != null ? `${(s.tokenSpentToday / 1000).toFixed(1)}K` : '—'}</p>
          <StatusBadge tone={s?.supabaseConnected ? 'green' : 'red'}>
            {s?.supabaseConnected ? 'Connected' : 'Disconnected'}
          </StatusBadge>
        </Card>

        {/* Deployment */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3"><Server size={16} style={{ color: 'var(--ws-accent)' }} /><h3 className="text-sm font-semibold text-on-surface">Deployment</h3></div>
          <p className="text-[13px] text-on-surface">Vercel · yvon.in</p>
          <p className="text-[12px] text-on-surface-variant/60 mt-1">GitHub CI · auto-deploy on push</p>
          <StatusBadge tone="green">Production</StatusBadge>
        </Card>

        {/* Active Ventures */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3"><Server size={16} style={{ color: 'var(--ws-accent)' }} /><h3 className="text-sm font-semibold text-on-surface">Ventures</h3></div>
          <div className="space-y-1.5">
            {(info?.ventures ?? []).map((v) => (
              <div key={v.slug} className="flex items-center justify-between text-[13px]">
                <span className="text-on-surface">{v.name}</span>
                <span className="text-on-surface-variant">{v.decisionsPending} pending</span>
              </div>
            ))}
            {(!info?.ventures || info.ventures.length === 0) && (
              <p className="text-[12px] text-on-surface-variant">Novizio · Hourbour</p>
            )}
          </div>
        </Card>

        {/* Quick venture switch */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3"><Server size={16} style={{ color: 'var(--ws-accent)' }} /><h3 className="text-sm font-semibold text-on-surface">Switch Venture</h3></div>
          <div className="space-y-2">
            {WORKSPACES.filter(w => w.isVenture).map((v) => (
              <button
                key={v.key}
                onClick={() => setWorkspace(v.key)}
                className="w-full flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] p-2 text-left hover:bg-white/[0.05] transition"
              >
                <span className="h-3 w-3 rounded-full" style={{ background: v.accent }} />
                <span className="text-[13px] text-on-surface font-medium">{v.name}</span>
                <span className="text-[11px] text-on-surface-variant">{v.business}</span>
                {workspace.key === v.key && <StatusBadge tone="green">Active</StatusBadge>}
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
