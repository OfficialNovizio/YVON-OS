'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useWorkspace } from '@/lib/WorkspaceContext'
import { WORKSPACES } from '@/lib/workspaces'
import type { WorkspaceKey } from '@/lib/workspaces'
import { Card, StatusBadge } from '@/components/ui'
import KaisRead from '@/components/KaisRead'
import {
  Inbox, CheckCheck, GitPullRequest, Shield, Moon, ArrowRight,
  Activity, Building2, Coins, Database, AlertTriangle, Loader2,
} from 'lucide-react'

interface DashboardData {
  greeting: string
  systemHealth: {
    status: string
    agentsLive: number
    supabaseConnected: boolean
    deepseekBalance: number | null
    tokenSpentToday: number
  }
  decisions: {
    total: number
    critical: number
    posts: number
    codeReviews: number
    warRoom: number
    security: number
  }
  activity: string[]
  ventures: { slug: string; name: string; decisionsPending: number }[]
}

export default function DashboardPage() {
  const { workspace } = useWorkspace()
  const wsLabel = WORKSPACES.find((w: { key: WorkspaceKey }) => w.key === workspace.key)?.name ?? workspace.key

  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-on-surface-variant" />
      </div>
    )
  }

  const d = data
  const status = d?.systemHealth?.status ?? 'healthy'

  return (
    <div className="max-w-7xl mx-auto">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">
            {d?.greeting ?? 'Good morning'}, Stark
          </h1>
          <p className="text-sm text-on-surface-variant">
            {wsLabel} · Here&apos;s what needs you, and what the agents handled overnight.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge
            tone={status === 'healthy' ? 'green' : status === 'degraded' ? 'yellow' : 'red'}
          >
            {status === 'healthy' ? 'System healthy' : status === 'degraded' ? 'System degraded' : 'System down'}
          </StatusBadge>
          <span className="text-xs text-on-surface-variant">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
            {d?.systemHealth?.agentsLive ?? '—'} agents live
          </span>
        </div>
      </div>

      {/* ── KPI Cards ────────────────────────────────────────────────────── */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Link href="/decision-queue">
          <Card hover className="p-4 h-full">
            <div className="mb-2 flex items-center justify-between">
              <Inbox size={16} style={{ color: 'var(--ws-accent)' }} />
              {(d?.decisions?.critical ?? 0) > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400">
                  {d?.decisions?.critical} critical
                </span>
              )}
            </div>
            <p className="text-3xl font-bold text-on-surface">{d?.decisions?.total ?? '—'}</p>
            <p className="text-[12px] text-on-surface-variant">Decisions waiting</p>
          </Card>
        </Link>

        <Link href="/social-approvals">
          <Card hover className="p-4 h-full">
            <CheckCheck size={16} className="mb-2" style={{ color: 'var(--ws-accent)' }} />
            <p className="text-3xl font-bold text-on-surface">{d?.decisions?.posts ?? '—'}</p>
            <p className="text-[12px] text-on-surface-variant">Posts to approve</p>
          </Card>
        </Link>

        <Link href="/software-pipeline">
          <Card hover className="p-4 h-full">
            <GitPullRequest size={16} className="mb-2" style={{ color: 'var(--ws-accent)' }} />
            <p className="text-3xl font-bold text-on-surface">{d?.decisions?.codeReviews ?? '—'}</p>
            <p className="text-[12px] text-on-surface-variant">Code reviews</p>
          </Card>
        </Link>

        <Link href="/advisory-council">
          <Card hover className="p-4 h-full">
            <Building2 size={16} className="mb-2" style={{ color: 'var(--ws-accent)' }} />
            <p className="text-3xl font-bold text-on-surface">{d?.decisions?.warRoom ?? '—'}</p>
            <p className="text-[12px] text-on-surface-variant">War Room plans</p>
          </Card>
        </Link>

        <div>
          <Card className="p-4 h-full">
            <Shield size={16} className="mb-2" style={{ color: 'var(--ws-accent)' }} />
            <p className="text-3xl font-bold text-on-surface">{d?.decisions?.security ?? 0}</p>
            <p className="text-[12px] text-on-surface-variant">Security alerts</p>
          </Card>
        </div>
      </div>

      {/* ── Main grid: activity + system health ─────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        {/* Overnight activity */}
        <Card className="p-4">
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-on-surface">
            <Moon size={15} style={{ color: 'var(--ws-accent)' }} />
            Handled overnight
          </h4>
          <div className="space-y-2.5 max-h-[320px] overflow-y-auto scroll-y">
            {(d?.activity ?? []).map((item) => (
              <div
                key={item}
                className="flex items-start gap-2.5 rounded-lg bg-white/[0.02] p-2.5 text-[13px] text-on-surface-variant"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                {item}
              </div>
            ))}
          </div>
        </Card>

        {/* Right column: system health + ventures */}
        <div className="space-y-4">
          {/* System health */}
          <Card className="p-4">
            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-on-surface">
              <Activity size={15} style={{ color: 'var(--ws-accent)' }} />
              System health
            </h4>
            <div className="space-y-2.5 text-[13px]">
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant flex items-center gap-1.5">
                  <Database size={12} /> Supabase
                </span>
                <span className={d?.systemHealth?.supabaseConnected ? 'text-emerald-400' : 'text-red-400'}>
                  {d?.systemHealth?.supabaseConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant flex items-center gap-1.5">
                  <Coins size={12} /> DeepSeek balance
                </span>
                <span className="text-on-surface">
                  {d?.systemHealth?.deepseekBalance != null
                    ? `$${d.systemHealth.deepseekBalance.toFixed(2)}`
                    : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant flex items-center gap-1.5">
                  <Activity size={12} /> Tokens today
                </span>
                <span className="text-on-surface">
                  {d?.systemHealth?.tokenSpentToday != null
                    ? (d.systemHealth.tokenSpentToday / 1000).toFixed(1) + 'K'
                    : '—'}
                </span>
              </div>
            </div>
          </Card>

          {/* Ventures */}
          <Card className="p-4">
            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-on-surface">
              <Building2 size={15} style={{ color: 'var(--ws-accent)' }} />
              Active ventures
            </h4>
            <div className="space-y-2">
              {(d?.ventures ?? []).map((v) => (
                <div key={v.slug} className="flex items-center justify-between rounded-lg bg-white/[0.02] p-2.5 text-[13px]">
                  <span className="text-on-surface font-medium">{v.name}</span>
                  {v.decisionsPending > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400">
                      {v.decisionsPending}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Quick action */}
          <Card className="flex flex-col justify-between p-4">
            <div>
              <h4 className="mb-1 text-sm font-semibold text-on-surface">Start your day</h4>
              <p className="text-[12px] text-on-surface-variant">
                Marcus trimmed everything to the {d?.decisions?.total ?? 7} things that actually need you.
              </p>
            </div>
            <Link href="/decision-queue" className="btn-accent mt-4 !justify-center">
              Open Decision Queue <ArrowRight size={14} />
            </Link>
          </Card>
        </div>
      </div>

      {/* ── Kai's Read ───────────────────────────────────────────────────── */}
      <div className="mt-5">
        <KaisRead
          ventureSlug={workspace.key}
          variant="dark"
          context="morning-brief"
        />
      </div>
    </div>
  )
}
