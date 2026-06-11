'use client'
import { PageHeader, StatusBadge, Card } from '@/components/ui'
import { Bell, Key, Palette, User, Server, Cpu } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" subtitle="System preferences, API connections, and profile — YVON OS configuration." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3"><User size={16} style={{ color: 'var(--ws-accent)' }} /><h3 className="text-sm font-semibold text-on-surface">Profile</h3></div>
          <p className="text-[13px] text-on-surface">CEO Marcus · YVON OS</p>
          <p className="text-[12px] text-on-surface-variant/60 mt-1">Agent roster: 13 active · 4 departments</p>
          <StatusBadge tone="green">Active</StatusBadge>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3"><Bell size={16} style={{ color: 'var(--ws-accent)' }} /><h3 className="text-sm font-semibold text-on-surface">Notifications</h3></div>
          <p className="text-[13px] text-on-surface">Decision Queue nudge: 30 min</p>
          <p className="text-[12px] text-on-surface-variant/60 mt-1">Telegram channel connected</p>
          <StatusBadge tone="blue">Configured</StatusBadge>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3"><Key size={16} style={{ color: 'var(--ws-accent)' }} /><h3 className="text-sm font-semibold text-on-surface">API Keys</h3></div>
          <p className="text-[13px] text-on-surface">DeepSeek · Supabase · YouTube</p>
          <p className="text-[12px] text-on-surface-variant/60 mt-1">Apify · GitHub · Vercel</p>
          <StatusBadge tone="green">6 / 6 configured</StatusBadge>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3"><Palette size={16} style={{ color: 'var(--ws-accent)' }} /><h3 className="text-sm font-semibold text-on-surface">Theme</h3></div>
          <p className="text-[13px] text-on-surface">Dark glass · Material 3</p>
          <p className="text-[12px] text-on-surface-variant/60 mt-1">Per-workspace accent colors</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3"><Server size={16} style={{ color: 'var(--ws-accent)' }} /><h3 className="text-sm font-semibold text-on-surface">Deployment</h3></div>
          <p className="text-[13px] text-on-surface">Vercel · yvon.in</p>
          <p className="text-[12px] text-on-surface-variant/60 mt-1">GitHub CI · auto-deploy on push</p>
          <StatusBadge tone="green">Production</StatusBadge>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3"><Cpu size={16} style={{ color: 'var(--ws-accent)' }} /><h3 className="text-sm font-semibold text-on-surface">AI Provider</h3></div>
          <p className="text-[13px] text-on-surface">DeepSeek v4 Pro</p>
          <p className="text-[12px] text-on-surface-variant/60 mt-1">Token usage tracked on Dashboard</p>
        </Card>
      </div>
    </div>
  )
}
