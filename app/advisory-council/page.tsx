'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Card, PageHeader, StatusBadge } from '@/components/ui'
import {
  Play, Radio, Check, X, Pause, Volume2, Loader2, MessageSquare,
  MessageCircleQuestion, LayoutGrid, Users, Activity, PanelRightClose, PanelRightOpen, Bot
} from 'lucide-react'
import ChatView from './_ChatView'
import ContextPanel from './_ContextPanel'
import AgentRoom from './_AgentRoom'
import type { ContextInjection, AgentAssignment, ExpandedTask, QualityGate } from '@/lib/council-preflight'

// ─── Agent Registry (24 agents, 10 departments) ───────────────────────────────

interface CouncilAgent {
  id: string; initials: string; name: string; role: string; department: string; color: string
}

const ALL_AGENTS: CouncilAgent[] = [
  { id: 'marcus-ceo', initials: 'MC', name: 'Marcus', role: 'CEO', department: 'Command', color: '#abc7ff' },
  { id: 'diana-coo', initials: 'DC', name: 'Diana', role: 'COO', department: 'Command', color: '#5ee0ff' },
  { id: 'board-command', initials: 'BR', name: 'Board', role: 'Governance', department: 'Command', color: '#c084fc' },
  { id: 'felix-finance', initials: 'FX', name: 'Felix', role: 'CFO', department: 'Finance', color: '#5fd0b4' },
  { id: 'comply-legal', initials: 'CP', name: 'Comply', role: 'Compliance', department: 'Legal', color: '#fb923c' },
  { id: 'docs-legal', initials: 'DC', name: 'Docs', role: 'Docs Officer', department: 'Legal', color: '#fbbf24' },
  { id: 'guard-legal', initials: 'GD', name: 'Guard', role: 'IP Protection', department: 'Legal', color: '#f87171' },
  { id: 'kai-marketing', initials: 'KA', name: 'Kai', role: 'CMO', department: 'Marketing', color: '#c08bff' },
  { id: 'lena-marketing', initials: 'LN', name: 'Lena', role: 'Brand', department: 'Marketing', color: '#f472b6' },
  { id: 'nate-marketing', initials: 'NT', name: 'Nate', role: 'Growth', department: 'Marketing', color: '#34d399' },
  { id: 'rio-marketing', initials: 'RO', name: 'Rio', role: 'Ads', department: 'Marketing', color: '#facc15' },
  { id: 'atlas-marketing', initials: 'AT', name: 'Atlas', role: 'Art', department: 'Marketing', color: '#e879f9' },
  { id: 'pixel-marketing', initials: 'PX', name: 'Pixel', role: 'Production', department: 'Marketing', color: '#22d3ee' },
  { id: 'kahneman-psychology', initials: 'KN', name: 'Kahneman', role: 'Bias Audit', department: 'Psychology', color: '#ffb693' },
  { id: 'depth-research', initials: 'DP', name: 'Depth', role: 'Deep Research', department: 'Research', color: '#a78bfa' },
  { id: 'synth-research', initials: 'SY', name: 'Synth', role: 'Synthesis', department: 'Research', color: '#818cf8' },
  { id: 'vette-research', initials: 'VT', name: 'Vette', role: 'Fact Check', department: 'Research', color: '#6366f1' },
  { id: 'forge-sense', initials: 'FG', name: 'Forge', role: 'Discovery', department: 'Sense', color: '#14b8a6' },
  { id: 'radar-sense', initials: 'RD', name: 'Radar', role: 'Intel', department: 'Sense', color: '#06b6d4' },
  { id: 'scout-sense', initials: 'SC', name: 'Scout', role: 'Tools', department: 'Sense', color: '#0ea5e9' },
  { id: 'dev-technical', initials: 'DV', name: 'Dev', role: 'Tech Lead', department: 'Technical', color: '#3b82f6' },
  { id: 'mia-technical', initials: 'MI', name: 'Mia', role: 'Frontend', department: 'Technical', color: '#ec4899' },
  { id: 'raj-technical', initials: 'RJ', name: 'Raj', role: 'Backend', department: 'Technical', color: '#f97316' },
  { id: 'quinn-technical', initials: 'QN', name: 'Quinn', role: 'QA', department: 'Technical', color: '#84cc16' },
]

