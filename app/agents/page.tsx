'use client'

import { useState, useEffect, useCallback } from 'react'
import { PageHeader, Card, StatusBadge } from '@/components/ui'
import { Settings, Save, Loader2, ChevronDown, ChevronUp, Zap, RefreshCw, AlertTriangle, CheckCircle, TrendingUp, DollarSign, Activity, Cpu } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface AgentSkill { name: string; category: string }
interface AgentOpsAgent {
  id: string; name: string; role: string; department: string; level: number
  status: 'active' | 'idle' | 'offline'
  skillsCount: number; skills: AgentSkill[]; memorySize: string; memoryHealth: number
}
interface ActivityEntry { time: string; agent: string; task: string; tokens: number; duration: string; status: string }
interface AgentOpsData { agents: AgentOpsAgent[]; departments: { name: string; agentCount: number; skillsTotal: number }[]; skillsTotal: number; activity: ActivityEntry[] }

interface TokenBurnData {
  initialized: boolean
  kpi?: { totalTokens: number; totalCost: number; totalSessions: number; avgTokens: number }
  hourlyBurn?: { hour: string; tokens: number; cost: number }[]
  leaderboard?: { agent: string; tokens: number; cost: number; sessions: number }[]
  providers?: { name: string; calls: number; tokens: number; cost: number; errors: number; health: string }[]
  error?: string
}

interface ProjectHealthData {
  initialized: boolean
  score?: { overall: number; codebase: number; api: number; toon: number; issues_score: number; burn: number }
  issues?: { total: number; critical: number; high: number; open: number; items: any[] }
  toon?: { nodes: number; edges: number; compressionRatio: number; healthPct: number }
  codebase?: { files: number; lines: number; languages: number }
  apiTimeline?: { time: string; latency: number; errors: number }[]
  healthEvents?: { time: string; type: string; message: string }[]
  recommendations?: { priority: string; text: string }[]
  error?: string
}

type TabKey = 'burn' | 'health' | 'ops'

const DEPT_COLORS: Record<string, string> = {
  Command: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  Technical: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  Marketing: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  Finance: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  Legal: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  Sense: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  Research: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  Psychology: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
}

const STATUS_DOT: Record<string, string> = {
  active: 'bg-emerald-400 shadow-[0_0_6px_rgba(74,222,128,0.5)]',
  idle: 'bg-amber-400',
  offline: 'bg-neutral-600',
}

const AVAILABLE_MODELS = ['deepseek-chat', 'deepseek-reasoner', 'gpt-4o', 'gpt-4o-mini', 'claude-sonnet-4-20250514', 'claude-opus-4-20250514', 'gemini-2.5-pro', 'gemini-2.5-flash']

// ─── Sub-components ──────────────────────────────────────────────────────────

function KPICard({ icon: Icon, label, value, sub, accent }: { icon: any; label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="glass-card p-4 flex items-start gap-3">
      <div className={`mt-0.5 p-2 rounded-xl ${accent || 'bg-white/[0.04]'}`}>
        <Icon size={18} className={accent ? 'text-white' : 'text-on-surface-variant'} />
      </div>
      <div>
        <div className="text-[11px] text-on-surface-variant/60 uppercase tracking-wider">{label}</div>
        <div className="text-xl font-bold text-on-surface tabular-nums mt-0.5">{value}</div>
        {sub && <div className="text-[11px] text-on-surface-variant/50 mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

function BurnChart({ data }: { data: { hour: string; tokens: number }[] }) {
  const maxTokens = Math.max(...data.map(d => d.tokens), 1)
  return (
    <div className="flex items-end gap-1 h-32">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0" title={`${d.hour}: ${d.tokens.toLocaleString()} tokens`}>
          <div className="w-full bg-gradient-to-t from-emerald-500/40 to-emerald-400 rounded-t-sm transition-all duration-300"
            style={{ height: `${Math.max((d.tokens / maxTokens) * 100, 2)}%`, minHeight: d.tokens > 0 ? '4px' : '1px' }} />
        </div>
      ))}
    </div>
  )
}

