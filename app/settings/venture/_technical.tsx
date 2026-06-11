'use client'

import { Card, StatusBadge } from '@/components/ui'
import { GitBranch, ExternalLink, Database, Cpu, Server, Shield, Monitor, Smartphone } from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════════════
//  PROPS
// ═══════════════════════════════════════════════════════════════════════════
interface SystemHealth {
  supabaseConnected: boolean; agentsLive: number; tokenSpentToday: number
  deepseekBalance: number | null; status: string
}

interface TechnicalTabProps {
  repoUrl: string; setRepoUrl: (v: string) => void
  notionUrl: string; setNotionUrl: (v: string) => void
  websiteUrl: string
  iosAppUrl: string
  androidAppUrl: string
  sysHealth: SystemHealth | null
}

// ═══════════════════════════════════════════════════════════════════════════
//  TECHNICAL TAB
// ═══════════════════════════════════════════════════════════════════════════
export default function TechnicalTab({
  repoUrl, setRepoUrl, notionUrl, setNotionUrl,
  websiteUrl, iosAppUrl, androidAppUrl, sysHealth,
}: TechnicalTabProps) {
  const s = sysHealth

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-2"><GitBranch size={15} style={{ color: 'var(--ws-accent)' }} /><h3 className="text-sm font-semibold">Repository</h3></div>
        <div className="flex flex-col gap-1 mb-2">
          <label className="text-[11px] text-on-surface-variant/60 uppercase tracking-wider">Repo URL</label>
          <input value={repoUrl} onChange={e => setRepoUrl(e.target.value)} placeholder="github.com/user/repo"
            className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-white/20" />
        </div>
        {repoUrl && <a href={repoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-on-surface-variant hover:text-on-surface inline-flex items-center gap-1"><ExternalLink size={11} /> Open</a>}
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-2"><Database size={15} style={{ color: 'var(--ws-accent)' }} /><h3 className="text-sm font-semibold">Database</h3></div>
        <div className="space-y-1.5 text-[13px]">
          <div className="flex justify-between"><span className="text-on-surface-variant">Supabase</span><StatusBadge tone={s?.supabaseConnected ? 'green' : 'red'}>{s?.supabaseConnected ? 'Connected' : 'Offline'}</StatusBadge></div>
          <div className="flex justify-between"><span className="text-on-surface-variant">Tokens today</span><span className="text-on-surface">{s?.tokenSpentToday ? (s.tokenSpentToday / 1000).toFixed(1) + 'K' : '...'}</span></div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-2"><Cpu size={15} style={{ color: 'var(--ws-accent)' }} /><h3 className="text-sm font-semibold">AI Provider</h3></div>
        <div className="space-y-1.5 text-[13px]">
          <div className="flex justify-between"><span className="text-on-surface-variant">Provider</span><span className="text-on-surface">DeepSeek</span></div>
          <div className="flex justify-between"><span className="text-on-surface-variant">Balance</span><span className={s?.deepseekBalance && s.deepseekBalance > 1 ? 'text-emerald-400' : 'text-on-surface'}>{s?.deepseekBalance != null ? `$${s.deepseekBalance.toFixed(2)}` : '—'}</span></div>
          <div className="flex justify-between"><span className="text-on-surface-variant">Status</span><StatusBadge tone="green">Active</StatusBadge></div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-2"><Server size={15} style={{ color: 'var(--ws-accent)' }} /><h3 className="text-sm font-semibold">Software Status</h3></div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[13px]"><Monitor size={13} className="text-on-surface-variant" /><span className="text-on-surface-variant">Website</span></div>
            {websiteUrl ? <StatusBadge tone="green">Deployed</StatusBadge> : <span className="text-xs text-on-surface-variant/40">Not linked</span>}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[13px]"><Smartphone size={13} className="text-on-surface-variant" /><span className="text-on-surface-variant">iOS App</span></div>
            {iosAppUrl ? <StatusBadge tone="green">Live</StatusBadge> : <span className="text-xs text-on-surface-variant/40">Not configured</span>}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[13px]"><Smartphone size={13} className="text-on-surface-variant" /><span className="text-on-surface-variant">Android App</span></div>
            {androidAppUrl ? <StatusBadge tone="green">Live</StatusBadge> : <span className="text-xs text-on-surface-variant/40">Not configured</span>}
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-2"><Shield size={15} style={{ color: 'var(--ws-accent)' }} /><h3 className="text-sm font-semibold">Security</h3></div>
        <div className="space-y-1.5 text-[13px]">
          <div className="flex justify-between"><span className="text-on-surface-variant">CSP</span><StatusBadge tone="green">Enabled</StatusBadge></div>
          <div className="flex justify-between"><span className="text-on-surface-variant">HTTPS</span><StatusBadge tone="green">Enforced</StatusBadge></div>
          <div className="flex justify-between"><span className="text-on-surface-variant">Rate Limit</span><StatusBadge tone="green">Active</StatusBadge></div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex flex-col gap-1 mb-2">
          <label className="text-[11px] text-on-surface-variant/60 uppercase tracking-wider">Notion Workspace</label>
          <input value={notionUrl} onChange={e => setNotionUrl(e.target.value)} placeholder="notion.so/workspace"
            className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-white/20" />
        </div>
        {notionUrl && <a href={notionUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-on-surface-variant hover:text-on-surface inline-flex items-center gap-1"><ExternalLink size={11} /> Open</a>}
      </Card>
    </div>
  )
}
