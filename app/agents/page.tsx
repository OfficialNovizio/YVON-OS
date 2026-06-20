'use client'

import { useState, useEffect, useCallback } from 'react'
import { PageHeader, Card, StatusBadge } from '@/components/ui'
import { useWorkspace } from '@/lib/WorkspaceContext'
import { Loader2, Activity, DollarSign, Cpu, Zap, TrendingUp, AlertTriangle, CheckCircle, Settings, ExternalLink } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface AgentInfo {
  id: string; name: string; role: string; department: string
  status: string; skillsCount: number; memoryHealth: number
}

interface VentureHealth {
  initialized: boolean
  repoId: string
  venture: string
  kpi: {
    score: number; status: string; tokensTotal: number; costTotal: number
    sessionsTotal: number; avgTokensPerCall: number; avgCostPerCall: number
    agentsActive: number; agentsTotal: number; lastCheck: string | null
  } | null
  hourlyBurn: { hour: string; tokens: number; cost: number }[]
  leaderboard: { agent: string; tokens: number; cost: number; sessions: number }[]
  agents: AgentInfo[]
  departments: { name: string; agentCount: number }[]
  issues: { total: number; critical: number; high: number; open: number } | null
  providers: { name: string; calls: number; tokens: number; cost: number; errors: number }[]
  activity: { time: string; agent: string; task: string; tokens: number; cost: number }[]
  error?: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function scoreColor(s: number): string {
  if (s >= 90) return '#34d399'  // emerald-400
  if (s >= 70) return '#fbbf24'  // amber-400
  return '#f87171'                // red-400
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

function timeAgo(iso: string | null): string {
  if (!iso) return 'Never'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function statusIcon(status: string, size = 14) {
  switch (status) {
    case 'healthy': return <CheckCircle size={size} style={{ color: '#34d399' }} />
    case 'degraded': return <AlertTriangle size={size} style={{ color: '#fbbf24' }} />
    case 'critical': return <AlertTriangle size={size} style={{ color: '#f87171' }} />
    default: return <Loader2 size={size} className="text-on-surface-variant animate-spin" />
  }
}

// ─── KPI Card ────────────────────────────────────────────────────────────────

function KPICard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <Card className="p-3">
      <div className="flex items-center gap-2 mb-1">{icon}<span className="text-[11px] text-on-surface-variant uppercase tracking-wider">{label}</span></div>
      <div className="text-xl font-bold text-on-surface tabular-nums">{value}</div>
      {sub && <div className="text-[10px] text-on-surface-variant/50 mt-0.5">{sub}</div>}
    </Card>
  )
}

// ─── Score Ring ──────────────────────────────────────────────────────────────

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - score / 100)
  const color = scoreColor(score)

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(255 255 255 / 0.06)" strokeWidth="6" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      <span className="absolute text-sm font-bold" style={{ color }}>{score}</span>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AgentsPage() {
  const { workspace } = useWorkspace()
  const [data, setData] = useState<VentureHealth | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/ventures-health?venture=${workspace.key}`)
      const json = await res.json()
      setData(json)
    } catch (e: any) {
      setData({ initialized: false, repoId: '', venture: workspace.key, kpi: null, hourlyBurn: [], leaderboard: [], agents: [], departments: [], issues: null, providers: [], activity: [], error: e.message })
    } finally {
      setLoading(false)
    }
  }, [workspace.key])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div>
        <PageHeader title="Agents" subtitle={`${workspace.name} · agent health monitor`} />
        <div className="flex items-center justify-center h-48"><Loader2 size={24} className="animate-spin text-on-surface-variant" /></div>
      </div>
    )
  }

  const kpi = data?.kpi

  // ── No data ────────────────────────────────────────────────────────────────
  if (!data?.initialized || !kpi) {
    return (
      <div>
        <PageHeader title="Agents" subtitle={`${workspace.name} · agent health monitor`} />
        <Card className="p-8 text-center max-w-lg mx-auto mt-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/[0.04] flex items-center justify-center">
            <Zap size={28} className="text-on-surface-variant/30" />
          </div>
          <h3 className="text-lg font-semibold text-on-surface mb-2">No Data for {workspace.name}</h3>
          <p className="text-[13px] text-on-surface-variant mb-1 leading-relaxed">
            {data?.error || 'ToonGine not detected on this venture\'s GitHub repo.'}
          </p>
          <p className="text-[12px] text-on-surface-variant/40 mb-6 font-mono">
            Repo: {data?.repoId || 'unknown'}
          </p>
          <div className="flex flex-col gap-2 text-left text-[12px] text-on-surface-variant/60 bg-white/[0.03] rounded-xl p-4 mb-4">
            <p>1. Clone the venture repo: <code className="text-[11px] bg-white/[0.04] px-1 rounded">git clone https://github.com/{data?.repoId}.git</code></p>
            <p>2. In the project root: <code className="text-[11px] bg-white/[0.04] px-1 rounded">npm install github:OfficialNovizio/ToonGine</code></p>
            <p>3. Run: <code className="text-[11px] bg-white/[0.04] px-1 rounded">npx toongine init</code> to start telemetry</p>
          </div>
          <a href="/settings" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.10] text-sm text-on-surface transition">
            <Settings size={14} /> Settings
          </a>
        </Card>
      </div>
    )
  }

  // ── Live Dashboard ─────────────────────────────────────────────────────────
  return (
    <div>
      <PageHeader
        title="Agents"
        subtitle={`${data.venture === 'novizio' ? 'Novizio' : 'Hourbour'} · ${kpi.agentsActive}/${kpi.agentsTotal} agents · ${formatTokens(kpi.tokensTotal)} tokens · ${timeAgo(kpi.lastCheck)}`}
      />

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        <KPICard icon={<Activity size={14} style={{ color: '#60a5fa' }} />} label="Score" value={`${kpi.score}`} sub={kpi.status} />
        <KPICard icon={<Cpu size={14} style={{ color: '#a78bfa' }} />} label="Agents" value={`${kpi.agentsActive}/${kpi.agentsTotal}`} sub="active/total" />
        <KPICard icon={<TrendingUp size={14} style={{ color: '#34d399' }} />} label="Tokens" value={formatTokens(kpi.tokensTotal)} sub={`${formatTokens(kpi.avgTokensPerCall)}/call`} />
        <KPICard icon={<DollarSign size={14} style={{ color: '#fbbf24' }} />} label="Cost" value={`$${kpi.costTotal.toFixed(2)}`} sub={`$${kpi.avgCostPerCall.toFixed(4)}/call`} />
        <KPICard icon={<Zap size={14} style={{ color: '#f472b6' }} />} label="Sessions" value={String(kpi.sessionsTotal)} sub="total runs" />
        {data.issues && (
          <KPICard
            icon={<AlertTriangle size={14} style={{ color: data.issues.critical > 0 ? '#f87171' : '#fbbf24' }} />}
            label="Issues"
            value={String(data.issues.open)}
            sub={`${data.issues.critical} critical · ${data.issues.high} high`}
          />
        )}
        <KPICard icon={<Activity size={14} style={{ color: '#38bdf8' }} />} label="Repo" value="" sub={data.repoId} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ── Left Column: Score + Agents ─────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Health Ring */}
          <Card className="p-4">
            <h3 className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-3">Health Score</h3>
            <div className="flex items-center gap-4">
              <ScoreRing score={kpi.score} size={96} />
              <div>
                <div className="flex items-center gap-1.5">{statusIcon(kpi.status, 14)} <span className="text-sm font-medium text-on-surface capitalize">{kpi.status}</span></div>
                <p className="text-[11px] text-on-surface-variant/60 mt-1">Last check: {timeAgo(kpi.lastCheck)}</p>
                <p className="text-[11px] text-on-surface-variant/40 mt-0.5 font-mono">{data.repoId}</p>
              </div>
            </div>
          </Card>

          {/* Agents Roster */}
          <Card className="p-4">
            <h3 className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-3">Agent Roster</h3>
            <div className="space-y-2 max-h-[320px] overflow-y-auto no-scrollbar">
              {data.agents.map(a => (
                <div key={a.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02]">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center text-[10px] font-bold text-on-surface-variant">
                    {a.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-on-surface font-medium truncate">{a.name}</div>
                    <div className="text-[11px] text-on-surface-variant/50">{a.role} · {a.department}</div>
                  </div>
                  <StatusBadge tone={a.status === 'active' ? 'green' : 'yellow'}>{a.status}</StatusBadge>
                </div>
              ))}
              {data.agents.length === 0 && <p className="text-[12px] text-on-surface-variant/40 text-center py-4">No agents detected</p>}
            </div>
          </Card>
        </div>

        {/* ── Center: Token Burn Chart + Leaderboard ──────────────────────────── */}
        <div className="space-y-4">
          {/* Hourly Burn Chart */}
          <Card className="p-4">
            <h3 className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-3">Token Burn (24h)</h3>
            {data.hourlyBurn.length > 0 ? (
              <div className="flex items-end gap-[2px] h-32">
                {data.hourlyBurn.map(h => {
                  const maxT = Math.max(...data.hourlyBurn.map(x => x.tokens), 1)
                  const height = `${Math.max(2, (h.tokens / maxT) * 100)}%`
                  return (
                    <div key={h.hour} className="flex-1 group relative" title={`${h.hour}: ${formatTokens(h.tokens)} tok · $${h.cost.toFixed(3)}`}>
                      <div className="w-full rounded-t bg-gradient-to-t from-emerald-500/60 to-emerald-400/80 hover:from-emerald-400 hover:to-emerald-300 transition" style={{ height }} />
                    </div>
                  )
                })}
              </div>
            ) : <p className="text-[12px] text-on-surface-variant/40 text-center py-8">No burn data yet</p>}
          </Card>

          {/* Leaderboard */}
          <Card className="p-4">
            <h3 className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-3">Agent Leaderboard</h3>
            <div className="space-y-1.5 max-h-[240px] overflow-y-auto no-scrollbar">
              {data.leaderboard.map((a, i) => (
                <div key={a.agent} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02]">
                  <span className="text-[10px] text-on-surface-variant/40 w-5 tabular-nums text-right font-mono">#{i + 1}</span>
                  <span className="flex-1 text-[12px] text-on-surface truncate">{a.agent}</span>
                  <span className="text-[11px] text-emerald-400/70 tabular-nums">{formatTokens(a.tokens)} tok</span>
                  <span className="text-[11px] text-amber-400/70 tabular-nums w-14 text-right">${a.cost.toFixed(2)}</span>
                </div>
              ))}
              {data.leaderboard.length === 0 && <p className="text-[12px] text-on-surface-variant/40 text-center py-4">No activity yet</p>}
            </div>
          </Card>
        </div>

        {/* ── Right: Activity Feed + Providers ─────────────────────────────────── */}
        <div className="space-y-4">
          {/* Providers */}
          <Card className="p-4">
            <h3 className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-3">Providers</h3>
            <div className="space-y-2">
              {data.providers.map(p => (
                <div key={p.name} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02]">
                  <div>
                    <div className="text-[12px] text-on-surface font-medium">{p.name}</div>
                    <div className="text-[10px] text-on-surface-variant/50">{p.calls} calls · {formatTokens(p.tokens)} tok</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[12px] text-amber-400/80 tabular-nums">${p.cost.toFixed(3)}</div>
                    {p.errors > 0 && <div className="text-[10px] text-red-400/70">{p.errors} errors</div>}
                  </div>
                </div>
              ))}
              {data.providers.length === 0 && <p className="text-[12px] text-on-surface-variant/40 text-center py-4">No provider data</p>}
            </div>
          </Card>

          {/* Recent Activity */}
          <Card className="p-4">
            <h3 className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-3">Recent Activity</h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
              {data.activity.map((a, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-white/[0.02]">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: 'var(--ws-accent, #6366f1)' }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] text-on-surface font-medium truncate">{a.agent}</span>
                      <span className="text-[10px] text-amber-400/70 tabular-nums shrink-0">{formatTokens(a.tokens)} tok</span>
                    </div>
                    <div className="text-[11px] text-on-surface-variant/50 truncate">{a.task}</div>
                  </div>
                </div>
              ))}
              {data.activity.length === 0 && <p className="text-[12px] text-on-surface-variant/40 text-center py-4">No activity yet</p>}
            </div>
          </Card>
        </div>
      </div>

      {/* Refresh */}
      <div className="mt-6 flex justify-center">
        <button onClick={fetchData} className="text-[12px] text-on-surface-variant/30 hover:text-on-surface-variant transition">
          Refresh
        </button>
      </div>
    </div>
  )
}
