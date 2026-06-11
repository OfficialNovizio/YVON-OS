'use client'

import { useState, useCallback } from 'react'
import { PageHeader, StatusBadge, Card } from '@/components/ui'
import { useLiveData } from '@/lib/use-live-data'
import { useWorkspace } from '@/lib/WorkspaceContext'
import type { AgentStatus } from '@/app/api/agent-status/route'
import { Settings, Save, Loader2, ChevronDown, ChevronUp, Monitor, Cpu, HardDrive, Terminal, MonitorPlay, Router } from 'lucide-react'

const DEPT_COLORS: Record<string, string> = {
  Command: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  Technical: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  Marketing: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  Finance: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
}

const STATUS_DOT: Record<string, string> = {
  active: 'bg-emerald-400 shadow-[0_0_6px_rgba(74,222,128,0.5)]',
  idle: 'bg-amber-400',
  offline: 'bg-neutral-600',
}

const AVAILABLE_MODELS = [
  'deepseek-chat',
  'deepseek-reasoner',
  'gpt-4o',
  'gpt-4o-mini',
  'claude-sonnet-4-20250514',
  'claude-opus-4-20250514',
  'gemini-2.5-pro',
  'gemini-2.5-flash',
]

// Machine definitions per LifeOS spec
const MACHINES = [
  {
    id: 'mm2-hermes',
    name: 'Mac Mini 2 — Hermes',
    role: 'Personal Layer · serves all workspaces',
    ram: '16 GB',
    cpu: 'M2',
    status: 'online' as const,
    agents: ['Marcus', 'Diana', 'Dev', 'Raj', 'Mia', 'Quinn', 'Felix'],
    layer: 'Hermes Gateway / Routing + Personal Team',
  },
  {
    id: 'mm1-openclaw',
    name: 'Mac Mini 1 — OpenClaw',
    role: 'Workspace tier · produces the work',
    ram: '16 GB',
    cpu: 'M2',
    status: 'online' as const,
    agents: ['Kai', 'Lena', 'Rio', 'Nate', 'Atlas', 'Pixel'],
    layer: 'Workspace / Master Agents',
  },
  {
    id: 'mm3-workshop',
    name: 'Mac Mini 3 — Workshop & Services',
    role: 'Skill workshop · makes the team better',
    ram: '16 GB',
    cpu: 'M2',
    status: 'cooling' as const,
    agents: [],
    layer: 'Skill Training & Improvement',
  },
  {
    id: 'studio-m5',
    name: 'Mac Studio M5',
    role: 'Reserved · future capacity',
    ram: '—',
    cpu: 'M5 Ultra',
    status: 'offline' as const,
    agents: [],
    layer: 'Reserved',
  },
]

const MACHINE_STATUS_COLORS: Record<string, string> = {
  online: 'text-emerald-400 bg-emerald-500/10',
  cooling: 'text-amber-400 bg-amber-500/10',
  offline: 'text-neutral-500 bg-neutral-500/10',
}

