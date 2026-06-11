'use client'

import { useState, useCallback } from 'react'
import { PageHeader, StatusBadge, Card } from '@/components/ui'
import { useLiveData } from '@/lib/use-live-data'
import { useWorkspace } from '@/lib/WorkspaceContext'
import type { AgentStatus } from '@/app/api/agent-status/route'
import { Settings, Save, Loader2, ChevronDown, ChevronUp } from 'lucide-react'

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

export default function AgentsPage() {
  const { workspace } = useWorkspace()
  const { data, loading } = useLiveData<{ agents: AgentStatus[]; agentsLive: number; totalAgents: number; machinesOnline: number }>({
    url: '/api/agent-status',
    mockData: { agents: [], agentsLive: 0, totalAgents: 0, machinesOnline: 0 },
    pollIntervalMs: 30000,
  })

  // Per-agent settings panel state
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null)
  const [agentModel, setAgentModel] = useState<string>('deepseek-chat')
  const [agentPrompt, setAgentPrompt] = useState<string>('')
  const [savingAgent, setSavingAgent] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  // Load agent settings when expanding
  const expandAgent = useCallback(async (agentId: string) => {
    if (expandedAgent === agentId) { setExpandedAgent(null); return }
    setExpandedAgent(agentId)
    setSaveMsg('')
    try {
      const [settingsRes, memoryRes] = await Promise.all([
        fetch(`/api/settings?ventureId=${workspace.key}&agentId=${agentId}`),
        fetch(`/api/settings?ventureId=${workspace.key}&agentId=${agentId}&type=memory`),
      ])
      if (settingsRes.ok) {
        const settings = await settingsRes.json()
        // Find this agent's settings
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

  return (
    <div>
      <PageHeader title="Agents" subtitle="Fleet health, agent activity, and per-agent configuration." />

      {/* Fleet stats */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: 'Machines', value: data?.machinesOnline ?? 0, icon: 'dns' },
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
                {/* Configure button */}
                <button
                  onClick={() => expandAgent(a.id)}
                  className="mt-3 w-full flex items-center justify-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-xs text-on-surface-variant hover:bg-white/[0.05] hover:text-on-surface transition"
                >
                  <Settings size={12} />
                  {isExpanded ? 'Close' : 'Configure'}
                  {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
              </Card>

              {/* Expanded settings panel */}
              {isExpanded && (
                <Card className="rounded-t-none border-t-0 p-4 pt-0">
                  <div className="pt-3 space-y-3">
                    {/* Model selector */}
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

                    {/* System prompt extension */}
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

                    {/* Save */}
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
    </div>
  )
}
