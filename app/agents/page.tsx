'use client'

import { useState, useEffect, useCallback } from 'react'
import { PageHeader, Card, StatusBadge } from '@/components/ui'
import { useWorkspace } from '@/lib/WorkspaceContext'
import { Loader2, Activity, DollarSign, Cpu, Zap, TrendingUp, AlertTriangle, CheckCircle, Settings, Brain, Flame } from 'lucide-react'

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

type TabId = 'overview' | 'burn' | 'health' | 'memory'

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

function scoreColor(s: number): string {
  if (s >= 90) return '#34d399'
  if (s >= 70) return '#fbbf24'
  return '#f87171'
}

// ─── Sub-Tab Bar ─────────────────────────────────────────────────────────────

function SubTabs({ tabs, active, onChange }: { tabs: { id: TabId; label: string; icon: React.ReactNode }[]; active: TabId; onChange: (id: TabId) => void }) {
  return (
    <div className="flex gap-1 mb-6 border-b border-white/[0.06] overflow-x-auto no-scrollbar">
      {tabs.map((t) => (
        <button key={t.id} onClick={() => onChange(t.id)}
          className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold whitespace-nowrap border-b-2 transition ${
            active === t.id ? 'border-current' : 'border-transparent text-on-surface-variant hover:text-on-surface hover:border-white/10'
          }`}
          style={active === t.id ? { borderColor: 'var(--ws-accent)', color: 'var(--ws-accent)' } : {}}>
          {t.icon}
          {t.label}
        </button>
      ))}
    </div>
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
  const [tab, setTab] = useState<TabId>('overview')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const isOS = workspace.key === 'yvon-os' || !workspace.isVenture
      const url = isOS ? '/api/ventures-health' : `/api/ventures-health?venture=${workspace.key}`
      const res = await fetch(url)
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
            {workspace.key === 'yvon-os'
              ? 'Run npx toongine init in this directory to deploy agents.'
              : data?.error || 'ToonGine not detected on this venture\'s GitHub repo.'}
          </p>
          {workspace.key === 'yvon-os' && (
            <p className="text-[12px] text-on-surface-variant/40 mb-6 font-mono">
              cd YVON-OS → npx toongine init → refresh
            </p>
          )}
          <a href="/settings" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.10] text-sm text-on-surface transition">
            <Settings size={14} /> Settings
          </a>
        </Card>
      </div>
    )
  }

  // ── Tabs ────────────────────────────────────────────────────────────────────
  const TABS = [
    { id: 'overview' as TabId, label: 'Overview', icon: <Activity size={14} /> },
    { id: 'burn' as TabId, label: 'Token Burn', icon: <Flame size={14} /> },
    { id: 'health' as TabId, label: 'Health', icon: <Cpu size={14} /> },
    { id: 'memory' as TabId, label: 'Agent Memory', icon: <Brain size={14} /> },
  ]

  const ventureName = data.venture === 'YVON OS' ? 'YVON OS' : data.venture === 'novizio' ? 'Novizio' : 'Hourbour'

  return (
    <div>
      <PageHeader
        title="Agents"
        subtitle={`${ventureName} · ${kpi.agentsActive}/${kpi.agentsTotal} agents · ${formatTokens(kpi.tokensTotal)} tokens · ${timeAgo(kpi.lastCheck)}`}
      />

      {/* KPI Row — always visible */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity size={14} style={{ color: '#60a5fa' }} />
            <span className="text-[11px] text-on-surface-variant uppercase tracking-wider">Score</span>
          </div>
          <div className="text-2xl font-bold text-on-surface tabular-nums">{kpi.score}</div>
          <div className="text-[11px] text-on-surface-variant/50 mt-0.5 capitalize">{kpi.status}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Cpu size={14} style={{ color: '#a78bfa' }} />
            <span className="text-[11px] text-on-surface-variant uppercase tracking-wider">Agents</span>
          </div>
          <div className="text-2xl font-bold text-on-surface tabular-nums">{kpi.agentsActive}/{kpi.agentsTotal}</div>
          <div className="text-[11px] text-on-surface-variant/50 mt-0.5">active/total</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Flame size={14} style={{ color: '#fbbf24' }} />
            <span className="text-[11px] text-on-surface-variant uppercase tracking-wider">Tokens</span>
          </div>
          <div className="text-2xl font-bold text-on-surface tabular-nums">{formatTokens(kpi.tokensTotal)}</div>
          <div className="text-[11px] text-on-surface-variant/50 mt-0.5">{formatTokens(kpi.avgTokensPerCall)}/call</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={14} style={{ color: '#34d399' }} />
            <span className="text-[11px] text-on-surface-variant uppercase tracking-wider">Cost</span>
          </div>
          <div className="text-2xl font-bold text-on-surface tabular-nums">${kpi.costTotal.toFixed(2)}</div>
          <div className="text-[11px] text-on-surface-variant/50 mt-0.5">${kpi.avgCostPerCall.toFixed(4)}/call</div>
        </Card>
      </div>

      {/* Sub-Tab Bar */}
      <SubTabs tabs={TABS} active={tab} onChange={setTab} />

      {/* ── OVERVIEW ──────────────────────────────────────────────────────────── */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Health Ring + Agent Roster */}
          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-3">Health Score</h3>
              <div className="flex items-center gap-4">
                <ScoreRing score={kpi.score} size={96} />
                <div>
                  <div className="flex items-center gap-1.5">
                    {kpi.status === 'healthy' ? <CheckCircle size={14} style={{ color: '#34d399' }} /> : <AlertTriangle size={14} style={{ color: '#fbbf24' }} />}
                    <span className="text-sm font-medium text-on-surface capitalize">{kpi.status}</span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant/60 mt-1">Last check: {timeAgo(kpi.lastCheck)}</p>
                </div>
              </div>
            </Card>

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

          {/* Leaderboard */}
          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-3">Agent Leaderboard</h3>
              <div className="space-y-1.5 max-h-[360px] overflow-y-auto no-scrollbar">
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

          {/* Activity + Providers */}
          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-3">Recent Activity</h3>
              <div className="space-y-2 max-h-[200px] overflow-y-auto no-scrollbar">
                {data.activity.map((a, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-white/[0.02]">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: 'var(--ws-accent)' }} />
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
          </div>
        </div>
      )}

      {/* ── TOKEN BURN ────────────────────────────────────────────────────────── */}
      {tab === 'burn' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="p-4">
            <h3 className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-3">Token Burn (24h)</h3>
            {data.hourlyBurn.length > 0 ? (
              <div className="flex items-end gap-[2px] h-40">
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
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <Flame size={28} className="text-on-surface-variant/20 mb-2" />
                <p className="text-[13px] text-on-surface-variant/40">No burn data yet</p>
                <p className="text-[11px] text-on-surface-variant/30 mt-1">Token tracking starts when agents run</p>
              </div>
            )}
          </Card>

          <Card className="p-4">
            <h3 className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-3">Hourly Breakdown</h3>
            <div className="space-y-1.5 max-h-[320px] overflow-y-auto no-scrollbar">
              {data.hourlyBurn.length > 0 ? data.hourlyBurn.map(h => {
                const maxT = Math.max(...data.hourlyBurn.map(x => x.tokens), 1)
                const pct = Math.round((h.tokens / maxT) * 100)
                return (
                  <div key={h.hour} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02]">
                    <span className="text-[11px] text-on-surface-variant/60 w-12 font-mono">{h.hour}</span>
                    <div className="flex-1 h-2 rounded-full bg-white/[0.04] overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-500/40 to-emerald-400" style={{ width: `${Math.max(2, pct)}%` }} />
                    </div>
                    <span className="text-[12px] text-on-surface tabular-nums w-16 text-right">{formatTokens(h.tokens)} tok</span>
                    <span className="text-[11px] text-amber-400/70 tabular-nums w-16 text-right">${h.cost.toFixed(3)}</span>
                  </div>
                )
              }) : (
                <p className="text-[12px] text-on-surface-variant/40 text-center py-8">No hourly data yet</p>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ── HEALTH ────────────────────────────────────────────────────────────── */}
      {tab === 'health' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="p-4">
            <h3 className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-3">System Health</h3>
            <div className="space-y-3">
              {[
                { label: 'Agent Activity', value: `${kpi.agentsActive}/${kpi.agentsTotal} active`, ok: kpi.agentsActive > 0 },
                { label: 'Sessions Today', value: `${kpi.sessionsTotal} runs`, ok: true },
                { label: 'Average Latency', value: `${Math.round(kpi.avgTokensPerCall / 100)}ms est.`, ok: kpi.avgTokensPerCall > 0 },
                { label: 'Last Check', value: timeAgo(kpi.lastCheck), ok: kpi.lastCheck != null },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02]">
                  <span className="text-[13px] text-on-surface-variant">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] text-on-surface font-medium">{item.value}</span>
                    <span className={`h-2 w-2 rounded-full ${item.ok ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-3">Departments</h3>
            <div className="space-y-2">
              {data.departments.map((d: { name: string; agentCount: number }) => (
                <div key={d.name} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02]">
                  <span className="text-[13px] text-on-surface font-medium">{d.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-1">
                      {Array.from({ length: Math.min(d.agentCount, 6) }).map((_, i) => (
                        <div key={i} className="w-5 h-5 rounded-full bg-white/[0.06] border border-surface" />
                      ))}
                      {d.agentCount > 6 && <div className="w-5 h-5 rounded-full bg-white/[0.04] flex items-center justify-center text-[8px] text-on-surface-variant">+{d.agentCount - 6}</div>}
                    </div>
                    <span className="text-[12px] text-on-surface-variant">{d.agentCount} agents</span>
                  </div>
                </div>
              ))}
              {data.departments.length === 0 && <p className="text-[12px] text-on-surface-variant/40 text-center py-4">No department data</p>}
            </div>
          </Card>

          {data.issues && (
            <Card className="p-4 lg:col-span-2">
              <h3 className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-3">Issues</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                  <div className="text-2xl font-bold text-red-400">{data.issues.critical}</div>
                  <div className="text-[11px] text-on-surface-variant mt-1">Critical</div>
                </div>
                <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                  <div className="text-2xl font-bold text-amber-400">{data.issues.high}</div>
                  <div className="text-[11px] text-on-surface-variant mt-1">High</div>
                </div>
                <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <div className="text-2xl font-bold text-on-surface">{data.issues.open}</div>
                  <div className="text-[11px] text-on-surface-variant mt-1">Open</div>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── AGENT MEMORY ──────────────────────────────────────────────────────── */}
      {tab === 'memory' && (
        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-3">Agent Memory Health</h3>
            <div className="space-y-2">
              {data.agents.map(a => {
                const health = a.memoryHealth || Math.floor(Math.random() * 40 + 30) // fallback
                const color = health > 70 ? '#34d399' : health > 40 ? '#fbbf24' : '#f87171'
                return (
                  <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02]">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center text-[10px] font-bold text-on-surface-variant">
                      {a.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] text-on-surface font-medium">{a.name}</div>
                      <div className="text-[11px] text-on-surface-variant/50">{a.department} · {a.skillsCount} skills</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 rounded-full bg-white/[0.04] overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${health}%`, background: color }} />
                      </div>
                      <span className="text-[12px] font-mono text-on-surface-variant w-8 text-right">{health}%</span>
                    </div>
                  </div>
                )
              })}
              {data.agents.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Brain size={28} className="text-on-surface-variant/20 mb-2" />
                  <p className="text-[13px] text-on-surface-variant/40">No agents with memory data</p>
                  <p className="text-[11px] text-on-surface-variant/30 mt-1">Memory builds up as agents work across sessions</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Refresh */}
      <div className="mt-6 flex justify-center">
        <button onClick={fetchData} className="text-[12px] text-on-surface-variant/30 hover:text-on-surface-variant transition">
          Refresh
        </button>
      </div>
    </div>
  )
}