function ScoreRing({ score, size = 100, label }: { score: number; size?: number; label: string }) {
  const radius = (size - 8) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = score >= 80 ? '#4ade80' : score >= 50 ? '#f59e0b' : '#f87171'
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-1000 ease-out" />
      </svg>
      <span className="text-2xl font-bold tabular-nums -mt-12">{score}%</span>
      <span className="text-[10px] text-on-surface-variant/60 uppercase tracking-wider">{label}</span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AgentsPage() {
  const [tab, setTab] = useState<TabKey>('burn')
  const [opsData, setOpsData] = useState<AgentOpsData | null>(null)
  const [burnData, setBurnData] = useState<TokenBurnData | null>(null)
  const [healthData, setHealthData] = useState<ProjectHealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [initializing, setInitializing] = useState(false)
  const [initMsg, setInitMsg] = useState('')
  const [initSteps, setInitSteps] = useState<string[]>([])

  // Configure tab state
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null)
  const [agentModel, setAgentModel] = useState('deepseek-chat')
  const [agentPrompt, setAgentPrompt] = useState('')
  const [savingAgent, setSavingAgent] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  // ─── Data loader ───────────────────────────────────────────────────────────

  useEffect(() => {
    let settled = 0
    const done = () => { settled++; if (settled >= 3) setLoading(false) }
    const defaultOps: AgentOpsData = { agents: [], departments: [], skillsTotal: 0, activity: [] }

    fetch('/api/agent-ops').then(r => r.json()).then(d => {
      if (!d.error && d.agents) setOpsData(d); else setOpsData(defaultOps)
      done()
    }).catch(() => { setOpsData(defaultOps); done() })

    fetch('/api/toongine/token-burn').then(r => r.json()).then(d => {
      setBurnData(d as TokenBurnData); done()
    }).catch(() => { setBurnData({ initialized: false }); done() })

    fetch('/api/toongine/project-health').then(r => r.json()).then(d => {
      setHealthData(d as ProjectHealthData); done()
    }).catch(() => { setHealthData({ initialized: false }); done() })
  }, [])

  // ─── Init handler ──────────────────────────────────────────────────────────

  const handleInitialize = async () => {
    setInitializing(true)
    setInitMsg('Initializing ToonGine...')
    setInitSteps([])
    try {
      const res = await fetch('/api/toongine/init', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setInitMsg('✓ Initialized! Reloading data...')
        setInitSteps(data.steps || [])
        // Refetch all data
        setTimeout(() => {
          fetch('/api/toongine/token-burn').then(r => r.json()).then(d => setBurnData(d as TokenBurnData))
          fetch('/api/toongine/project-health').then(r => r.json()).then(d => setHealthData(d as ProjectHealthData))
          fetch('/api/agent-ops').then(r => r.json()).then(d => { if (!d.error && d.agents) setOpsData(d) })
          setInitMsg('')
          setInitSteps([])
        }, 1500)
      } else {
        setInitMsg(`✗ Error: ${data.error || 'Unknown error'}`)
      }
    } catch (e: any) {
      setInitMsg(`✗ Network error: ${e.message}`)
    }
    setInitializing(false)
  }

  // ─── Configure handlers ────────────────────────────────────────────────────
  const expandAgent = useCallback(async (agentId: string) => {
    if (expandedAgent === agentId) { setExpandedAgent(null); return }
    setExpandedAgent(agentId); setSaveMsg('')
    try {
      const res = await fetch(`/api/settings?ventureId=yvon&agentId=${agentId}`)
      if (res.ok) {
        const settings = await res.json()
        if (Array.isArray(settings)) {
          const cfg = settings.find((s: { agentId: string }) => s.agentId === agentId)
          if (cfg) { setAgentModel(cfg.model || 'deepseek-chat'); setAgentPrompt(cfg.systemPromptExtension || '') }
        }
      }
    } catch {}
  }, [expandedAgent])

  const saveAgentSettings = async (agentId: string) => {
    setSavingAgent(true); setSaveMsg('')
    try {
      const res = await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ventureId: 'yvon', agentId, model: agentModel, systemPromptExtension: agentPrompt }) })
      if (res.ok) { setSaveMsg('Saved ✓'); setTimeout(() => setSaveMsg(''), 2000) }
      else { const err = await res.json(); setSaveMsg(`Error: ${err.error}`) }
    } catch { setSaveMsg('Network error') }
    setSavingAgent(false)
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 size={24} className="animate-spin text-on-surface-variant" /></div>

  const totalAgents = opsData?.agents?.length || 24

  return (
    <div>
      <PageHeader
        title="Agents"
        subtitle={`${totalAgents} agents · ${opsData?.departments?.length || 7} departments · ${opsData?.skillsTotal || 0} skills · Hermes v0.16 · DeepSeek`}
      />

      {/* Tabs */}
      <div className="mb-5 flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] w-fit">
        {[
          { key: 'burn' as TabKey, label: '💰 Token Burn', icon: '💰' },
          { key: 'health' as TabKey, label: '🏥 Project Health', icon: '🏥' },
          { key: 'ops' as TabKey, label: '👥 Agent Ops', icon: '👥' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${tab === t.key ? 'bg-white/[0.08] text-on-surface' : 'text-on-surface-variant hover:text-on-surface'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── INITIALIZE BANNER ─────────────────────────────────────────────── */}
      {!burnData?.initialized && !healthData?.initialized && (tab === 'burn' || tab === 'health') && (
        <Card className="p-6 text-center">
          <div className="text-4xl mb-3">🚀</div>
          <h3 className="text-lg font-semibold mb-2">Initialize ToonGine</h3>
          <p className="text-sm text-on-surface-variant/70 max-w-md mx-auto mb-4">
            One click to enable token tracking, project health monitoring, graph intelligence, and real-time agent analytics.
          </p>
          {initSteps.length > 0 && (
            <div className="mb-4 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] text-left max-w-md mx-auto">
              {initSteps.map((s, i) => (
                <div key={i} className="text-xs text-on-surface-variant/80 py-0.5 font-mono">{s}</div>
              ))}
            </div>
          )}
          <button onClick={handleInitialize} disabled={initializing}
            className="btn-accent px-6 py-3 text-sm">
            {initializing ? <Loader2 size={16} className="animate-spin mr-2" /> : <Zap size={16} className="mr-2" />}
            {initializing ? 'Initializing...' : 'Initialize ToonGine'}
          </button>
          {initMsg && !initMsg.startsWith('✓') && (
            <p className="text-xs text-red-400 mt-3">{initMsg}</p>
          )}
        </Card>
      )}

      {/* ── TAB 1: TOKEN BURN ─────────────────────────────────────────────── */}
      {tab === 'burn' && burnData?.initialized && (
        <div className="space-y-4">
          {/* KPI Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KPICard icon={Zap} label="Total Tokens" value={burnData.kpi!.totalTokens.toLocaleString()} sub={`${burnData.kpi!.totalSessions} sessions`} accent="bg-amber-500/20" />
            <KPICard icon={DollarSign} label="Total Cost" value={`$${burnData.kpi!.totalCost.toFixed(2)}`} accent="bg-emerald-500/20" />
            <KPICard icon={Activity} label="Avg Tokens/Session" value={burnData.kpi!.avgTokens.toLocaleString()} accent="bg-blue-500/20" />
            <KPICard icon={TrendingUp} label="Cash Burn Rate" value={`$${(burnData.kpi!.totalCost / Math.max(burnData.kpi!.totalSessions, 1)).toFixed(4)}`} sub="per session avg" accent="bg-purple-500/20" />
          </div>

          {/* Hourly Burn Chart */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">📊 Hourly Token Burn (24h)</span>
              <span className="text-[10px] text-on-surface-variant/50 tabular-nums">
                Peak: {Math.max(...(burnData.hourlyBurn || []).map(d => d.tokens)).toLocaleString()} tokens
              </span>
            </div>
            <BurnChart data={burnData.hourlyBurn || []} />
            <div className="flex justify-between mt-2 text-[9px] text-on-surface-variant/40">
              <span>24h ago</span><span>Now</span>
            </div>
          </Card>

          {/* Leaderboard + Providers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-4">
              <div className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">🏆 Agent Leaderboard</div>
              <div className="space-y-2">
                {(burnData.leaderboard || []).slice(0, 8).map((a, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg bg-white/[0.02] p-2.5">
                    <span className="text-xs font-bold text-on-surface-variant/40 w-5 tabular-nums">#{i + 1}</span>
                    <span className="text-sm text-on-surface font-medium flex-1">{a.agent}</span>
                    <span className="text-xs text-on-surface-variant/70 tabular-nums">{a.tokens.toLocaleString()} tok</span>
                    <span className="text-xs text-emerald-400/80 tabular-nums w-16 text-right">{a.sessions} sess</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <div className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">🔌 Provider Health</div>
              <div className="space-y-2">
                {(burnData.providers || []).map((p, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg bg-white/[0.02] p-2.5">
                    <span className={`w-2 h-2 rounded-full ${p.errors > 0 ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                    <span className="text-sm text-on-surface font-medium flex-1">{p.name}</span>
                    <span className="text-xs text-on-surface-variant/70 tabular-nums">{p.calls.toLocaleString()} calls</span>
                    {p.errors > 0 && <span className="text-[10px] text-amber-400">{p.errors} err</span>}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ── TAB 2: PROJECT HEALTH ─────────────────────────────────────────── */}
      {tab === 'health' && healthData?.initialized && (
        <div className="space-y-4">
          {/* Score Rings */}
          <Card className="p-5">
            <div className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-4">❤️ Health Score</div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 justify-items-center">
              <ScoreRing score={healthData.score!.overall} size={90} label="Overall" />
              <ScoreRing score={healthData.score!.codebase} size={80} label="Codebase" />
              <ScoreRing score={healthData.score!.api} size={80} label="API" />
              <ScoreRing score={healthData.score!.toon} size={80} label="TOON" />
              <ScoreRing score={healthData.score!.burn} size={80} label="Burn" />
            </div>
          </Card>

          {/* TOON Health + Codebase */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-4">
              <div className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">🧠 TOON Intelligence</div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Nodes', value: healthData.toon!.nodes.toLocaleString() },
                  { label: 'Edges', value: healthData.toon!.edges.toLocaleString() },
                  { label: 'Compression', value: `${healthData.toon!.compressionRatio}%` },
                  { label: 'Health', value: `${healthData.toon!.healthPct}%` },
                ].map((m, i) => (
                  <div key={i} className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-3 text-center">
                    <div className="text-xl font-bold text-on-surface tabular-nums">{m.value}</div>
                    <div className="text-[10px] text-on-surface-variant/60">{m.label}</div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <div className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">📁 Codebase</div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Files', value: healthData.codebase!.files.toLocaleString() },
                  { label: 'Lines', value: healthData.codebase!.lines.toLocaleString() },
                  { label: 'Languages', value: healthData.codebase!.languages },
                ].map((m, i) => (
                  <div key={i} className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-3 text-center">
                    <div className="text-xl font-bold text-on-surface tabular-nums">{m.value}</div>
                    <div className="text-[10px] text-on-surface-variant/60">{m.label}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Issues + Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">🐛 Issues</span>
                <span className="text-[10px] text-on-surface-variant/50">{healthData.issues!.total} total</span>
              </div>
              {healthData.issues!.critical > 0 && (
                <div className="flex items-center gap-2 mb-2 p-2 rounded-lg bg-red-500/5 border border-red-500/10">
                  <AlertTriangle size={14} className="text-red-400" />
                  <span className="text-xs text-red-300">{healthData.issues!.critical} critical</span>
                </div>
              )}
              <div className="space-y-1.5 mt-3">
                {(healthData.issues?.items || []).map((iss: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-[11px] py-1.5 border-b border-white/[0.03] last:border-0">
                    <span className={`status-pill ${iss.priority === 'critical' ? 'status-pill-critical' : iss.priority === 'high' ? 'status-pill-warning' : 'status-pill-info'}`}>{iss.priority || iss.severity}</span>
                    <span className="text-on-surface flex-1 truncate">{iss.title || iss.message || iss.description}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <div className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">💡 Recommendations</div>
              <div className="space-y-2">
                {(healthData.recommendations || []).map((r, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-lg bg-white/[0.02] p-2.5">
                    <span className={`mt-0.5 ${r.priority === 'critical' ? 'text-red-400' : r.priority === 'high' ? 'text-amber-400' : 'text-blue-400'}`}>
                      {r.priority === 'critical' ? <AlertTriangle size={12} /> : <CheckCircle size={12} />}
                    </span>
                    <span className="text-xs text-on-surface-variant/80">{r.text}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ── TAB 3: AGENT OPS ─────────────────────────────────────────────── */}
      {tab === 'ops' && opsData && (
        <div className="space-y-4">
          {/* Agent Roster */}
          <Card className="p-4">
            <div className="text-xs font-semibold text-on-surface-variant mb-3 uppercase tracking-wider">Agent Roster · {opsData.agents.length} Agents</div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {opsData.departments.map(dept => {
                const deptAgents = opsData.agents.filter(a => a.department === dept.name)
                return (
                  <div key={dept.name} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                    <div className="text-[11px] font-semibold text-on-surface-variant mb-2 uppercase tracking-wider">{dept.name} · {deptAgents.length} agents</div>
                    <div className="space-y-1.5">
                      {deptAgents.map(a => (
                        <div key={a.id} className="flex items-center gap-2 text-[12px]">
                          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[a.status]}`} />
                          <span className="text-on-surface font-medium">{a.name}</span>
                          <span className="text-on-surface-variant/60 text-[10px]">{a.role}</span>
                          {a.skillsCount > 0 && <span className="ml-auto text-[10px] text-on-surface-variant/40">{a.skillsCount} skills</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Skill Inventory */}
          <Card className="p-4">
            <div className="text-xs font-semibold text-on-surface-variant mb-3 uppercase tracking-wider">⭐ Skill Inventory · {opsData.skillsTotal} Skills</div>
            <div className="space-y-2">
              {opsData.departments.map(dept => (
                <div key={dept.name}>
                  <div className="flex justify-between text-[11px] mb-0.5">
                    <span className="text-on-surface-variant">{dept.name} ({dept.skillsTotal})</span>
                    <span className="tabular-nums text-on-surface-variant/60">{dept.skillsTotal > 0 ? '100%' : '0%'} loaded</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/[0.04]">
                    <div className="h-1.5 rounded-full bg-emerald-400" style={{ width: `${dept.skillsTotal > 0 ? 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {opsData.agents.filter(a => a.skills.length > 0).slice(0, 10).map(a => (
                <div key={a.id} className="rounded-lg border border-white/[0.04] bg-white/[0.01] p-2.5">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[12px] font-semibold text-on-surface">{a.name}</span>
                    <span className="text-[10px] text-on-surface-variant/60">{a.skillsCount} skills</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {a.skills.map(s => (
                      <span key={s.name} className="px-1.5 py-0.5 rounded text-[9px] bg-white/[0.04] text-on-surface-variant/70">{s.name}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Memory Health */}
          <Card className="p-4">
            <div className="text-xs font-semibold text-on-surface-variant mb-3 uppercase tracking-wider">🧠 Memory Health</div>
            <div className="space-y-2">
              {opsData.agents.map(a => (
                <div key={a.id}>
                  <div className="flex justify-between text-[11px] mb-0.5">
                    <span className="text-on-surface-variant">{a.name}</span>
                    <span className="tabular-nums text-on-surface-variant/60">{a.memorySize} · {a.memoryHealth}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/[0.04]">
                    <div className="h-1.5 rounded-full" style={{ width: `${a.memoryHealth}%`, background: a.memoryHealth > 60 ? '#34d399' : a.memoryHealth > 30 ? '#f59e0b' : '#f87171' }} />
                  </div>
                  {a.memoryHealth <= 30 && <div className="text-[10px] text-amber-400 mt-0.5">⚠️ low memory health</div>}
                </div>
              ))}
            </div>
          </Card>

          {/* Activity Feed */}
          <Card className="p-4">
            <div className="text-xs font-semibold text-on-surface-variant mb-3 uppercase tracking-wider">📜 Activity Feed</div>
            {opsData.activity.length === 0 ? (
              <p className="text-xs text-on-surface-variant/40 py-4 text-center">No activity yet — start using agents to populate this feed</p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {opsData.activity.map((entry, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg bg-white/[0.02] p-2.5 text-[12px]">
                    <span className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${entry.status === 'completed' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-on-surface-variant/60 tabular-nums">{entry.time}</span>
                        <span className="text-on-surface font-medium">{entry.agent}</span>
                        <span className="text-on-surface-variant truncate">· {entry.task}</span>
                      </div>
                      <div className="text-[10px] text-on-surface-variant/50 mt-0.5">{entry.tokens.toLocaleString()} tok · {entry.duration}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Configure */}
          <Card className="p-4">
            <div className="text-xs font-semibold text-on-surface-variant mb-3 uppercase tracking-wider">⚙ Configure Agent</div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {opsData.agents.slice(0, 14).map(a => {
                const isExpanded = expandedAgent === a.id
                return (
                  <div key={a.id}>
                    <div className={`glass-card p-3 ${isExpanded ? 'rounded-b-none' : ''}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`w-2 h-2 rounded-full ${STATUS_DOT[a.status]}`} />
                        <span className="text-[12px] font-semibold text-on-surface">{a.name}</span>
                        <span className="text-[10px] text-on-surface-variant ml-auto">{a.role}</span>
                      </div>
                      <span className={`inline-block px-2 py-0.5 rounded text-[9px] border ${DEPT_COLORS[a.department] || 'bg-white/5 text-on-surface-variant border-white/10'}`}>{a.department}</span>
                      <button onClick={() => expandAgent(a.id)}
                        className="mt-2 w-full flex items-center justify-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 py-1 text-[11px] text-on-surface-variant hover:bg-white/[0.05] transition">
                        <Settings size={11} /> {isExpanded ? 'Close' : 'Configure'} {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                      </button>
                    </div>
                    {isExpanded && (
                      <div className="glass-card rounded-t-none border-t-0 p-3 pt-0">
                        <div className="pt-2 space-y-2">
                          <select value={agentModel} onChange={e => setAgentModel(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-2 py-1.5 text-[12px] text-on-surface focus:outline-none">
                            {AVAILABLE_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                          <textarea value={agentPrompt} onChange={e => setAgentPrompt(e.target.value)} rows={2}
                            placeholder="System prompt extension..."
                            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-2 py-1.5 text-[12px] text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none resize-none" />
                          <div className="flex items-center gap-2">
                            <button onClick={() => saveAgentSettings(a.id)} disabled={savingAgent}
                              className="btn-accent flex items-center gap-1 text-[11px] px-3 py-1.5">
                              {savingAgent ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} {savingAgent ? 'Saving' : 'Save'}
                            </button>
                            {saveMsg && <span className={`text-[11px] ${saveMsg.startsWith('Saved') ? 'text-emerald-400' : 'text-red-400'}`}>{saveMsg}</span>}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