export default function AgentsPage() {
  const { workspace } = useWorkspace()
  const { data, loading } = useLiveData<{ agents: AgentStatus[]; agentsLive: number; totalAgents: number; machinesOnline: number }>({
    url: '/api/agent-status',
    mockData: { agents: [], agentsLive: 0, totalAgents: 0, machinesOnline: 0 },
    pollIntervalMs: 30000,
  })

  const [tab, setTab] = useState<'fleet' | 'configure'>('fleet')

  // Per-agent settings panel state
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null)
  const [agentModel, setAgentModel] = useState<string>('deepseek-chat')
  const [agentPrompt, setAgentPrompt] = useState<string>('')
  const [savingAgent, setSavingAgent] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  const expandAgent = useCallback(async (agentId: string) => {
    if (expandedAgent === agentId) { setExpandedAgent(null); return }
    setExpandedAgent(agentId)
    setSaveMsg('')
    try {
      const [settingsRes] = await Promise.all([
        fetch(`/api/settings?ventureId=${workspace.key}&agentId=${agentId}`),
      ])
      if (settingsRes.ok) {
        const settings = await settingsRes.json()
        if (Array.isArray(settings)) {
          const cfg = settings.find((s: { agentId: string }) => s.agentId === agentId)
          if (cfg) {
            setAgentModel(cfg.model || 'deepseek-chat')
            setAgentPrompt(cfg.systemPromptExtension || '')
          }
        }
      }
    } catch {}
  }, [expandedAgent, workspace.key])

  const saveAgentSettings = async (agentId: string) => {
    setSavingAgent(true)
    setSaveMsg('')
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ventureId: workspace.key,
          agentId,
          model: agentModel,
          systemPromptExtension: agentPrompt,
        }),
      })
      if (res.ok) {
        setSaveMsg('Saved ✓')
        setTimeout(() => setSaveMsg(''), 2000)
      } else {
        const err = await res.json()
        setSaveMsg(`Error: ${err.error}`)
      }
    } catch {
      setSaveMsg('Network error')
    }
    setSavingAgent(false)
  }

  const onlineMachines = MACHINES.filter((m) => m.status === 'online').length
  const totalRam = MACHINES.filter((m) => m.status === 'online').reduce((sum, m) => sum + parseInt(m.ram), 0)

  const getAgentStatus = (name: string) => data?.agents?.find((a) => a.name === name)?.status ?? 'offline'
  const getAgentTask = (name: string) => data?.agents?.find((a) => a.name === name)?.currentTask

  return (
    <div>
      <PageHeader title="Agents" subtitle="Fleet infrastructure, agent activity, and per-agent configuration." />

      {/* Tabs */}
      <div className="mb-5 flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] w-fit">
        <button
          onClick={() => setTab('fleet')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
            tab === 'fleet' ? 'bg-white/[0.08] text-on-surface' : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Monitor size={14} className="inline mr-1.5" />
          Fleet
        </button>
        <button
          onClick={() => setTab('configure')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
            tab === 'configure' ? 'bg-white/[0.08] text-on-surface' : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Settings size={14} className="inline mr-1.5" />
          Configure
        </button>
      </div>

      {/* ── FLEET TAB ─────────────────────────────────────── */}
      {tab === 'fleet' && (
        <>
          {/* KPI cards */}
          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card className="glass-card p-4 text-center">
              <Monitor size={18} className="text-emerald-400 mx-auto mb-1" />
              <div className="text-2xl font-bold text-on-surface">{onlineMachines}</div>
              <div className="text-[11px] text-on-surface-variant">Machines online</div>
            </Card>
            <Card className="glass-card p-4 text-center">
              <Cpu size={18} className="text-blue-400 mx-auto mb-1" />
              <div className="text-2xl font-bold text-on-surface">{data?.agentsLive ?? 0}</div>
              <div className="text-[11px] text-on-surface-variant">Agents running</div>
            </Card>
            <Card className="glass-card p-4 text-center">
              <HardDrive size={18} className="text-purple-400 mx-auto mb-1" />
              <div className="text-2xl font-bold text-on-surface">{totalRam} GB</div>
              <div className="text-[11px] text-on-surface-variant">RAM in use</div>
            </Card>
            <Card className="glass-card p-4 text-center">
              <Router size={18} className="text-amber-400 mx-auto mb-1" />
              <div className="text-2xl font-bold text-on-surface">Hermes</div>
              <div className="text-[11px] text-on-surface-variant">Routing · online</div>
            </Card>
          </div>

          {/* Machine groups */}
          <div className="space-y-3">
            {MACHINES.map((machine) => {
              const machineAgents = machine.agents
                .map((name) => data?.agents?.find((a) => a.name === name))
                .filter(Boolean) as AgentStatus[]
              const liveOnMachine = machineAgents.filter((a) => a.status === 'active').length

              return (
                <Card key={machine.id} className="glass-card overflow-hidden">
                  {/* Machine header */}
                  <div className="p-4 flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-on-surface">{machine.name}</h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${MACHINE_STATUS_COLORS[machine.status]}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${machine.status === 'online' ? 'bg-emerald-400' : machine.status === 'cooling' ? 'bg-amber-400' : 'bg-neutral-500'}`} />
                          {machine.status === 'online' ? 'online' : machine.status === 'cooling' ? 'cooling / idle' : 'offline'}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-0.5">{machine.role}</p>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-on-surface-variant/60">
                        <span className="flex items-center gap-1"><Cpu size={10} />{machine.cpu}</span>
                        <span className="flex items-center gap-1"><HardDrive size={10} />{machine.ram}</span>
                        {liveOnMachine > 0 && (
                          <span className="flex items-center gap-1 text-emerald-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />{liveOnMachine} live</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {machine.status !== 'offline' && (
                      <div className="flex gap-1.5">
                        <button
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02] text-xs text-on-surface-variant hover:bg-white/[0.06] hover:text-on-surface transition"
                          title="SSH / Terminal"
                        >
                          <Terminal size={12} />
                          SSH
                        </button>
                        <button
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02] text-xs text-on-surface-variant hover:bg-white/[0.06] hover:text-on-surface transition"
                          title="Screen Share"
                        >
                          <MonitorPlay size={12} />
                          Screen
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Agent avatars on this machine */}
                  {machineAgents.length > 0 && (
                    <div className="px-4 pb-4 border-t border-white/[0.04] pt-3">
                      <div className="text-[10px] uppercase tracking-wider text-on-surface-variant/50 mb-2">{machine.layer}</div>
                      <div className="flex flex-wrap gap-2">
                        {machineAgents.map((a) => (
                          <div
                            key={a.id}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.12] transition cursor-pointer"
                            title={`${a.role}${a.currentTask ? ` — ${a.currentTask}` : ''}`}
                          >
                            {a.avatar ? (
                              <img src={a.avatar} alt={a.name} className="w-5 h-5 rounded-full" />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-on-surface">
                                {a.name[0]}
                              </div>
                            )}
                            <div>
                              <div className="text-xs font-medium text-on-surface leading-tight">{a.name}</div>
                              <div className="text-[9px] text-on-surface-variant/60 leading-tight">{a.role}</div>
                            </div>
                            <span className={`w-1.5 h-1.5 rounded-full ml-1 ${STATUS_DOT[a.status]}`} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reserved machines */}
                  {machineAgents.length === 0 && (
                    <div className="px-4 pb-4 border-t border-white/[0.04] pt-3">
                      <p className="text-xs text-on-surface-variant/40 italic">
                        {machine.status === 'offline' ? 'Reserved for future capacity — coming soon.' : 'No agents assigned — dedicated to skill training workloads.'}
                      </p>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        </>
      )}

      {/* ── CONFIGURE TAB ─────────────────────────────────── */}
      {tab === 'configure' && (
        <>
          {/* Fleet mini-stats */}
          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: 'Machines', value: onlineMachines, icon: 'dns' },
              { label: 'Live', value: data?.agentsLive ?? 0, icon: 'bolt' },
              { label: 'Total', value: data?.totalAgents ?? 0, icon: 'groups' },
              { label: 'Loading', value: loading ? '...' : '✓', icon: 'pulse' },
            ].map((s) => (
              <div key={s.label} className="glass-card p-3 text-center">
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant mb-1 block">{s.icon}</span>
                <div className="text-lg font-bold text-on-surface">{s.value}</div>
                <div className="text-[10px] text-on-surface-variant">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Agent grid */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {data?.agents?.map((a) => {
              const isExpanded = expandedAgent === a.id
              return (
                <div key={a.id}>
                  <Card className={`glass-card glass-card-hover p-4 ${isExpanded ? 'rounded-b-none' : ''}`}>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        {a.avatar ? (
                          <img src={a.avatar} alt={a.name} className="w-10 h-10 rounded-full" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold text-on-surface">
                            {a.name[0]}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-on-surface">{a.name}</span>
                          <span className={`inline-block w-2 h-2 rounded-full ${STATUS_DOT[a.status]}`} />
                        </div>
                        <div className="text-[11px] text-on-surface-variant">{a.role}</div>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] border ${DEPT_COLORS[a.department] ?? 'bg-white/5 text-on-surface-variant border-white/10'}`}>
                          {a.department}
                        </span>
                        {a.currentTask && (
                          <div className="mt-2 text-[11px] text-on-surface-variant truncate">
                            <span className="text-[10px] uppercase tracking-wider text-on-surface-variant">Now:</span>{' '}
                            {a.currentTask}
                          </div>
                        )}
                        <div className="mt-1 text-[10px] text-on-surface-variant/60">{a.machine}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => expandAgent(a.id)}
                      className="mt-3 w-full flex items-center justify-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-xs text-on-surface-variant hover:bg-white/[0.05] hover:text-on-surface transition"
                    >
                      <Settings size={12} />
                      {isExpanded ? 'Close' : 'Configure'}
                      {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                  </Card>

                  {isExpanded && (
                    <Card className="rounded-t-none border-t-0 p-4 pt-0">
                      <div className="pt-3 space-y-3">
                        <div>
                          <label className="text-[11px] text-on-surface-variant/60 uppercase tracking-wider block mb-1">Model</label>
                          <select
                            value={agentModel}
                            onChange={(e) => setAgentModel(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-white/20 transition"
                          >
                            {AVAILABLE_MODELS.map((m) => (
                              <option key={m} value={m} className="bg-surface-container text-on-surface">{m}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[11px] text-on-surface-variant/60 uppercase tracking-wider block mb-1">
                            System Prompt Extension
                          </label>
                          <textarea
                            value={agentPrompt}
                            onChange={(e) => setAgentPrompt(e.target.value)}
                            rows={3}
                            placeholder="Additional instructions appended to this agent's system prompt…"
                            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-white/20 transition resize-none"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => saveAgentSettings(a.id)}
                            disabled={savingAgent}
                            className="btn-accent flex items-center gap-1.5 text-xs px-4 py-2"
                          >
                            {savingAgent ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                            {savingAgent ? 'Saving...' : 'Save'}
                          </button>
                          {saveMsg && (
                            <span className={`text-xs ${saveMsg.startsWith('Saved') ? 'text-emerald-400' : 'text-red-400'}`}>
                              {saveMsg}
                            </span>
                          )}
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
