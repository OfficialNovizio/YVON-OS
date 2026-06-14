'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Card, PageHeader, StatusBadge } from '@/components/ui'
import { Radio, Send, Loader2, Shield, Brain, Zap, Users, Gavel, Scale, FileText, Lock } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CouncilAgent {
  id: string; name: string; role: string; department: string; level: number
  color: string; initials: string; status: 'idle' | 'thinking' | 'done'
}

interface DebateMessage { agent: string; role: string; text: string; timestamp: number }

interface LegalFinding {
  agent: string; role: string; finding: string
  risk_level: 'none' | 'low' | 'medium' | 'high' | 'critical'
  recommendation: string
}

interface BoardRuling {
  passed: boolean; violations: string[]; required_fixes: string[]
  ruling: 'APPROVED' | 'CONDITIONAL' | 'REJECTED' | 'ESCALATED'
}

interface CouncilDecision {
  decision: 'APPROVED' | 'REJECTED' | 'CONDITIONAL'
  rationale: string; conditions: string[]; risks_accepted: string[]; next_steps: string[]
  positions: Array<{ agent: string; role: string; thesis: string; recommendation: string; score?: number }>
  legal_findings?: LegalFinding[]
  board_ruling?: BoardRuling
  bias_audit?: string; total_tokens: number; duration_ms: number; mode: 'live' | 'simulated'
}

type DecisionType = 'product_launch' | 'contracts' | 'open_source' | 'compliance' | 'general'

// ─── Constants ────────────────────────────────────────────────────────────────

const COUNCIL_SEATS: CouncilAgent[] = [
  { id: 'marcus-ceo', name: 'Marcus', role: 'CEO', department: 'Command', level: 1, color: '#abc7ff', initials: 'MC', status: 'idle' },
  { id: 'diana-coo', name: 'Diana', role: 'COO', department: 'Command', level: 1, color: '#5ee0ff', initials: 'DC', status: 'idle' },
  { id: 'felix-finance', name: 'Felix', role: 'CFO', department: 'Finance', level: 2, color: '#5fd0b4', initials: 'FX', status: 'idle' },
  { id: 'kai-marketing', name: 'Kai', role: 'CMO', department: 'Marketing', level: 3, color: '#c08bff', initials: 'KA', status: 'idle' },
]

const VALIDATORS = [{ id: 'kahneman-psychology', name: 'Kahneman', role: 'Bias Validator', color: '#ffb693', initials: 'KN' }]
const GOVERNANCE = [{ id: 'board-command', name: 'Board', role: 'Governance', color: '#ff8a80', initials: 'BR' }]

const LEGAL_AGENTS: Record<DecisionType, Array<{ id: string; name: string; role: string; color: string; initials: string }>> = {
  product_launch: [{ id: 'comply-legal', name: 'Comply', role: 'Compliance', color: '#ffa726', initials: 'CP' }],
  contracts: [
    { id: 'docs-legal', name: 'Docs', role: 'Documentation', color: '#66bb6a', initials: 'DC' },
    { id: 'comply-legal', name: 'Comply', role: 'Compliance', color: '#ffa726', initials: 'CP' },
  ],
  open_source: [{ id: 'guard-legal', name: 'Guard', role: 'IP Protection', color: '#ef5350', initials: 'GD' }],
  compliance: [{ id: 'comply-legal', name: 'Comply', role: 'Compliance', color: '#ffa726', initials: 'CP' }],
  general: [{ id: 'comply-legal', name: 'Comply', role: 'Compliance', color: '#ffa726', initials: 'CP' }],
}

