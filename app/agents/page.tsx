'use client'

import { useState, useEffect, useCallback } from 'react'
import { PageHeader, Card, StatusBadge } from '@/components/ui'
import { Settings, Save, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { ToonGineDashboard } from 'toongine/dashboard'
import type { TokenBurnData, ProjectHealthData } from 'toongine/dashboard'

// ─── Agent Ops types ──────────────────────────────────────────────────────────

interface AgentSkill { name: string; category: string }
interface AgentOpsAgent {
  id: string; name: string; role: string; department: string; level: number
  status: 'active' | 'idle' | 'offline'
  skillsCount: number; skills: AgentSkill[]; memorySize: string; memoryHealth: number
}
interface ActivityEntry { time: string; agent: string; task: string; tokens: number; duration: string; status: string }
interface AgentOpsData { agents: AgentOpsAgent[]; departments: { name: string; agentCount: number; skillsTotal: number }[]; skillsTotal: number; activity: ActivityEntry[] }
interface DemoData extends AgentOpsData { tokenBurnData: TokenBurnData; projectHealthData: ProjectHealthData }

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AgentsPage() {
  const [tab, setTab] = useState<TabKey>('burn')
  const [opsData, setOpsData] = useState<AgentOpsData | null>(null)
  const [burnData, setBurnData] = useState<TokenBurnData | null>(null)
  const [healthData, setHealthData] = useState<ProjectHealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDemo, setIsDemo] = useState(false)

  // Configure tab state
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null)
  const [agentModel, setAgentModel] = useState('deepseek-chat')
  const [agentPrompt, setAgentPrompt] = useState('')
  const [savingAgent, setSavingAgent] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  // ─── Demo data loader (dev only, delete-safe) ──────────────────────────
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') { setLoading(false); return }
    import('@/feed-data/agents').then(mod => {
      const demo = mod.default as DemoData
      setOpsData({ agents: demo.agents, departments: demo.departments, skillsTotal: demo.skillsTotal, activity: demo.activity })
      setBurnData(demo.tokenBurnData)
      setHealthData(demo.projectHealthData)
      setIsDemo(true)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  // ─── Live data fetcher (production) ───────────────────────────────────
  useEffect(() => {
    if (isDemo || process.env.NODE_ENV === 'development') return
    // Fetch agent ops data
    fetch('/api/agent-ops').then(r => r.json()).then(d => {
      if (!d.error) setOpsData(d)
    }).catch(() => {})
    // Fetch dashboard data for Token Burn + Project Health
    fetch('/api/yvon-dashboard-stats').then(r => r.json()).then(d => {
      if (d.toon) {
        setBurnData({
          tokenUsage: d.cost?.tokenUsage || [],
          costByDept: [],
          costTrend: [],
          perAgentBurn: [],
          providerHealth: [{ provider: 'DeepSeek', usagePercent: 82, balance: d.systemHealth?.deepseekBalance || null, configured: true }],
        })
        setHealthData({
          kpi: { toonAvg: d.toon?.avgSavingsPercent || 94, bundleSize: d.cie?.totalTicks || 208, apiSuccess: 99.2, issuesOpen: 3, issuesCritical: 0 },
          toonQuality: [], savingsTrend: [], topKMatch: { chunksMatched: 4.2, chunksInjected: 3.8, l1: 82, l2: 14, ref: 4 },
          codebase: { lastCompile: '—', duration: '—', files: 0, chunks: 0, terms: 0, bpe: 0, corpusSize: '—', compressedSize: '—', compressionPercent: 0, delta: '—', tsErrors: 0 },
          apiHealth: { status200: 99, status400: 1, status500: 0, total24h: 0, errors: 0, topError: '' },
          promptQuality: { avgContext: '—', avgInjected: '—', reduction: 0, cacheHits: 62, bestAgent: '—', worstAgent: '—' },
          issues: [], docCoverage: [],
        })
      }
    }).catch(() => {})
    setLoading(false)
  }, [isDemo])

  // ─── Configure handlers ───────────────────────────────────────────────
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

      {/* ── TAB 1 + 2: ToonGine Dashboard ───────────────────────────────── */}
      {(tab === 'burn' || tab === 'health') && (
        <ToonGineDashboard tab={tab} tokenBurnData={burnData} projectHealthData={healthData} />
      )}

      {/* ── TAB 3: Agent Ops ─────────────────────────────────────────────── */}
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
            {/* Expandable per-agent skills */}
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
                  {a.memoryHealth <= 30 && <div className="text-[10px] text-amber-400 mt-0.5">⚠️ needs npm update toongine</div>}
                </div>
              ))}
            </div>
          </Card>

          {/* Activity Feed */}
          <Card className="p-4">
            <div className="text-xs font-semibold text-on-surface-variant mb-3 uppercase tracking-wider">📜 Activity Feed</div>
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