// ─── Decision Types ────────────────────────────────────────────────────────────

type DecisionType = 'product_launch' | 'contracts' | 'open_source' | 'compliance' | 'general' | 'strategy' | 'research'

const COUNCIL_COMPOSITION: Record<DecisionType, string[]> = {
  general: ['marcus-ceo', 'diana-coo', 'felix-finance', 'kai-marketing', 'kahneman-psychology'],
  strategy: ['marcus-ceo', 'diana-coo', 'felix-finance', 'board-command', 'radar-sense', 'depth-research', 'kahneman-psychology'],
  product_launch: ['marcus-ceo', 'diana-coo', 'felix-finance', 'kai-marketing', 'comply-legal', 'board-command', 'kahneman-psychology'],
  contracts: ['marcus-ceo', 'diana-coo', 'docs-legal', 'comply-legal', 'board-command', 'kahneman-psychology'],
  open_source: ['marcus-ceo', 'guard-legal', 'docs-legal', 'board-command', 'kahneman-psychology'],
  compliance: ['marcus-ceo', 'comply-legal', 'docs-legal', 'guard-legal', 'board-command', 'kahneman-psychology'],
  research: ['depth-research', 'synth-research', 'vette-research', 'forge-sense', 'scout-sense', 'kahneman-psychology', 'marcus-ceo'],
}

function getCouncil(type: DecisionType): CouncilAgent[] {
  const ids = COUNCIL_COMPOSITION[type] || COUNCIL_COMPOSITION.general
  return ids.map(id => ALL_AGENTS.find(a => a.id === id)!).filter(Boolean)
}

const decisionTypes: { value: DecisionType; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'product_launch', label: 'Product Launch' },
  { value: 'contracts', label: 'Contracts' },
  { value: 'open_source', label: 'Open Source' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'strategy', label: 'Strategy' },
  { value: 'research', label: 'Research' },
]

// ─── Types ────────────────────────────────────────────────────────────────────

interface CouncilResult {
  decision: 'APPROVED' | 'REJECTED' | 'CONDITIONAL'
  rationale: string; conditions: string[]; risks_accepted: string[]; next_steps: string[]
  positions: Array<{ agent: string; role: string; thesis: string; recommendation: string; score?: number }>
  legal_findings?: Array<{ agent: string; role: string; finding: string; risk_level: string; recommendation: string }>
  board_ruling?: { passed: boolean; violations: string[]; required_fixes: string[]; ruling: string }
  bias_audit?: string; total_tokens: number; duration_ms: number; mode: string
}