const DECISION_TYPES: { value: DecisionType; label: string; icon: React.ReactNode }[] = [
  { value: 'general', label: 'General', icon: <Zap size={13} /> },
  { value: 'product_launch', label: 'Launch', icon: <Send size={13} /> },
  { value: 'contracts', label: 'Contracts', icon: <FileText size={13} /> },
  { value: 'open_source', label: 'Open Source', icon: <Lock size={13} /> },
  { value: 'compliance', label: 'Compliance', icon: <Scale size={13} /> },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdvisoryCouncilPage() {
  const [agents, setAgents] = useState<CouncilAgent[]>(COUNCIL_SEATS.map(a => ({ ...a })))
  const [topic, setTopic] = useState('')
  const [context, setContext] = useState('')
  const [urgency, setUrgency] = useState<'routine' | 'high' | 'critical'>('routine')
  const [decisionType, setDecisionType] = useState<DecisionType>('general')
  const [loading, setLoading] = useState(false)
  const [debate, setDebate] = useState<DebateMessage[]>([])
  const [decision, setDecision] = useState<CouncilDecision | null>(null)
  const [warRoom, setWarRoom] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const transcriptRef = useRef<HTMLDivElement>(null)

  const currentLegal = LEGAL_AGENTS[decisionType]

  useEffect(() => {
    fetch('/api/council/convene').then(r => r.json()).then(data => {
      if (data.status === 'live') setAgents(prev => prev.map(a => ({ ...a, status: 'idle' as const })))
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (transcriptRef.current) transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
  }, [debate])

  const conveneCouncil = useCallback(async () => {
    if (!topic.trim()) return
    setLoading(true); setError(null); setDecision(null); setDebate([]); setWarRoom(true)
    setAgents(prev => prev.map(a => ({ ...a, status: 'thinking' })))

    const legalNames = currentLegal.map(l => l.name).join(', ')
    setDebate([{ agent: 'system', role: 'Council', text: `Convening: "${topic}"\nUrgency: ${urgency} · Type: ${decisionType}\nCouncil: Marcus (CEO), Diana (COO), Felix (CFO), Kai (CMO)${legalNames ? `\nLegal: ${legalNames}` : ''}\nValidator: Kahneman · Gate: Board`, timestamp: Date.now() }])

    try {
      const res = await fetch('/api/council/convene', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, context, urgency, decision_type: decisionType }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); setAgents(prev => prev.map(a => ({ ...a, status: 'idle' }))); setLoading(false); return }

      const cd = data as CouncilDecision

      // Executive positions
      for (let i = 0; i < cd.positions.length; i++) {
        const pos = cd.positions[i]; const agent = agents[i]; if (!agent) continue
        setAgents(prev => prev.map((a, idx) => idx === i ? { ...a, status: 'done' } : a))
        setDebate(prev => [...prev, { agent: agent.id, role: `${pos.role} → ${pos.recommendation}${pos.score ? ` (${pos.score}/10)` : ''}`, text: pos.thesis, timestamp: Date.now() + i * 1000 }])
        await new Promise(r => setTimeout(r, 400))
      }

      // Legal findings
      if (cd.legal_findings && cd.legal_findings.length > 0) {
        for (const lf of cd.legal_findings) {
          setDebate(prev => [...prev, { agent: lf.agent, role: `⚖ ${lf.role} — Risk: ${lf.risk_level.toUpperCase()}`, text: `${lf.finding}\n\n→ ${lf.recommendation}`, timestamp: Date.now() + 3000 }])
          await new Promise(r => setTimeout(r, 300))
        }
      }

      // Synthesis
      setDebate(prev => [...prev, { agent: 'marcus-ceo', role: 'CEO — SYNTHESIS', text: `DECISION: ${cd.decision}\n${cd.rationale}`, timestamp: Date.now() + 4000 }])

      // Bias audit
      if (cd.bias_audit) {
        setDebate(prev => [...prev, { agent: 'kahneman-psychology', role: '🧠 Bias Audit', text: cd.bias_audit!, timestamp: Date.now() + 5000 }])
      }

      // Board ruling (real data from API, not hardcoded)
      if (cd.board_ruling) {
        const br = cd.board_ruling
        const parts: string[] = []
        if (br.violations.length > 0) parts.push(`Violations: ${br.violations.map(v => `Law ${v}`).join(', ')}`)
        if (br.required_fixes.length > 0) parts.push(`Fixes: ${br.required_fixes.map(f => `• ${f}`).join(' | ')}`)
        const text = parts.length > 0 ? parts.join('\n') : `Board ${br.ruling.toLowerCase()}. All clear.`
        setDebate(prev => [...prev, { agent: 'board-command', role: `🏛 Board Gate — ${br.ruling}`, text, timestamp: Date.now() + 6000 }])
      } else {
        // Fallback for v1 API responses
        setDebate(prev => [...prev, {
          agent: 'board-command', role: 'Governance',
          text: cd.decision === 'APPROVED' ? 'Board approves. Risk thresholds within bounds.'
            : cd.decision === 'CONDITIONAL' ? `Board approves with ${cd.conditions.length} conditions.` : 'Board rejects.',
          timestamp: Date.now() + 6000,
        }])
      }

      setDecision(cd)
    } catch (err: any) { setError(err.message || 'Failed'); setAgents(prev => prev.map(a => ({ ...a, status: 'idle' }))) }
    finally { setLoading(false); setAgents(prev => prev.map(a => a.status === 'thinking' ? { ...a, status: 'idle' } : a)) }
  }, [topic, context, urgency, decisionType, currentLegal, agents])

  return (
    <div>
      <PageHeader
        title="Advisory Council"
        subtitle={`${COUNCIL_SEATS.length} seats · ${currentLegal.length} legal · ${VALIDATORS.length} validator · ${GOVERNANCE.length} governance · Powered by Hermes`}
        actions={
          <button className="btn-accent !py-2 !text-sm" onClick={conveneCouncil} disabled={loading || !topic.trim()}>
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Radio size={15} />}
            {loading ? 'Convening...' : 'Convene Council'}
          </button>
        }
      />

      {/* Topic + Decision Type */}
      <Card className="mb-5 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-semibold text-on-surface-variant">What should the council decide?</label>
            <input value={topic} onChange={e => setTopic(e.target.value)}
              placeholder="e.g. Launch Hourbour MVP without SOC2?"
              className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:border-white/20 focus:outline-none"
              onKeyDown={e => e.key === 'Enter' && conveneCouncil()} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-on-surface-variant">Urgency</label>
            <select value={urgency} onChange={e => setUrgency(e.target.value as any)}
              className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-on-surface focus:outline-none">
              <option value="routine">Routine</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {DECISION_TYPES.map(dt => (
            <button key={dt.value} onClick={() => setDecisionType(dt.value)}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                decisionType === dt.value
                  ? 'bg-white/10 text-on-surface'
                  : 'bg-white/[0.03] text-on-surface-variant/60 hover:bg-white/[0.06]'
              }`}
            >
              {dt.icon} {dt.label}
            </button>
          ))}
        </div>
        <input value={context} onChange={e => setContext(e.target.value)}
          placeholder="Additional context (optional)..."
          className="mt-2 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-on-surface-variant placeholder:text-on-surface-variant/40 focus:border-white/20 focus:outline-none" />
      </Card>

      {/* Agent Grid */}
      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {agents.map(agent => (
          <Card key={agent.id} className="p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-black/80" style={{ background: agent.color }}>{agent.initials}</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-on-surface">{agent.name}</p>
                <p className="text-[11px] text-on-surface-variant">{agent.role} · L{agent.level}</p>
              </div>
              <div className="ml-auto">
                {agent.status === 'thinking' ? <Loader2 size={14} className="animate-spin" style={{ color: agent.color }} />
                  : agent.status === 'done' ? <span className="text-xs" style={{ color: agent.color }}>✓</span>
                  : <span className="h-2 w-2 rounded-full bg-white/20" />}
              </div>
            </div>
          </Card>
        ))}
        {/* Legal Agents */}
        {currentLegal.map(l => (
          <Card key={l.id} className="p-4 opacity-80">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-black/80" style={{ background: l.color }}>{l.initials}</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-on-surface">{l.name}</p>
                <p className="text-[11px] text-on-surface-variant">{l.role}</p>
              </div>
              <Scale size={14} className="ml-auto text-on-surface-variant/40" />
            </div>
          </Card>
        ))}
        {VALIDATORS.map(v => (
          <Card key={v.id} className="p-4 opacity-70">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-black/80" style={{ background: v.color }}>{v.initials}</span>
              <div><p className="text-sm font-semibold text-on-surface">{v.name}</p><p className="text-[11px] text-on-surface-variant">{v.role}</p></div>
              <Brain size={14} className="ml-auto text-on-surface-variant/40" />
            </div>
          </Card>
        ))}
        {GOVERNANCE.map(g => (
          <Card key={g.id} className="p-4 opacity-70">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-black/80" style={{ background: g.color }}>{g.initials}</span>
              <div><p className="text-sm font-semibold text-on-surface">{g.name}</p><p className="text-[11px] text-on-surface-variant">{g.role}</p></div>
              <Gavel size={14} className="ml-auto text-on-surface-variant/40" />
            </div>
          </Card>
        ))}
      </div>

      {/* Error */}
      {error && <Card className="mb-5 p-4"><p className="text-sm text-error">{error}</p></Card>}

      {/* Legal Findings Summary */}
      {decision?.legal_findings && decision.legal_findings.length > 0 && (
        <Card className="mb-5 p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-on-surface"><Scale size={14} style={{ color: '#ffa726' }} /> Legal Findings</h3>
          <div className="space-y-2">
            {decision.legal_findings.map((lf, i) => (
              <div key={i} className="rounded-lg border border-white/5 bg-white/[0.02] p-3" style={{ borderLeftWidth: 3, borderLeftColor: lf.risk_level === 'critical' ? '#b71c1c' : lf.risk_level === 'high' ? '#f44336' : lf.risk_level === 'medium' ? '#ff9800' : '#4caf50' }}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-on-surface">{lf.role}</span>
                  <span className="text-[10px] font-bold uppercase" style={{ color: lf.risk_level === 'critical' || lf.risk_level === 'high' ? '#f44336' : lf.risk_level === 'medium' ? '#ff9800' : '#4caf50' }}>{lf.risk_level}</span>
                </div>
                <p className="text-[12px] leading-relaxed text-on-surface-variant">{lf.finding}</p>
                <p className="mt-1 text-[11px]" style={{ color: 'var(--ws-accent)' }}>→ {lf.recommendation}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Board Ruling */}
      {decision?.board_ruling && (decision.board_ruling.ruling !== 'APPROVED' || decision.board_ruling.violations.length > 0) && (
        <div className="mb-5 rounded-xl border p-5" style={{ borderLeft: `3px solid ${decision.board_ruling.ruling === 'ESCALATED' ? '#f44336' : decision.board_ruling.ruling === 'CONDITIONAL' ? '#ff9800' : 'transparent'}`, background: 'rgba(255,255,255,0.02)' }}>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-on-surface"><Gavel size={14} style={{ color: '#ff8a80' }} /> Board Ruling — {decision.board_ruling.ruling}</h3>
          {decision.board_ruling.violations.length > 0 && (
            <p className="text-[12px] text-red-400">Violations: {decision.board_ruling.violations.map(v => `Law ${v}`).join(', ')}</p>
          )}
          {decision.board_ruling.required_fixes.length > 0 && (
            <div className="mt-1">
              <p className="text-[11px] font-semibold text-on-surface-variant">Required fixes:</p>
              <ul className="mt-0.5 space-y-0.5">{decision.board_ruling.required_fixes.map((f, i) => <li key={i} className="text-[11px] text-on-surface-variant">• {f}</li>)}</ul>
            </div>
          )}
        </div>
      )}

      {/* Decision */}
      {decision && (
        <div className="mb-5 rounded-xl border p-5" style={{
          borderColor: decision.decision === 'APPROVED' ? 'rgba(95,208,180,0.3)' : decision.decision === 'CONDITIONAL' ? 'rgba(255,182,147,0.3)' : 'rgba(255,138,128,0.3)',
        }}>
          <div className="mb-3 flex items-center gap-3">
            <StatusBadge tone={decision.decision === 'APPROVED' ? 'green' : decision.decision === 'CONDITIONAL' ? 'yellow' : 'red'}>{decision.decision}</StatusBadge>
            <span className="text-[11px] text-on-surface-variant">{decision.mode === 'live' ? '🟢 Live Hermes' : '🟡 Simulated'}</span>
            <span className="ml-auto text-[11px] text-on-surface-variant tabular-nums">{(decision.total_tokens/1000).toFixed(1)}K tokens · {(decision.duration_ms/1000).toFixed(1)}s</span>
          </div>
          <p className="text-sm text-on-surface">{decision.rationale}</p>
          {decision.conditions.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-on-surface-variant">Conditions:</p>
              <ul className="mt-1 space-y-1">{decision.conditions.map((c,i) => <li key={i} className="text-[12px] text-on-surface-variant">• {c}</li>)}</ul>
            </div>
          )}
          {decision.risks_accepted.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-semibold text-on-surface-variant" style={{ color: '#ff9800' }}>Risks Accepted:</p>
              <ul className="mt-1 space-y-1">{decision.risks_accepted.map((r,i) => <li key={i} className="text-[12px] text-on-surface-variant">• {r}</li>)}</ul>
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-2">{decision.next_steps.map((s,i) => <span key={i} className="rounded-full bg-white/[0.04] px-3 py-1 text-[11px] text-on-surface-variant">{s}</span>)}</div>
        </div>
      )}

      {/* Transcript */}
      {debate.length > 0 && (
        <Card className="p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-on-surface"><Radio size={14} style={{ color: 'var(--ws-accent)' }} /> Council Transcript</h3>
          <div ref={transcriptRef} className="max-h-80 space-y-3 overflow-y-auto">
            {debate.map((msg, i) => (
              <div key={i} className="rounded-lg bg-white/[0.02] p-3">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-[11px] font-semibold" style={{ color: agents.find(a => a.id === msg.agent)?.color || currentLegal.find(l => l.id === msg.agent)?.color || VALIDATORS.find(v => v.id === msg.agent)?.color || GOVERNANCE.find(g => g.id === msg.agent)?.color || 'var(--ws-accent)' }}>{msg.role}</span>
                  <span className="text-[10px] text-on-surface-variant/50 tabular-nums">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-on-surface-variant">{msg.text}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* War Room */}
      {warRoom && <WarRoomModal agents={agents} debate={debate} topic={topic} loading={loading} decision={decision} decisionType={decisionType} onClose={() => setWarRoom(false)} onSubmit={conveneCouncil} setTopic={setTopic} legalAgents={currentLegal} />}
    </div>
  )
}

// ─── War Room Modal ───────────────────────────────────────────────────────────

function WarRoomModal({ agents, debate, topic, loading, decision, decisionType, onClose, onSubmit, setTopic, legalAgents }: {
  agents: CouncilAgent[]; debate: DebateMessage[]; topic: string; loading: boolean
  decision: CouncilDecision | null; decisionType: DecisionType
  onClose: () => void; onSubmit: () => void; setTopic: (t: string) => void
  legalAgents: Array<{ id: string; name: string; role: string; color: string; initials: string }>
}) {
  const [input, setInput] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-sm">
      <div className="flex items-center gap-4 border-b border-white/10 px-5 py-3">
        <span className="flex items-center gap-2 text-sm font-bold tracking-wide text-on-surface"><Radio size={16} style={{ color: 'var(--ws-accent)' }} /> WAR ROOM</span>
        {loading ? <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--ws-accent)' }}><Loader2 size={12} className="animate-spin" /> CONVENING</span>
          : decision ? <span className="flex items-center gap-1.5 text-xs" style={{ color: decision.decision === 'APPROVED' ? '#5fd0b4' : decision.decision === 'CONDITIONAL' ? '#ffb693' : '#ff8a80' }}><span className="h-2 w-2 rounded-full" style={{ background: decision.decision === 'APPROVED' ? '#5fd0b4' : decision.decision === 'CONDITIONAL' ? '#ffb693' : '#ff8a80' }} />{decision.decision}</span>
          : <span className="flex items-center gap-1.5 text-xs text-on-surface-variant"><Users size={12} />Ready</span>}
        <span className="truncate text-sm text-on-surface-variant">{topic || 'Set a topic'}</span>
        <span className="text-[10px] text-on-surface-variant/40">{decisionType}</span>
        <div className="ml-auto"><button className="btn-ghost !py-1.5 !text-xs" onClick={onClose}>Close</button></div>
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="scroll-y w-[360px] shrink-0 overflow-y-auto border-r border-white/10 p-4">
          {debate.length === 0 ? (
            <div className="py-8 text-center">
              <Zap size={32} className="mx-auto mb-3 text-on-surface-variant/30" />
              <p className="text-sm text-on-surface-variant">Council chamber ready</p>
            </div>
          ) : debate.map((msg, i) => (
            <div key={i} className="mb-3">
              <p className="mb-0.5 text-[11px] font-semibold" style={{ color: agents.find(a => a.id === msg.agent)?.color || legalAgents.find(l => l.id === msg.agent)?.color || 'var(--ws-accent)' }}>{msg.role}</p>
              <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-on-surface-variant">{msg.text.slice(0, 300)}</p>
            </div>
          ))}
        </div>
        <div className="relative flex flex-1 items-center justify-center overflow-hidden">
          <div className="absolute inset-0 opacity-90" style={{ background: 'radial-gradient(120% 90% at 50% 0%, rgba(40,60,110,0.5), transparent 60%), radial-gradient(100% 80% at 50% 100%, var(--ws-accent-soft), #07080d 70%)' }} />
          <div className="relative text-center">
            <div className="relative mx-auto mb-8">
              <div className="relative mx-auto h-48 w-80">
                <div className="absolute inset-0 rounded-[50%] border" style={{ borderColor: 'var(--ws-glow)', background: 'rgba(255,255,255,0.02)' }} />
                {agents.map((agent, i) => {
                  const angle = (i / agents.length) * Math.PI * 2 - Math.PI / 2; const radius = 140
                  const x = Math.cos(angle) * radius + 160; const y = Math.sin(angle) * radius + 96
                  return <span key={agent.id} className="absolute flex h-10 w-10 items-center justify-center rounded-full text-[11px] font-bold text-black/80 shadow-lg transition-all duration-500"
                    style={{ background: agent.color, left: x - 20, top: y - 20, transform: agent.status === 'thinking' ? 'scale(1.15)' : 'scale(1)', boxShadow: agent.status === 'done' ? `0 0 20px ${agent.color}40` : undefined }}
                    title={`${agent.name} — ${agent.role}`}>{agent.status === 'thinking' ? <Loader2 size={14} className="animate-spin text-black/60" /> : agent.initials}</span>
                })}
                <div className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-white/10 bg-black/40">
                  <Shield size={18} style={{ color: 'var(--ws-accent)' }} /><span className="mt-0.5 text-[9px] font-semibold" style={{ color: 'var(--ws-accent)' }}>10 LAWS</span>
                </div>
              </div>
            </div>
            {decision && <p className="mt-4 text-sm text-on-surface-variant"><span className="font-semibold text-on-surface">{decision.decision === 'APPROVED' ? '✅' : decision.decision === 'CONDITIONAL' ? '⚠️' : '❌'}</span> {decision.rationale.slice(0,200)}</p>}
            {loading && <p className="mt-4 animate-pulse text-sm text-on-surface-variant">Council deliberating...</p>}
          </div>
          {decision && (
            <div className="absolute bottom-5 left-1/2 w-[min(560px,90%)] -translate-x-1/2">
              <div className="rounded-xl border bg-surface p-4" style={{ borderColor: decision.decision === 'APPROVED' ? 'rgba(95,208,180,0.3)' : decision.decision === 'CONDITIONAL' ? 'rgba(255,182,147,0.3)' : 'rgba(255,138,128,0.3)' }}>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--ws-accent)' }}>The council {decision.decision === 'CONDITIONAL' ? 'conditionally approves' : decision.decision === 'APPROVED' ? 'approves' : 'rejects'}</p>
                <p className="text-sm text-on-surface">{decision.rationale}</p>
                {decision.board_ruling && decision.board_ruling.ruling !== 'APPROVED' && (
                  <p className="mt-2 text-[11px]" style={{ color: '#ff8a80' }}>
                    Board: {decision.board_ruling.ruling}{decision.board_ruling.required_fixes.length > 0 ? ` — ${decision.board_ruling.required_fixes.length} fixes required` : ''}
                  </p>
                )}
                <div className="mt-3 flex gap-2">
                  <button className="btn-accent !py-1.5 !text-xs" onClick={onClose}>Accept & Close</button>
                  <button className="btn-ghost !py-1.5 !text-xs" onClick={() => { setTopic(''); onClose() }}>New Topic</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="border-t border-white/10 p-3">
        <div className="mx-auto flex max-w-2xl items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2">
          <input value={input} onChange={e => setInput(e.target.value)} placeholder="Jump in — steer the debate…"
            className="flex-1 bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none"
            onKeyDown={e => { if (e.key === 'Enter' && input.trim()) { setTopic(input); setInput(''); onSubmit() } }}
            disabled={loading} />
          <button className="btn-accent !py-1.5 !text-xs" onClick={() => { if (input.trim()) { setTopic(input); setInput(''); onSubmit() } }} disabled={loading || !input.trim()}><Send size={13} /> Send</button>
        </div>
      </div>
    </div>
  )
}