interface DebateMessage { agent: string; role: string; text: string; timestamp: number }

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdvisoryCouncilPage() {
  // Decision mode (legacy — preserved)
  const [topic, setTopic] = useState('')
  const [context, setContext] = useState('')
  const [decisionType, setDecisionType] = useState<DecisionType>('general')
  const [urgency, setUrgency] = useState<'routine' | 'high' | 'critical'>('routine')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CouncilResult | null>(null)
  const [debate, setDebate] = useState<DebateMessage[]>([])
  const [warRoom, setWarRoom] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [speaking, setSpeaking] = useState<{ recIndex: number; audioUrl: string; loading: boolean } | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Chat mode (new)
  const [chatActive, setChatActive] = useState(false)
  const [sidePanelOpen, setSidePanelOpen] = useState(true)
  const [venture, setVenture] = useState('yvon')
  const [mobileTab, setMobileTab] = useState<'chat' | 'agents' | 'context'>('chat')

  // Preflight state
  const [expandedTask, setExpandedTask] = useState<ExpandedTask | null>(null)
  const [assignments, setAssignments] = useState<AgentAssignment[]>([])
  const [qualityGate, setQualityGate] = useState<QualityGate | null>(null)
  const [contextInjection, setContextInjection] = useState<ContextInjection | null>(null)
  const [sessionTokens, setSessionTokens] = useState(0)
  const [sessionCost, setSessionCost] = useState(0)
  const [fingerprintChanged, setFingerprintChanged] = useState(false)
  const [activeAgent, setActiveAgent] = useState<string | null>(null)

  // Is mobile?
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // ─── Legacy Council Convene ──────────────────────────────────────────────

  const conveneCouncil = useCallback(async () => {
    if (!topic.trim()) return
    setLoading(true); setError(null); setResult(null); setDebate([]); setWarRoom(true)
    try {
      const res = await fetch('/api/council/convene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, context, urgency, decision_type: decisionType }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); setLoading(false); return }
      const cd = data as CouncilResult
      const msgs: DebateMessage[] = [
        { agent: 'system', role: 'Council', text: `Convened: "${topic}" · ${decisionType} · ${urgency}`, timestamp: Date.now() },
      ]
      for (const pos of cd.positions) {
        msgs.push({ agent: pos.agent, role: `${pos.role} (${pos.recommendation})`, text: pos.thesis, timestamp: Date.now() + msgs.length * 800 })
      }
      if (cd.legal_findings) {
        for (const lf of cd.legal_findings) {
          msgs.push({ agent: lf.agent, role: `⚖ ${lf.role} — ${lf.risk_level}`, text: `${lf.finding}\n→ ${lf.recommendation}`, timestamp: Date.now() + msgs.length * 600 })
        }
      }
      msgs.push({ agent: 'marcus-ceo', role: 'CEO — SYNTHESIS', text: `${cd.decision}: ${cd.rationale}`, timestamp: Date.now() + msgs.length * 600 })
      if (cd.bias_audit) msgs.push({ agent: 'kahneman-psychology', role: 'Bias Audit', text: cd.bias_audit, timestamp: Date.now() + msgs.length * 500 })
      if (cd.board_ruling) {
        const br = cd.board_ruling
        const parts: string[] = []
        if (br.violations.length > 0) parts.push(`Violations: ${br.violations.map(v => `Law ${v}`).join(', ')}`)
        if (br.required_fixes.length > 0) parts.push(`Fixes: ${br.required_fixes.join(' | ')}`)
        msgs.push({ agent: 'board-command', role: `Board — ${br.ruling}`, text: parts.join('\n') || 'All clear.', timestamp: Date.now() + msgs.length * 500 })
      }
      setDebate(msgs)
      setResult(cd)
    } catch (err: any) { setError(err.message || 'Failed') }
    finally { setLoading(false) }
  }, [topic, context, urgency, decisionType])

  // ─── Chat Metadata Handlers ──────────────────────────────────────────────

  const handleMeta = useCallback((meta: any) => {
    if (meta.expandedTask) setExpandedTask(meta.expandedTask)
    if (meta.assignments) setAssignments(meta.assignments)
    if (meta.qualityGate) setQualityGate(meta.qualityGate)
    if (meta.contextTokens) {
      setContextInjection(prev => prev ? { ...prev, injectedTokens: meta.contextTokens } : null)
    }
    if (meta.fingerprintMatch !== undefined) setFingerprintChanged(!meta.fingerprintMatch)
  }, [])

  const handleDone = useCallback((stats: { totalTokens: number; cost: number }) => {
    setSessionTokens(prev => prev + stats.totalTokens)
    setSessionCost(prev => prev + stats.cost)
  }, [])

  // ─── Start Live Session ─────────────────────────────────────────────────

  const startLiveSession = useCallback(() => {
    setChatActive(true)
    setSidePanelOpen(true)
  }, [])

  const stopLiveSession = useCallback(() => {
    setChatActive(false)
    setExpandedTask(null)
    setAssignments([])
    setQualityGate(null)
    setContextInjection(null)
    setSessionTokens(0)
    setSessionCost(0)
    setActiveAgent(null)
  }, [])

  // ─── Render Modes ────────────────────────────────────────────────────────

  // Mobile layout
  if (isMobile) {
    return (
      <div className="flex flex-col h-[calc(100vh-80px)]">
        <PageHeader
          title="Advisory Council"
          subtitle={chatActive ? 'Live session — council with full context' : '24 agents debate, recommend, and execute. Live Hermes agents with tool access.'}
          actions={
            <button
              className={chatActive ? 'btn-ghost' : 'btn-accent'}
              onClick={chatActive ? stopLiveSession : startLiveSession}
            >
              {chatActive ? <X size={15} /> : <Radio size={15} />}
              {chatActive ? 'End Session' : 'Start Live Session'}
            </button>
          }
        />

        {chatActive ? (
          <>
            {/* Mobile Tab Bar */}
            <div className="flex border-b border-white/[0.06] px-3">
              {(['chat', 'agents', 'context'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setMobileTab(tab)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-[12px] font-semibold transition-colors border-b-2 ${
                    mobileTab === tab
                      ? 'border-current'
                      : 'border-transparent text-on-surface-variant/60'
                  }`}
                  style={mobileTab === tab ? { color: 'var(--ws-accent)', borderColor: 'var(--ws-accent)' } : {}}
                >
                  {tab === 'chat' && <MessageSquare size={13} />}
                  {tab === 'agents' && <Users size={13} />}
                  {tab === 'context' && <Activity size={13} />}
                  {tab === 'chat' ? 'Chat' : tab === 'agents' ? 'Agents' : 'Context'}
                </button>
              ))}
            </div>

            {/* Mobile Content */}
            <div className="flex-1 min-h-0">
              {mobileTab === 'chat' && (
                <ChatView
                  venture={venture}
                  onMetaReceived={handleMeta}
                  onDone={handleDone}
                  isMobile
                />
              )}
              {mobileTab === 'agents' && (
                <div className="p-3 space-y-3">
                  <AgentRoom assignments={assignments} activeAgent={activeAgent} isMobile />
                </div>
              )}
              {mobileTab === 'context' && (
                <div className="p-3">
                  <ContextPanel
                    context={contextInjection}
                    sessionTokens={sessionTokens}
                    sessionCost={sessionCost}
                    fingerprintChanged={fingerprintChanged}
                    isMobile
                  />
                </div>
              )}
            </div>
          </>
        ) : (
          /* Decision Mode (legacy) */
          <div className="p-4 space-y-4">
            <Card className="p-4">
              <label className="mb-1 block text-xs font-semibold text-on-surface-variant">What should the council decide?</label>
              <input value={topic} onChange={e => setTopic(e.target.value)}
                placeholder="e.g. Launch Hourbour MVP without SOC2?"
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:border-white/20 focus:outline-none mb-2"
                onKeyDown={e => e.key === 'Enter' && conveneCouncil()} />
              <div className="flex flex-wrap gap-1.5 mb-2">
                {decisionTypes.map(dt => (
                  <button key={dt.value} onClick={() => setDecisionType(dt.value)}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${decisionType === dt.value ? 'bg-white/10 text-on-surface' : 'bg-white/[0.03] text-on-surface-variant/60 hover:bg-white/[0.06]'}`}>
                    {dt.label}
                  </button>
                ))}
                <select value={urgency} onChange={e => setUrgency(e.target.value as any)}
                  className="ml-auto rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] text-on-surface-variant focus:outline-none">
                  <option value="routine">Routine</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <input value={context} onChange={e => setContext(e.target.value)}
                placeholder="Additional context (optional)..."
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-on-surface-variant placeholder:text-on-surface-variant/40 focus:border-white/20 focus:outline-none" />
            </Card>
          </div>
        )}
      </div>
    )
  }

  // ─── Desktop Layout ───────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      <PageHeader
        title="Advisory Council"
        subtitle={chatActive ? 'Live session — council pre-flights every message with full context injection' : '24 agents debate, recommend, and execute. Use @agent-name to invite specialists.'}
        actions={
          <div className="flex items-center gap-2">
            {chatActive && (
              <button className="btn-ghost" onClick={() => setSidePanelOpen(!sidePanelOpen)}>
                {sidePanelOpen ? <PanelRightClose size={15} /> : <PanelRightOpen size={15} />}
                {sidePanelOpen ? 'Hide Panel' : 'Show Panel'}
              </button>
            )}
            <button
              className={chatActive ? 'btn-ghost' : 'btn-accent'}
              onClick={chatActive ? stopLiveSession : startLiveSession}
            >
              {chatActive ? <X size={15} /> : <Play size={15} />}
              {chatActive ? 'End Session' : 'Start Live Session'}
            </button>
          </div>
        }
      />

      {chatActive ? (
        /* Live Chat Mode */
        <div className="flex flex-1 min-h-0 gap-4 px-4 pb-4">
          {/* Chat area */}
          <div className={`flex flex-col min-h-0 ${sidePanelOpen ? 'flex-1 lg:flex-[1.2]' : 'flex-1'}`}
            style={{ background: 'rgba(19,19,19,0.72)', backdropFilter: 'blur(18px) saturate(140%)', WebkitBackdropFilter: 'blur(18px) saturate(140%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '1.25rem' }}>
            <ChatView
              venture={venture}
              onMetaReceived={handleMeta}
              onDone={handleDone}
            />
          </div>

          {/* Side panel */}
          {sidePanelOpen && (
            <div className="w-[320px] shrink-0 space-y-3 overflow-y-auto scroll-y">
              <AgentRoom assignments={assignments} activeAgent={activeAgent} />
              <ContextPanel
                context={contextInjection}
                sessionTokens={sessionTokens}
                sessionCost={sessionCost}
                fingerprintChanged={fingerprintChanged}
              />

              {/* Quality Gate card */}
              {qualityGate && (
                <Card className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`flex h-2.5 w-2.5 rounded-full ${qualityGate.passed ? 'bg-green-400' : 'bg-red-400'}`} />
                    <span className="text-[12px] font-semibold text-on-surface">
                      Quality Gate: {qualityGate.passed ? 'PASSED' : 'FAILED'}
                    </span>
                  </div>
                  {qualityGate.warnings.length > 0 && (
                    <div className="space-y-1">
                      {qualityGate.warnings.map((w, i) => (
                        <p key={i} className="text-[10px] text-yellow-400/90">⚠ {w}</p>
                      ))}
                    </div>
                  )}
                  {qualityGate.constitutionViolations.length > 0 && (
                    <div className="space-y-1 mt-1">
                      {qualityGate.constitutionViolations.map((v, i) => (
                        <p key={i} className="text-[10px] text-red-400">✕ {v}</p>
                      ))}
                    </div>
                  )}
                  <div className="mt-2 flex items-center gap-3 text-[10px] text-on-surface-variant/60">
                    <span>Est. {qualityGate.estimatedTokens} tokens</span>
                    <span>${qualityGate.estimatedCost.toFixed(4)}</span>
                  </div>
                </Card>
              )}

              {/* Expanded Task card */}
              {expandedTask && (
                <Card className="p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant/50 mb-1.5">Expanded Task</p>
                  <p className="text-[11px] font-semibold text-on-surface mb-1">{expandedTask.objective}</p>
                  <div className="space-y-0.5">
                    {expandedTask.scope.map((s, i) => (
                      <p key={i} className="text-[10px] text-on-surface-variant">{i + 1}. {s}</p>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Decision Mode (legacy — preserved) */
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_300px] px-4 pb-4">
          <div className="space-y-4">
            <Card className="p-4">
              <label className="mb-1 block text-xs font-semibold text-on-surface-variant">What should the council decide?</label>
              <input value={topic} onChange={e => setTopic(e.target.value)}
                placeholder="e.g. Launch Hourbour MVP without SOC2?"
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:border-white/20 focus:outline-none mb-2"
                onKeyDown={e => e.key === 'Enter' && conveneCouncil()} />
              <div className="flex flex-wrap gap-1.5 mb-2">
                {decisionTypes.map(dt => (
                  <button key={dt.value} onClick={() => setDecisionType(dt.value)}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${decisionType === dt.value ? 'bg-white/10 text-on-surface' : 'bg-white/[0.03] text-on-surface-variant/60 hover:bg-white/[0.06]'}`}>
                    {dt.label}
                  </button>
                ))}
                <select value={urgency} onChange={e => setUrgency(e.target.value as any)}
                  className="ml-auto rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] text-on-surface-variant focus:outline-none">
                  <option value="routine">Routine</option><option value="high">High</option><option value="critical">Critical</option>
                </select>
              </div>
              <input value={context} onChange={e => setContext(e.target.value)}
                placeholder="Additional context (optional)..."
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-on-surface-variant placeholder:text-on-surface-variant/40 focus:border-white/20 focus:outline-none" />
            </Card>

            {error && <Card className="p-4"><p className="text-sm text-error">{error}</p></Card>}

            {result && (
              <Card className="p-5">
                <div className="mb-2 flex items-center gap-2">
                  <StatusBadge tone={result.decision === 'APPROVED' ? 'green' : result.decision === 'CONDITIONAL' ? 'yellow' : 'red'}>{result.decision}</StatusBadge>
                  <span className="text-[11px] text-on-surface-variant">{result.mode === 'live' ? '🟢 Live Hermes' : '🟡 Simulated'} · {(result.total_tokens / 1000).toFixed(1)}K tokens · {(result.duration_ms / 1000).toFixed(1)}s</span>
                </div>
                <h2 className="text-lg font-semibold leading-snug text-on-surface">{result.rationale}</h2>
                {result.conditions.length > 0 && (
                  <p className="mt-2 text-[13px] text-on-surface-variant">
                    <span className="font-semibold text-on-surface">Conditions:</span> {result.conditions.join(' · ')}
                  </p>
                )}
                <div className="mt-2 flex -space-x-1.5">
                  {getCouncil(decisionType).map((c) => (
                    <span key={c.name} title={c.name} className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface text-[10px] font-bold text-black/80" style={{ background: c.color }}>{c.initials}</span>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button className="btn-accent !py-1.5 !text-xs"><Check size={13} /> Accept</button>
                  <button className="btn-ghost !py-1.5 !text-xs">Accept & create task</button>
                  <button className="btn-ghost !py-1.5 !text-xs" onClick={startLiveSession}><MessageSquare size={13} /> Discuss in Chat</button>
                </div>
              </Card>
            )}

            {result?.positions && result.positions.map((pos, i) => (
              <Card key={i} className="p-4">
                <div className="mb-1.5 flex items-center gap-2">
                  <StatusBadge tone="blue">{pos.role}</StatusBadge>
                  <span className="text-[11px] text-on-surface-variant">{pos.recommendation}{pos.score ? ` · ${pos.score}/10` : ''}</span>
                </div>
                <h3 className="text-sm font-semibold text-on-surface">{pos.thesis.slice(0, 120)}{pos.thesis.length > 120 ? '…' : ''}</h3>
                <div className="mt-3 flex gap-2">
                  <button className="btn-accent !py-1.5 !text-xs">Accept</button>
                  <button className="btn-ghost !py-1.5 !text-xs">Assign</button>
                </div>
              </Card>
            ))}
          </div>

          <div className="space-y-4">
            <Card className="p-4">
              <h4 className="mb-1 text-sm font-semibold text-on-surface">This session</h4>
              <p className="text-3xl font-bold text-on-surface">{result ? result.positions.length : 0}</p>
              <p className="text-[12px] text-on-surface-variant">agent positions · {result ? `${(result.total_tokens / 1000).toFixed(1)}K tokens` : 'ready'}</p>
            </Card>
            <Card className="p-4">
              <h4 className="mb-1 text-sm font-semibold text-on-surface">Decision type</h4>
              <p className="text-sm font-semibold capitalize" style={{ color: 'var(--ws-accent)' }}>{decisionType.replace('_', ' ')}</p>
              <p className="text-[12px] text-on-surface-variant">{urgency} urgency</p>
            </Card>
            <button className="btn-accent w-full" onClick={startLiveSession}>
              <MessageSquare size={15} /> Open Chat
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
